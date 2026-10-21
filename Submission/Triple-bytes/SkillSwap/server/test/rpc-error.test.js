import assert from "node:assert/strict";
import test from "node:test";
import { getRpcErrorCode } from "../src/lib/supabaseRpcError.js";

test("maps the plain exception messages raised by the supplied SQL", () => {
  assert.equal(getRpcErrorCode({ message: "GIG_NOT_OPEN" }), "GIG_NOT_OPEN");
  assert.equal(
    getRpcErrorCode({ message: "PostgreSQL error", details: "APPLICATION_NOT_PENDING" }),
    "APPLICATION_NOT_PENDING",
  );
});

test("does not invent a code for an unknown database failure", () => {
  assert.equal(getRpcErrorCode({ message: "connection failed" }), null);
});
