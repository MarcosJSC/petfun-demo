
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("Falta configurar RESEND_API_KEY.");
}

const resend = new Resend(apiKey);

try {
  const { data, error } = await resend.emails.send({
    from: "PetFunCR <onboarding@resend.dev>",
    to: ["petfuncr@outlook.com"],
    subject: "Prueba de notificaciones PetFunCR",
    text: [
      "Hola, socio.",
      "",
      "Este es un correo de prueba para verificar las notificaciones de PetFunCR.",
      "No se ha creado ni modificado ninguna reserva.",
      "",
      "Si recibiste este correo, el envío funciona correctamente.",
    ].join("\n"),
  });

  if (error) {
    console.error("Resend reportó un error:", error.message);
    process.exitCode = 1;
  } else {
    console.log("Resend aceptó el correo.");
    console.log("ID del correo:", data?.id);
  }
} catch (error) {
  console.error(
    "Error enviando el correo:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
}
