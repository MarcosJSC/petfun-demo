
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { autorizarReserva } from "@/lib/reservas/autorizarReserva";
import { validarSaludPerrito } from "@/lib/reservas/validarSaludPerrito";

export const dynamic = "force-dynamic";

type DetalleReserva = {
  perrito_id: number;
};

type ReservaParaAprobar = {
  id: number;
  propietario_id: number;
  sucursal_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  tipo_estadia_id: number;
  estado: string;
  reserva_perritos: DetalleReserva[];
};

type PerritoActual = {
  id: number;
  propietario_id: number;
  sucursal_id: number;
  activo: boolean;
};

export async function POST(request: NextRequest) {
  try {
    // 1. Validar sesión, rol y perfil activo.
    // Se conserva el control centralizado existente.
    const resultado = await autorizarReserva(request);

    if (!resultado.autorizado) {
      return resultado.respuesta;
    }

    const { usuario } = resultado;

    // 2. Leer y validar los datos recibidos.
    let body: {
      reservaId?: unknown;
      observacionesAdmin?: unknown;
      autorizarExcesoCapacidad?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es válido." },
        { status: 400 }
      );
    }

    const reservaId = Number(body.reservaId);

    const observacionesAdmin =
      typeof body.observacionesAdmin === "string"
        ? body.observacionesAdmin.trim()
        : "";

    // Solo se acepta un booleano real.
    // No convertir strings como "true" en autorizaciones.
    const autorizarExcesoCapacidad =
      body.autorizarExcesoCapacidad === true;

    if (
      body.autorizarExcesoCapacidad !== undefined &&
      typeof body.autorizarExcesoCapacidad !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "La autorización de exceso de capacidad debe ser verdadera o falsa.",
        },
        { status: 400 }
      );
    }

    if (!Number.isSafeInteger(reservaId) || reservaId <= 0) {
      return NextResponse.json(
        { error: "El identificador de la reserva no es válido." },
        { status: 400 }
      );
    }

    if (observacionesAdmin.length > 2000) {
      return NextResponse.json(
        {
          error: "Las observaciones no pueden superar 2000 caracteres.",
        },
        { status: 400 }
      );
    }

    // 3. Consultar la reserva con los datos necesarios.
    const { data: reserva, error: errorReserva } =
      await supabaseAdmin
        .from("reservas")
        .select(`
          id,
          propietario_id,
          sucursal_id,
          fecha_entrada,
          fecha_salida,
          tipo_estadia_id,
          estado,
          reserva_perritos (
            perrito_id
          )
        `)
        .eq("id", reservaId)
        .maybeSingle();

    if (errorReserva) {
      console.error("Error consultando reserva:", errorReserva);

      return NextResponse.json(
        { error: "No se pudo consultar la reserva." },
        { status: 500 }
      );
    }

    if (!reserva) {
      return NextResponse.json(
        { error: "La reserva no existe." },
        { status: 404 }
      );
    }

    const reservaValidada =
      reserva as unknown as ReservaParaAprobar;

    // 4. Verificar acceso a la sucursal.
    if (
      usuario.sucursalesIds !== null &&
      !usuario.sucursalesIds.includes(
        Number(reservaValidada.sucursal_id)
      )
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes acceso a la sucursal de esta reserva.",
        },
        { status: 403 }
      );
    }

    // 5. La reserva debe continuar pendiente.
    if (reservaValidada.estado !== "Pendiente") {
      return NextResponse.json(
        {
          error:
            `La reserva no está pendiente. Estado actual: ${reservaValidada.estado}.`,
        },
        { status: 409 }
      );
    }

    // 6. Validar propietario, sucursal, fechas y servicio.
    if (
      !Number.isSafeInteger(Number(reservaValidada.propietario_id)) ||
      Number(reservaValidada.propietario_id) <= 0 ||
      !Number.isSafeInteger(Number(reservaValidada.sucursal_id)) ||
      Number(reservaValidada.sucursal_id) <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La reserva tiene un propietario o una sucursal no válidos.",
        },
        { status: 409 }
      );
    }

    if (
      !reservaValidada.fecha_entrada ||
      !reservaValidada.fecha_salida ||
      reservaValidada.fecha_salida < reservaValidada.fecha_entrada
    ) {
      return NextResponse.json(
        {
          error: "Las fechas de la reserva no son válidas.",
        },
        { status: 409 }
      );
    }

    if (![1, 2].includes(Number(reservaValidada.tipo_estadia_id))) {
      return NextResponse.json(
        {
          error:
            "El tipo de estadía no es válido para una reserva pública.",
        },
        { status: 409 }
      );
    }

    const detalles = reservaValidada.reserva_perritos;

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json(
        { error: "La reserva no tiene perritos asociados." },
        { status: 409 }
      );
    }

    const perritosIds = detalles.map((detalle) =>
      Number(detalle.perrito_id)
    );

    if (
      perritosIds.some(
        (id) => !Number.isSafeInteger(id) || id <= 0
      ) ||
      new Set(perritosIds).size !== perritosIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "La reserva contiene identificadores de perritos inválidos o repetidos.",
        },
        { status: 409 }
      );
    }

    // 7. Consultar los datos actuales de los perritos.
    const { data: perritos, error: errorPerritos } =
      await supabaseAdmin
        .from("perritos")
        .select("id, propietario_id, sucursal_id, activo")
        .in("id", perritosIds);

    if (errorPerritos) {
      console.error(
        "Error consultando perritos de la reserva:",
        errorPerritos
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron verificar los datos actuales de los perritos.",
        },
        { status: 500 }
      );
    }

    const perritosActuales =
      (perritos ?? []) as PerritoActual[];

    // 8. Comprobar existencia, estado y pertenencia.
    if (perritosActuales.length !== perritosIds.length) {
      return NextResponse.json(
        {
          error:
            "Uno o más perritos asociados a la reserva ya no existen o no se pudieron localizar.",
        },
        { status: 409 }
      );
    }

    const perritosInvalidos = perritosActuales.filter(
      (perrito) =>
        !perrito.activo ||
        Number(perrito.propietario_id) !==
          Number(reservaValidada.propietario_id) ||
        Number(perrito.sucursal_id) !==
          Number(reservaValidada.sucursal_id) ||
        !perritosIds.includes(Number(perrito.id))
    );

    if (perritosInvalidos.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede aprobar: uno o más perritos están inactivos o sus datos ya no coinciden con el propietario o la sucursal de la reserva.",
          perritos: perritosInvalidos.map((perrito) => ({
            perritoId: perrito.id,
            activo: perrito.activo,
          })),
        },
        { status: 409 }
      );
    }

    // 9. Revalidar la salud de cada perrito hasta la salida.
    const validaciones = await Promise.all(
      perritosIds.map(async (perritoId) => {
        const resultadoSalud = await validarSaludPerrito(
          perritoId,
          reservaValidada.fecha_salida
        );

        return {
          perritoId,
          ...resultadoSalud,
        };
      })
    );

    const incumplimientos = validaciones.filter(
      (resultadoSalud) => !resultadoSalud.cumple
    );

    if (incumplimientos.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede aprobar la reserva porque uno o más perritos no cumplen los requisitos sanitarios.",
          perritos: incumplimientos,
        },
        { status: 422 }
      );
    }

    // 10. Aprobar mediante la función SQL de tres argumentos.
    // La base de datos vuelve a comprobar la capacidad, los bloqueos,
    // el estado de la reserva y la pertenencia de los perritos.
    const { data, error } = await supabaseAdmin.rpc(
      "aprobar_reserva_publica",
      {
        p_reserva_id: reservaId,
        p_observaciones_admin: observacionesAdmin || null,
        p_autorizar_exceso: autorizarExcesoCapacidad,
      }
    );

    if (error) {
      console.error("Error aprobando reserva:", error);

      return NextResponse.json(
        {
          error:
            error.message ||
            "No se pudo aprobar la reserva. Revisá el estado y la capacidad.",
        },
        { status: 409 }
      );
    }

    // 11. Responder según el resultado confirmado por SQL.
    const resultadoSql = data as
      | {
          exceso_capacidad_autorizado?: boolean;
        }
      | null;

    const excesoAutorizado =
      resultadoSql?.exceso_capacidad_autorizado === true;

    return NextResponse.json(
      {
        ok: true,
        mensaje: excesoAutorizado
          ? "Reserva aprobada con autorización excepcional de capacidad y estadías creadas correctamente."
          : "Reserva aprobada y estadías creadas correctamente.",
        resultado: data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error inesperado aprobando reserva:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al aprobar la reserva.",
      },
      { status: 500 }
    );
  }
}
