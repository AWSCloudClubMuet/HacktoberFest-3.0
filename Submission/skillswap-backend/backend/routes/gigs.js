import { Router } from "express";
import { listGigs, getGig, createGig, updateGigStatus } from "../services/gigService.js";
import { requireUser } from "../middleware/auth.js";
import { listGigApplicationsForOwner } from "../services/applicationService.js";

const router = Router();

router.get("/", (req, res) => res.json(listGigs(req.query)));
router.get("/:id/applications", (req, res) =>
  res.json(listGigApplications(req.params.id))
);
router.get("/:id", (req, res) => res.json(getGig(req.params.id)));

router.get("/:id/applications", requireUser, (req, res) =>
  res.json(listGigApplicationsForOwner(req.params.id, req.user.id))
);

router.post("/", requireUser, (req, res) =>
  res.status(201).json(createGig(req.body, req.user.id))
);

router.patch("/:id", requireUser, (req, res) =>
  res.json(updateGigStatus(req.params.id, req.body, req.user.id))
);

// Temporary: the poster comes from body.user_id. Step 11 replaces this
// with the x-user-id header so it can't be faked in the body.
router.post("/", (req, res) => {
  res.status(201).json(createGig(req.body, req.body.user_id));
});

// Temporary: acting user comes from body.user_id.
// Step 11 replaces this with the x-user-id header.
router.patch("/:id", (req, res) => {
  res.json(updateGigStatus(req.params.id, req.body, req.body.user_id));
});

export default router;