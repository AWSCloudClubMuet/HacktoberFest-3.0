import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveReviewee,
  effectiveGigStatus,
  isAllowedGigTransition,
  roundRating,
  todayIso,
} from "../src/domain/rules.js";

test("calendar dates use the configured Pakistan time zone", () => {
  assert.equal(todayIso(() => new Date("2026-10-20T20:00:00Z")), "2026-10-21");
});

test("an open gig past its deadline is effectively expired", () => {
  assert.equal(effectiveGigStatus({ status: "Open", deadline: "2026-10-20" }, "2026-10-21"), "Expired");
});

test("an open gig due today remains open", () => {
  assert.equal(effectiveGigStatus({ status: "Open", deadline: "2026-10-21" }, "2026-10-21"), "Open");
});

test("only the documented direct gig transitions are valid", () => {
  assert.equal(isAllowedGigTransition("In Progress", "Completed"), true);
  assert.equal(isAllowedGigTransition("Open", "Cancelled"), true);
  assert.equal(isAllowedGigTransition("Open", "Completed"), false);
  assert.equal(isAllowedGigTransition("Open", "In Progress"), false);
});

test("reviewee is always the other participant", () => {
  const gig = { user_id: "owner", accepted_applicant_id: "worker" };
  assert.equal(deriveReviewee(gig, "owner"), "worker");
  assert.equal(deriveReviewee(gig, "worker"), "owner");
  assert.equal(deriveReviewee(gig, "outsider"), null);
});

test("ratings are rounded to one decimal place", () => {
  assert.equal(roundRating(4.46), 4.5);
  assert.equal(roundRating(null), null);
});
