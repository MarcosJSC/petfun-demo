import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { consultarDisponibilidad } from "@/lib/reservas/consultarDisponibilidad";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Ruta disponible únicamente en desarrollo." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();

    const sucursalId = Number(body.sucursalId);
    const cantidadPerritos = Number(body.cantidadPerritos);
    const fechaEntrada = body.fechaEntrada;
    const fechaSalida = body.fechaSalida;

    const resultado = await consultarDisponibilidad({
      sucursalId,
      cantidadPerritos,
      fechaEntrada,
      fechaSalida,
    });

    return NextResponse.json(resultado, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(
      "Error probando disponibilidad:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No fue posible consultar la disponibilidad." },
      { status: 400 }
    );
  }
}
