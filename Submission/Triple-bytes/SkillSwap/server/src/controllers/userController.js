import * as users from "../services/userService.js";

export async function listUsers(_req, res) {
  res.json(await users.listUsers());
}

export async function getUser(req, res) {
  res.json(await users.getUserProfile(req.params.id));
}
