#!/usr/bin/env node
/**
 * Verify the most recent backup run (or a specific --run-id) by downloading
 * every recorded version and comparing its size and SHA-256 with the manifest.
 *
 * Detects:
 *   - missing objects or versions
 *   - size mismatches (incomplete backups)
 *   - SHA-256 mismatches (corrupt or unexpected content)
 *   - a run that recorded a failed upload
 */

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { checkArgs, parseArgs, printFatal } from "./lib/cli.mjs";
import {
  createS3Client,
  DEFAULT_MANIFEST,
  friendlyAwsError,
  isNotFound,
  getTopicArn,
  readManifest,
  resolveInputPath,
  sha256Buffer,
  toDisplayPath,
  writeManifest,
} from "./lib/s3.mjs";
import { notifyFailure, printNotificationResult } from "./lib/alerts.mjs";

const HELP = `Usage: node scripts/verify.mjs [options]

Verify that every file in a backup run exists, is complete, and matches the
SHA-256 recorded in the manifest.

Options:
  --run-id ID            Run to verify (default: most recent run)
  --bucket NAME          Bucket override (default: BUCKET_NAME or run bucket)
  --manifest FILE        Manifest path (default: manifests/manifest.json)
  --topic-arn ARN        SNS topic override (default: BACKUP_ALERTS_TOPIC_ARN)
  --no-alert             Do not publish an SNS failure alert
  --help                 Show this help

Exit codes:
  0  every expected object passed
  1  at least one object is missing, incomplete or corrupt
`;

function failedCheck(role, key, versionId, message) {
  return {
    role,
    key,
    versionId: versionId || null,
    status: "missing",
    expectedSize: null,
    actualSize: null,
    expectedSha256: null,
    actualSha256: null,
    returnedVersionId: null,
    message,
  };
}

async function checkObject({ s3, bucket, role, key, versionId, expectedSha256, expectedSize }) {
  if (!key) {
    return failedCheck(role, key, versionId, "No S3 key recorded in the manifest.");
  }
  if (!versionId) {
    return failedCheck(
      role,
      key,
      versionId,
      "No versionId recorded. Bucket versioning may be disabled or the upload failed.",
    );
  }
  if (!expectedSha256) {
    return failedCheck(role, key, versionId, "No expected SHA-256 recorded in the manifest.");
  }

  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key, VersionId: versionId }),
    );

    const bytes = await response.Body.transformToByteArray();
    const actualSha256 = sha256Buffer(bytes);
    const actualSize = Number(response.ContentLength ?? bytes.byteLength);
    const returnedVersionId = response.VersionId || null;
    const metadataSha256 = response.Metadata?.sha256 || null;
    const problems = [];

    if (actualSize !== Number(expectedSize)) {
      problems.push(`size mismatch: expected ${expectedSize}, got ${actualSize}`);
    }
    if (actualSha256 !== expectedSha256) {
      problems.push(
        `sha256 mismatch: expected ${expectedSha256}, got ${actualSha256}`,
      );
    }
    if (metadataSha256 && metadataSha256 !== expectedSha256) {
      problems.push(
        `S3 metadata sha256 mismatch: expected ${expectedSha256}, got ${metadataSha256}`,
      );
    }
    if (returnedVersionId !== versionId) {
      problems.push(
        `version mismatch: requested ${versionId}, S3 returned ${returnedVersionId || "none"}`,
      );
    }

    return {
      role,
      key,
      versionId,
      status: problems.length === 0 ? "ok" : "corrupt",
      expectedSize: Number(expectedSize),
      actualSize,
      expectedSha256,
      actualSha256,
      returnedVersionId,
      message: problems.length === 0 ? "SHA-256, size and version match." : problems.join("; "),
    };
  } catch (error) {
    if (isNotFound(error)) {
      return failedCheck(role, key, versionId, "Object version not found in S3.");
    }
    return {
      ...failedCheck(role, key, versionId, friendlyAwsError(error)),
      status: "error",
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    booleans: ["no-alert", "help"],
  });
  checkArgs(args, [
    "run-id",
    "bucket",
    "manifest",
    "topic-arn",
    "no-alert",
    "help",
  ]);

  if (args.help) {
    console.log(HELP);
    return;
  }

  const manifestPath = resolveInputPath(args.manifest, DEFAULT_MANIFEST);
  const manifest = await readManifest(manifestPath);

  if (manifest.runs.length === 0) {
    throw new Error(
      `No backup runs in ${toDisplayPath(manifestPath)}. Run "node scripts/backup.mjs" first.`,
    );
  }

  const run = args["run-id"]
    ? manifest.runs.find((candidate) => candidate.runId === args["run-id"])
    : manifest.runs[manifest.runs.length - 1];

  if (!run) {
    const recent = manifest.runs
      .slice(-5)
      .map((candidate) => candidate.runId)
      .join(", ");
    throw new Error(`Run not found: ${args["run-id"]}. Recent runs: ${recent}`);
  }

  const bucket =
    args.bucket ||
    process.env.BUCKET_NAME ||
    process.env.BACKUP_BUCKET ||
    run.bucket;

  if (!bucket) {
    throw new Error("No bucket configured. Set BUCKET_NAME or pass --bucket.");
  }

  console.log(`[verify] Run: ${run.runId}`);
  console.log(`[verify] Bucket: s3://${bucket}`);
  console.log(`[verify] Recorded status: ${run.status}`);
  console.log(`[verify] Files: ${run.files.length}\n`);

  const s3 = createS3Client();
  const results = [];
  let objectsChecked = 0;
  let objectsPassed = 0;

  for (const file of run.files) {
    const checks = [];

    if (file.archiveVersionId) {
      checks.push(
        await checkObject({
          s3,
          bucket,
          role: "archive",
          key: file.archiveKey,
          versionId: file.archiveVersionId,
          expectedSha256: file.sha256,
          expectedSize: file.size,
        }),
      );
    } else {
      checks.push(
        failedCheck(
          "archive",
          file.archiveKey,
          null,
          file.error || "Backup did not record an archive version.",
        ),
      );
    }

    if (file.latestVersionId) {
      checks.push(
        await checkObject({
          s3,
          bucket,
          role: "latest",
          key: file.latestKey,
          versionId: file.latestVersionId,
          expectedSha256: file.sha256,
          expectedSize: file.size,
        }),
      );
    } else {
      checks.push(
        failedCheck(
          "latest",
          file.latestKey,
          null,
          file.error || "Backup did not record a latest mirror version.",
        ),
      );
    }

    objectsChecked += checks.length;
    objectsPassed += checks.filter((check) => check.status === "ok").length;

    const filePassed =
      file.status === "success" && checks.every((check) => check.status === "ok");
    const fileResult = {
      sourceFile: file.sourceFile,
      status: filePassed ? "ok" : "failed",
      checks,
    };
    results.push(fileResult);

    console.log(
      `${filePassed ? "PASS" : "FAIL"} ${file.sourceFile} [${checks
        .map((check) => `${check.role}=${check.status}`)
        .join(" ")}]`,
    );
    for (const check of checks) {
      if (check.status !== "ok") {
        console.error(`     ${check.role}: ${check.message}`);
      }
    }
  }

  const filesPassed = results.filter((result) => result.status === "ok").length;
  const filesFailed = results.length - filesPassed;
  const passed = filesFailed === 0;

  const verification = {
    verifiedAt: new Date().toISOString(),
    runId: run.runId,
    bucket,
    status: passed ? "pass" : "fail",
    expectedFiles: results.length,
    passedFiles: filesPassed,
    failedFiles: filesFailed,
    objectsChecked,
    objectsPassed,
    totalArchiveBytes: results.reduce((total, result) => {
      const archive = result.checks.find((check) => check.role === "archive");
      return total + (archive?.actualSize || 0);
    }, 0),
    results,
  };

  manifest.verifications.push(verification);
  await writeManifest(manifestPath, manifest);

  console.log(
    `\n${passed ? "VERIFICATION PASS" : "VERIFICATION FAIL"}: ${filesPassed}/${results.length} files, ${objectsPassed}/${objectsChecked} objects.`,
  );
  console.log(`[verify] Manifest updated: ${toDisplayPath(manifestPath)}`);

  if (!passed) {
    if (args["no-alert"]) {
      console.warn("[alerts] SNS alert suppressed by --no-alert.");
    } else {
      const failedFiles = results
        .filter((result) => result.status !== "ok")
        .map((result) => ({
          file: result.sourceFile,
          checks: result.checks
            .filter((check) => check.status !== "ok")
            .map((check) => ({
              role: check.role,
              status: check.status,
              message: check.message,
            })),
        }));

      const notification = await notifyFailure({
        topicArn: getTopicArn(args),
        subject: `BACKUP VERIFY FAILED: ${run.runId}`,
        event: "backup.verification_failed",
        details: {
          runId: run.runId,
          bucket,
          failedFiles: filesFailed,
          totalFiles: results.length,
          manifest: toDisplayPath(manifestPath),
          failures: failedFiles,
        },
      });
      printNotificationResult(notification);
    }

    console.error("\n[verify] FAILED. Exit code 1.");
    process.exitCode = 1;
    return;
  }

  console.log("[verify] PASS. Next: node scripts/restore.mjs or node scripts/report.mjs");
}

main().catch((error) => {
  printFatal("verify", new Error(friendlyAwsError(error)));
});
