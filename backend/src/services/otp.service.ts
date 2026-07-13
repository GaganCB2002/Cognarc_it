import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 15;

const otpStore = new Map<string, { otp: string; userId: string; expiresAt: number; used: boolean }>();
const resetTokenStore = new Map<string, { userId: string; expiresAt: number; used: boolean }>();

// Periodic cleanup of expired OTPs and reset tokens every 60 seconds
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(key);
    }
  }
  for (const [token, record] of resetTokenStore.entries()) {
    if (record.expiresAt < now) {
      resetTokenStore.delete(token);
    }
  }
}, 60000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

export function generateOTP(userId: string): { otp: string; key: string } {
  const existing = Array.from(otpStore.entries()).find(
    ([_, v]) => v.userId === userId && v.expiresAt > Date.now() && !v.used
  );
  if (existing) {
    return { otp: existing[1].otp, key: existing[0] };
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const key = crypto.randomUUID();
  otpStore.set(key, {
    otp,
    userId,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    used: false,
  });

  setTimeout(() => otpStore.delete(key), OTP_EXPIRY_MINUTES * 60 * 1000 + 5000);

  return { otp, key };
}

export function verifyOTP(key: string, otp: string, userId: string): boolean {
  const record = otpStore.get(key);
  if (!record) return false;
  if (record.used) return false;
  if (record.userId !== userId) return false;
  if (record.expiresAt < Date.now()) {
    otpStore.delete(key);
    return false;
  }
  if (record.otp !== otp) return false;

  record.used = true;
  setTimeout(() => otpStore.delete(key), 1000);
  return true;
}

export function generateResetToken(userId: string): string {
  const existing = Array.from(resetTokenStore.entries()).find(
    ([_, v]) => v.userId === userId && v.expiresAt > Date.now() && !v.used
  );
  if (existing) {
    return existing[0];
  }

  const token = crypto.randomBytes(32).toString("hex");
  resetTokenStore.set(token, {
    userId,
    expiresAt: Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
    used: false,
  });

  setTimeout(() => resetTokenStore.delete(token), RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000 + 5000);

  return token;
}

export function verifyResetToken(token: string): string | null {
  const record = resetTokenStore.get(token);
  if (!record) return null;
  if (record.used) return null;
  if (record.expiresAt < Date.now()) {
    resetTokenStore.delete(token);
    return null;
  }
  return record.userId;
}

export function markResetTokenUsed(token: string): void {
  const record = resetTokenStore.get(token);
  if (record) {
    record.used = true;
    setTimeout(() => resetTokenStore.delete(token), 1000);
  }
}
