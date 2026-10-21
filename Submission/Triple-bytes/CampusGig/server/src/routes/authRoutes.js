import { Router } from "express";
import { login, me, signup } from "../controllers/authController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { currentUser } from "../middleware/currentUser.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, signupSchema } from "../schemas/authSchemas.js";

export const authRoutes = Router();
authRoutes.post("/signup", validate(signupSchema), asyncHandler(signup));
authRoutes.post("/login", validate(loginSchema), asyncHandler(login));
authRoutes.get("/me", currentUser, me);
