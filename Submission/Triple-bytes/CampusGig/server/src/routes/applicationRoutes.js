import { Router } from "express";
import {
  createApplication,
  listApplications,
  updateApplication,
} from "../controllers/applicationController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { currentUser } from "../middleware/currentUser.js";
import { validate } from "../middleware/validate.js";
import { validateId } from "../middleware/validateId.js";
import {
  createApplicationSchema,
  listApplicationsSchema,
  updateApplicationSchema,
} from "../schemas/applicationSchemas.js";

export const applicationRoutes = Router();
applicationRoutes.use(currentUser);
applicationRoutes.get("/", validate(listApplicationsSchema, "query"), asyncHandler(listApplications));
applicationRoutes.post("/", validate(createApplicationSchema), asyncHandler(createApplication));
applicationRoutes.patch("/:id", validateId(), validate(updateApplicationSchema), asyncHandler(updateApplication));
