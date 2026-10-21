import { data, save, nextId } from "../db/db.js";
import { badRequest, forbidden, notFound, conflict } from "./errors.js";
import { findGig, getEffectiveStatus, getGig } from "./gigService.js";
import { findUser } from "./userService.js";

// Add readable names so the frontend needs fewer requests
function present(app) {
  const gig = findGig(app.gig_id);
  const applicant = findUser(app.applicant_id);
  return {
    ...app,
    gig_title: gig ? gig.title : null,
    gig_status: gig ? getEffectiveStatus(gig) : null,
    applicant_name: applicant ? applicant.name : null,
  };
}

export function findApplication(id) {
  return data.applications.find((a) => a.id === Number(id)) || null;
}

export function createApplication(body, applicantId) {
  const errors = [];

  const gig = findGig(body.gig_id);
  if (!gig) throw notFound("Gig not found");

  const applicant = findUser(applicantId);
  if (!applicant) throw badRequest("Validation failed", ["applicant_id must belong to an existing user"]);

  if (typeof body.message !== "string" || body.message.trim().length < 5 || body.message.trim().length > 500)
    errors.push("message is required (5 to 500 characters)");
  if (errors.length) throw badRequest("Validation failed", errors);

  // Rule: cannot apply to your own gig
  if (gig.user_id === applicant.id)
    throw forbidden("You cannot apply to your own gig");

  // Rule: only open gigs accept applications (Expired counts as closed)
  const status = getEffectiveStatus(gig);
  if (status !== "Open")
    throw conflict(`This gig is ${status} and is not accepting applications`);

  // Rule: one application per user per gig
  const duplicate = data.applications.some(
    (a) => a.gig_id === gig.id && a.applicant_id === applicant.id
  );
  if (duplicate) throw conflict("You already applied to this gig");

  const application = {
    id: nextId("applications"),
    gig_id: gig.id,
    applicant_id: applicant.id,
    message: body.message.trim(),
    status: "Pending",
    created_at: new Date().toISOString(),
  };
  data.applications.push(application);
  save();
  return present(application);
}

// "My applications" view with personal statuses
export function listApplications({ applicant_id, gig_id, status }) {
  let result = data.applications;
  if (applicant_id) result = result.filter((a) => a.applicant_id === Number(applicant_id));
  if (gig_id) result = result.filter((a) => a.gig_id === Number(gig_id));
  if (status) result = result.filter((a) => a.status === status);
  return result
    .map(present)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// Owner view of one gig's applications
export function listGigApplications(gigId) {
  const gig = findGig(gigId);
  if (!gig) throw notFound("Gig not found");
  return listApplications({ gig_id: gig.id });
}


export function updateApplicationStatus(id, body, actorId) {
  const application = findApplication(id);
  if (!application) throw notFound("Application not found");

  const gig = findGig(application.gig_id);
  if (!gig) throw notFound("Gig not found");

  const actor = findUser(actorId);
  if (!actor)
    throw badRequest("Validation failed", ["user_id must belong to an existing user"]);

  // Rule: only the gig owner can accept or reject applicants
  if (gig.user_id !== actor.id)
    throw forbidden("Only the gig owner can accept or reject applicants");

  if (!["Accepted", "Rejected"].includes(body.status))
    throw badRequest("Validation failed", ["status must be Accepted or Rejected"]);

  // Only Pending applications can be decided, and only once
  if (application.status !== "Pending")
    throw conflict(`This application is already ${application.status}`);

  if (body.status === "Accepted") {
    // Gig must still be Open (Expired, In Progress, Completed, Cancelled all block it)
    const gigStatus = getEffectiveStatus(gig);
    if (gigStatus !== "Open")
      throw conflict(`Cannot accept an applicant: this gig is ${gigStatus}`);

    // All checks passed, now apply every change together
    application.status = "Accepted";
    gig.status = "In Progress";
    gig.accepted_applicant_id = application.applicant_id;

    for (const other of data.applications) {
      if (other.gig_id === gig.id && other.id !== application.id && other.status === "Pending") {
        other.status = "Rejected";
      }
    }
  } else {
    application.status = "Rejected";
  }

  save();

  // Return everything the UI needs to refresh in one response
  return {
    application: present(application),
    gig: getGig(gig.id),
    applications: listGigApplications(gig.id),
  };
}

// Owner-only view of a gig's applications
export function listGigApplicationsForOwner(gigId, actorId) {
  const gig = findGig(gigId);
  if (!gig) throw notFound("Gig not found");
  if (gig.user_id !== Number(actorId))
    throw forbidden("Only the gig owner can view applications for this gig");
  return listApplications({ gig_id: gig.id });
}