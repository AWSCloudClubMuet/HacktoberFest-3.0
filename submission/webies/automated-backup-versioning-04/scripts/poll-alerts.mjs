#!/usr/bin/env node
/**
 * Receive failure alerts from the SQS queue that is subscribed to the SNS
 * alert topic. LocalStack does not deliver real email, so this queue is the
 * local proof that the SNS -> SQS alert path works.
 */

import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import {
  checkArgs,
  parseArgs,
  parseIntegerOption,
  printFatal,
} from "./lib/cli.mjs";
import { baseClientConfig, friendlyAwsError, getEndpoint } from "./lib/s3.mjs";

const HELP = `Usage: node scripts/poll-alerts.mjs [options]

Receive messages from the alert verification SQS queue.

Options:
  --queue-url URL   Queue URL (default: ALERT_QUEUE_URL environment variable)
  --max N           Maximum messages to receive, 1-10 (default: 10)
  --wait N          Long-poll wait in seconds, 0-20 (default: 5)
  --delete          Delete each message after printing it
  --expect          Exit 1 when no message is received
  --help            Show this help

Exit codes:
  0  messages printed, or no messages and --expect was not set
  1  no messages and --expect was set, or the queue could not be read
`;

function normalizeQueueUrl(queueUrl, endpoint) {
  if (!endpoint) {
    return queueUrl;
  }

  try {
    const queue = new URL(queueUrl);
    const edge = new URL(endpoint);
    // LocalStack returns host-style queue URLs. Point the path at the edge
    // endpoint so the same script works with http://localhost:4566.
    return `${edge.origin}${queue.pathname}${queue.search}`;
  } catch {
    return queueUrl;
  }
}

function formatBody(body) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    booleans: ["delete", "expect", "help"],
  });
  checkArgs(args, ["queue-url", "max", "wait", "delete", "expect", "help"]);

  if (args.help) {
    console.log(HELP);
    return;
  }

  const rawQueueUrl = args["queue-url"] || process.env.ALERT_QUEUE_URL;
  if (!rawQueueUrl) {
    throw new Error(
      "No queue configured. Set ALERT_QUEUE_URL (for example, export ALERT_QUEUE_URL=\"$(terraform -chdir=infra output -raw sqs_queue_url)\") or pass --queue-url.",
    );
  }

  const maxMessages = parseIntegerOption(args.max, "max", {
    min: 1,
    max: 10,
    fallback: 10,
  });
  const waitSeconds = parseIntegerOption(args.wait, "wait", {
    min: 0,
    max: 20,
    fallback: 5,
  });
  const queueUrl = normalizeQueueUrl(rawQueueUrl, getEndpoint());
  const client = new SQSClient(baseClientConfig());

  const response = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitSeconds,
      MessageAttributeNames: ["All"],
      AttributeNames: ["All"],
    }),
  );

  const messages = response.Messages || [];
  if (messages.length === 0) {
    console.log("[alerts] No messages received.");
    if (args.expect) {
      console.error("[alerts] --expect was set, so exit code is 1.");
      process.exitCode = 1;
    }
    return;
  }

  console.log(`[alerts] Received ${messages.length} message(s) from ${queueUrl}\n`);

  for (const [index, message] of messages.entries()) {
    console.log(`--- message ${index + 1} ---`);
    console.log(`MessageId: ${message.MessageId || "n/a"}`);
    console.log(`Received:  ${message.Attributes?.SentTimestamp || "n/a"}`);
    console.log("Body:");
    console.log(formatBody(message.Body || ""));
    console.log("");

    if (args.delete && message.ReceiptHandle) {
      await client.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
      console.log(`[alerts] Deleted message ${message.MessageId || index + 1}.`);
    }
  }

  if (!args.delete) {
    console.log(
      "[alerts] Messages were left in the queue. They become visible again after the visibility timeout. Use --delete to acknowledge them.",
    );
  }
}

main().catch((error) => {
  printFatal("alerts", new Error(friendlyAwsError(error)));
});
