/**
 * Failure notification helpers.
 *
 * SNS is the core alert path. The optional CloudWatch custom metric feeds the
 * opt-in alarm in Terraform. Both are best-effort: a monitoring failure must
 * never hide the result of the backup or verification operation.
 */

import { baseClientConfig, friendlyAwsError } from "./s3.mjs";

export async function publishAlert({ topicArn, subject, event, details }) {
  if (!topicArn) {
    return {
      published: false,
      reason: "BACKUP_ALERTS_TOPIC_ARN is not set; SNS alert skipped.",
    };
  }

  const { SNSClient, PublishCommand } = await import("@aws-sdk/client-sns");
  const client = new SNSClient(baseClientConfig());
  const message = JSON.stringify(
    {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    },
    null,
    2,
  );

  const response = await client.send(
    new PublishCommand({
      TopicArn: topicArn,
      Subject: subject.slice(0, 100),
      Message: message,
    }),
  );

  return { published: true, messageId: response.MessageId || null };
}

export async function publishFailureMetric({ namespace, failureCount }) {
  if (!namespace) {
    return {
      published: false,
      reason: "CLOUDWATCH_NAMESPACE is not set; CloudWatch metric skipped.",
    };
  }

  const { CloudWatchClient, PutMetricDataCommand } = await import(
    "@aws-sdk/client-cloudwatch"
  );
  const client = new CloudWatchClient(baseClientConfig());

  await client.send(
    new PutMetricDataCommand({
      Namespace: namespace,
      MetricData: [
        {
          MetricName: "BackupFailures",
          Unit: "Count",
          Value: Math.max(1, Number(failureCount) || 1),
          Timestamp: new Date(),
        },
      ],
    }),
  );

  return { published: true };
}

export async function notifyFailure({
  topicArn,
  subject,
  event,
  details,
  metricNamespace,
  failureCount,
}) {
  const result = { alert: null, metric: null, errors: [] };

  try {
    result.alert = await publishAlert({ topicArn, subject, event, details });
  } catch (error) {
    result.errors.push(`SNS publish failed: ${friendlyAwsError(error)}`);
  }

  try {
    result.metric = await publishFailureMetric({
      namespace: metricNamespace,
      failureCount,
    });
  } catch (error) {
    result.errors.push(`CloudWatch metric publish failed: ${friendlyAwsError(error)}`);
  }

  return result;
}

export function printNotificationResult(result) {
  if (result.alert?.published) {
    console.log(`[alerts] SNS message published (${result.alert.messageId || "no message id"}).`);
  } else if (result.alert?.reason) {
    console.warn(`[alerts] ${result.alert.reason}`);
  }

  if (result.metric?.published) {
    console.log("[alerts] CloudWatch BackupFailures metric published.");
  } else if (result.metric?.reason && result.alert?.published) {
    console.warn(`[alerts] ${result.metric.reason}`);
  }

  for (const error of result.errors) {
    console.error(`[alerts] ${error}`);
  }
}
