import { Router } from "express";
import { createReview, listReviews } from "../services/reviewService.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => res.json(listReviews(req.query)));

router.post("/", requireUser, (req, res) =>
  res.status(201).json(createReview(req.body, req.user.id))
);

export default router;