import { getSupabase } from "../config/supabaseClient.js";
import { effectiveGigStatus, roundRating } from "../domain/rules.js";
import { AppError, databaseError } from "../lib/AppError.js";
import { getRpcErrorCode } from "../lib/supabaseRpcError.js";

export async function createApplication(applicantId, input) {
  const db = getSupabase();
  const [gigResult, duplicateResult] = await Promise.all([
    db.from("gigs").select("*").eq("id", input.gig_id).maybeSingle(),
    db.from("applications").select("id")
      .eq("gig_id", input.gig_id).eq("applicant_id", applicantId).maybeSingle(),
  ]);
  const { data: gig, error: gigError } = gigResult;
  if (gigError) throw databaseError(gigError);
  if (!gig) throw new AppError(404, "GIG_NOT_FOUND", "Gig was not found.");
  if (gig.user_id === applicantId) {
    throw new AppError(403, "CANNOT_APPLY_OWN_GIG", "You cannot apply to your own gig.");
  }
  if (effectiveGigStatus(gig) !== "Open") {
    throw new AppError(409, "GIG_NOT_OPEN", "This gig is closed.");
  }

  const { data: existing, error: duplicateError } = duplicateResult;
  if (duplicateError) throw databaseError(duplicateError);
  if (existing) {
    throw new AppError(409, "DUPLICATE_APPLICATION", "You have already applied to this gig.");
  }

  const { data, error } = await db.from("applications").insert({
    gig_id: input.gig_id,
    applicant_id: applicantId,
    message: input.message,
    status: "Pending",
  }).select("*").single();

  if (error?.code === "23505") {
    throw new AppError(409, "DUPLICATE_APPLICATION", "You have already applied to this gig.");
  }
  if (error) throw databaseError(error);
  return data;
}

export async function listOwnApplications(currentUserId, filters) {
  if (filters.applicant_id !== currentUserId) {
    throw new AppError(403, "FORBIDDEN", "You can only view your own applications.");
  }

  let query = getSupabase().from("applications").select(`
    id, gig_id, applicant_id, message, status, created_at,
    gig:gigs!applications_gig_id_fkey(id,title,status,category,deadline)
  `).eq("applicant_id", currentUserId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw databaseError(error);
  return data.map((application) => ({
    ...application,
    gig: application.gig ? {
      ...application.gig,
      status: effectiveGigStatus(application.gig),
    } : null,
  }));
}

export async function listGigApplications(gigId, ownerId) {
  const db = getSupabase();
  const { data: gig, error: gigError } = await db
    .from("gigs").select("id,user_id").eq("id", gigId).maybeSingle();
  if (gigError) throw databaseError(gigError);
  if (!gig) throw new AppError(404, "GIG_NOT_FOUND", "Gig was not found.");
  if (gig.user_id !== ownerId) {
    throw new AppError(403, "NOT_GIG_OWNER", "Only the gig owner can view applications.");
  }

  const { data: applications, error } = await db.from("applications").select(`
    id, gig_id, applicant_id, message, status, created_at,
    applicant:users!applications_applicant_id_fkey(id,name,major,skills)
  `).eq("gig_id", gigId).order("created_at");
  if (error) throw databaseError(error);

  const applicantIds = [...new Set(applications.map((item) => item.applicant_id))];
  const ratingsByUser = new Map();
  if (applicantIds.length > 0) {
    const { data: reviews, error: reviewsError } = await db
      .from("reviews").select("reviewee_id,rating").in("reviewee_id", applicantIds);
    if (reviewsError) throw databaseError(reviewsError);
    for (const userId of applicantIds) {
      const ratings = reviews.filter((review) => review.reviewee_id === userId)
        .map((review) => Number(review.rating));
      ratingsByUser.set(userId, ratings.length
        ? roundRating(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
        : null);
    }
  }

  return applications.map((application) => ({
    ...application,
    applicant: {
      ...application.applicant,
      average_rating: ratingsByUser.get(application.applicant_id) ?? null,
    },
  }));
}

export async function updateApplication(applicationId, ownerId, status) {
  const db = getSupabase();
  const { data: application, error: readError } = await db
    .from("applications")
    .select(`*, gig:gigs!applications_gig_id_fkey(*)`)
    .eq("id", applicationId)
    .maybeSingle();

  if (readError) throw databaseError(readError);
  if (!application) {
    throw new AppError(404, "APPLICATION_NOT_FOUND", "Application was not found.");
  }
  if (application.gig.user_id !== ownerId) {
    throw new AppError(403, "NOT_GIG_OWNER", "Only the gig owner can decide applications.");
  }
  if (application.status !== "Pending") {
    throw new AppError(409, "APPLICATION_NOT_PENDING", "This application has already been decided.");
  }

  if (status === "Accepted") {
    if (effectiveGigStatus(application.gig) !== "Open") {
      throw new AppError(409, "GIG_NOT_OPEN", "This gig is closed.");
    }
    const { data, error } = await db.rpc("accept_applicant", {
      p_application_id: applicationId,
      p_owner_id: ownerId,
    });
    if (error) {
      const code = getRpcErrorCode(error);
      if (code === "APPLICATION_NOT_FOUND") throw new AppError(404, code, "Application was not found.");
      if (code === "GIG_NOT_OPEN") throw new AppError(409, code, "This gig is closed.");
      if (code === "APPLICATION_NOT_PENDING") throw new AppError(409, code, "This application has already been decided.");
      if (code === "NOT_GIG_OWNER") throw new AppError(403, code, "Only the gig owner can decide applications.");
      throw databaseError(error);
    }
    return data;
  }

  const { data: rejected, error } = await db.from("applications")
    .update({ status: "Rejected" })
    .eq("id", applicationId)
    .eq("status", "Pending")
    .select("id,gig_id,applicant_id,status")
    .maybeSingle();
  if (error) throw databaseError(error);
  if (!rejected) {
    throw new AppError(409, "APPLICATION_NOT_PENDING", "This application has already been decided.");
  }
  return {
    application: rejected,
    gig: application.gig,
    rejected_application_ids: [],
  };
}
