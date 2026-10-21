import "dotenv/config";

function serviceKey() {
  return process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function getEnv() {
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!serviceKey()) missing.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_KEY)");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missing.push("JWT_SECRET (at least 32 characters)");
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  return {
    port: Number(process.env.PORT || 5000),
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: serviceKey(),
    jwtSecret: process.env.JWT_SECRET,
    clientOrigin: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
      .filter(Boolean),
  };
}
