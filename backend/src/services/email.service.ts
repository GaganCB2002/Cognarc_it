import nodemailer from "nodemailer";

const APP_NAME = process.env.APP_NAME || "StudyTrack";
let transporter: nodemailer.Transporter | null = null;
let etherealUrl: string | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const account = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
  etherealUrl = `https://ethereal.email/login?user=${account.user}`;
  console.log(`[EMAIL] Using Ethereal — view emails at ${etherealUrl}`);

  return transporter;
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"${APP_NAME}" <noreply@studytrack.app>`,
      to,
      subject,
      html,
    });

    const previewUrl = etherealUrl
      ? `${etherealUrl.replace("/login", "")}/message/${info.messageId}`
      : nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      console.log(`[EMAIL] Sent to ${to} — preview: ${previewUrl}`);
    } else {
      console.log(`[EMAIL] Sent to ${to} (${subject})`);
    }

    return true;
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const otpChars = otp.split("").join(" ");
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:40px 16px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
<tr><td style="background:#111111;border-radius:16px;border:1px solid #222222;padding:48px 32px 36px;text-align:center">
<div style="width:56px;height:56px;background:#FFCF70;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px">
<span style="color:#000;font-size:28px;font-weight:800;line-height:1">S</span>
</div>
<h1 style="color:#F5F5F5;font-size:24px;font-weight:700;margin:0 0 4px;letter-spacing:-0.3px">${APP_NAME}</h1>
<p style="color:#888;font-size:14px;margin:0 0 28px">Your one-time verification code</p>
<div style="background:#1A1A1A;border-radius:12px;padding:28px 24px;margin-bottom:28px;border:1px solid #2A2A2A">
<p style="color:#FFCF70;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;font-family:'Courier New',Consolas,monospace;line-height:1">${otpChars}</p>
</div>
<p style="color:#666;font-size:13px;margin:0;line-height:1.6">This code expires in <strong style="color:#999">10 minutes</strong>. Never share this code with anyone.</p>
<p style="color:#555;font-size:12px;margin:20px 0 0;line-height:1.5">If you did not request this code, you can safely ignore this email.</p>
</td></tr>
<tr><td style="padding:20px 32px 0;text-align:center">
<p style="color:#444;font-size:11px;margin:0">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  await sendMail(email, `Your ${APP_NAME} verification code: ${otp}`, html);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:40px 16px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
<tr><td style="background:#111111;border-radius:16px;border:1px solid #222222;padding:48px 32px 36px;text-align:center">
<div style="width:56px;height:56px;background:#FFCF70;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px">
<span style="color:#000;font-size:28px;font-weight:800;line-height:1">S</span>
</div>
<h1 style="color:#F5F5F5;font-size:24px;font-weight:700;margin:0 0 4px;letter-spacing:-0.3px">Password Reset</h1>
<p style="color:#888;font-size:14px;margin:0 0 8px">We received a request to reset your password</p>
<p style="color:#666;font-size:13px;margin:0 0 32px">Click the button below to create a new password.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
<tr><td style="background:#FFCF70;border-radius:12px;padding:0">
<a href="${resetUrl}" style="display:inline-block;background:#FFCF70;color:#000;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;line-height:1">Reset Password</a>
</td></tr>
</table>
<div style="background:#1A1A1A;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #2A2A2A;text-align:left">
<p style="color:#888;font-size:12px;margin:0 0 4px;font-weight:600">Link expires in 15 minutes</p>
<p style="color:#555;font-size:11px;margin:0;word-break:break-all;line-height:1.5">${resetUrl}</p>
</div>
<p style="color:#666;font-size:12px;margin:0;line-height:1.6">If you did not request a password reset, please ignore this email.</p>
</td></tr>
<tr><td style="padding:20px 32px 0;text-align:center">
<p style="color:#444;font-size:11px;margin:0">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  await sendMail(email, `Reset your ${APP_NAME} password`, html);
}
