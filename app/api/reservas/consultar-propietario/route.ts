import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const codigo =
      typeof body?.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    if (!/^PF-[A-Z0-9]{5,12}$/.test(codigo)) {
      return NextResponse.json(
        { error: "Código de reserva inválido." },
        { status: 400 }
      );
    }

    const { data: propietario, error: errorPropietario } =
      await supabaseAdmin
        .from("propietarios")
        .select("id, nombre, apellidos, sucursal_id")
        .eq("codigo_reserva", codigo)
        .maybeSingle();

    if (errorPropietario) {
      console.error(
        "Error consultando propietario:",
        errorPropietario.message
      );

      return NextResponse.json(
        { error: "No fue posible realizar la consulta." },
        { status: 500 }
      );
    }

    if (!propietario) {
      return NextResponse.json(
        { error: "Código de reserva inválido o no habilitado." },
        { status: 404 }
      );
    }

    const { data: perritos, error: errorPerritos } =
      await supabaseAdmin
        .from("perritos")
        .select("id, nombre")
        .eq("propietario_id", propietario.id)
        .eq("sucursal_id", propietario.sucursal_id)
        .eq("activo", true)
        .order("nombre");

    if (errorPerritos) {
      console.error(
        "Error consultando perritos:",
        errorPerritos.message
      );

      return NextResponse.json(
        { error: "No fue posible consultar los perritos." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        propietario: {
          nombre: propietario.nombre,
          apellidos: propietario.apellidos,
        },
        perritos: perritos ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }
}