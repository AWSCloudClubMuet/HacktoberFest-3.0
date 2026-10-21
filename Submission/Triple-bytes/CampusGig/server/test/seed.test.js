import assert from "node:assert/strict";
import test from "node:test";
import { applications, gigs, reviews, users } from "../src/db/seed.js";

test("seed data meets the required minimum counts", () => {
  assert.ok(users.length >= 12);
  assert.ok(gigs.length >= 25);
  assert.ok(applications.length >= 20);
  assert.ok(reviews.length >= 8);
});

test("seed gigs cover all required categories, types, payments, and stored statuses", () => {
  assert.deepEqual(new Set(gigs.map((gig) => gig.category)), new Set(["Programming", "Design", "Writing", "Tutoring"]));
  assert.deepEqual(new Set(gigs.map((gig) => gig.type)), new Set(["Offering", "Requesting"]));
  assert.deepEqual(new Set(gigs.map((gig) => gig.payment_type)), new Set(["Paid", "SkillSwap", "Free"]));
  assert.deepEqual(new Set(gigs.map((gig) => gig.status)), new Set(["Open", "In Progress", "Completed", "Cancelled"]));
});

test("assigned seed gigs have exactly one matching accepted application", () => {
  for (const gig of gigs.filter((item) => ["In Progress", "Completed"].includes(item.status))) {
    const gigApplications = applications.filter((item) => item.gig_id === gig.id);
    const accepted = gigApplications.filter((item) => item.status === "Accepted");
    assert.equal(accepted.length, 1, gig.title);
    assert.equal(accepted[0].applicant_id, gig.accepted_applicant_id, gig.title);
    assert.ok(gigApplications.filter((item) => item.id !== accepted[0].id)
      .every((item) => item.status === "Rejected"), gig.title);
  }
});

test("seed reviews belong only to completed gigs and their two participants", () => {
  for (const review of reviews) {
    const gig = gigs.find((item) => item.id === review.gig_id);
    assert.equal(gig?.status, "Completed");
    assert.deepEqual(
      new Set([review.reviewer_id, review.reviewee_id]),
      new Set([gig.user_id, gig.accepted_applicant_id]),
    );
  }
});
