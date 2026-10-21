import * as gigs from "../services/gigService.js";

export async function listGigs(req, res) {
  res.json(await gigs.listGigs(req.validated));
}

export async function getGig(req, res) {
  res.json(await gigs.getGig(req.params.id, req.user.id));
}

export async function createGig(req, res) {
  res.status(201).json(await gigs.createGig(req.user.id, req.validated));
}

export async function updateGig(req, res) {
  res.json(await gigs.updateGigStatus(req.params.id, req.user.id, req.validated.status));
}
