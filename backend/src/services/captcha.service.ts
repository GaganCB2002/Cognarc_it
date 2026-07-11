const CAPTCHA_EXPIRY_SECONDS = 300;
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789";

interface CaptchaStore {
  answer: string;
  expiresAt: number;
}

const captchaStore = new Map<string, CaptchaStore>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of captchaStore) {
    if (value.expiresAt < now) {
      captchaStore.delete(key);
    }
  }
}, 60000);

interface CaptchaQuestion {
  key: string;
  question: string;
  expiresAt: number;
}

function pickCharacter(characters: string): string {
  return characters[Math.floor(Math.random() * characters.length)];
}

function generateChallenge(): { question: string; answer: string } {
  const code = [
    pickCharacter(UPPERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(DIGITS),
    pickCharacter(UPPERCASE),
  ].join("");

  return { question: code, answer: code };
}

export function generateCaptcha(): CaptchaQuestion {
  const { question, answer } = generateChallenge();
  const expiresAt = Date.now() + CAPTCHA_EXPIRY_SECONDS * 1000;
  const key = Buffer.from(Date.now().toString() + Math.random().toString()).toString("base64url");

  captchaStore.set(key, { answer, expiresAt });

  return { key, question, expiresAt };
}

export function verifyCaptcha(key: string, answer: string): boolean {
  const entry = captchaStore.get(key);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    captchaStore.delete(key);
    return false;
  }
  captchaStore.delete(key);
  return entry.answer.toLowerCase() === String(answer).trim().toLowerCase();
}
