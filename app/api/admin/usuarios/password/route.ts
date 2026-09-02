import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseAdmin";


export async function POST(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }


    const token =
      authorization.replace(
        "Bearer ",
        ""
      );


    const {
      data: {
        user: usuarioActual,
      },
      error: errorUsuario,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      errorUsuario ||
      !usuarioActual
    ) {
      return NextResponse.json(
        {
          error:
            "Sesión inválida.",
        },
        {
          status: 401,
        }
      );
    }


    const {
      data: perfilActual,
      error: errorPerfil,
    } =
      await supabaseAdmin
        .from(
          "perfiles_usuario"
        )
        .select(`
          usuario_id,
          rol,
          activo
        `)
        .eq(
          "usuario_id",
          usuarioActual.id
        )
        .single();

    if (
      errorPerfil ||
      !perfilActual ||
      perfilActual.rol !==
        "superadmin" ||
      !perfilActual.activo
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para restablecer contraseñas.",
        },
        {
          status: 403,
        }
      );
    }


    const body =
      await request.json();

    const usuarioId =
      String(
        body.usuarioId || ""
      ).trim();

    const nuevaPassword =
      String(
        body.nuevaPassword || ""
      );


    if (!usuarioId) {
      return NextResponse.json(
        {
          error:
            "El usuario es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }


    if (
      nuevaPassword.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * Evitamos que el superadmin
     * cambie su propia contraseña
     * desde Administración.
     */
    if (
      usuarioId ===
      usuarioActual.id
    ) {
      return NextResponse.json(
        {
          error:
            "Para cambiar tu propia contraseña utiliza la opción de Mi cuenta.",
        },
        {
          status: 400,
        }
      );
    }


    const {
      error:
        errorActualizarPassword,
    } =
      await supabaseAdmin
        .auth
        .admin
        .updateUserById(
          usuarioId,
          {
            password:
              nuevaPassword,
          }
        );


    if (
      errorActualizarPassword
    ) {
      console.error(
        "Error actualizando contraseña:",
        errorActualizarPassword
      );

      return NextResponse.json(
        {
          error:
            errorActualizarPassword.message ||
            "No se pudo restablecer la contraseña.",
        },
        {
          status: 400,
        }
      );
    }


    return NextResponse.json(
      {
        ok: true,
      }
    );

  } catch (error) {
    console.error(
      "Error inesperado restableciendo contraseña:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado.",
      },
      {
        status: 500,
      }
    );
  }
}