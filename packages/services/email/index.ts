/**
 * Email Service — FinalForms
 *
 * Uses Resend for transactional emails.
 * Set RESEND_API_KEY in your .env to enable real sending.
 * If the key is absent, emails are logged to console (dev-safe stub).
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev stub — log instead of sending
    console.log("[EmailService] RESEND_API_KEY not set. Email would have been sent:");
    console.log("  To:", payload.to);
    console.log("  Subject:", payload.subject);
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
    console.error("[EmailService] Failed to send email:", errText);
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
};
