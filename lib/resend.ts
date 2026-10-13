
import { Resend } from "resend";

export const correoPetFunCR = "petfuncr@outlook.com";

export function obtenerResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("Falta configurar RESEND_API_KEY.");
    return null;
  }

  return new Resend(apiKey);
}
