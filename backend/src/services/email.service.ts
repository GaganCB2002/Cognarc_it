import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  appName: string;
}

const config: EmailConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || "noreply@studytrack.app",
  appName: process.env.APP_NAME || "StudyTrack",
};

const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.port === 465,
  auth: {
    user: config.user,
    pass: config.pass,
  },
});

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0A0A0A; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #0A0A0A; padding: 40px 0;">
        <tr><td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background: #111111; border-radius: 16px; border: 1px solid #222222; overflow: hidden;">
            <tr><td style="padding: 40px 32px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; background: #FFCF70; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: #000; font-size: 24px; font-weight: 800;">S</span>
              </div>
              <h1 style="color: #F5F5F5; font-size: 22px; font-weight: 700; margin: 0 0 8px;">${config.appName}</h1>
              <p style="color: #999; font-size: 14px; margin: 0 0 28px;">Your verification code</p>
              <div style="background: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #222;">
                <p style="color: #FFCF70; font-size: 36px; font-weight: 800; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 0;">This code expires in <strong style="color: #999;">10 minutes</strong>. Do not share this code with anyone. If you did not request this, please ignore this email.</p>
            </td></tr>
            <tr><td style="padding: 20px 32px; background: #0A0A0A; border-top: 1px solid #222;">
              <p style="color: #555; font-size: 11px; margin: 0; text-align: center;">&copy; 2026 ${config.appName}. All rights reserved.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${config.appName}" <${config.from}>`,
    to: email,
    subject: `Your ${config.appName} Verification Code`,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0A0A0A; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #0A0A0A; padding: 40px 0;">
        <tr><td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background: #111111; border-radius: 16px; border: 1px solid #222222; overflow: hidden;">
            <tr><td style="padding: 40px 32px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; background: #FFCF70; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: #000; font-size: 24px; font-weight: 800;">S</span>
              </div>
              <h1 style="color: #F5F5F5; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Reset Your Password</h1>
              <p style="color: #999; font-size: 14px; margin: 0 0 28px;">Click below to create a new password</p>
              <a href="${resetUrl}" style="display: inline-block; background: #FFCF70; color: #000; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 10px; letter-spacing: 0.5px;">Reset Password</a>
              <p style="color: #666; font-size: 12px; line-height: 1.6; margin: 24px 0 0;">This link expires in <strong style="color: #999;">15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
            </td></tr>
            <tr><td style="padding: 20px 32px; background: #0A0A0A; border-top: 1px solid #222;">
              <p style="color: #555; font-size: 11px; margin: 0; text-align: center;">&copy; 2026 ${config.appName}. All rights reserved.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${config.appName}" <${config.from}>`,
    to: email,
    subject: `Reset your ${config.appName} password`,
    html,
  });
}
