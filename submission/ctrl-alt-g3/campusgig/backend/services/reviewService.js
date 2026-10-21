import { data, save, nextId } from "../db/db.js";
import { badRequest, forbidden, notFound, conflict } from "./errors.js";
import { findGig } from "./gigService.js";
import { findUser } from "./userService.js";

function present(review) {
  const gig = findGig(review.gig_id);
  const reviewer = findUser(review.reviewer_id);
  const reviewee = findUser(review.reviewee_id);
  return {
    ...review,
    gig_title: gig ? gig.title : null,
    reviewer_name: reviewer ? reviewer.name : null,
    reviewee_name: reviewee ? reviewee.name : null,
  };
}

export function createReview(body, reviewerId) {
  const gig = findGig(body.gig_id);
  if (!gig) throw notFound("Gig not found");

  const reviewer = findUser(reviewerId);
  if (!reviewer)
    throw badRequest("Validation failed", ["reviewer_id must belong to an existing user"]);

  const errors = [];
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)
    errors.push("rating must be a whole number from 1 to 5");
  if (typeof body.comment !== "string" || body.comment.trim().length < 3 || body.comment.trim().length > 500)
    errors.push("comment is required (3 to 500 characters)");
  if (errors.length) throw badRequest("Validation failed", errors);

  // Rule: reviews are only allowed after the gig is completed
  if (gig.status !== "Completed")
    throw conflict("You can only review a gig after it is Completed");

  // Rule: only the owner and the accepted applicant can review
  const isOwner = gig.user_id === reviewer.id;
  const isAcceptedApplicant = gig.accepted_applicant_id === reviewer.id;
  if (!isOwner && !isAcceptedApplicant)
    throw forbidden("Only the gig owner and the accepted applicant can review this gig");

  // Rule: one review per reviewer per gig
  const duplicate = data.reviews.some(
    (r) => r.gig_id === gig.id && r.reviewer_id === reviewer.id
  );
  if (duplicate) throw conflict("You already reviewed this gig");

  // The reviewee is always the other party, never chosen by the client
  const reviewee_id = isOwner ? gig.accepted_applicant_id : gig.user_id;

  const review = {
    id: nextId("reviews"),
    gig_id: gig.id,
    reviewer_id: reviewer.id,
    reviewee_id,
    rating: body.rating,
    comment: body.comment.trim(),
  };
  data.reviews.push(review);
  save();
  return present(review);
}

// Filters: user_id = reviews received by that user, gig_id = reviews on that gig
export function listReviews({ user_id, gig_id }) {
  let result = data.reviews;
  if (user_id) result = result.filter((r) => r.reviewee_id === Number(user_id));
  if (gig_id) result = result.filter((r) => r.gig_id === Number(gig_id));
  return result.map(present).sort((a, b) => b.id - a.id);
}