import bcrypt from "bcrypt";

export function generateOtpCode(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
