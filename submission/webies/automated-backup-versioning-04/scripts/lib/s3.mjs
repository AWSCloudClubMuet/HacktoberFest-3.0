/**
 * Shared S3 client, checksum, manifest and formatting helpers.
 *
 * The SDK reads the standard AWS credential chain. The only environment
 * switch needed for LocalStack is AWS_ENDPOINT_URL; when it is unset the same
 * code talks to real AWS and uses virtual-hosted-style requests.
 */

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client } from "@aws-sdk/client-s3";

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

export const TEAM_ROOT = path.resolve(LIB_DIR, "..", "..");
export const DEFAULT_SAMPLE_DATA = path.join(TEAM_ROOT, "sample-data");
export const DEFAULT_MANIFEST = path.join(TEAM_ROOT, "manifests", "manifest.json");
export const DEFAULT_REPORTS_DIR = path.join(TEAM_ROOT, "reports");
export const DEFAULT_RESTORE_DIR = path.join(TEAM_ROOT, "restored");
export const MANIFEST_SCHEMA_VERSION = 1;

export function getAwsRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}

export function getEndpoint() {
  const raw = (process.env.AWS_ENDPOINT_URL || "").trim();
  if (!raw) {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      `AWS_ENDPOINT_URL is not a valid URL: ${raw}. Example: http://localhost:4566`,
    );
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("AWS_ENDPOINT_URL must start with http:// or https://.");
  }

  return raw.replace(/\/+$/, "");
}

export function baseClientConfig() {
  const endpoint = getEndpoint();
  return {
    region: getAwsRegion(),
    ...(endpoint ? { endpoint } : {}),
    maxAttempts: Number.parseInt(process.env.AWS_MAX_ATTEMPTS || "3", 10),
  };
}

export function createS3Client() {
  const endpoint = getEndpoint();
  return new S3Client({
    ...baseClientConfig(),
    forcePathStyle: Boolean(endpoint),
  });
}

export function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function sha256File(filePath) {
  const buffer = await readFile(filePath);
  return sha256Buffer(buffer);
}

export async function listFilesRecursive(rootDir) {
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return files;
}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function toDisplayPath(value) {
  const relative = path.relative(TEAM_ROOT, value);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return toPosix(relative);
  }
  return value;
}

export function newRunId(date = new Date()) {
  const timestamp = date.toISOString().replace(/[-:.]/g, "");
  return `${timestamp}-${randomUUID().slice(0, 8)}`;
}

export function archiveKeyFor(runId, relativeFile) {
  return `backups/${runId}/${relativeFile}`;
}

export function latestKeyFor(relativeFile) {
  return `latest/${relativeFile}`;
}

export function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  const digits = unit === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(digits)} ${units[unit]}`;
}

export function formatIso(value) {
  if (!value) {
    return "n/a";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export function shortHash(value) {
  return value ? `${value.slice(0, 12)}...` : "n/a";
}

export function emptyManifest() {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    runs: [],
    verifications: [],
    recoveries: [],
  };
}

function normalizeManifest(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Manifest must contain a JSON object.");
  }

  return {
    ...emptyManifest(),
    ...parsed,
    schemaVersion: parsed.schemaVersion || MANIFEST_SCHEMA_VERSION,
    runs: Array.isArray(parsed.runs) ? parsed.runs : [],
    verifications: Array.isArray(parsed.verifications) ? parsed.verifications : [],
    recoveries: Array.isArray(parsed.recoveries) ? parsed.recoveries : [],
  };
}

export async function readManifest(manifestPath, { allowMissing = true } = {}) {
  try {
    const raw = await readFile(manifestPath, "utf8");
    try {
      return normalizeManifest(JSON.parse(raw));
    } catch (error) {
      throw new Error(`Cannot parse manifest ${manifestPath}: ${error.message}`);
    }
  } catch (error) {
    if (error.code === "ENOENT" && allowMissing) {
      return emptyManifest();
    }
    if (error.code === "ENOENT") {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }
    throw error;
  }
}

export async function writeManifest(manifestPath, manifest) {
  await mkdir(path.dirname(manifestPath), { recursive: true });
  const temporaryPath = `${manifestPath}.${process.pid}.${Date.now()}.tmp`;
  const body = `${JSON.stringify(manifest, null, 2)}\n`;

  try {
    await writeFile(temporaryPath, body, "utf8");
    await rename(temporaryPath, manifestPath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw new Error(`Cannot write manifest ${manifestPath}: ${error.message}`);
  }
}

export function resolveInputPath(value, fallback) {
  if (!value) {
    return fallback;
  }
  return path.resolve(process.cwd(), value);
}

export function getBucketName(args = {}) {
  const bucket = args.bucket || process.env.BUCKET_NAME || process.env.BACKUP_BUCKET;
  if (!bucket) {
    throw new Error(
      "No bucket configured. Set BUCKET_NAME (for example, export BUCKET_NAME=\"$(terraform -chdir=infra output -raw bucket_name)\") or pass --bucket.",
    );
  }
  return bucket;
}

export function getTopicArn(args = {}) {
  return (
    args["topic-arn"] ||
    process.env.BACKUP_ALERTS_TOPIC_ARN ||
    process.env.SNS_TOPIC_ARN ||
    null
  );
}

export function getMetricNamespace(args = {}) {
  return args["metric-namespace"] || process.env.CLOUDWATCH_NAMESPACE || null;
}

export function getRetentionDays() {
  const parsed = Number.parseInt(process.env.NONCURRENT_RETENTION_DAYS || "7", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 7;
}

export function guessContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    ".csv": "text/csv; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".yaml": "application/yaml; charset=utf-8",
    ".yml": "application/yaml; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };
  return types[extension] || "application/octet-stream";
}

export function isNotFound(error) {
  return (
    error?.name === "NoSuchKey" ||
    error?.name === "NotFound" ||
    error?.name === "NoSuchVersion" ||
    error?.$metadata?.httpStatusCode === 404
  );
}

export function friendlyAwsError(error) {
  if (!error) {
    return "Unknown error.";
  }

  const name = error.name || error.Code || "Error";
  const message = error.message || String(error);
  const status = error.$metadata?.httpStatusCode;
  const hints = [];

  if (
    name === "CredentialsProviderError" ||
    /credential/i.test(message) ||
    /Could not load credentials/i.test(message)
  ) {
    hints.push(
      "No AWS credentials were found. For LocalStack export AWS_ACCESS_KEY_ID=test and AWS_SECRET_ACCESS_KEY=test; for real AWS configure a profile or role.",
    );
  }
  if (name === "ECONNREFUSED" || /ECONNREFUSED/.test(message)) {
    hints.push("Cannot reach the S3 endpoint. Check AWS_ENDPOINT_URL and that LocalStack is running.");
  }
  if (status === 403) {
    hints.push("Access denied. Check the IAM policy, bucket policy and the active credentials.");
  }
  if (name === "NoSuchBucket" || /NoSuchBucket/.test(message)) {
    hints.push("The bucket no longer exists. Run terraform apply again or check BUCKET_NAME.");
  }

  return [
    `${name}: ${message}`,
    status ? `(HTTP ${status})` : "",
    ...hints,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
