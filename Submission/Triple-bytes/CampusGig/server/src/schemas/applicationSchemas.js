import { z } from "zod";
import { applicationStatus, uuid } from "./common.js";

export const createApplicationSchema = z.object({
  gig_id: uuid,
  message: z.string().trim().min(5).max(500),
}).strict();

export const updateApplicationSchema = z.object({
  status: z.enum(["Accepted", "Rejected"]),
}).strict();

export const listApplicationsSchema = z.object({
  applicant_id: uuid,
  status: applicationStatus.optional(),
}).strict();
