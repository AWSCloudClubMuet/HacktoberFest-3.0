import { Router } from "express";
import { createReview, listReviews } from "../controllers/reviewController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { currentUser } from "../middleware/currentUser.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema, listReviewsSchema } from "../schemas/reviewSchemas.js";

export const reviewRoutes = Router();
reviewRoutes.use(currentUser);
reviewRoutes.get("/", validate(listReviewsSchema, "query"), asyncHandler(listReviews));
reviewRoutes.post("/", validate(createReviewSchema), asyncHandler(createReview));
