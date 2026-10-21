#!/usr/bin/env node
/**
 * Restore one exact S3 object version and prove that the restored bytes match
 * the SHA-256 recorded when that version was backed up.
 *
 * Two targeting modes:
 *   --key latest/service-config.yaml --version-id <id>
 *   --run-id <run-id> --file service-config.yaml [--archive]
 *
 * Use --list --key <key> to inspect the available version IDs first.
 */

import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, ListObjectVersionsCommand } from "@aws-sdk/client-s3";
import { checkArgs, parseArgs, printFatal } from "./lib/cli.mjs";
import {
  createS3Client,
  DEFAULT_MANIFEST,
  DEFAULT_RESTORE_DIR,
  formatBytes,
  formatIso,
  friendlyAwsError,
  isNotFound,
  readManifest,
  resolveInputPath,
  sha256Buffer,
  toDisplayPath,
  writeManifest,
} from "./lib/s3.mjs";

const HELP = `Usage:
  node scripts/restore.mjs --list --key <s3-key>
  node scripts/restore.mjs --key <s3-key> --version-id <version-id> [options]
  node scripts/restore.mjs --run-id <run-id> --file <relative-file> [options]

Restore a specific object version, compare its SHA-256 with the manifest, and
write the recovered bytes under restored/.

Options:
  --list                 List versions for --key instead of restoring
  --key KEY              S3 key to restore or list
  --version-id ID        Exact S3 version to restore
  --run-id ID            Backup run that recorded the version
  --file FILE            File within the run (relative path or basename)
  --archive              With --run-id/--file, use the archive copy instead of latest/
  --expected-sha256 HEX  Expected SHA-256 when no manifest entry matches
  --out FILE             Output path (default: restored/<basename>)
  --bucket NAME          Bucket override (default: BUCKET_NAME or manifest run bucket)
  --manifest FILE        Manifest path (default: manifests/manifest.json)
  --json                 With --list, print raw JSON
  --help                 Show this help

Exit codes:
  0  restore passed every check
  1  restore failed, or the requested version could not be read
`;

function resolveBucket(args, fallback) {
  return args.bucket || process.env.BUCKET_NAME || process.env.BACKUP_BUCKET || fallback || null;
}

function assertVersionId(versionId) {
  if (!versionId || ["null", "undefined"].includes(String(versionId).toLowerCase())) {
    throw new Error(
      "A concrete versionId is required. Use --list --key <key> to find it, or use --run-id and --file.",
    );
  }
  return String(versionId);
}

function findRun(manifest, runId) {
  if (!runId) {
    return manifest.runs[manifest.runs.length - 1];
  }
  return manifest.runs.find((run) => run.runId === runId);
}

function findFile(run, fileArg) {
  const wanted = fileArg.split(path.sep).join("/");
  const exact = run.files.find((file) => file.sourceFile === wanted);
  if (exact) {
    return exact;
  }

  const basename = path.posix.basename(wanted);
  const matches = run.files.filter(
    (file) => path.posix.basename(file.sourceFile) === basename,
  );

  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length > 1) {
    throw new Error(
      `File name "${fileArg}" is ambiguous in run ${run.runId}. Use the full relative path: ${matches
        .map((file) => file.sourceFile)
        .join(", ")}`,
    );
  }
  return null;
}

function findManifestMatch(manifest, key, versionId) {
  for (const run of manifest.runs) {
    for (const file of run.files) {
      if (file.archiveKey === key && file.archiveVersionId === versionId) {
        return { run, file, kind: "archive" };
      }
      if (file.latestKey === key && file.latestVersionId === versionId) {
        return { run, file, kind: "latest" };
      }
    }
  }
  return null;
}

async function listVersions({ s3, bucket, key }) {
  const versions = [];
  const deleteMarkers = [];
  let keyMarker;
  let versionIdMarker;

  for (;;) {
    const response = await s3.send(
      new ListObjectVersionsCommand({
        Bucket: bucket,
        Prefix: key,
        ...(keyMarker ? { KeyMarker: keyMarker } : {}),
        ...(versionIdMarker ? { VersionIdMarker: versionIdMarker } : {}),
      }),
    );

    for (const version of response.Versions || []) {
      if (version.Key === key) {
        versions.push(version);
      }
    }
    for (const marker of response.DeleteMarkers || []) {
      if (marker.Key === key) {
        deleteMarkers.push(marker);
      }
    }

    if (!response.IsTruncated) {
      break;
    }
    keyMarker = response.NextKeyMarker;
    versionIdMarker = response.NextVersionIdMarker;
    if (!keyMarker) {
      break;
    }
  }

  versions.sort((left, right) => {
    if (Boolean(left.IsLatest) !== Boolean(right.IsLatest)) {
      return left.IsLatest ? -1 : 1;
    }
    return new Date(right.LastModified).getTime() - new Date(left.LastModified).getTime();
  });

  return { versions, deleteMarkers };
}

function printVersionTable({ bucket, key, versions, deleteMarkers, asJson }) {
  if (asJson) {
    console.log(JSON.stringify({ bucket, key, versions, deleteMarkers }, null, 2));
    return;
  }

  console.log(`[restore] Key: ${key}`);
  console.log(`[restore] Bucket: s3://${bucket}\n`);

  if (versions.length === 0 && deleteMarkers.length === 0) {
    console.log("No versions or delete markers found for this key.");
    return;
  }

  console.log("VERSION ID                        SIZE        LAST MODIFIED              LATEST");
  for (const version of versions) {
    console.log(
      `${String(version.VersionId || "null").padEnd(33)} ${formatBytes(version.Size).padEnd(11)} ${formatIso(
        version.LastModified,
      ).padEnd(26)} ${version.IsLatest ? "yes" : "no"}`,
    );
  }
  for (const marker of deleteMarkers) {
    console.log(
      `${String(marker.VersionId || "null").padEnd(33)} ${"delete-marker".padEnd(11)} ${formatIso(
        marker.LastModified,
      ).padEnd(26)} ${marker.IsLatest ? "yes" : "no"}`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    booleans: ["list", "archive", "json", "help"],
  });
  checkArgs(args, [
    "list",
    "key",
    "version-id",
    "run-id",
    "file",
    "archive",
    "expected-sha256",
    "out",
    "bucket",
    "manifest",
    "json",
    "help",
  ]);

  if (args.help) {
    console.log(HELP);
    return;
  }

  const manifestPath = resolveInputPath(args.manifest, DEFAULT_MANIFEST);
  const manifest = await readManifest(manifestPath);
  const s3 = createS3Client();

  if (args.list) {
    if (!args.key) {
      throw new Error("--list requires --key.");
    }
    const bucket = resolveBucket(args, null);
    if (!bucket) {
      throw new Error("No bucket configured. Set BUCKET_NAME or pass --bucket.");
    }

    const listing = await listVersions({ s3, bucket, key: args.key });
    printVersionTable({ bucket, key: args.key, ...listing, asJson: args.json });
    if (listing.versions.length === 0) {
      process.exitCode = 1;
    }
    return;
  }

  if ((args["run-id"] && !args.file) || (!args["run-id"] && args.file)) {
    throw new Error("--run-id and --file must be provided together.");
  }

  let key;
  let versionId;
  let expectedSha256 = args["expected-sha256"]
    ? args["expected-sha256"].toLowerCase()
    : null;
  let expectedSize = null;
  let sourceRunId = null;
  let sourceFile = null;
  let kind = "explicit";
  let runBucket = null;

  if (args["run-id"] || args.file) {
    if (manifest.runs.length === 0) {
      throw new Error(`No backup runs in ${toDisplayPath(manifestPath)}.`);
    }

    const run = findRun(manifest, args["run-id"]);
    if (!run) {
      throw new Error(`Run not found: ${args["run-id"]}.`);
    }

    const file = findFile(run, args.file);
    if (!file) {
      throw new Error(
        `File "${args.file}" not found in run ${run.runId}. Available files: ${run.files
          .map((candidate) => candidate.sourceFile)
          .join(", ")}`,
      );
    }

    kind = args.archive ? "archive" : "latest";
    key = kind === "archive" ? file.archiveKey : file.latestKey;
    versionId = kind === "archive" ? file.archiveVersionId : file.latestVersionId;
    expectedSize = file.size;
    expectedSha256 = expectedSha256 || file.sha256;
    sourceRunId = run.runId;
    sourceFile = file.sourceFile;
    runBucket = run.bucket;

    if (!key || !versionId) {
      throw new Error(
        `Run ${run.runId} has no ${kind} version for ${file.sourceFile}. ${
          kind === "latest"
            ? "Try --archive or re-run the backup with versioning enabled."
            : "The upload likely failed; inspect the manifest."
        }`,
      );
    }
  } else {
    if (!args.key) {
      throw new Error(
        "Pass --key and --version-id, or use --run-id and --file. Run with --help for examples.",
      );
    }
    if (!args["version-id"]) {
      throw new Error(
        "A specific --version-id is required. Use --list --key <key> to inspect versions.",
      );
    }

    key = args.key;
    versionId = assertVersionId(args["version-id"]);

    const match = findManifestMatch(manifest, key, versionId);
    if (match) {
      expectedSize = match.file.size;
      sourceRunId = match.run.runId;
      sourceFile = match.file.sourceFile;
      kind = match.kind;
      runBucket = match.run.bucket;
      if (!expectedSha256) {
        expectedSha256 = match.file.sha256;
      }
    }
  }

  versionId = assertVersionId(versionId);

  if (!expectedSha256) {
    throw new Error(
      `No manifest entry matches ${key} version ${versionId}, so there is no expected SHA-256 to verify. Pass --expected-sha256 <64-hex> or use --run-id and --file.`,
    );
  }
  if (!/^[a-f0-9]{64}$/i.test(expectedSha256)) {
    throw new Error("--expected-sha256 must be a 64-character hexadecimal SHA-256 value.");
  }
  expectedSha256 = expectedSha256.toLowerCase();

  const bucket = resolveBucket(args, runBucket);
  if (!bucket) {
    throw new Error("No bucket configured. Set BUCKET_NAME or pass --bucket.");
  }

  console.log(`[restore] Source: s3://${bucket}/${key} (version ${versionId})`);
  console.log(`[restore] Expected SHA-256: ${expectedSha256}`);
  if (sourceRunId) {
    console.log(`[restore] Recorded by run ${sourceRunId} (${sourceFile}, ${kind})`);
  }

  let bytes;
  let returnedVersionId;
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key, VersionId: versionId }),
    );
    bytes = await response.Body.transformToByteArray();
    returnedVersionId = response.VersionId || null;
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error(`Object version not found: s3://${bucket}/${key}@${versionId}`);
    }
    throw new Error(friendlyAwsError(error));
  }

  const actualSha256 = sha256Buffer(bytes);
  const actualSize = bytes.byteLength;
  const problems = [];

  if (actualSha256 !== expectedSha256) {
    problems.push(`sha256 mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }
  if (expectedSize !== null && actualSize !== Number(expectedSize)) {
    problems.push(`size mismatch: expected ${expectedSize}, got ${actualSize}`);
  }
  if (returnedVersionId !== versionId) {
    problems.push(
      `version mismatch: requested ${versionId}, S3 returned ${returnedVersionId || "none"}`,
    );
  }

  const defaultOut = path.join(DEFAULT_RESTORE_DIR, path.posix.basename(key));
  let outputPath = args.out ? path.resolve(process.cwd(), args.out) : defaultOut;

  if (args.out) {
    try {
      const outputStat = await stat(outputPath);
      if (outputStat.isDirectory()) {
        outputPath = path.join(outputPath, path.posix.basename(key));
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);

  const passed = problems.length === 0;
  const recovery = {
    restoredAt: new Date().toISOString(),
    bucket,
    key,
    requestedVersionId: versionId,
    returnedVersionId,
    kind,
    sourceRunId,
    sourceFile,
    expectedSha256,
    actualSha256,
    expectedSize,
    actualSize,
    outputPath: toDisplayPath(outputPath),
    status: passed ? "pass" : "fail",
    message: passed ? "Restored bytes match the recorded version." : problems.join("; "),
  };

  manifest.recoveries.push(recovery);
  await writeManifest(manifestPath, manifest);

  console.log(`[restore] Returned version: ${returnedVersionId || "none"}`);
  console.log(`[restore] Output: ${toDisplayPath(outputPath)} (${formatBytes(actualSize)})`);
  console.log(`[restore] Actual SHA-256:   ${actualSha256}`);

  if (!passed) {
    for (const problem of problems) {
      console.error(`[restore] FAIL: ${problem}`);
    }
    console.error("\nRESTORE FAIL. The downloaded file was kept for inspection. Exit code 1.");
    process.exitCode = 1;
    return;
  }

  console.log("\nRESTORE PASS. Restored bytes match the expected version.");
  console.log(`[restore] Manifest updated: ${toDisplayPath(manifestPath)}`);
}

main().catch((error) => {
  printFatal("restore", new Error(friendlyAwsError(error)));
});
