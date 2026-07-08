import crypto from "crypto";

const captchaStore = new Map<string, { answer: number; expiresAt: number }>();
const CAPTCHA_EXPIRY_SECONDS = 120;

interface CaptchaQuestion {
  key: string;
  question: string;
}

export function generateCaptcha(): CaptchaQuestion {
  const ops = ["+", "-"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number;
  let b: number;
  let answer: number;

  if (op === "-") {
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 30) + 5;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
  }

  const key = crypto.randomUUID();
  captchaStore.set(key, {
    answer,
    expiresAt: Date.now() + CAPTCHA_EXPIRY_SECONDS * 1000,
  });

  setTimeout(() => captchaStore.delete(key), CAPTCHA_EXPIRY_SECONDS * 1000 + 1000);

  return {
    key,
    question: `What is ${a} ${op} ${b}?`,
  };
}

export function verifyCaptcha(key: string, answer: number): boolean {
  const record = captchaStore.get(key);
  if (!record) return false;
  if (record.expiresAt < Date.now()) {
    captchaStore.delete(key);
    return false;
  }
  if (record.answer !== answer) return false;

  captchaStore.delete(key);
  return true;
}
