#!/usr/bin/env node
/**
 * Render reports/backup-status.md from the JSON manifest.
 *
 * The default mode is completely offline and uses only manifest data, which
 * makes the report reproducible during review. --live additionally queries S3
 * for the real current/noncurrent version counts and byte totals.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ListObjectVersionsCommand } from "@aws-sdk/client-s3";
import {
  checkArgs,
  parseArgs,
  parseIntegerOption,
  printFatal,
} from "./lib/cli.mjs";
import {
  createS3Client,
  DEFAULT_MANIFEST,
  DEFAULT_REPORTS_DIR,
  formatBytes,
  formatIso,
  friendlyAwsError,
  getBucketName,
  getRetentionDays,
  readManifest,
  resolveInputPath,
  shortHash,
  toDisplayPath,
} from "./lib/s3.mjs";

const HELP = `Usage: node scripts/report.mjs [options]

Generate a Markdown backup status report from the manifest.

Options:
  --manifest FILE        Manifest path (default: manifests/manifest.json)
  --out FILE             Output path (default: reports/backup-status.md)
  --live                 Also query S3 for real version counts and bytes
  --bucket NAME          Bucket for --live (default: BUCKET_NAME)
  --retention-days N     Lifecycle retention to display (default: 7 or env)
  --help                 Show this help

Exit codes:
  0  report written
  1  report written, but the optional --live S3 query failed
`;

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function byTime(records, field) {
  return [...records].sort(
    (left, right) => new Date(right[field] || 0).getTime() - new Date(left[field] || 0).getTime(),
  );
}

function escapeCell(value) {
  return String(value ?? "n/a").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function latestOf(records, field) {
  return byTime(records, field)[0] || null;
}

function statusLabel(status) {
  if (!status) {
    return "NOT RUN";
  }
  return String(status).toUpperCase();
}

async function collectLiveStorage(bucket) {
  const s3 = createS3Client();
  let keyMarker;
  let versionIdMarker;
  const totals = {
    currentVersions: 0,
    noncurrentVersions: 0,
    deleteMarkers: 0,
    currentBytes: 0,
    noncurrentBytes: 0,
    totalBytes: 0,
  };

  for (;;) {
    const response = await s3.send(
      new ListObjectVersionsCommand({
        Bucket: bucket,
        ...(keyMarker ? { KeyMarker: keyMarker } : {}),
        ...(versionIdMarker ? { VersionIdMarker: versionIdMarker } : {}),
      }),
    );

    for (const version of response.Versions || []) {
      const size = Number(version.Size) || 0;
      totals.totalBytes += size;
      if (version.IsLatest) {
        totals.currentVersions += 1;
        totals.currentBytes += size;
      } else {
        totals.noncurrentVersions += 1;
        totals.noncurrentBytes += size;
      }
    }

    totals.deleteMarkers += (response.DeleteMarkers || []).length;

    if (!response.IsTruncated) {
      break;
    }
    keyMarker = response.NextKeyMarker;
    versionIdMarker = response.NextVersionIdMarker;
    if (!keyMarker) {
      break;
    }
  }

  return totals;
}

function buildReport({
  manifest,
  manifestPath,
  outputPath,
  retentionDays,
  liveStorage,
  liveError,
}) {
  const runs = manifest.runs;
  const successfulRuns = runs.filter((run) => run.status === "success");
  const failedRuns = runs.filter((run) => run.status === "failed");
  const files = runs.flatMap((run) => run.files || []);
  const successfulFiles = files.filter((file) => file.status === "success");
  const failedFiles = files.filter((file) => file.status !== "success");
  const lastSuccessfulRun = latestOf(successfulRuns, "finishedAt");
  const lastAttempt = latestOf(runs, "startedAt");
  const lastVerification = latestOf(manifest.verifications, "verifiedAt");
  const lastRecovery = latestOf(manifest.recoveries, "restoredAt");
  const archiveBytes = sum(successfulFiles.map((file) => file.size));
  const uploadedBytes = sum(
    runs.map((run) => {
      if (Number.isFinite(Number(run.uploadedBytes))) {
        return Number(run.uploadedBytes);
      }
      return sum(
        (run.files || [])
          .filter((file) => file.status === "success")
          .map((file) => Number(file.size) * 2),
      );
    }),
  );
  const latestKeys = new Set(
    successfulFiles.map((file) => file.latestKey).filter(Boolean),
  );
  const environments = [
    ...new Set(runs.map((run) => run.environment).filter(Boolean)),
  ];
  const synthetic = manifest.synthetic === true;

  const failureEvents = [];
  for (const run of runs) {
    for (const file of run.files || []) {
      if (file.status !== "success") {
        failureEvents.push({
          at: run.finishedAt || run.startedAt,
          type: "backup",
          detail: `${run.runId}/${file.sourceFile}: ${file.error || "upload failed"}`,
        });
      }
    }
  }
  for (const verification of manifest.verifications) {
    if (verification.status === "fail") {
      failureEvents.push({
        at: verification.verifiedAt,
        type: "verify",
        detail: `${verification.runId}: ${verification.failedFiles}/${verification.expectedFiles} files failed`,
      });
    }
  }
  for (const recovery of manifest.recoveries) {
    if (recovery.status === "fail") {
      failureEvents.push({
        at: recovery.restoredAt,
        type: "restore",
        detail: `${recovery.key}@${recovery.requestedVersionId}: ${recovery.message}`,
      });
    }
  }
  failureEvents.sort((left, right) => new Date(right.at) - new Date(left.at));

  const lines = [];
  lines.push("# Automated Backup Status Report");
  lines.push("");
  if (synthetic) {
    lines.push(
      "> **Synthetic demo data.** This report was rendered from a sample manifest to validate report output. It is not evidence of a live AWS run.",
    );
    lines.push("");
  }
  lines.push(`Generated: ${new Date().toISOString()}  `);
  lines.push(`Manifest: \`${toDisplayPath(manifestPath)}\`  `);
  lines.push(`Report: \`${toDisplayPath(outputPath)}\`  `);
  lines.push(`Environment: \`${environments.length > 0 ? environments.join(", ") : "n/a"}\`  `);
  lines.push(`Bucket: \`${lastAttempt?.bucket || lastSuccessfulRun?.bucket || "n/a"}\`  `);
  lines.push(`Region: \`${lastAttempt?.region || "n/a"}\``);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Total backup jobs | ${runs.length} |`);
  lines.push(`| Successful backup jobs | ${successfulRuns.length} |`);
  lines.push(`| Failed backup jobs | ${failedRuns.length} |`);
  lines.push(`| Total file uploads attempted | ${files.length} |`);
  lines.push(`| Successful file uploads | ${successfulFiles.length} |`);
  lines.push(`| Failed file uploads | ${failedFiles.length} |`);
  lines.push(
    `| Last successful backup time | ${lastSuccessfulRun ? formatIso(lastSuccessfulRun.finishedAt) : "never"} |`,
  );
  lines.push(
    `| Last backup attempt | ${lastAttempt ? `${formatIso(lastAttempt.startedAt)} (${statusLabel(lastAttempt.status)})` : "never"} |`,
  );
  lines.push(
    `| Verification status | ${lastVerification ? `${statusLabel(lastVerification.status)} at ${formatIso(lastVerification.verifiedAt)} (${lastVerification.passedFiles}/${lastVerification.expectedFiles} files)` : "NOT RUN"} |`,
  );
  lines.push(
    `| Recovered file status | ${lastRecovery ? `${statusLabel(lastRecovery.status)} at ${formatIso(lastRecovery.restoredAt)} (${lastRecovery.sourceFile || lastRecovery.key})` : "NOT RUN"} |`,
  );
  lines.push(`| Archive storage (manifest) | ${formatBytes(archiveBytes)} across ${successfulFiles.length} file copies |`);
  lines.push(`| Uploaded storage incl. latest mirror | ${formatBytes(uploadedBytes)} |`);
  lines.push(`| Retention | Noncurrent versions expire after ${retentionDays} days |`);
  lines.push("");

  lines.push("## Backup runs");
  lines.push("");
  if (runs.length === 0) {
    lines.push("No backup runs have been recorded yet. Run `node scripts/backup.mjs`.");
  } else {
    lines.push("| Run ID | Started | Finished | Status | Files ok | Files failed | Archive bytes | Environment |");
    lines.push("| --- | --- | --- | --- | ---: | ---: | ---: | --- |");
    for (const run of [...runs].reverse()) {
      const ok = (run.files || []).filter((file) => file.status === "success").length;
      const failed = (run.files || []).filter((file) => file.status !== "success").length;
      lines.push(
        `| \`${escapeCell(run.runId)}\` | ${formatIso(run.startedAt)} | ${formatIso(run.finishedAt)} | ${statusLabel(run.status)} | ${ok} | ${failed} | ${formatBytes(run.archiveBytes)} | ${escapeCell(run.environment || "n/a")} |`,
      );
    }
  }
  lines.push("");

  lines.push("## Verification status");
  lines.push("");
  if (manifest.verifications.length === 0) {
    lines.push("No verification has been recorded. Run `node scripts/verify.mjs`.");
  } else {
    lines.push("| Verified at | Run ID | Status | Files checked | Files passed | Objects checked | Objects passed |");
    lines.push("| --- | --- | --- | ---: | ---: | ---: | ---: |");
    for (const verification of [...manifest.verifications].reverse().slice(0, 10)) {
      lines.push(
        `| ${formatIso(verification.verifiedAt)} | \`${escapeCell(verification.runId)}\` | ${statusLabel(verification.status)} | ${verification.expectedFiles} | ${verification.passedFiles} | ${verification.objectsChecked} | ${verification.objectsPassed} |`,
      );
    }

    const latest = latestOf(manifest.verifications, "verifiedAt");
    if (latest?.status === "fail") {
      lines.push("");
      lines.push("Latest verification failures:");
      lines.push("");
      for (const result of latest.results?.filter((item) => item.status !== "ok") || []) {
        for (const check of result.checks?.filter((item) => item.status !== "ok") || []) {
          lines.push(`- \`${escapeCell(result.sourceFile)}\` ${check.role}: ${escapeCell(check.message)}`);
        }
      }
    }
  }
  lines.push("");

  lines.push("## Recovery status");
  lines.push("");
  if (manifest.recoveries.length === 0) {
    lines.push("No restore has been recorded. Run `node scripts/restore.mjs`.");
  } else {
    lines.push("| Restored at | Key | Version ID | Status | Output | SHA-256 |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const recovery of [...manifest.recoveries].reverse().slice(0, 10)) {
      lines.push(
        `| ${formatIso(recovery.restoredAt)} | \`${escapeCell(recovery.key)}\` | \`${escapeCell(recovery.requestedVersionId)}\` | ${statusLabel(recovery.status)} | \`${escapeCell(recovery.outputPath)}\` | \`${shortHash(recovery.actualSha256)}\` |`,
      );
    }

    if (lastRecovery) {
      lines.push("");
      lines.push(
        `Latest recovery: **${statusLabel(lastRecovery.status)}** for \`${lastRecovery.sourceFile || lastRecovery.key}\` (run \`${lastRecovery.sourceRunId || "n/a"}\`).`,
      );
      lines.push("");
      lines.push(
        `Expected SHA-256: \`${lastRecovery.expectedSha256}\`  `,
      );
      lines.push(
        `Actual SHA-256:   \`${lastRecovery.actualSha256}\``,
      );
    }
  }
  lines.push("");

  lines.push("## Storage and retention");
  lines.push("");
  lines.push(`- Manifest archive copies: ${successfulFiles.length} objects, ${formatBytes(archiveBytes)}.`);
  lines.push(
    `- Uploaded bytes including the overwritten \`latest/\` mirror: ${formatBytes(uploadedBytes)}. The mirror keeps one object per source file but retains every historical version.`,
  );
  lines.push(`- Distinct \`latest/\` keys: ${latestKeys.size}.`);

  if (liveStorage) {
    lines.push(
      `- Live S3 totals: ${liveStorage.currentVersions} current version(s) / ${formatBytes(liveStorage.currentBytes)}; ${liveStorage.noncurrentVersions} noncurrent version(s) / ${formatBytes(liveStorage.noncurrentBytes)}; ${liveStorage.deleteMarkers} delete marker(s).`,
    );
    lines.push(`- Live S3 bytes across all versions: ${formatBytes(liveStorage.totalBytes)}.`);
  } else {
    lines.push(
      "- Live S3 totals were not queried. Run with `--live` to include real current/noncurrent version counts; billed storage can exceed the manifest estimate because every version is retained.",
    );
  }

  if (liveError) {
    lines.push("");
    lines.push(`> **Live S3 query failed:** ${escapeCell(liveError)}`);
  }

  lines.push(
    `- Lifecycle rule \`expire-noncurrent-versions\` expires noncurrent versions after ${retentionDays} days and aborts incomplete multipart uploads after 1 day.`,
  );
  lines.push("- Current versions are retained until explicitly deleted; versioning does not impose a retention limit by itself.");
  lines.push(
    "- The demo bucket uses `force_destroy = true` so `terraform destroy` can remove all versions. Real data buckets should set it to `false`.",
  );
  lines.push("");

  lines.push("## Failure events");
  lines.push("");
  if (failureEvents.length === 0) {
    lines.push("No failed backup, verification or restore events are recorded.");
  } else {
    lines.push("| Time | Type | Detail |");
    lines.push("| --- | --- | --- |");
    for (const event of failureEvents.slice(0, 20)) {
      lines.push(`| ${formatIso(event.at)} | ${escapeCell(event.type)} | ${escapeCell(event.detail)} |`);
    }
  }
  lines.push("");

  lines.push("## Reproduce");
  lines.push("");
  lines.push("```bash");
  lines.push("node scripts/backup.mjs");
  lines.push("node scripts/verify.mjs");
  lines.push("node scripts/report.mjs --live");
  lines.push("```");
  lines.push("");
  lines.push(
    "The manifest is the source of truth for expected keys, sizes, checksums and version IDs. Verification downloads each recorded version; it does not trust S3 metadata alone.",
  );
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    booleans: ["live", "help"],
  });
  checkArgs(args, ["manifest", "out", "live", "bucket", "retention-days", "help"]);

  if (args.help) {
    console.log(HELP);
    return;
  }

  const manifestPath = resolveInputPath(args.manifest, DEFAULT_MANIFEST);
  const outputPath = resolveInputPath(
    args.out,
    path.join(DEFAULT_REPORTS_DIR, "backup-status.md"),
  );
  const retentionDays = args["retention-days"]
    ? parseIntegerOption(args["retention-days"], "retention-days", {
        min: 1,
        max: 3650,
        fallback: getRetentionDays(),
      })
    : getRetentionDays();

  const manifest = await readManifest(manifestPath);

  let liveStorage = null;
  let liveError = null;

  if (args.live) {
    const fallbackBucket = manifest.runs.at(-1)?.bucket;
    try {
      const bucket = getBucketName({ ...args, bucket: args.bucket || fallbackBucket });
      liveStorage = await collectLiveStorage(bucket);
    } catch (error) {
      liveError = friendlyAwsError(error);
    }
  }

  const report = buildReport({
    manifest,
    manifestPath,
    outputPath,
    retentionDays,
    liveStorage,
    liveError,
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, "utf8");

  console.log(`[report] Wrote ${toDisplayPath(outputPath)}`);
  console.log(
    `[report] ${manifest.runs.length} run(s), ${manifest.verifications.length} verification(s), ${manifest.recoveries.length} recovery record(s).`,
  );

  if (liveStorage) {
    console.log(
      `[report] Live S3: ${liveStorage.currentVersions} current / ${liveStorage.noncurrentVersions} noncurrent versions, ${formatBytes(liveStorage.totalBytes)} total.`,
    );
  }
  if (liveError) {
    console.error(`[report] Live S3 query failed (report still written): ${liveError}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  printFatal("report", new Error(friendlyAwsError(error)));
});
