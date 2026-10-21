import "dotenv/config";
import { getSupabase } from "../config/supabaseClient.js";
import { DEMO_PASSWORD, users } from "./seed.js";

async function setDemoAccounts() {
  const db = getSupabase();

  const results = await Promise.all(
    users.map(({ id, email, password_hash }) =>
      db.from("users").update({ email, password_hash }).eq("id", id).select("id"),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  console.log(`Set login details for ${users.length} demo users. Password for all of them: ${DEMO_PASSWORD}`);
  for (const { name, email } of users) console.log(`  ${name.padEnd(14)} ${email}`);
}

setDemoAccounts().catch((error) => {
  console.error("Could not set demo accounts. Did you run database/04_auth.sql first?");
  console.error(error);
  process.exitCode = 1;
});
