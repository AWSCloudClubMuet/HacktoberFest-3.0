// Usage: node scripts/smoke-test.mjs [baseUrl]   (server must be running; resets seed data first)
const BASE = process.argv[2] || "http://localhost:3001";
let pass = 0, fail = 0;
const call = async (method, path, body) => {
  const res = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const check = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + extra}`); };
const future = (d = 10) => new Date(Date.now() + d * 86400000).toISOString();

await call("POST", "/api/reset");
const users = (await call("GET", "/api/users")).body.data;
const [A, B, C] = users.slice(0, 3).map((u) => u.id);

// Seed requirements
const gigs0 = (await call("GET", "/api/gigs")).body.data;
const apps0 = (await call("GET", "/api/applications")).body.data;
const revs0 = (await call("GET", "/api/reviews")).body.data;
check("seed: >=12 users, >=25 gigs, >=20 apps, >=8 reviews", users.length >= 12 && gigs0.length >= 25 && apps0.length >= 20 && revs0.length >= 8, `${users.length}/${gigs0.length}/${apps0.length}/${revs0.length}`);
check("seed: all 5 statuses present", ["Open", "In Progress", "Completed", "Expired", "Cancelled"].every((s) => gigs0.some((g) => g.status === s)));

// M2 filters
const prog = (await call("GET", "/api/gigs?category=Programming&type=Requesting")).body.data;
check("filter category+type", prog.length > 0 && prog.every((g) => g.category === "Programming" && g.type === "Requesting"));
const paid = (await call("GET", "/api/gigs?payment_type=Paid&min_budget=50&max_budget=150")).body.data;
check("filter budget range", paid.length > 0 && paid.every((g) => g.budget >= 50 && g.budget <= 150));
const q = (await call("GET", "/api/gigs?q=react")).body.data;
check("keyword search (title/description)", q.length > 0 && q.every((g) => (g.title + g.description).toLowerCase().includes("react")));
check("expired status filter", (await call("GET", "/api/gigs?status=Expired")).body.data.length >= 1);

// M1 validation
const base = { user_id: A, title: "Need help with a React demo", description: "Looking for a peer to pair on a small React demo.", type: "Requesting", category: "Programming", payment_type: "Paid", budget: 40, deadline: future() };
check("create gig: invalid (short title) -> 400", (await call("POST", "/api/gigs", { ...base, title: "hi" })).status === 400);
check("create gig: paid w/o budget -> 400", (await call("POST", "/api/gigs", { ...base, budget: null })).status === 400);
check("create gig: free with budget -> 400", (await call("POST", "/api/gigs", { ...base, payment_type: "Free" })).status === 400);
check("create gig: past deadline -> 400", (await call("POST", "/api/gigs", { ...base, deadline: "2020-01-01T00:00:00.000Z" })).status === 400);
check("create gig: bad category -> 400", (await call("POST", "/api/gigs", { ...base, category: "Cooking" })).status === 400);
const created = await call("POST", "/api/gigs", base);
check("create gig: valid -> 201 Open", created.status === 201 && created.body.status === "Open");
const gid = created.body.id;

// M2 applications
check("apply to own gig -> 403", (await call("POST", "/api/applications", { gig_id: gid, applicant_id: A, message: "me" })).status === 403);
check("apply with empty message -> 400", (await call("POST", "/api/applications", { gig_id: gid, applicant_id: B, message: "  " })).status === 400);
const a1 = await call("POST", "/api/applications", { gig_id: gid, applicant_id: B, message: "I can help!" });
check("apply -> 201 Pending", a1.status === 201 && a1.body.status === "Pending");
check("duplicate application -> 409", (await call("POST", "/api/applications", { gig_id: gid, applicant_id: B, message: "again" })).status === 409);
const a2 = await call("POST", "/api/applications", { gig_id: gid, applicant_id: C, message: "Me too" });

// M3 workflow
check("non-owner accept -> 403", (await call("PATCH", `/api/applications/${a1.body.id}`, { action: "accept", owner_id: B })).status === 403);
check("complete from Open -> 409", (await call("PATCH", `/api/gigs/${gid}`, { owner_id: A, status: "Completed" })).status === 409);
check("PATCH gig without owner -> 403", (await call("PATCH", `/api/gigs/${gid}`, { status: "Completed" })).status === 403);
check("PATCH gig other fields -> 400", (await call("PATCH", `/api/gigs/${gid}`, { owner_id: A, user_id: B })).status === 400);
const acc = await call("PATCH", `/api/applications/${a1.body.id}`, { action: "accept", owner_id: A });
check("accept -> gig In Progress + applicant set", acc.status === 200 && acc.body.gig.status === "In Progress" && acc.body.gig.accepted_applicant_id === B);
const apps = (await call("GET", `/api/applications?gig_id=${gid}`)).body.data;
check("accept cascade: other Pending -> Rejected", apps.find((x) => x.id === a2.body.id).status === "Rejected" && apps.find((x) => x.id === a1.body.id).status === "Accepted");
const late = users[3].id;
check("gig closed to new applications -> 409", (await call("POST", "/api/applications", { gig_id: gid, applicant_id: late, message: "late" })).status === 409);
check("review before completion -> 409", (await call("POST", "/api/reviews", { gig_id: gid, reviewer_id: A, rating: 5, comment: "x" })).status === 409);
check("reject already-decided app -> 409", (await call("PATCH", `/api/applications/${a2.body.id}`, { action: "reject", owner_id: A })).status === 409);
const before = (await call("GET", `/api/users/${B}`)).body.stats;
check("complete gig -> Completed", (await call("PATCH", `/api/gigs/${gid}`, { owner_id: A, status: "Completed" })).body.status === "Completed");

// M4 reviews
check("review by outsider -> 403", (await call("POST", "/api/reviews", { gig_id: gid, reviewer_id: C, rating: 5, comment: "x" })).status === 403);
check("rating 0 / 6 / 4.5 -> 400", (await Promise.all([0, 6, 4.5].map((r) => call("POST", "/api/reviews", { gig_id: gid, reviewer_id: A, rating: r, comment: "ok" })))).every((r) => r.status === 400));
const r1 = await call("POST", "/api/reviews", { gig_id: gid, reviewer_id: A, rating: 5, comment: "Great work" });
check("owner reviews applicant -> 201, reviewee = applicant", r1.status === 201 && r1.body.reviewee_id === B);
check("duplicate review -> 409", (await call("POST", "/api/reviews", { gig_id: gid, reviewer_id: A, rating: 1, comment: "again" })).status === 409);
const r2 = await call("POST", "/api/reviews", { gig_id: gid, reviewer_id: B, rating: 4, comment: "Clear brief" });
check("applicant reviews owner -> 201, reviewee = owner", r2.status === 201 && r2.body.reviewee_id === A);
const after = (await call("GET", `/api/users/${B}`)).body.stats;
const allRevs = (await call("GET", `/api/reviews?user_id=${B}`)).body.data.filter((r) => r.reviewee_id === B);
const expectedAvg = Number((allRevs.reduce((s, r) => s + r.rating, 0) / allRevs.length).toFixed(1));
check("average rating computed from stored reviews", after.averageRating === expectedAvg && after.reviewCount === before.reviewCount + 1 && after.gigsCompleted === before.gigsCompleted + 1, JSON.stringify({ before, after, expectedAvg }));

await call("POST", "/api/reset");
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
