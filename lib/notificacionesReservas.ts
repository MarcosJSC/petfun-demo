
import {
  correoPetFunCR,
  obtenerResend,
} from "@/lib/resend";

type NotificacionReserva = {
  asunto: string;
  mensaje: string;
};

// Evita que caracteres de los nombres o mensajes rompan el HTML.
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function crearHtml(asunto: string, mensaje: string): string {
  const lineas = mensaje.split("\n");

  const contenido = lineas
    .map((linea) => {
      const texto = escaparHtml(linea);

      if (!texto.trim()) {
        return '<div style="height:10px;line-height:10px;">&nbsp;</div>';
      }

      // Destaca el número de reserva.
      if (linea.startsWith("Número de reserva:")) {
        const partes = linea.split(":");
        const etiqueta = escaparHtml(partes.shift() ?? "");
        const valor = escaparHtml(partes.join(":").trim());

        return `
          <div style="background-color:#F3EDFC;border:1px solid #E1D4F5;border-radius:10px;padding:16px;margin:8px 0;">
            <div style="font-size:11px;font-weight:bold;letter-spacing:1px;color:#7652A8;margin-bottom:6px;">
              ${etiqueta.toUpperCase()}
            </div>
            <div style="font-size:19px;font-weight:bold;color:#59358C;overflow-wrap:anywhere;">
              ${valor}
            </div>
          </div>`;
      }

      // Resalta los nombres de los perritos.
      if (linea.startsWith("- ")) {
        return `
          <div style="padding:5px 0;color:#59358C;font-weight:bold;">
            🐾 ${texto.substring(2)}
          </div>`;
      }

 
      // Destaca el nombre del propietario en morado.
      if (linea.startsWith("Propietario:")) {
        const nombre = escaparHtml(
          linea.substring("Propietario:".length).trim()
        );

        return `
          <p style="margin:0 0 9px;color:#454052;font-size:14px;line-height:1.7;">
            Propietario:
            <span style="color:#68429A;font-weight:bold;">${nombre}</span>
          </p>`;
      }

      return `
        <p style="margin:0 0 9px;color:#454052;font-size:14px;line-height:1.7;">
          ${texto}
        </p>`;

    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHtml(asunto)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3F8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F5F3F8;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#FFFFFF;border-radius:14px;overflow:hidden;">

          <tr>
            <td align="center" style="background-color:#68429A;padding:28px 20px;">
              <div style="font-size:28px;font-weight:bold;letter-spacing:0.5px;color:#FFFFFF;">
                PetFunCR
              </div>
              <div style="font-size:13px;color:#F0E7FC;margin-top:7px;">
                Hotel y Guardería Canina
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 24px 12px;">
              <div style="display:inline-block;background-color:#F0E7FC;color:#68429A;border-radius:20px;padding:7px 12px;font-size:12px;font-weight:bold;">
                NUEVA SOLICITUD
              </div>
              <h1 style="margin:18px 0 8px;color:#392650;font-size:23px;line-height:1.3;">
                ${escaparHtml(asunto)}
              </h1>
              <p style="margin:0;color:#756B80;font-size:14px;line-height:1.6;">
                Se ha recibido una notificación en el sistema de reservas de PetFunCR.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 24px 24px;">
              ${contenido}
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color:#F3EDFC;padding:22px 24px;">
              <p style="margin:0 0 8px;color:#59358C;font-size:14px;font-weight:bold;">
                PetFunCR 🐾
              </p>
              <p style="margin:0;color:#756B80;font-size:12px;line-height:1.6;">
                Ingresa al panel administrativo para revisar y gestionar la solicitud.
              </p>
            </td>
          </tr>

        </table>

        <p style="margin:16px 0 0;color:#8B8295;font-size:11px;text-align:center;">
          Notificación automática de PetFunCR
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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
      html: crearHtml(asunto, mensaje),
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
