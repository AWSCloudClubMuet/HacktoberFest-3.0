import { getSupabase } from "../config/supabaseClient.js";
import {
  effectiveGigStatus,
  isAllowedGigTransition,
  todayIso,
  withEffectiveStatus,
} from "../domain/rules.js";
import { AppError, databaseError } from "../lib/AppError.js";

const GIG_SELECT = `
  id, user_id, title, description, type, category, payment_type, budget,
  deadline, status, accepted_applicant_id, created_at,
  owner:users!gigs_user_id_fkey(id,name,major),
  applications(count)
`;

function shapeGig(gig) {
  const { applications, ...rest } = gig;
  return withEffectiveStatus({
    ...rest,
    applications_count: applications?.[0]?.count || 0,
  });
}

function safeSearch(value) {
  return value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();
}

export async function listGigs(filters) {
  let query = getSupabase().from("gigs").select(GIG_SELECT);

  if (filters.q) {
    const q = safeSearch(filters.q);
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.payment_type) query = query.eq("payment_type", filters.payment_type);
  if (filters.user_id) query = query.eq("user_id", filters.user_id);
  if (filters.min_budget != null || filters.max_budget != null) {
    query = query.eq("payment_type", "Paid");
    if (filters.min_budget != null) query = query.gte("budget", filters.min_budget);
    if (filters.max_budget != null) query = query.lte("budget", filters.max_budget);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw databaseError(error);

  const gigs = data.map(shapeGig);
  return filters.status ? gigs.filter((gig) => gig.status === filters.status) : gigs;
}

export async function getGig(gigId, currentUserId) {
  const db = getSupabase();
  const [gigResult, applicationResult, reviewResult] = await Promise.all([
    db.from("gigs")
      .select(`${GIG_SELECT}, accepted_applicant:users!gigs_accepted_applicant_id_fkey(id,name)`)
      .eq("id", gigId)
      .maybeSingle(),
    db.from("applications").select("id,status")
      .eq("gig_id", gigId).eq("applicant_id", currentUserId).maybeSingle(),
    db.from("reviews").select("id,gig_id,reviewer_id,reviewee_id,rating,comment,created_at")
      .eq("gig_id", gigId).eq("reviewer_id", currentUserId).maybeSingle(),
  ]);

  const { data: gig, error } = gigResult;
  if (error) throw databaseError(error);
  if (!gig) throw new AppError(404, "GIG_NOT_FOUND", "Gig was not found.");
  if (applicationResult.error) throw databaseError(applicationResult.error);
  if (reviewResult.error) throw databaseError(reviewResult.error);

  return {
    ...shapeGig(gig),
    my_application: applicationResult.data,
    my_review: reviewResult.data,
  };
}

export async function createGig(ownerId, input) {
  const payload = {
    ...input,
    budget: input.payment_type === "Paid" ? input.budget : null,
    user_id: ownerId,
    status: "Open",
    accepted_applicant_id: null,
  };
  const { data, error } = await getSupabase()
    .from("gigs")
    .insert(payload)
    .select(GIG_SELECT)
    .single();
  if (error) throw databaseError(error);
  return shapeGig(data);
}

export async function updateGigStatus(gigId, ownerId, nextStatus) {
  const db = getSupabase();
  const { data: gig, error: readError } = await db
    .from("gigs")
    .select("*")
    .eq("id", gigId)
    .maybeSingle();

  if (readError) throw databaseError(readError);
  if (!gig) throw new AppError(404, "GIG_NOT_FOUND", "Gig was not found.");
  if (gig.user_id !== ownerId) {
    throw new AppError(403, "NOT_GIG_OWNER", "Only the gig owner can change its status.");
  }

  const currentStatus = effectiveGigStatus(gig);
  if (!isAllowedGigTransition(currentStatus, nextStatus)) {
    throw new AppError(409, "INVALID_TRANSITION", `Cannot change ${currentStatus} to ${nextStatus}.`);
  }

  const { data, error } = await db
    .from("gigs")
    .update({ status: nextStatus })
    .eq("id", gigId)
    .eq("status", gig.status)
    .select(GIG_SELECT)
    .maybeSingle();

  if (error) throw databaseError(error);
  if (!data) throw new AppError(409, "INVALID_TRANSITION", "The gig changed before this request completed.");
  return shapeGig(data);
}

export async function requireOpenGig(gigId) {
  const { data, error } = await getSupabase()
    .from("gigs")
    .select("*")
    .eq("id", gigId)
    .maybeSingle();
  if (error) throw databaseError(error);
  if (!data) throw new AppError(404, "GIG_NOT_FOUND", "Gig was not found.");
  if (effectiveGigStatus(data, todayIso()) !== "Open") {
    throw new AppError(409, "GIG_NOT_OPEN", "This gig is closed.");
  }
  return data;
}
