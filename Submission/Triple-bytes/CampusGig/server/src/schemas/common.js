import { z } from "zod";

export const uuid = z.guid("Must be a valid UUID.");
export const gigType = z.enum(["Offering", "Requesting"]);
export const category = z.enum(["Programming", "Design", "Writing", "Tutoring"]);
export const paymentType = z.enum(["Paid", "SkillSwap", "Free"]);
export const effectiveGigStatus = z.enum([
  "Open",
  "In Progress",
  "Completed",
  "Expired",
  "Cancelled",
]);
export const applicationStatus = z.enum(["Pending", "Accepted", "Rejected"]);

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Invalid date.");
