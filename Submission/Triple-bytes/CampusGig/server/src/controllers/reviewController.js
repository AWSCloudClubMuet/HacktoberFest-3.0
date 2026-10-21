import * as reviews from "../services/reviewService.js";

export async function createReview(req, res) {
  res.status(201).json(await reviews.createReview(req.user.id, req.validated));
}

export async function listReviews(req, res) {
  res.json(await reviews.listReviews(req.validated));
}
