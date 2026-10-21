import { data, save, nextId } from "../db/db.js";
import { badRequest, notFound, forbidden, conflict } from "./errors.js";
import { findUser } from "./userService.js";

export const CATEGORIES = ["Programming", "Design", "Writing", "Tutoring"];
export const TYPES = ["Offering", "Requesting"];
export const PAYMENT_TYPES = ["Paid", "SkillSwap", "Free"];

// An Open gig whose deadline day has passed is shown as Expired.
// "Expired" is never stored, only computed.
export function getEffectiveStatus(gig) {
  if (gig.status === "Open") {
    const endOfDeadline = new Date(`${gig.deadline}T23:59:59.999`);
    if (endOfDeadline < new Date()) return "Expired";
  }
  return gig.status;
}

// Gig as the API should return it (status replaced by the effective one)
export function withEffectiveStatus(gig) {
  return { ...gig, status: getEffectiveStatus(gig) };
}

export function findGig(id) {
  return data.gigs.find((g) => g.id === Number(id)) || null;
}


// Today's date in the server's local timezone (YYYY-MM-DD)
const todayStr = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

function isValidDateString(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  // Parse and compare in UTC on both sides so timezone doesn't matter
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function validateGig(body) {
  const errors = [];

  if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 100)
    errors.push("title is required (3 to 100 characters)");

  if (typeof body.description !== "string" || body.description.trim().length < 10)
    errors.push("description is required (min 10 characters)");

  if (!TYPES.includes(body.type))
    errors.push(`type must be one of: ${TYPES.join(", ")}`);

  if (!CATEGORIES.includes(body.category))
    errors.push(`category must be one of: ${CATEGORIES.join(", ")}`);

  if (!PAYMENT_TYPES.includes(body.payment_type))
    errors.push(`payment_type must be one of: ${PAYMENT_TYPES.join(", ")}`);

  // Budget rule: required for Paid, must be empty for SkillSwap/Free
  const hasBudget = body.budget !== undefined && body.budget !== null;
  if (body.payment_type === "Paid") {
    if (typeof body.budget !== "number" || !Number.isFinite(body.budget) || body.budget <= 0)
      errors.push("budget is required for Paid gigs and must be a positive number");
  } else if (PAYMENT_TYPES.includes(body.payment_type) && hasBudget) {
    errors.push("budget must be empty for SkillSwap and Free gigs");
  }

  if (!isValidDateString(body.deadline))
    errors.push("deadline is required in YYYY-MM-DD format");
  else if (body.deadline < todayStr())
    errors.push("deadline cannot be in the past");

  if (errors.length) throw badRequest("Validation failed", errors);
}

// Attach the owner's name so the frontend doesn't need a second request
function present(gig) {
  const owner = findUser(gig.user_id);
  return { ...withEffectiveStatus(gig), owner_name: owner ? owner.name : null };
}

export function createGig(body, userId) {
  const owner = findUser(userId);
  if (!owner) throw badRequest("Validation failed", ["user_id must belong to an existing user"]);

  validateGig(body);

  const gig = {
    id: nextId("gigs"),
    user_id: owner.id,
    title: body.title.trim(),
    description: body.description.trim(),
    type: body.type,
    category: body.category,
    payment_type: body.payment_type,
    budget: body.payment_type === "Paid" ? body.budget : null,
    deadline: body.deadline,
    status: "Open",
    accepted_applicant_id: null,
    created_at: new Date().toISOString(),
  };
  data.gigs.push(gig);
  save();
  return present(gig);
}

export function getGig(id) {
  const gig = findGig(id);
  if (!gig) throw notFound("Gig not found");
  return present(gig);
}

export function listGigs(query) {
  const { category, type, payment_type, status, q, minBudget, maxBudget, user_id } = query;
  const errors = [];

  if (category && !CATEGORIES.includes(category)) errors.push("invalid category");
  if (type && !TYPES.includes(type)) errors.push("invalid type");
  if (payment_type && !PAYMENT_TYPES.includes(payment_type)) errors.push("invalid payment_type");

  const min = minBudget !== undefined ? Number(minBudget) : null;
  const max = maxBudget !== undefined ? Number(maxBudget) : null;
  if (min !== null && Number.isNaN(min)) errors.push("minBudget must be a number");
  if (max !== null && Number.isNaN(max)) errors.push("maxBudget must be a number");
  if (errors.length) throw badRequest("Invalid filters", errors);

  const needle = typeof q === "string" ? q.trim().toLowerCase() : "";

  let result = data.gigs.map(present); // status is already Expired where it applies

  if (category) result = result.filter((g) => g.category === category);
  if (type) result = result.filter((g) => g.type === type);
  if (payment_type) result = result.filter((g) => g.payment_type === payment_type);
  if (status) result = result.filter((g) => g.status === status);
  if (user_id) result = result.filter((g) => g.user_id === Number(user_id));

  // Budget range only matches gigs that have a budget (Paid ones)
  if (min !== null) result = result.filter((g) => g.budget !== null && g.budget >= min);
  if (max !== null) result = result.filter((g) => g.budget !== null && g.budget <= max);

  // Keyword search across title and description
  if (needle) {
    result = result.filter(
      (g) => g.title.toLowerCase().includes(needle) || g.description.toLowerCase().includes(needle)
    );
  }

  // Newest first
  return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
}


const STATUSES = ["Open", "In Progress", "Completed", "Expired", "Cancelled"];

export function updateGigStatus(id, body, actorId) {
  const gig = findGig(id);
  if (!gig) throw notFound("Gig not found");

  const actor = findUser(actorId);
  if (!actor)
    throw badRequest("Validation failed", ["user_id must belong to an existing user"]);

  // Rule: only the gig owner can change status
  if (gig.user_id !== actor.id)
    throw forbidden("Only the gig owner can change the gig status");

  if (!STATUSES.includes(body.status))
    throw badRequest("Validation failed", [`status must be one of: ${STATUSES.join(", ")}`]);

  const current = getEffectiveStatus(gig); // what the user sees (Expired included)
  const next = body.status;

  if (next === current)
    throw conflict(`This gig is already ${current}`);

  if (next === "Completed") {
    // Rule: completion is only allowed from In Progress
    if (gig.status !== "In Progress")
      throw conflict(`Only gigs that are In Progress can be completed (this gig is ${current})`);
    gig.status = "Completed";
  } else if (next === "In Progress") {
    // Only accepting an applicant can start a gig
    throw conflict("Accept an applicant to move this gig to In Progress");
  } else if (next === "Cancelled") {
    if (gig.status !== "Open")
      throw conflict(`Only Open gigs can be cancelled (this gig is ${current})`);
    gig.status = "Cancelled";
    // Don't leave dangling Pending applications on a cancelled gig
    for (const app of data.applications) {
      if (app.gig_id === gig.id && app.status === "Pending") app.status = "Rejected";
    }
  } else {
    // Open and Expired can't be set by hand
    throw conflict(`Status cannot be set to ${next} manually`);
  }

  save();
  return present(gig);
}