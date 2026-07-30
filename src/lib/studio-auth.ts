import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const STUDIO_COOKIE = "sgyun_studio_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function studioPassword() {
  return process.env.SGYUN_STUDIO_PASSWORD ?? "";
}

function studioSecret() {
  return process.env.SGYUN_STUDIO_SESSION_SECRET ?? "";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(expiresAt: string) {
  return createHmac("sha256", studioSecret()).update(expiresAt).digest("hex");
}

export function isStudioConfigured() {
  return Boolean(studioPassword() && studioSecret());
}

export function validateStudioPassword(candidate: string) {
  if (!isStudioConfigured()) return false;
  return safeEqual(candidate, studioPassword());
}

export function createStudioSessionToken() {
  const expiresAt = String(
    Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
  );
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function validateStudioSessionToken(token?: string) {
  if (!token || !isStudioConfigured()) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(signature, sign(expiresAt));
}

export async function isStudioAuthenticated() {
  const store = await cookies();
  return validateStudioSessionToken(store.get(STUDIO_COOKIE)?.value);
}

export const studioSessionMaxAge = SESSION_DURATION_SECONDS;
