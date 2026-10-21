import * as applications from "../services/applicationService.js";

export async function createApplication(req, res) {
  res.status(201).json(await applications.createApplication(req.user.id, req.validated));
}

export async function listApplications(req, res) {
  res.json(await applications.listOwnApplications(req.user.id, req.validated));
}

export async function listGigApplications(req, res) {
  res.json(await applications.listGigApplications(req.params.id, req.user.id));
}

export async function updateApplication(req, res) {
  res.json(await applications.updateApplication(
    req.params.id,
    req.user.id,
    req.validated.status,
  ));
}
