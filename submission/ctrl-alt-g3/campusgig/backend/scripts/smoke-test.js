// Run with the server running:  npm run test:flow
const BASE = process.env.BASE_URL || "http://localhost:4000";
let passed = 0;
let failed = 0;

async function call(method, path, userId, body) {
  const headers = { "Content-Type": "application/json" };
  if (userId) headers["x-user-id"] = String(userId);
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

function check(name, condition, extra = "") {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
}

const deadline = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

async function run() {
  console.log("\nSkillSwap flow test\n");

  // Setup: a brand-new user so rating checks start from zero
  let r = await call("POST", "/users", null, {
    name: "Flow Tester", major: "Software Engineering", semester: 4, bio: "Test", skills: ["Testing"],
  });
  check("create user", r.status === 201);
  const newbie = r.body.id;

  // M1: gig creation + validation
  r = await call("POST", "/gigs", 1, {
    title: "Flow test gig", description: "Created by the smoke test script.",
    type: "Requesting", category: "Programming", payment_type: "Paid", budget: 1000, deadline,
  });
  check("create gig as user 1", r.status === 201 && r.body.status === "Open");
  const gigId = r.body.id;

  r = await call("POST", "/gigs", 1, {
    title: "Bad gig", description: "Free gig with a budget.", type: "Offering",
    category: "Design", payment_type: "Free", budget: 500, deadline,
  });
  check("reject budget on Free gig", r.status === 400);

  r = await call("POST", "/gigs", null, {});
  check("reject gig creation without x-user-id", r.status === 401);

  // M2: applications
  r = await call("POST", "/applications", 1, { gig_id: gigId, message: "Applying to my own gig" });
  check("reject applying to own gig", r.status === 403);

  r = await call("POST", "/applications", newbie, { gig_id: gigId, message: "I can do this" });
  check("apply as applicant", r.status === 201 && r.body.status === "Pending");
  const appA = r.body.id;

  r = await call("POST", "/applications", newbie, { gig_id: gigId, message: "Applying again" });
  check("reject duplicate application", r.status === 409);

  r = await call("POST", "/applications", 3, { gig_id: gigId, message: "Second applicant here" });
  check("second applicant applies", r.status === 201);
  const appB = r.body.id;

  r = await call("GET", "/gigs?status=Expired");
  check("expired gigs are computed", r.status === 200 && r.body.length >= 4);

  // M3: selection + status
  r = await call("PATCH", `/applications/${appA}`, 3, { status: "Accepted" });
  check("non-owner cannot accept", r.status === 403);

  r = await call("PATCH", `/applications/${appA}`, 1, { status: "Accepted" });
  check("owner accepts applicant", r.status === 200);
  check("gig becomes In Progress", r.body?.gig?.status === "In Progress");
  check("accepted applicant stored", r.body?.gig?.accepted_applicant_id === newbie);
  const other = r.body?.applications?.find((a) => a.id === appB);
  check("other pending application auto-rejected", other?.status === "Rejected");

  r = await call("POST", "/applications", 5, { gig_id: gigId, message: "Too late to apply" });
  check("gig closed to new applications", r.status === 409);

  r = await call("POST", "/reviews", 1, { gig_id: gigId, rating: 5, comment: "Too early" });
  check("reject review before completion", r.status === 409);

  r = await call("PATCH", `/gigs/${gigId}`, newbie, { status: "Completed" });
  check("applicant cannot complete gig", r.status === 403);

  r = await call("PATCH", `/gigs/${gigId}`, 1, { status: "Completed" });
  check("owner completes gig", r.status === 200 && r.body.status === "Completed");

  // M4: reviews
  r = await call("POST", "/reviews", 5, { gig_id: gigId, rating: 5, comment: "Not involved" });
  check("stranger cannot review", r.status === 403);

  r = await call("POST", "/reviews", newbie, { gig_id: gigId, rating: 6, comment: "Bad rating" });
  check("reject rating above 5", r.status === 400);

  r = await call("POST", "/reviews", 1, { gig_id: gigId, rating: 4, comment: "Good work overall" });
  check("owner reviews applicant", r.status === 201 && r.body.reviewee_id === newbie);

  r = await call("POST", "/reviews", 1, { gig_id: gigId, rating: 5, comment: "Second review" });
  check("reject duplicate review", r.status === 409);

  r = await call("POST", "/reviews", newbie, { gig_id: gigId, rating: 5, comment: "Great owner" });
  check("applicant reviews owner", r.status === 201 && r.body.reviewee_id === 1);

  r = await call("GET", `/users/${newbie}`);
  check("average rating computed from reviews", r.body?.average_rating === 4 && r.body?.review_count === 1,
    `(got ${r.body?.average_rating}, ${r.body?.review_count})`);

  r = await call("PATCH", `/users/${newbie}`, newbie, { average_rating: 5 });
  check("rating cannot be edited by hand", r.body?.average_rating === 4);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

run().catch((e) => {
  console.error("Could not reach the server. Is `npm run dev` running?\n", e.message);
  process.exit(1);
});