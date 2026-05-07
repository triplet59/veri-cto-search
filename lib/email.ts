// Resend email wrapper — used for transactional email
// (assessment invitations, candidate confirmations).

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_NAME = "Veri Hiring";
const FROM_ADDRESS = "noreply@veri-global.com";

interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOpts) {
  const resend = getResend();
  return await resend.emails.send({
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

export function assessmentInviteEmail(candidateName: string, assessmentUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Your Veri technical assessment";
  const text = `Hello ${candidateName},

Thank you for the time you've put into your application so far. We'd like to invite you to complete the technical assessment for the Senior Technical Officer role at Veri.

Access your assessment here:
${assessmentUrl}

This link is unique to you. The assessment is in five sections covering architecture, governance, leadership, a practical coding task, and short scenario questions. We expect a thoughtful response to take around 4 to 5 hours of focused work — please complete it across multiple sessions if that suits you better. The platform auto-saves as you go.

Please return your completed assessment within seven days of receiving this email. You're welcome to use AI tools as part of your work; we ask only that the final answers represent your own thinking and that you'd be able to defend any technical position in a follow-up live conversation.

If anything is unclear, please reply to this email.

Best regards,
Veri Hiring Team
Veri / Gravitas Finance LLC
Mauritius`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B0F14;color:#E6ECF3;padding:24px;line-height:1.6;">
<div style="max-width:560px;margin:0 auto;background:#10161F;border:1px solid #1E2733;border-radius:14px;padding:32px;">
<p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1E88E5;margin:0 0 8px;">Senior Technical Officer Search</p>
<h1 style="font-size:22px;color:#E6ECF3;margin:0 0 20px;">Your Veri technical assessment</h1>
<p>Hello ${candidateName},</p>
<p>Thank you for the time you've put into your application so far. We'd like to invite you to complete the technical assessment for the Senior Technical Officer role at Veri.</p>
<p style="text-align:center;margin:28px 0;">
  <a href="${assessmentUrl}" style="display:inline-block;background:#1E88E5;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:500;">Open the assessment</a>
</p>
<p style="font-size:14px;color:#A7B0BC;">Or paste this URL into your browser:<br><span style="color:#1E88E5;word-break:break-all;">${assessmentUrl}</span></p>
<p>The assessment is in five sections covering architecture, governance, leadership, a practical coding task, and short scenario questions. We expect a thoughtful response to take around 4 to 5 hours of focused work — please complete it across multiple sessions if that suits you better. The platform auto-saves as you go.</p>
<p>Please return your completed assessment within <strong>seven days</strong> of receiving this email.</p>
<p>You're welcome to use AI tools as part of your work; we ask only that the final answers represent your own thinking and that you'd be able to defend any technical position in a follow-up live conversation.</p>
<p>If anything is unclear, please reply to this email.</p>
<p style="margin-top:32px;color:#A7B0BC;font-size:14px;">Best regards,<br><strong>Veri Hiring Team</strong><br>Veri / Gravitas Finance LLC · Mauritius</p>
</div>
</body></html>`;

  return { subject, html, text };
}
