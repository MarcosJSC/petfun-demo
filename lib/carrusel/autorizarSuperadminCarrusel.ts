import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type UsuarioSuperadminCarrusel = {
  usuarioId: string;
  rol: "superadmin";
};

type ResultadoAutorizacionCarrusel =
  | {
      autorizado: true;
      usuario: UsuarioSuperadminCarrusel;
    }
  | {
      autorizado: false;
      respuesta: NextResponse;
    };

/**
 * Autoriza exclusivamente a usuarios autenticados cuyo perfil esté activo
 * y tenga el rol superadmin. Debe usarse solo desde Route Handlers del servidor.
 */
export async function autorizarSuperadminCarrusel(
  request: NextRequest
): Promise<ResultadoAutorizacionCarrusel> {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "No autorizado." },
          { status: 401, headers: { "Cache-Control": "no-store" } }
        ),
      };
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "No autorizado." },
          { status: 401, headers: { "Cache-Control": "no-store" } }
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
          { status: 401, headers: { "Cache-Control": "no-store" } }
        ),
      };
    }

    const { data: perfil, error: errorPerfil } = await supabaseAdmin
      .from("perfiles_usuario")
      .select("usuario_id, rol, activo")
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (errorPerfil) {
      console.error(
        "Error verificando perfil para administrar el carrusel:",
        errorPerfil.message
      );

      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "No se pudo verificar la autorización." },
          { status: 500, headers: { "Cache-Control": "no-store" } }
        ),
      };
    }

    if (!perfil || perfil.activo !== true || perfil.rol !== "superadmin") {
      return {
        autorizado: false,
        respuesta: NextResponse.json(
          { error: "Solo el superadministrador puede administrar el carrusel." },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        ),
      };
    }

    return {
      autorizado: true,
      usuario: {
        usuarioId: user.id,
        rol: "superadmin",
      },
    };
  } catch (error) {
    console.error(
      "Error inesperado verificando autorización del carrusel:",
      error instanceof Error ? error.message : error
    );

    return {
      autorizado: false,
      respuesta: NextResponse.json(
        { error: "No se pudo verificar la autorización." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      ),
    };
  }
}
