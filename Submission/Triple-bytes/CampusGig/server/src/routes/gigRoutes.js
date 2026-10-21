import { Router } from "express";
import {
  createGig,
  getGig,
  listGigs,
  updateGig,
} from "../controllers/gigController.js";
import { listGigApplications } from "../controllers/applicationController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { currentUser } from "../middleware/currentUser.js";
import { validate } from "../middleware/validate.js";
import { validateId } from "../middleware/validateId.js";
import {
  createGigSchema,
  listGigsSchema,
  updateGigStatusSchema,
} from "../schemas/gigSchemas.js";

export const gigRoutes = Router();
gigRoutes.use(currentUser);
gigRoutes.get("/", validate(listGigsSchema, "query"), asyncHandler(listGigs));
gigRoutes.post("/", validate(createGigSchema), asyncHandler(createGig));
gigRoutes.get("/:id/applications", validateId(), asyncHandler(listGigApplications));
gigRoutes.get("/:id", validateId(), asyncHandler(getGig));
gigRoutes.patch("/:id", validateId(), validate(updateGigStatusSchema), asyncHandler(updateGig));
