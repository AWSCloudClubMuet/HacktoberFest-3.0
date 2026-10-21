import * as auth from "../services/authService.js";

export async function signup(req, res) {
  res.status(201).json(await auth.signup(req.validated, req.ip));
}

export async function login(req, res) {
  res.json(await auth.login(req.validated, req.ip));
}

export function me(req, res) {
  res.json(req.user);
}
