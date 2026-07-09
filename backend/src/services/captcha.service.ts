import crypto from "crypto";

const captchaStore = new Map<string, { answer: string; expiresAt: number }>();
const CAPTCHA_EXPIRY_SECONDS = 300;

interface CaptchaQuestion {
  key: string;
  question: string;
}

function generateChallenge(): { question: string; answer: string } {
  const operations = ['+', '-'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * (op === '-' ? num1 : 20)) + 1;
  let answer: number;
  let question: string;

  switch (op) {
    case '+':
      answer = num1 + num2;
      question = `What is ${num1} + ${num2}?`;
      break;
    case '-':
      answer = num1 - num2;
      question = `What is ${num1} - ${num2}?`;
      break;
    default:
      answer = num1 + num2;
      question = `What is ${num1} + ${num2}?`;
  }

  return { question, answer: String(answer) };
}

export function generateCaptcha(): CaptchaQuestion {
  const key = crypto.randomUUID();
  const { question, answer } = generateChallenge();

  captchaStore.set(key, {
    answer,
    expiresAt: Date.now() + CAPTCHA_EXPIRY_SECONDS * 1000,
  });

  setTimeout(() => captchaStore.delete(key), CAPTCHA_EXPIRY_SECONDS * 1000 + 1000);

  return { key, question };
}

export function verifyCaptcha(key: string, answer: string): boolean {
  const record = captchaStore.get(key);
  if (!record) return false;
  if (record.expiresAt < Date.now()) {
    captchaStore.delete(key);
    return false;
  }
  const isValid = record.answer.toLowerCase() === String(answer).trim().toLowerCase();
  if (isValid) {
    captchaStore.delete(key);
  }
  return isValid;
}
