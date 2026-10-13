
import {
  correoPetFunCR,
  obtenerResend,
} from "@/lib/resend";

type NotificacionReserva = {
  asunto: string;
  mensaje: string;
};

export async function enviarNotificacionReserva({
  asunto,
  mensaje,
}: NotificacionReserva): Promise<void> {
  try {
    const resend = obtenerResend();

    if (!resend) {
      return;
    }

    const { error } = await resend.emails.send({
      from: "PetFunCR <onboarding@resend.dev>",
      to: [correoPetFunCR],
      subject: asunto,
      text: mensaje,
    });

    if (error) {
      console.error(
        "Resend no pudo enviar la notificación de reserva:",
        error.message
      );
    }
  } catch (error) {
    console.error(
      "Error inesperado enviando notificación de reserva:",
      error instanceof Error ? error.message : error
    );
  }
}
