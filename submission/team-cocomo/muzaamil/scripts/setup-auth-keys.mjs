// Generates Convex Auth signing keys and stores them on the current deployment.
// Secrets are passed straight to `convex env set` and never printed.
import { execFileSync } from "node:child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(keys.publicKey)) }] });
const siteUrl = process.env.SITE_URL ?? "http://localhost:5180";

const set = (name, value) =>
  execFileSync("npx", ["convex", "env", "set", name, "--", value], { stdio: ["ignore", "ignore", "inherit"] });

set("JWT_PRIVATE_KEY", privateKey);
set("JWKS", jwks);
set("SITE_URL", siteUrl);
console.log(`Convex Auth keys set. SITE_URL=${siteUrl}`);
