
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ROLES_AUTORIZADOS = [
  "superadmin",
  "administrador",
  "operador",
] as const;

export type UsuarioReservaAutorizado = {
  usuarioId: string;
  rol: (typeof ROLES_AUTORIZADOS)[number];
  sucursalesIds: number[] | null;
};

type ResultadoAutorizacion =
  | {
      autorizado: true;
      usuario: UsuarioReservaAutorizado;
    }
  | {
      autorizado: false;
      respuesta: NextResponse;
    };

export async function autorizarReserva(
  request: NextRequest,
  sucursalId?: number
): Promise<ResultadoAutorizacion> {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "No autorizado." },
          { status: 401 }
        ),
      };
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "No autorizado." },
          { status: 401 }
        ),
      };
    }

    const {
      data: { user },
      error: errorUsuario,
    } = await supabaseAdmin.auth.getUser(token);

    if (errorUsuario || !user) {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "La sesión no es válida." },
          { status: 401 }
        ),
      };
    }

    const { data: perfil, error: errorPerfil } =
      await supabaseAdmin
        .from("perfiles_usuario")
        .select("usuario_id, rol, activo")
        .eq("usuario_id", user.id)
        .maybeSingle();

    if (
      errorPerfil ||
      !perfil ||
      perfil.activo !== true ||
      !ROLES_AUTORIZADOS.includes(
        perfil.rol as (typeof ROLES_AUTORIZADOS)[number]
      )
    ) {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          {
            error:
              "No tienes permisos para gestionar reservas.",
          },
          { status: 403 }
        ),
      };
    }

    const rol = perfil.rol as UsuarioReservaAutorizado["rol"];

    // El superadministrador puede operar en cualquier sucursal.
    if (rol === "superadmin") {
      return {
        autorizado: true,
        usuario: {
          usuarioId: user.id,
          rol,
          sucursalesIds: null,
        },
      };
    }

    const {
      data: asignaciones,
      error: errorAsignaciones,
    } = await supabaseAdmin
      .from("usuario_sucursales")
      .select("sucursal_id")
      .eq("usuario_id", user.id);

    if (errorAsignaciones) {
      console.error(
        "Error verificando sucursales del usuario:",
        errorAsignaciones
      );

      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "No se pudieron verificar tus sucursales." },
          { status: 500 }
        ),
      };
    }

    const sucursalesIds = (asignaciones ?? []).map(
      (asignacion) => Number(asignacion.sucursal_id)
    );

    if (
      sucursalId !== undefined &&
      (
        !Number.isInteger(sucursalId) ||
        !sucursalesIds.includes(sucursalId)
      )
    ) {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          {
            error:
              "No tienes acceso a la sucursal de esta reserva.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      autorizado: true,
      usuario: {
        usuarioId: user.id,
        rol,
        sucursalesIds,
      },
    };
  } catch (error) {
    console.error(
      "Error inesperado autorizando reserva:",
      error
    );

    return {
      autorizado: false,
      respuesta: NextResponse.json(
        { error: "No se pudo verificar la autorización." },
        { status: 500 }
      ),
    };
  }
}
