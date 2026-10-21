import { Router } from "express";
import { listGigs, getGig, createGig, updateGigStatus } from "../services/gigService.js";
import { listGigApplicationsForOwner } from "../services/applicationService.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => res.json(listGigs(req.query)));

// must stay above "/:id"
router.get("/:id/applications", requireUser, (req, res) =>
  res.json(listGigApplicationsForOwner(req.params.id, req.user.id))
);

router.get("/:id", (req, res) => res.json(getGig(req.params.id)));

router.post("/", requireUser, (req, res) =>
  res.status(201).json(createGig(req.body, req.user.id))
);

router.patch("/:id", requireUser, (req, res) =>
  res.json(updateGigStatus(req.params.id, req.body, req.user.id))
);

export default router;