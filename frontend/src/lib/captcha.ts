export interface CaptchaChallenge {
  key: string;
  question: string;
  expiresAt: number;
}

const CAPTCHA_EXPIRY_SECONDS = 300;
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789";

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pickCharacter(characters: string): string {
  return characters[Math.floor(Math.random() * characters.length)];
}

export function generateCaptchaChallenge(): CaptchaChallenge {
  const code = [
    pickCharacter(UPPERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(DIGITS),
    pickCharacter(UPPERCASE),
  ].join("");
  const expiresAt = Date.now() + CAPTCHA_EXPIRY_SECONDS * 1000;
  const key = encodeBase64Url(JSON.stringify({ question: code, answer: code, expiresAt }));

  return { key, question: code, expiresAt };
}
