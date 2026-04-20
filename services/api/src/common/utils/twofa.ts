import { authenticator } from "otplib";

export function generate2faSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "Campus Lab", secret);
  return { secret, otpauthUrl };
}

export function verify2faCode(secret: string, code: string): boolean {
  return authenticator.verify({ token: code, secret });
}
