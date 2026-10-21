import { getSupabase } from "../config/supabaseClient.js";
import { deriveReviewee } from "../domain/rules.js";
import { AppError, databaseError } from "../lib/AppError.js";

export async function createReview(reviewerId, input) {
  const db = getSupabase();
  const { data: gig, error: gigError } = await db
    .from("gigs").select("*").eq("id", input.gig_id).maybeSingle();
  if (gigError) throw databaseError(gigError);
  if (!gig) throw new AppError(404, "GIG_NOT_FOUND", "Gig was not found.");
  if (gig.status !== "Completed") {
    throw new AppError(409, "GIG_NOT_COMPLETED", "Reviews are allowed only after completion.");
  }

  const revieweeId = deriveReviewee(gig, reviewerId);
  if (!revieweeId) {
    throw new AppError(403, "NOT_GIG_PARTICIPANT", "Only the gig participants can review.");
  }

  const { data: existing, error: duplicateError } = await db.from("reviews")
    .select("id").eq("gig_id", input.gig_id).eq("reviewer_id", reviewerId).maybeSingle();
  if (duplicateError) throw databaseError(duplicateError);
  if (existing) {
    throw new AppError(409, "DUPLICATE_REVIEW", "You have already reviewed this gig.");
  }

  const { data, error } = await db.from("reviews").insert({
    gig_id: input.gig_id,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating: input.rating,
    comment: input.comment ?? null,
  }).select("*").single();
  if (error?.code === "23505") {
    throw new AppError(409, "DUPLICATE_REVIEW", "You have already reviewed this gig.");
  }
  if (error) throw databaseError(error);
  return data;
}

export async function listReviews(filters) {
  let query = getSupabase().from("reviews").select(`
    id, gig_id, reviewer_id, reviewee_id, rating, comment, created_at,
    reviewer:users!reviews_reviewer_id_fkey(id,name)
  `).order("created_at", { ascending: false });
  if (filters.reviewee_id) query = query.eq("reviewee_id", filters.reviewee_id);
  if (filters.gig_id) query = query.eq("gig_id", filters.gig_id);
  const { data, error } = await query;
  if (error) throw databaseError(error);
  return data;
}
