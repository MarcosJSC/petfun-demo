import { NextResponse } from "next/server";
import { correoPetFunCR, obtenerResend } from "@/lib/resend";

export const runtime = "nodejs";

const REMITENTE = "PetFunCR <onboarding@resend.dev>";

function textoPlano(valor: unknown, maximo: number): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (!limpio || limpio.length > maximo) return null;
  return limpio;
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function crearHtml(datos: {
  nombre: string;
  correo: string;
  asunto: string;
  mensaje: string;
}): string {
  const mensajeHtml = escaparHtml(datos.mensaje)
    .split("\n")
    .map((linea) =>
      linea
        ? `<p style="margin:0 0 10px;line-height:1.7;color:#454052;">${linea}</p>`
        : '<div style="height:8px;line-height:8px;">&nbsp;</div>'
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Contacto web PetFunCR</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F3F8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;">
    <tr><td style="padding:26px 24px;background:#68429A;color:#FFFFFF;text-align:center;">
      <div style="font-size:26px;font-weight:bold;">PetFunCR</div>
      <div style="font-size:13px;margin-top:6px;color:#F0E7FC;">Hotel y Guardería Canina</div>
    </td></tr>
    <tr><td style="padding:26px 24px 12px;">
      <div style="display:inline-block;padding:7px 12px;border-radius:20px;background:#F0E7FC;color:#68429A;font-size:12px;font-weight:bold;">NUEVO MENSAJE WEB</div>
      <h1 style="margin:17px 0 8px;font-size:22px;line-height:1.35;color:#392650;">${escaparHtml(datos.asunto)}</h1>
      <p style="margin:0;color:#756B80;font-size:14px;line-height:1.6;">Una persona completó el formulario de contacto de PetFunCR.</p>
    </td></tr>
    <tr><td style="padding:12px 24px 26px;">
      <p style="margin:0 0 10px;line-height:1.7;color:#454052;"><strong>Nombre:</strong> ${escaparHtml(datos.nombre)}</p>
      <p style="margin:0 0 18px;line-height:1.7;color:#454052;"><strong>Correo para responder:</strong> <a href="mailto:${escaparHtml(datos.correo)}" style="color:#68429A;">${escaparHtml(datos.correo)}</a></p>
      <div style="padding:16px;border:1px solid #E1D4F5;border-radius:10px;background:#FAF8FD;">
        <div style="margin-bottom:10px;font-size:11px;font-weight:bold;letter-spacing:1px;color:#7652A8;">MENSAJE</div>
        ${mensajeHtml}
      </div>
    </td></tr>
    <tr><td style="padding:18px 24px;background:#F3EDFC;color:#756B80;text-align:center;font-size:12px;line-height:1.6;">Notificación automática del sitio web de PetFunCR.</td></tr>
  </table>
</body></html>`;
}

export async function POST(request: Request) {
  try {
    const longitud = Number(request.headers.get("content-length") ?? "0");
    if (longitud > 16_000) {
      return NextResponse.json(
        { error: "El mensaje es demasiado grande. Revisá el formulario e intentá nuevamente." },
        { status: 413 }
      );
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
    }

    const datos = body as Record<string, unknown>;

    // Campo oculto anti-spam. No se revela al bot si el mensaje fue descartado.
    if (typeof datos.sitioWeb === "string" && datos.sitioWeb.trim()) {
      return NextResponse.json({ mensaje: "¡Gracias por escribirnos! Recibimos tu mensaje." });
    }

    const nombre = textoPlano(datos.nombre, 80);
    const correo = textoPlano(datos.correo, 254)?.toLowerCase() ?? null;
    const asunto = textoPlano(datos.asunto, 120);
    const mensaje = typeof datos.mensaje === "string"
      ? datos.mensaje.replace(/\r\n?/g, "\n").trim()
      : null;

    if (!nombre || nombre.length < 2) {
      return NextResponse.json({ error: "Ingresá tu nombre (entre 2 y 80 caracteres)." }, { status: 400 });
    }

    if (!correo || correo.length < 6 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(correo)) {
      return NextResponse.json({ error: "Ingresá una dirección de correo válida." }, { status: 400 });
    }

    if (!asunto || asunto.length < 3 || /[\r\n]/.test(asunto)) {
      return NextResponse.json({ error: "El asunto debe tener entre 3 y 120 caracteres." }, { status: 400 });
    }

    if (!mensaje || mensaje.length < 10 || mensaje.length > 4000) {
      return NextResponse.json({ error: "El mensaje debe tener entre 10 y 4000 caracteres." }, { status: 400 });
    }

    const resend = obtenerResend();
    if (!resend) {
      return NextResponse.json(
        { error: "El formulario no está disponible en este momento. Escribinos por WhatsApp." },
        { status: 503 }
      );
    }

    const { error } = await resend.emails.send({
      from: REMITENTE,
      to: [correoPetFunCR],
      replyTo: correo,
      subject: `Contacto web PetFunCR: ${asunto}`,
      text: [
        "Nuevo mensaje desde el formulario de contacto de PetFunCR.",
        "",
        `Nombre: ${nombre}`,
        `Correo para responder: ${correo}`,
        `Asunto: ${asunto}`,
        "",
        "Mensaje:",
        mensaje,
      ].join("\n"),
      html: crearHtml({ nombre, correo, asunto, mensaje }),
    });

    if (error) {
      console.error("Resend no pudo enviar el mensaje de contacto:", error.message);
      return NextResponse.json(
        { error: "No pudimos enviar tu mensaje. Intentá nuevamente o escribinos por WhatsApp." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { mensaje: "¡Gracias por escribirnos! Recibimos tu mensaje." },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Error procesando el formulario de contacto:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "No pudimos procesar tu mensaje. Intentá nuevamente o escribinos por WhatsApp." },
      { status: 500 }
    );
  }
}
