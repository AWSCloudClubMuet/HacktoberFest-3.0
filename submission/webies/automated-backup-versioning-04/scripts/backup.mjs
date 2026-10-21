#!/usr/bin/env node
/**
 * Upload every file in sample-data/ (or --source) to S3.
 *
 * Each run writes:
 *   backups/<timestamped-run-id>/<relative-path>   immutable run copy
 *   latest/<relative-path>                         overwritten mirror (creates versions)
 *
 * Both objects carry a SHA-256 metadata field. The manifest records the
 * source hash, size, S3 keys and version IDs so verify/restore/report can work
 * without guessing.
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { checkArgs, parseArgs, printFatal } from "./lib/cli.mjs";
import {
  archiveKeyFor,
  createS3Client,
  DEFAULT_MANIFEST,
  DEFAULT_SAMPLE_DATA,
  formatBytes,
  friendlyAwsError,
  getBucketName,
  getTopicArn,
  guessContentType,
  latestKeyFor,
  listFilesRecursive,
  newRunId,
  readManifest,
  resolveInputPath,
  sha256Buffer,
  shortHash,
  toDisplayPath,
  toPosix,
  writeManifest,
} from "./lib/s3.mjs";
import { notifyFailure, printNotificationResult } from "./lib/alerts.mjs";

const HELP = `Usage: node scripts/backup.mjs [options]

Upload all files under the source directory to a versioned S3 bucket.

Options:
  --bucket NAME          Bucket name (default: BUCKET_NAME environment variable)
  --source DIR           Source directory (default: sample-data/)
  --manifest FILE        Manifest path (default: manifests/manifest.json)
  --simulate-failure     Skip the first upload to demonstrate the alert path
  --topic-arn ARN        SNS topic override (default: BACKUP_ALERTS_TOPIC_ARN)
  --help                 Show this help

Environment:
  AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
  BUCKET_NAME, BACKUP_ALERTS_TOPIC_ARN

Exit codes:
  0  every file uploaded successfully
  1  one or more files failed (the manifest and alert are still written)
`;

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    booleans: ["simulate-failure", "help"],
  });
  checkArgs(args, [
    "bucket",
    "source",
    "manifest",
    "simulate-failure",
    "topic-arn",
    "help",
  ]);

  if (args.help) {
    console.log(HELP);
    return;
  }

  const bucket = getBucketName(args);
  const sourceDir = resolveInputPath(args.source, DEFAULT_SAMPLE_DATA);
  const manifestPath = resolveInputPath(args.manifest, DEFAULT_MANIFEST);

  let sourceStat;
  try {
    sourceStat = await stat(sourceDir);
  } catch {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }
  if (!sourceStat.isDirectory()) {
    throw new Error(`Source path is not a directory: ${sourceDir}`);
  }

  const files = await listFilesRecursive(sourceDir);
  if (files.length === 0) {
    throw new Error(`No files found under ${sourceDir}. Add sample data before running a backup.`);
  }

  const manifest = await readManifest(manifestPath);
  const startedAt = new Date();
  const runId = newRunId(startedAt);

  const run = {
    runId,
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    durationMs: 0,
    status: "running",
    environment: "aws",
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    bucket,
    sourceRoot: toDisplayPath(sourceDir),
    archivePrefix: `backups/${runId}/`,
    counts: { total: files.length, successful: 0, failed: 0 },
    archiveBytes: 0,
    uploadedBytes: 0,
    files: [],
  };

  console.log(`[backup] Run ${runId}`);
  console.log(`[backup] ${files.length} file(s) from ${toDisplayPath(sourceDir)} to s3://${bucket}/backups/${runId}/`);

  const s3 = createS3Client();

  for (const [index, sourceFile] of files.entries()) {
    const relativeFile = toPosix(path.relative(sourceDir, sourceFile));
    const archiveKey = archiveKeyFor(runId, relativeFile);
    const latestKey = latestKeyFor(relativeFile);
    const record = {
      sourceFile: relativeFile,
      size: null,
      sha256: null,
      archiveKey,
      archiveVersionId: null,
      latestKey,
      latestVersionId: null,
      status: "failed",
      error: null,
    };

    let phase = "read";

    try {
      const body = await readFile(sourceFile);
      const checksum = sha256Buffer(body);
      record.size = body.length;
      record.sha256 = checksum;

      if (args["simulate-failure"] && index === 0) {
        phase = "simulated upload";
        throw new Error("Simulated upload failure requested by --simulate-failure.");
      }

      const metadata = {
        sha256: checksum,
        "source-file": relativeFile,
        "backup-run-id": runId,
        "backup-kind": "archive",
      };

      phase = "archive upload";
      const archiveResponse = await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: archiveKey,
          Body: body,
          ContentType: guessContentType(sourceFile),
          ServerSideEncryption: "AES256",
          Metadata: metadata,
        }),
      );
      record.archiveVersionId = archiveResponse.VersionId || null;

      phase = "latest mirror upload";
      const latestResponse = await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: latestKey,
          Body: body,
          ContentType: guessContentType(sourceFile),
          ServerSideEncryption: "AES256",
          Metadata: {
            ...metadata,
            "backup-kind": "latest",
            "archive-key": archiveKey,
          },
        }),
      );
      record.latestVersionId = latestResponse.VersionId || null;
      record.status = "success";
    } catch (error) {
      record.error = `${phase} failed: ${friendlyAwsError(error)}`;
    }

    run.files.push(record);

    if (record.status === "success") {
      run.counts.successful += 1;
      run.archiveBytes += record.size;
      run.uploadedBytes += record.size * 2;
      console.log(
        `[ok]   ${relativeFile} (${formatBytes(record.size)}, sha256 ${shortHash(record.sha256)}) -> ${archiveKey}`,
      );
    } else {
      run.counts.failed += 1;
      console.error(`[fail] ${relativeFile}: ${record.error}`);
    }
  }

  const finishedAt = new Date();
  run.finishedAt = finishedAt.toISOString();
  run.durationMs = finishedAt.getTime() - startedAt.getTime();
  run.status = run.counts.failed > 0 ? "failed" : "success";

  manifest.runs.push(run);
  await writeManifest(manifestPath, manifest);

  console.log(
    `\n[backup] ${run.counts.successful}/${run.counts.total} file(s) succeeded, ${run.counts.failed} failed.`,
  );
  console.log(
    `[backup] Archived ${formatBytes(run.archiveBytes)}; uploaded ${formatBytes(run.uploadedBytes)} including the latest/ mirror.`,
  );
  console.log(`[backup] Manifest: ${toDisplayPath(manifestPath)}`);

  if (run.counts.failed > 0) {
    const failedFiles = run.files
      .filter((file) => file.status !== "success")
      .map((file) => ({ file: file.sourceFile, error: file.error }));

    const notification = await notifyFailure({
      topicArn: getTopicArn(args),
      subject: `BACKUP FAILED: ${runId}`,
      event: "backup.failed",
      details: {
        runId,
        bucket,
        region: run.region,
        totalFiles: run.counts.total,
        failedFiles: run.counts.failed,
        sourceRoot: run.sourceRoot,
        manifest: toDisplayPath(manifestPath),
        failures: failedFiles,
      },
    });
    printNotificationResult(notification);

    console.error(
      "\n[backup] FAILED. Inspect the manifest, fix the cause and re-run. Exit code 1.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("[backup] PASS. Next: node scripts/verify.mjs");
}

main().catch((error) => {
  printFatal("backup", new Error(friendlyAwsError(error)));
});
