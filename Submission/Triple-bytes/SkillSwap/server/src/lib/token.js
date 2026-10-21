import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "../config/env.js";

const TOKEN_LIFETIME = "7d";

function secretKey() {
  return new TextEncoder().encode(getEnv().jwtSecret);
}

export function signToken(userId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_LIFETIME)
    .sign(secretKey());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
