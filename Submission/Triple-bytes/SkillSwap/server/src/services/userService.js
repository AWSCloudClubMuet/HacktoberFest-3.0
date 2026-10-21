import { getSupabase } from "../config/supabaseClient.js";
import { roundRating } from "../domain/rules.js";
import { AppError, databaseError } from "../lib/AppError.js";
import { PUBLIC_USER_FIELDS } from "./authService.js";

let usersCache = { at: 0, data: null };
const USERS_TTL_MS = 60_000;

export async function listUsers() {
  if (usersCache.data && Date.now() - usersCache.at < USERS_TTL_MS) return usersCache.data;

  const { data, error } = await getSupabase()
    .from("users")
    .select(PUBLIC_USER_FIELDS)
    .order("name");
  if (error) throw databaseError(error);
  usersCache = { at: Date.now(), data };
  return data;
}

export async function getUserProfile(userId) {
  const db = getSupabase();
  const { data: user, error: userError } = await db
    .from("users")
    .select(PUBLIC_USER_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw databaseError(userError);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User was not found.");

  const [postedResult, completedResult, reviewsResult] = await Promise.all([
    db.from("gigs").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("gigs").select("id", { count: "exact", head: true })
      .eq("status", "Completed")
      .or(`user_id.eq.${userId},accepted_applicant_id.eq.${userId}`),
    db.from("reviews")
      .select(`
        id, gig_id, reviewer_id, reviewee_id, rating, comment, created_at,
        reviewer:users!reviews_reviewer_id_fkey(id,name),
        gig:gigs!reviews_gig_id_fkey(id,title)
      `)
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  for (const result of [postedResult, completedResult, reviewsResult]) {
    if (result.error) throw databaseError(result.error);
  }

  const ratings = reviewsResult.data.map((review) => Number(review.rating));
  const average = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : null;

  return {
    ...user,
    stats: {
      gigs_posted: postedResult.count || 0,
      gigs_completed: completedResult.count || 0,
      average_rating: roundRating(average),
      review_count: reviewsResult.data.length,
    },
    reviews: reviewsResult.data.map(({ gig, ...review }) => ({
      ...review,
      gig_title: gig?.title || null,
    })),
  };
}
