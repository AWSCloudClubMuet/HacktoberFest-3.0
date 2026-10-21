import { z } from "zod";
import {
  category,
  effectiveGigStatus,
  gigType,
  isoDate,
  paymentType,
  uuid,
} from "./common.js";
import { todayIso } from "../domain/rules.js";

export const createGigSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(2000),
  type: gigType,
  category,
  payment_type: paymentType,
  budget: z.number().positive().nullable().optional(),
  deadline: isoDate,
}).strict().superRefine((value, ctx) => {
  if (value.deadline < todayIso()) {
    ctx.addIssue({ code: "custom", path: ["deadline"], message: "Deadline cannot be in the past." });
  }
  if (value.payment_type === "Paid" && value.budget == null) {
    ctx.addIssue({ code: "custom", path: ["budget"], message: "Budget is required for paid gigs." });
  }
  if (value.payment_type !== "Paid" && value.budget != null) {
    ctx.addIssue({ code: "custom", path: ["budget"], message: "Budget must be empty unless payment type is Paid." });
  }
});

export const updateGigStatusSchema = z.object({
  status: z.enum(["Completed", "Cancelled"]),
}).strict();

const optionalNumber = z.preprocess(
  (value) => value === undefined ? undefined : Number(value),
  z.number().nonnegative().optional(),
);

export const listGigsSchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: category.optional(),
  type: gigType.optional(),
  payment_type: paymentType.optional(),
  min_budget: optionalNumber,
  max_budget: optionalNumber,
  status: effectiveGigStatus.optional(),
  user_id: uuid.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.min_budget != null && value.max_budget != null && value.min_budget > value.max_budget) {
    ctx.addIssue({ code: "custom", path: ["min_budget"], message: "min_budget cannot exceed max_budget." });
  }
});
