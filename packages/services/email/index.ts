/**
 * Email Service — FinalForms
 *
 * Uses Resend for transactional emails.
 * Set RESEND_API_KEY in your .env to enable real sending.
 * If the key is absent, emails are logged to console (dev-safe stub).
 */

import { logger } from "@repo/logger";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev stub — log instead of sending
    logger.info("[EmailService] RESEND_API_KEY not set. Email would have been sent:");
    logger.info(`  To: ${payload.to}`);
    logger.info(`  Subject: ${payload.subject}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FinalForms <noreply@finalforms.com>",
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error(`[EmailService] Failed to send email: ${errText}`);
    // Non-blocking: don't throw — email failure shouldn't fail form submission
  }
}

export const emailService = {
  /**
   * Sends a "Thank You" confirmation email to the respondent after they submit a form.
   */
  async sendThankYou(
    to: string,
    formTitle: string,
    answers: Array<{ label: string; answer: any }>,
  ): Promise<void> {
    const answersHtml = answers
      .map(
        (a) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;color:#9ca3af;font-size:12px;width:40%">${a.label}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;color:#ffffff;font-size:13px">${
          Array.isArray(a.answer) ? a.answer.join(", ") : String(a.answer ?? "—")
        }</td>
      </tr>`,
      )
      .join("");

    await sendEmail({
      to,
      subject: `✅ Your response to "${formTitle}" was received`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#111111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#fff;margin-bottom:12px">F</div>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Submission Received!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0">Your response to <strong>${formTitle}</strong> has been recorded.</p>
    </div>
    <div style="padding:24px">
      <p style="color:#9ca3af;font-size:13px;margin:0 0 16px">Here's a copy of your answers:</p>
      <table style="width:100%;border-collapse:collapse;background:#0d0d0d;border-radius:10px;overflow:hidden">
        <tbody>${answersHtml}</tbody>
      </table>
      <p style="color:#6b7280;font-size:11px;margin:20px 0 0;text-align:center">
        Powered by <a href="https://finalforms.com" style="color:#6366f1;text-decoration:none">FinalForms</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    });
  },

  /**
   * Sends a "New Response" notification to the form creator.
   */
  async sendNewResponseNotification(
    creatorEmail: string,
    formTitle: string,
    respondentEmail?: string,
  ): Promise<void> {
    await sendEmail({
      to: creatorEmail,
      subject: `🔔 New response to "${formTitle}"`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#111111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden">
    <div style="padding:32px;text-align:center">
      <div style="width:56px;height:56px;background:#1e1b4b;border:1px solid #4338ca;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px">🔔</div>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">You got a new response!</h1>
      <p style="color:#9ca3af;font-size:13px;margin:0">
        <strong style="color:#fff">${formTitle}</strong> just received a new submission${respondentEmail ? ` from <strong style="color:#6366f1">${respondentEmail}</strong>` : ""}.
      </p>
    </div>
    <div style="padding:0 24px 24px;text-align:center">
      <a href="https://finalforms.com/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;box-shadow:0 4px 15px rgba(79,70,229,0.35)">
        View Response →
      </a>
      <p style="color:#4b5563;font-size:11px;margin:16px 0 0">
        Powered by <a href="https://finalforms.com" style="color:#6366f1;text-decoration:none">FinalForms</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    });
  },

  /**
   * Sends a secure password reset email.
   * Security notes:
   *   - Link expires in 15 minutes (enforced server-side)
   *   - Warns user if they did not initiate the reset
   *   - Does NOT include password or any sensitive data
   *   - Includes anti-phishing reminder
   */
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await sendEmail({
      to,
      subject: "Reset your FinalForms password",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#111111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;text-align:center">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px">🔒</div>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Password Reset Request</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#d1d5db;font-size:14px;margin:0 0 20px;line-height:1.6">
        We received a request to reset the password for your FinalForms account associated with this email address.
      </p>
      <p style="color:#d1d5db;font-size:14px;margin:0 0 24px;line-height:1.6">
        Click the button below to reset your password. <strong style="color:#fff">This link expires in 15 minutes.</strong>
      </p>
      <div style="text-align:center;margin:0 0 28px">
        <a href="${resetUrl}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;box-shadow:0 4px 15px rgba(220,38,38,0.35)">
          Reset My Password
        </a>
      </div>
      <div style="background:#1f1f1f;border:1px solid #374151;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">⚠️ Didn't request this?</p>
        <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged. No action is required.
        </p>
      </div>
      <div style="border-top:1px solid #1f1f1f;padding-top:16px">
        <p style="color:#6b7280;font-size:11px;margin:0;line-height:1.5">
          🛡️ <strong>Anti-phishing reminder:</strong> FinalForms will never ask for your password via email. This link only allows you to set a new password on our website. If the button above doesn't work, do NOT copy the link manually — visit <a href="https://finalforms.com" style="color:#6366f1;text-decoration:none">finalforms.com</a> directly and use "Forgot password".
        </p>
        <p style="color:#4b5563;font-size:11px;margin:12px 0 0;text-align:center">
          Powered by <a href="https://finalforms.com" style="color:#6366f1;text-decoration:none">FinalForms</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
    });
  },

  /**
   * Sends a secure email verification email.
   * Security notes:
   *   - Link expires in 24 hours (enforced server-side)
   *   - Does NOT include any sensitive data
   */
  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await sendEmail({
      to,
      subject: "Verify your FinalForms email address",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#111111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px">✉️</div>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Verify Your Email Address</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#d1d5db;font-size:14px;margin:0 0 20px;line-height:1.6">
        Welcome to FinalForms! We just need to verify your email address to complete your registration.
      </p>
      <p style="color:#d1d5db;font-size:14px;margin:0 0 24px;line-height:1.6">
        Click the button below to verify your email. <strong style="color:#fff">This link expires in 24 hours.</strong>
      </p>
      <div style="text-align:center;margin:0 0 28px">
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;box-shadow:0 4px 15px rgba(37,99,235,0.35)">
          Verify Email Address
        </a>
      </div>
      <div style="border-top:1px solid #1f1f1f;padding-top:16px">
        <p style="color:#4b5563;font-size:11px;margin:12px 0 0;text-align:center">
          Powered by <a href="https://finalforms.com" style="color:#6366f1;text-decoration:none">FinalForms</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
    });
  },
};
