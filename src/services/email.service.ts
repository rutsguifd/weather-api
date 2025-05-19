import nodemailer, { SentMessageInfo } from "nodemailer";
import { config } from "../config";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<SentMessageInfo> {
  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html,
    });
    console.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    throw new Error(
      `EmailServiceError: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
}
