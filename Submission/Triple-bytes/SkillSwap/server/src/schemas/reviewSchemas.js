import { z } from "zod";
import { uuid } from "./common.js";

export const createReviewSchema = z.object({
  gig_id: uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).nullable().optional(),
}).strict();

export const listReviewsSchema = z.object({
  reviewee_id: uuid.optional(),
  gig_id: uuid.optional(),
}).strict().refine((value) => value.reviewee_id || value.gig_id, {
  message: "reviewee_id or gig_id is required.",
  path: ["request"],
});
