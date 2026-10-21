import { data, save, nextId } from "../db/db.js";
import { badRequest, forbidden, notFound } from "./errors.js";

export function findUser(id) {
  return data.users.find((u) => u.id === Number(id)) || null;
}

// All profile numbers are computed from stored data, never edited by hand
export function getUserStats(userId) {
  const id = Number(userId);

  const gigs_posted = data.gigs.filter((g) => g.user_id === id).length;

  // Completed gigs the user took part in, as owner or as accepted applicant
  const gigs_completed = data.gigs.filter(
    (g) =>
      g.status === "Completed" &&
      (g.user_id === id || g.accepted_applicant_id === id)
  ).length;

  const received = data.reviews.filter((r) => r.reviewee_id === id);
  const review_count = received.length;
  const average_rating = review_count
    ? Math.round((received.reduce((sum, r) => sum + r.rating, 0) / review_count) * 10) / 10
    : null; // null = no reviews yet

  return { gigs_posted, gigs_completed, average_rating, review_count };
}

// User object with stats attached (used by GET /users/:id)
export function withStats(user) {
  return { ...user, ...getUserStats(user.id) };
}

function validateUser(body, { partial = false } = {}) {
  const errors = [];
  const has = (k) => body[k] !== undefined;

  if (!partial || has("name")) {
    if (typeof body.name !== "string" || body.name.trim().length < 2)
      errors.push("name is required (min 2 characters)");
  }
  if (!partial || has("major")) {
    if (typeof body.major !== "string" || !body.major.trim())
      errors.push("major is required");
  }
  if (!partial || has("semester")) {
    if (!Number.isInteger(body.semester) || body.semester < 1 || body.semester > 8)
      errors.push("semester must be a whole number from 1 to 8");
  }
  if (has("bio") && typeof body.bio !== "string")
    errors.push("bio must be text");
  if (!partial || has("skills")) {
    if (
      !Array.isArray(body.skills) ||
      body.skills.length === 0 ||
      body.skills.some((s) => typeof s !== "string" || !s.trim())
    )
      errors.push("skills must be a non-empty array of text values");
  }

  if (errors.length) throw badRequest("Validation failed", errors);
}

export function listUsers() {
  return data.users.map(withStats);
}

export function getUser(id) {
  const user = findUser(id);
  if (!user) throw notFound("User not found");
  return withStats(user);
}

export function createUser(body) {
  validateUser(body);
  const user = {
    id: nextId("users"),
    name: body.name.trim(),
    major: body.major.trim(),
    semester: body.semester,
    bio: (body.bio || "").trim(),
    skills: body.skills.map((s) => s.trim()),
  };
  data.users.push(user);
  save();
  return withStats(user);
}

export function updateUser(id, body, actorId) {
  const user = findUser(id);
  if (!user) throw notFound("User not found");
  if (user.id !== Number(actorId))
    throw forbidden("You can only edit your own profile");
  validateUser(body, { partial: true });
  // ...the rest stays exactly the same

  // Only these fields can change. Stats and id can never be edited.
  for (const key of ["name", "major", "semester", "bio", "skills"]) {
    if (body[key] !== undefined) {
      user[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
    }
  }
  save();
  return withStats(user);
}