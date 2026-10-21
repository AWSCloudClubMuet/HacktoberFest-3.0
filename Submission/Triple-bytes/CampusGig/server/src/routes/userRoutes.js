import { Router } from "express";
import { getUser, listUsers } from "../controllers/userController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validateId } from "../middleware/validateId.js";

export const userRoutes = Router();
userRoutes.get("/", asyncHandler(listUsers));
userRoutes.get("/:id", validateId(), asyncHandler(getUser));
