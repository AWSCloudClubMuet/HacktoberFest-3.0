import cors from "cors";
import express from "express";
import { getEnv } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { applicationRoutes } from "./routes/applicationRoutes.js";
import { gigRoutes } from "./routes/gigRoutes.js";
import { reviewRoutes } from "./routes/reviewRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  const env = getEnv();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/gigs", gigRoutes);
  app.use("/applications", applicationRoutes);
  app.use("/reviews", reviewRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
