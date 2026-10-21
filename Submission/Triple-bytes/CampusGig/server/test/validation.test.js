import assert from "node:assert/strict";
import test from "node:test";
import { createGigSchema } from "../src/schemas/gigSchemas.js";
import { createReviewSchema } from "../src/schemas/reviewSchemas.js";

const baseGig = {
  title: "Build a React dashboard",
  description: "Create a responsive dashboard with filters.",
  type: "Requesting",
  category: "Programming",
  payment_type: "Paid",
  budget: 3000,
  deadline: "2099-12-31",
};

test("paid gigs require a positive budget", () => {
  assert.equal(createGigSchema.safeParse({ ...baseGig, budget: undefined }).success, false);
  assert.equal(createGigSchema.safeParse(baseGig).success, true);
});

test("free and skill-swap gigs reject a budget", () => {
  assert.equal(createGigSchema.safeParse({ ...baseGig, payment_type: "Free", budget: 10 }).success, false);
  assert.equal(createGigSchema.safeParse({ ...baseGig, payment_type: "SkillSwap", budget: null }).success, true);
});

test("reviews require an integer rating from one to five", () => {
  const valid = { gig_id: "550e8400-e29b-41d4-a716-446655440000", rating: 5, comment: "Great" };
  assert.equal(createReviewSchema.safeParse(valid).success, true);
  assert.equal(createReviewSchema.safeParse({ ...valid, rating: 0 }).success, false);
  assert.equal(createReviewSchema.safeParse({ ...valid, rating: 4.5 }).success, false);
});
