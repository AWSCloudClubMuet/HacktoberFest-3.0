import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { warmUpSupabase } from "./config/supabaseClient.js";

const env = getEnv();
const app = createApp();

app.listen(env.port, () => {
  console.log(`Campus Gig API listening on http://localhost:${env.port}`);
  warmUpSupabase();
});
