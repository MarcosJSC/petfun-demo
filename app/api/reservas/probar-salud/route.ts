
import { NextResponse } from "next/server";
import { validarSaludPerrito } from "@/lib/reservas/validarSaludPerrito";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Ruta disponible solo en desarrollo." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();

    const perritoId = Number(body?.perritoId);
    const fechaSalida = body?.fechaSalida;

    if (
      !Number.isInteger(perritoId) ||
      perritoId <= 0 ||
      typeof fechaSalida !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaSalida)
    ) {
      return NextResponse.json(
        { error: "Debes indicar un perritoId y una fechaSalida válidos." },
        { status: 400 }
      );
    }

    const resultado = await validarSaludPerrito(
      perritoId,
      fechaSalida
    );

    return NextResponse.json(resultado, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error probando salud:", error);

    return NextResponse.json(
      { error: "No se pudo validar la salud del perrito." },
      { status: 500 }
    );
  }
}
