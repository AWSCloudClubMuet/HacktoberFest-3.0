#!/usr/bin/env node
/**
 * Detect a missed or stale backup from the local manifest.
 *
 * The core demo has no deployed scheduler. Run this script from cron, CI, a
 * monitoring job, or an EventBridge/Lambda schedule after the expected backup
 * window. It exits non-zero and publishes `backup.missed` when there is no
 * successful run or the latest successful run is older than the limit.
 */

import {
  DEFAULT_MANIFEST,
  formatIso,
  getMetricNamespace,
  getTopicArn,
  readManifest,
  resolveInputPath,
  toDisplayPath,
} from "./lib/s3.mjs";
import { checkArgs, parseArgs, parseIntegerOption, printFatal } from "./lib/cli.mjs";
import { notifyFailure, printNotificationResult } from "./lib/alerts.mjs";

const HELP = `Usage: node scripts/check-freshness.mjs [options]

Check the age of the latest successful backup in the manifest. This is the
local missed-backup check; invoke it from a scheduler or monitoring job.

Options:
  --manifest FILE        Manifest path (default: manifests/manifest.json)
  --max-age-hours N      Maximum allowed age in hours (default: 26)
  --now ISO              Override the current time for a deterministic test
  --topic-arn ARN        SNS topic override (default: BACKUP_ALERTS_TOPIC_ARN)
  --metric-namespace NS  CloudWatch namespace override (default: CLOUDWATCH_NAMESPACE)
  --no-alert             Do not publish an SNS alert
  --help                 Show this help

Exit codes:
  0  the latest successful backup is within the allowed age
  1  no successful backup exists or the latest one is stale
`;

function findLatestSuccessfulRun(runs) {
  return (
    runs
      .filter((run) => run && run.status === "success")
      .map((run) => ({
        run,
        timestamp: Date.parse(run.finishedAt || run.startedAt || ""),
      }))
      .filter((entry) => Number.isFinite(entry.timestamp))
      .sort((left, right) => right.timestamp - left.timestamp)[0] || null
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    booleans: ["no-alert", "help"],
  });
  checkArgs(args, [
    "manifest",
    "max-age-hours",
    "now",
    "topic-arn",
    "metric-namespace",
    "no-alert",
    "help",
  ]);

  if (args.help) {
    console.log(HELP);
    return;
  }

  const maxAgeHours = parseIntegerOption(args["max-age-hours"], "max-age-hours", {
    min: 1,
    max: 8760,
    fallback: 26,
  });
  const manifestPath = resolveInputPath(args.manifest, DEFAULT_MANIFEST);
  const now = args.now ? new Date(args.now) : new Date();

  if (Number.isNaN(now.getTime())) {
    throw new Error(`--now is not a valid date: ${args.now}`);
  }

  const manifest = await readManifest(manifestPath);
  const latest = findLatestSuccessfulRun(manifest.runs);
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  console.log(`[freshness] Manifest: ${toDisplayPath(manifestPath)}`);
  console.log(
    `[freshness] Maximum age: ${maxAgeHours} ${maxAgeHours === 1 ? "hour" : "hours"}`,
  );

  let passed;
  let ageHours = null;
  let reason;

  if (!latest) {
    passed = false;
    reason = "No successful backup exists in the manifest.";
    console.log("[freshness] Latest successful backup: none");
  } else {
    const ageMs = Math.max(0, now.getTime() - latest.timestamp);
    ageHours = ageMs / (60 * 60 * 1000);
    passed = ageMs <= maxAgeMs;
    const lastSuccessfulAt = latest.run.finishedAt || latest.run.startedAt;
    console.log(
      `[freshness] Latest successful backup: ${formatIso(lastSuccessfulAt)} (${latest.run.runId})`,
    );
    console.log(`[freshness] Age: ${ageHours.toFixed(1)} hours`);
    reason = passed
      ? `Latest successful backup is ${ageHours.toFixed(1)} hours old, within the ${maxAgeHours}-hour limit.`
      : `Latest successful backup is ${ageHours.toFixed(1)} hours old, exceeding the ${maxAgeHours}-hour limit.`;
  }

  if (passed) {
    console.log("[freshness] PASS: backup is fresh.");
    return;
  }

  console.error(`[freshness] FAIL: ${reason}`);

  if (args["no-alert"]) {
    console.warn("[alerts] SNS alert suppressed by --no-alert.");
  } else {
    const notification = await notifyFailure({
      topicArn: getTopicArn(args),
      subject: "BACKUP MISSED OR STALE",
      event: "backup.missed",
      details: {
        reason,
        maxAgeHours,
        checkedAt: now.toISOString(),
        lastSuccessfulAt: latest
          ? formatIso(latest.run.finishedAt || latest.run.startedAt)
          : null,
        lastSuccessfulRunId: latest?.run.runId || null,
        bucket: latest?.run.bucket || null,
        environment: latest?.run.environment || null,
        ageHours: ageHours === null ? null : Number(ageHours.toFixed(2)),
        manifest: toDisplayPath(manifestPath),
      },
      metricNamespace: getMetricNamespace(args),
      failureCount: 1,
    });
    printNotificationResult(notification);
  }

  process.exitCode = 1;
}

main().catch((error) => {
  printFatal("freshness", error);
});
