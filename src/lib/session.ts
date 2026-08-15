import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
const SESSION_DURATION = "30d";

export type SessionPayload = {
  sub: string;
  email: string;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — copy .env.example to .env and fill it in.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

// Edge-safe: no database access, only signature/expiry verification. This is
// what middleware calls — keep it that way so it can keep running on the
// Edge runtime without pulling in the (Node-only) Prisma adapter.
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
