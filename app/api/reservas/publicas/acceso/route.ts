
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const codigo =
      typeof body?.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    if (!/^PF-[A-Z0-9]{5,12}$/.test(codigo)) {
      return NextResponse.json(
        { error: "Revisá el código e intentá nuevamente." },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const { data: propietario, error: errorPropietario } =
      await supabaseAdmin
        .from("propietarios")
        .select("id, sucursal_id")
        .eq("codigo_reserva", codigo)
        .maybeSingle();

    if (errorPropietario) {
      console.error(
        "Error validando código de reserva:",
        errorPropietario.message
      );

      return NextResponse.json(
        { error: "No fue posible validar el código en este momento." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (!propietario) {
      return NextResponse.json(
        { error: "Código inválido o sin acceso a reservas." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const { data: perritos, error: errorPerritos } =
      await supabaseAdmin
        .from("perritos")
        .select("id, nombre")
        .eq("propietario_id", propietario.id)
        .eq("sucursal_id", propietario.sucursal_id)
        .eq("activo", true)
        .order("nombre", { ascending: true });

    if (errorPerritos) {
      console.error(
        "Error consultando perritos para reserva pública:",
        errorPerritos.message
      );

      return NextResponse.json(
        { error: "No fue posible consultar los perritos en este momento." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        mensaje: "Código validado correctamente.",
        perritos: perritos ?? [],
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "Error en acceso público de reservas:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No fue posible procesar la solicitud." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
