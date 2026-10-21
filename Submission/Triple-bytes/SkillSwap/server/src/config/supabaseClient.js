import { createClient } from "@supabase/supabase-js";
import { Agent, fetch as undiciFetch } from "undici";
import { getEnv } from "./env.js";

let client;

const agent = new Agent({
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 600_000,
  connections: 16,
});

const keepAliveFetch = (input, init) => undiciFetch(input, { ...init, dispatcher: agent });

export function getSupabase() {
  if (!client) {
    const env = getEnv();
    client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: keepAliveFetch },
    });
  }
  return client;
}

export function warmUpSupabase() {
  const ping = () => getSupabase().from("users").select("id").limit(1).then(() => {}, () => {});
  for (let i = 0; i < 4; i++) ping();
  setInterval(() => { for (let i = 0; i < 4; i++) ping(); }, 20_000).unref();
}
