
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { autorizarReserva } from "@/lib/reservas/autorizarReserva";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar sesión, perfil activo y rol autorizado.
    const resultado = await autorizarReserva(request);

    if (!resultado.autorizado) {
      return resultado.respuesta;
    }

    const { usuario } = resultado;

    // La sucursal seleccionada en el panel solo puede restringir la consulta;
    // nunca concede acceso a una sucursal que el usuario no tenga asignada.
    const valorSucursal = request.nextUrl.searchParams.get("sucursalId");
    let sucursalSolicitada: number | null = null;

    if (valorSucursal !== null && valorSucursal !== "global") {
      const idParseado = Number(valorSucursal);

      if (!Number.isSafeInteger(idParseado) || idParseado <= 0) {
        return NextResponse.json(
          { error: "La sucursal seleccionada no es válida." },
          { status: 400 }
        );
      }

      sucursalSolicitada = idParseado;
    }

    // 2. Consultar reservas sin incluir credenciales ni datos innecesarios.
    let consulta = supabaseAdmin
      .from("reservas")
      .select(`
        id,
        numero_reserva,
        propietario_id,
        sucursal_id,
        fecha_entrada,
        fecha_salida,
        turno_entrada,
        tipo_estadia_id,
        estado,
        monto_estimado,
        observaciones_cliente,
        observaciones_admin,
        created_at,
        propietarios (
          nombre,
          apellidos,
          telefono
        ),
        sucursales (
          id,
          nombre
        ),
        tipos_estadia (
          nombre
        ),
        reserva_perritos (
          id,
          perrito_id,
          dias_calculados,
          precio_hotel_aplicado,
          precio_guarderia_aplicado,
          subtotal_hotel_estimado,
          subtotal_guarderia_estimado,
          perritos (
            nombre
          )
        )
      `)
      .order("created_at", { ascending: false });

    // 3. Administradores y operadores solo ven sus sucursales.
    if (usuario.sucursalesIds !== null) {
      if (usuario.sucursalesIds.length === 0) {
        return NextResponse.json({
          ok: true,
          reservas: [],
        });
      }

      if (
        sucursalSolicitada !== null &&
        !usuario.sucursalesIds.includes(sucursalSolicitada)
      ) {
        return NextResponse.json(
          { error: "No tienes acceso a la sucursal seleccionada." },
          { status: 403 }
        );
      }

      consulta = consulta.in(
        "sucursal_id",
        usuario.sucursalesIds
      );
    }

    // El superadministrador puede consultar todas o filtrar una sucursal.
    // Los demás usuarios ya quedaron limitados a sus sucursales autorizadas.
    if (sucursalSolicitada !== null) {
      consulta = consulta.eq("sucursal_id", sucursalSolicitada);
    }

    const { data, error } = await consulta;

    if (error) {
      console.error("Error consultando reservas:", error);

      return NextResponse.json(
        { error: "No se pudieron cargar las reservas." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        reservas: data ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error inesperado consultando reservas:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado." },
      { status: 500 }
    );
  }
}
