
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const codigo =
      typeof body?.codigo === "string"
        ? body.codigo.trim().toUpperCase()
        : "";

    if (!/^PF-[A-Z0-9]{5,12}$/.test(codigo)) {
      return NextResponse.json(
        { error: "Ingresá un código de propietario válido." },
        { status: 400 }
      );
    }

    const {
      data: propietario,
      error: errorPropietario,
    } = await supabaseAdmin
      .from("propietarios")
      .select("id")
      .eq("codigo_reserva", codigo)
      .maybeSingle();

    if (errorPropietario) {
      console.error(
        "Error consultando propietario:",
        errorPropietario.message
      );

      return NextResponse.json(
        { error: "No fue posible consultar las reservas." },
        { status: 500 }
      );
    }

    if (!propietario) {
      return NextResponse.json(
        { error: "Código de reserva inválido o no habilitado." },
        { status: 404 }
      );
    }

    const {
      data: reservas,
      error: errorReservas,
    } = await supabaseAdmin
      .from("reservas")
      .select(`
        id,
        numero_reserva,
        fecha_entrada,
        fecha_salida,
        turno_entrada,
        tipo_estadia_id,
        estado,
        monto_estimado,
        observaciones_cliente,
        created_at,
        reserva_perritos (
          perrito_id,
          perritos (
            nombre
          )
        )
      `)
      .eq("propietario_id", propietario.id)
      .eq("estado", "Pendiente")
      .order("created_at", { ascending: false });

    if (errorReservas) {
      console.error(
        "Error consultando reservas:",
        errorReservas.message
      );

      return NextResponse.json(
        { error: "No fue posible consultar las reservas." },
        { status: 500 }
      );
    }

    const resultado = (reservas ?? []).map((reserva: any) => ({
      id: reserva.id,
      numeroReserva: reserva.numero_reserva,
      fechaEntrada: reserva.fecha_entrada,
      fechaSalida: reserva.fecha_salida,
      turnoEntrada: reserva.turno_entrada,
      tipoEstadia:
        reserva.tipo_estadia_id === 1
          ? "Hotel"
          : reserva.tipo_estadia_id === 2
            ? "Guardería"
            : "No especificado",
      estado: reserva.estado,
      montoEstimado: reserva.monto_estimado,
      observacionesCliente: reserva.observaciones_cliente,
      fechaSolicitud: reserva.created_at,
      perritos: (reserva.reserva_perritos ?? []).map(
        (detalle: any) => ({
          id: detalle.perrito_id,
          nombre: detalle.perritos?.nombre ?? "Perrito",
        })
      ),
    }));

    return NextResponse.json({
      reservas: resultado,
    });
  } catch (error) {
    console.error("Error en consulta pública de reservas:", error);

    return NextResponse.json(
      { error: "Ocurrió un error al consultar las reservas." },
      { status: 500 }
    );
  }
}
