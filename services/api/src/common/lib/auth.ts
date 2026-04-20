import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { JwtPayload } from "../types/auth.js";

export enum TokenType {
  AUTH = "auth",
  ADMIN_SESSION = "admin_session",
  REFRESH = "refresh",
}

/**
 * Generate a JWT token for various purposes
 */
export function generateJwt(
  payload: Record<string, any>,
  type: TokenType,
  expiresIn: string | number = "7d"
): string {
  const secret = env.JWT_ACCESS_SECRET;
  return jwt.sign(payload, secret, { expiresIn } as any);
}

/**
 * Validate and decode a JWT token
 */
export function validateJwt(token: string, expectedType?: TokenType): any {
  const secret = env.JWT_ACCESS_SECRET;
  try {
    return jwt.verify(token, secret) as any;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Sign access token (standard auth token)
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL } as any);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}
