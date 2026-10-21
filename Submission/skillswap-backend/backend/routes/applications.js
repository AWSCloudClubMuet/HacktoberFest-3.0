import { Router } from "express";
import {
  createApplication,
  listApplications,
  updateApplicationStatus,
} from "../services/applicationService.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

// "My applications": always scoped to the acting user
router.get("/", requireUser, (req, res) =>
  res.json(listApplications({ applicant_id: req.user.id, status: req.query.status }))
);

router.post("/", requireUser, (req, res) =>
  res.status(201).json(createApplication(req.body, req.user.id))
);

router.patch("/:id", requireUser, (req, res) =>
  res.json(updateApplicationStatus(req.params.id, req.body, req.user.id))
);

export default router;