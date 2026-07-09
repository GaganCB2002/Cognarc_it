const CAPTCHA_EXPIRY_SECONDS = 300;
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789";

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
  const keyPayload = JSON.stringify({ question, answer, expiresAt });
  const key = Buffer.from(keyPayload, "utf8").toString("base64url");

  return { key, question, expiresAt };
}

export function verifyCaptcha(key: string, answer: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(key, "base64url").toString("utf8")) as {
      question?: string;
      answer?: string;
      expiresAt?: number;
    };
    if (!decoded.answer || !decoded.expiresAt) return false;
    if (decoded.expiresAt < Date.now()) return false;
    return decoded.answer.toLowerCase() === String(answer).trim().toLowerCase();
  } catch {
    return false;
  }
}
