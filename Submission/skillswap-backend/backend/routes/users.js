import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
} from "../services/userService.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => res.json(listUsers()));
router.get("/:id", (req, res) => res.json(getUser(req.params.id)));
router.post("/", (req, res) => res.status(201).json(createUser(req.body)));

router.patch("/:id", requireUser, (req, res) =>
  res.json(updateUser(req.params.id, req.body, req.user.id))
);

export default router;