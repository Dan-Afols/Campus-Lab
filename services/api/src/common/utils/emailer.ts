import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

async function safeSend(message: {
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  try {
    await transporter.sendMail(message);
  } catch (error) {
    // Avoid breaking auth/signup flow when SMTP is temporarily unavailable in local/dev.
    console.warn("SMTP send skipped:", (error as Error).message);
  }
}

export async function sendEmailOtp(to: string, code: string, purpose: string): Promise<void> {
  await safeSend({
    from: `Campus Lab <${env.SMTP_USER}>`,
    to,
    subject: `Campus Lab ${purpose} OTP`,
    text: `Your OTP code is ${code}. It expires in 10 minutes.`
  });
}

export async function sendSecurityAlertEmail(to: string, subject: string, text: string): Promise<void> {
  await safeSend({
    from: `Campus Lab Security <${env.SMTP_USER}>`,
    to,
    subject,
    text
  });
}
