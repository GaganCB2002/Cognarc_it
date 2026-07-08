import crypto from "crypto";

const captchaStore = new Map<string, { answer: string; expiresAt: number }>();
const CAPTCHA_EXPIRY_SECONDS = 120;
const CAPTCHA_LENGTH = 6;

const ALLOWED_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

interface CaptchaQuestion {
  key: string;
  question: string;
}

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    code += ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)];
  }
  return code;
}

export function generateCaptcha(): CaptchaQuestion {
  const key = crypto.randomUUID();
  const answer = generateCode();

  captchaStore.set(key, {
    answer,
    expiresAt: Date.now() + CAPTCHA_EXPIRY_SECONDS * 1000,
  });

  setTimeout(() => captchaStore.delete(key), CAPTCHA_EXPIRY_SECONDS * 1000 + 1000);

  const displayText = answer.split('').join(' ');
  return {
    key,
    question: displayText,
  };
}

export function verifyCaptcha(key: string, answer: string): boolean {
  const record = captchaStore.get(key);
  if (!record) return false;
  if (record.expiresAt < Date.now()) {
    captchaStore.delete(key);
    return false;
  }
  if (record.answer.toLowerCase() !== answer.toLowerCase().trim()) return false;

  captchaStore.delete(key);
  return true;
}
