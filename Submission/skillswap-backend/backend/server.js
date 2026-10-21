import express from "express";
import cors from "cors";
import usersRouter from "./routes/users.js";
import { ApiError } from "./services/errors.js";
import gigsRouter from "./routes/gigs.js";
import applicationsRouter from "./routes/applications.js";
import reviewsRouter from "./routes/reviews.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/users", usersRouter);
app.use("/gigs", gigsRouter);
app.use("/applications", applicationsRouter);
app.use("/reviews", reviewsRouter);


// Unknown route
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Central error handler: turns thrown ApiErrors into JSON
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: err.message, ...(err.details && { details: err.details }) });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});