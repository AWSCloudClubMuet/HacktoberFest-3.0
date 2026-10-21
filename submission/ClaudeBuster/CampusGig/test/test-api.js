/**
 * Automated Test Suite for Campus Gig & SkillSwap Portal
 * Verifies Milestones 1 through 5, Mock API endpoints, and business rules.
 * Run with: node test/test-api.js
 */

import { mockDb } from '../js/mockApi.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion Failed: " + message);
  }
}

function runTest(name, fn) {
  try {
    mockDb.reset(); // fresh test state
    fn();
    passed++;
    console.log(` ✅ [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(` ❌ [FAIL] ${name} -> ${err.message}`);
  }
}

console.log("===============================================================");
console.log("  🎓 CAMPUS GIG & SKILLSWAP PORTAL — AUTOMATED VERIFICATION   ");
console.log("===============================================================");

// ---------------------------------------------------------------------------
// MILESTONE 5: Seed Data & Mock Endpoints Requirements
// ---------------------------------------------------------------------------
runTest("M5: Seed data contains >= 12 users", () => {
  const users = mockDb.getAllUsers();
  assert(users.length >= 12, `Expected >= 12 users, got ${users.length}`);
});

runTest("M5: Seed data contains >= 25 gigs across required categories & statuses", () => {
  const gigs = mockDb.getGigs();
  assert(gigs.length >= 25, `Expected >= 25 gigs, got ${gigs.length}`);

  const categories = new Set(gigs.map(g => g.category));
  ["Programming", "Design", "Writing", "Tutoring"].forEach(cat => {
    assert(categories.has(cat), `Missing category in seed data: ${cat}`);
  });

  const statuses = new Set(gigs.map(g => g.status));
  ["Open", "In Progress", "Completed", "Expired"].forEach(st => {
    assert(statuses.has(st), `Missing status in seed data: ${st}`);
  });

  const types = new Set(gigs.map(g => g.type));
  assert(types.has("Offering") && types.has("Requesting"), "Must include both Offering and Requesting types");
});

runTest("M5: Seed data contains >= 20 applications with varied statuses", () => {
  assert(mockDb.applications.length >= 20, `Expected >= 20 applications, got ${mockDb.applications.length}`);
  const statuses = new Set(mockDb.applications.map(a => a.status));
  assert(statuses.has("Pending") && statuses.has("Accepted") && statuses.has("Rejected"),
    "Applications must include Pending, Accepted, and Rejected statuses");
});

runTest("M5: Seed data contains >= 8 reviews with ratings 1-5 and comments", () => {
  assert(mockDb.reviews.length >= 8, `Expected >= 8 reviews, got ${mockDb.reviews.length}`);
  mockDb.reviews.forEach(r => {
    assert(r.rating >= 1 && r.rating <= 5, "Rating must be 1 to 5");
    assert(r.comment && r.comment.length > 5, "Review must have meaningful comment");
  });
});

// ---------------------------------------------------------------------------
// MILESTONE 1: Profiles & Gig Creation
// ---------------------------------------------------------------------------
runTest("M1: Role flexibility (user acts as Poster on one gig, Applicant on another)", () => {
  // usr_2 owns gig_7 and is accepted applicant on gig_2
  const profile = mockDb.getUserProfile("usr_2");
  assert(profile.gigs_posted_count > 0, "User must have gigs posted");
  const myApplications = mockDb.getApplicationsForUser("usr_2");
  assert(myApplications.length > 0, "User must be able to act as applicant on other gigs");
});

runTest("M1: Validated gig creation (Paid requires positive budget)", () => {
  // Test valid gig creation
  const validGig = mockDb.createGig({
    user_id: "usr_1",
    title: "Build Node.js Microservice",
    description: "Need an Express backend for authentication",
    category: "Programming",
    type: "Offering",
    payment_type: "Paid",
    budget: 50,
    deadline: "2026-11-15"
  });
  assert(validGig && validGig.id, "Gig must be created successfully");
  assert(validGig.status === "Open", "New gig status must be Open");

  // Test invalid gig creation without budget for Paid gig
  let threw = false;
  try {
    mockDb.createGig({
      user_id: "usr_1",
      title: "Broken Paid Gig",
      description: "Should fail",
      category: "Programming",
      type: "Offering",
      payment_type: "Paid",
      budget: null, // Invalid for Paid!
      deadline: "2026-11-15"
    });
  } catch (e) {
    threw = true;
  }
  assert(threw, "Paid gig without budget must throw validation error");
});

// ---------------------------------------------------------------------------
// MILESTONE 2: Discovery & Applications
// ---------------------------------------------------------------------------
runTest("M2: Filter and search across title and description", () => {
  const programmingGigs = mockDb.getGigs({ category: "Programming" });
  assert(programmingGigs.every(g => g.category === "Programming"), "All returned gigs must be Programming");

  const searchResults = mockDb.getGigs({ q: "React" });
  assert(searchResults.length > 0, "Should find gigs matching query 'React'");
  assert(searchResults.some(g => g.title.includes("React") || g.description.includes("React")), "Matched keyword in title or desc");
});

runTest("M2: Reject application to user's own gig", () => {
  // gig_1 is owned by usr_1
  let threw = false;
  try {
    mockDb.createApplication({
      gig_id: "gig_1",
      applicant_id: "usr_1", // Owner trying to apply!
      message: "I want to apply to my own gig"
    });
  } catch (e) {
    threw = true;
  }
  assert(threw, "Applying to own gig must be rejected");
});

runTest("M2: Reject duplicate application to same gig", () => {
  // Apply once
  mockDb.createApplication({
    gig_id: "gig_1",
    applicant_id: "usr_4",
    message: "First application"
  });

  // Apply second time
  let threw = false;
  try {
    mockDb.createApplication({
      gig_id: "gig_1",
      applicant_id: "usr_4",
      message: "Duplicate application"
    });
  } catch (e) {
    threw = true;
  }
  assert(threw, "Duplicate application must be rejected");
});

runTest("M2: Gigs past deadline while still Open appear as Expired", () => {
  // gig_14 was Open with deadline in the past
  const gig14 = mockDb.gigs.find(g => g.id === "gig_14");
  assert(gig14.status === "Expired", `Expected Expired, got ${gig14.status}`);
});

// ---------------------------------------------------------------------------
// MILESTONE 3: Applicant Selection & Status Transitions
// ---------------------------------------------------------------------------
runTest("M3: Only gig owner can accept applicant", () => {
  // gig_1 is owned by usr_1. Application app_14 is pending by usr_7
  let threw = false;
  try {
    mockDb.updateApplicationStatus("app_14", "Accepted", "usr_9"); // Non-owner acting!
  } catch (e) {
    threw = true;
  }
  assert(threw, "Non-owner accepting applicant must be rejected");
});

runTest("M3: Accepting applicant transitions gig to In Progress and rejects other applicants", () => {
  // gig_1 has two pending applications: app_14 (usr_7) and app_15 (usr_10)
  const result = mockDb.updateApplicationStatus("app_14", "Accepted", "usr_1");
  assert(result.gig.status === "In Progress", "Gig status must transition to In Progress");
  assert(result.gig.accepted_applicant_id === "usr_7", "Accepted applicant ID must be set");

  // Verify other pending application (app_15) was automatically rejected
  const otherApp = mockDb.applications.find(a => a.id === "app_15");
  assert(otherApp.status === "Rejected", `Expected auto-rejected app_15, got ${otherApp.status}`);
});

runTest("M3: Allow completion ONLY from In Progress status", () => {
  // gig_3 is Open
  let threw = false;
  try {
    mockDb.updateGigStatus("gig_3", "Completed", "usr_3"); // Direct Open -> Completed invalid!
  } catch (e) {
    threw = true;
  }
  assert(threw, "Completing an Open gig directly must be rejected");

  // gig_2 is In Progress owned by usr_7 -> Can be completed!
  const completed = mockDb.updateGigStatus("gig_2", "Completed", "usr_7");
  assert(completed.status === "Completed", "Completing an In Progress gig must succeed");
});

// ---------------------------------------------------------------------------
// MILESTONE 4: Mutual Reviews & Calculated Reputation
// ---------------------------------------------------------------------------
runTest("M4: Two-way reviews permitted after completion", () => {
  // gig_7 is Completed (owner: usr_2, accepted: usr_3)
  // Both left reviews in seed data: rev_1 (usr_2 -> usr_3) and rev_2 (usr_3 -> usr_2)
  const gig7Reviews = mockDb.getReviewsForGig("gig_7");
  assert(gig7Reviews.length === 2, `Expected 2 mutual reviews, got ${gig7Reviews.length}`);
});

runTest("M4: Only one review per reviewer for that gig", () => {
  // usr_2 already reviewed gig_7
  let threw = false;
  try {
    mockDb.createReview({
      gig_id: "gig_7",
      reviewer_id: "usr_2",
      rating: 5,
      comment: "Second review attempt"
    });
  } catch (e) {
    threw = true;
  }
  assert(threw, "Duplicate review for the same gig must be rejected");
});

runTest("M4: Dynamic average rating calculated from stored reviews", () => {
  // Calculate usr_3 average rating from reviews where reviewee_id === usr_3
  const profile = mockDb.getUserProfile("usr_3");
  const reviews = mockDb.reviews.filter(r => r.reviewee_id === "usr_3");
  const expectedAvg = Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1));

  assert(profile.average_rating === expectedAvg,
    `Profile rating must match calculated average: ${profile.average_rating} vs ${expectedAvg}`);
  assert(profile.reviews_count === reviews.length, "Review count must match");
});

console.log("===============================================================");
console.log(` TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("===============================================================");

if (failed > 0) {
  process.exit(1);
}
