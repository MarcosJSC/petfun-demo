import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const rolesPermitidos = [
  "superadmin",
  "administrador",
  "operador",
  "consulta",
] as const;

type RolPermitido =
  (typeof rolesPermitidos)[number];

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * 1. Obtener token del usuario
     *    que está haciendo la petición.
     */
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


    /*
     * 2. Validar el token contra Supabase.
     */
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


    /*
     * 3. Confirmar que quien llama
     *    sea superadministrador activo.
     *
     *    Como usamos service role aquí,
     *    la consulta se realiza de forma
     *    segura en el servidor.
     */
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
            "No tienes permiso para crear usuarios.",
        },
        {
          status: 403,
        }
      );
    }


    /*
     * 4. Leer datos enviados
     *    desde el formulario.
     */
    const body =
      await request.json();

    const nombre =
      String(
        body.nombre || ""
      ).trim();

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body.password || ""
      );

    const rol =
      String(
        body.rol || ""
      ) as RolPermitido;

    const activo =
      body.activo !== false;

    const sucursalIds =
      Array.isArray(
        body.sucursalIds
      )
        ? body.sucursalIds
            .map(Number)
            .filter(
              (id: number) =>
                Number.isInteger(id) &&
                id > 0
            )
        : [];


    /*
     * 5. Validaciones.
     */
    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "El nombre es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "El correo es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password.length < 8
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

    if (
      !rolesPermitidos.includes(
        rol
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Rol no válido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Superadmin no necesita
     * sucursales asignadas.
     */
    if (
      rol !== "superadmin" &&
      sucursalIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Debes asignar al menos una sucursal.",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * 6. Crear usuario en Supabase Auth.
     */
    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .createUser({
          email,
          password,

          /*
           * Por ahora confirmamos
           * automáticamente el correo.
           */
          email_confirm: true,
        });

    if (
      authError ||
      !authData.user
    ) {
      console.error(
        "Error creando Auth user:",
        authError
      );

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "No se pudo crear el usuario.",
        },
        {
          status: 400,
        }
      );
    }

    const nuevoUsuarioId =
      authData.user.id;


    /*
     * 7. Crear perfil.
     */
    const {
      error:
        perfilNuevoError,
    } =
      await supabaseAdmin
        .from(
          "perfiles_usuario"
        )
        .insert({
          usuario_id:
            nuevoUsuarioId,

          nombre,
          rol,
          activo,
        });

    if (perfilNuevoError) {
      console.error(
        "Error creando perfil:",
        perfilNuevoError
      );

      /*
       * Rollback:
       * si falla el perfil,
       * borramos el usuario Auth.
       */
      await supabaseAdmin
        .auth
        .admin
        .deleteUser(
          nuevoUsuarioId
        );

      return NextResponse.json(
        {
          error:
            "No se pudo crear el perfil del usuario.",
        },
        {
          status: 500,
        }
      );
    }


    /*
     * 8. Asignar sucursales.
     */
    if (
      rol !== "superadmin"
    ) {
      const asignaciones =
        sucursalIds.map(
          (sucursalId: number) => ({
            usuario_id:
              nuevoUsuarioId,

            sucursal_id:
              sucursalId,
          })
        );

      const {
        error:
          asignacionesError,
      } =
        await supabaseAdmin
          .from(
            "usuario_sucursales"
          )
          .insert(
            asignaciones
          );

      if (
        asignacionesError
      ) {
        console.error(
          "Error asignando sucursales:",
          asignacionesError
        );

        /*
         * Rollback.
         */
        await supabaseAdmin
          .from(
            "perfiles_usuario"
          )
          .delete()
          .eq(
            "usuario_id",
            nuevoUsuarioId
          );

        await supabaseAdmin
          .auth
          .admin
          .deleteUser(
            nuevoUsuarioId
          );

        return NextResponse.json(
          {
            error:
              "No se pudieron asignar las sucursales.",
          },
          {
            status: 500,
          }
        );
      }
    }


    /*
     * 9. Todo salió bien.
     */
    return NextResponse.json(
      {
        ok: true,

        usuario: {
          id:
            nuevoUsuarioId,
          nombre,
          email,
          rol,
          activo,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "Error inesperado creando usuario:",
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


export async function PATCH(
  request: NextRequest
) {
  try {
    /*
     * 1. Obtener token.
     */
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
          error: "No autorizado.",
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

    /*
     * 2. Validar sesión.
     */
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
          error: "Sesión inválida.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * 3. Verificar superadmin.
     */
    const {
      data: perfilActual,
      error: errorPerfil,
    } =
      await supabaseAdmin
        .from("perfiles_usuario")
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
            "No tienes permiso para editar usuarios.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 4. Leer datos.
     */
    const body =
      await request.json();

    const usuarioId =
      String(
        body.usuarioId || ""
      ).trim();

    const nombre =
      String(
        body.nombre || ""
      ).trim();

    const rol =
      String(
        body.rol || ""
      ) as RolPermitido;

    const activo =
      body.activo !== false;

    const sucursalIds =
      Array.isArray(
        body.sucursalIds
      )
        ? body.sucursalIds
            .map(Number)
            .filter(
              (id: number) =>
                Number.isInteger(id) &&
                id > 0
            )
        : [];

    /*
     * 5. Validaciones.
     */
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

    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "El nombre es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !rolesPermitidos.includes(
        rol
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Rol no válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      rol !== "superadmin" &&
      sucursalIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Debes asignar al menos una sucursal.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 6. Actualizar perfil.
     */
    const {
      error: errorActualizarPerfil,
    } =
      await supabaseAdmin
        .from("perfiles_usuario")
        .update({
          nombre,
          rol,
          activo,
        })
        .eq(
          "usuario_id",
          usuarioId
        );

    if (errorActualizarPerfil) {
      console.error(
        "Error actualizando perfil:",
        errorActualizarPerfil
      );

      return NextResponse.json(
        {
          error:
            "No se pudo actualizar el usuario.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 7. Eliminar asignaciones
     *    anteriores.
     */
    const {
      error:
        errorEliminarSucursales,
    } =
      await supabaseAdmin
        .from("usuario_sucursales")
        .delete()
        .eq(
          "usuario_id",
          usuarioId
        );

    if (errorEliminarSucursales) {
      console.error(
        "Error eliminando asignaciones:",
        errorEliminarSucursales
      );

      return NextResponse.json(
        {
          error:
            "El usuario fue actualizado, pero no se pudieron actualizar sus sucursales.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 8. Crear las nuevas
     *    asignaciones.
     *
     * Superadmin no necesita
     * sucursales.
     */
    if (
      rol !== "superadmin"
    ) {
      const asignaciones =
        sucursalIds.map(
          (sucursalId: number) => ({
            usuario_id:
              usuarioId,

            sucursal_id:
              sucursalId,
          })
        );

      const {
        error:
          errorNuevasSucursales,
      } =
        await supabaseAdmin
          .from(
            "usuario_sucursales"
          )
          .insert(
            asignaciones
          );

      if (
        errorNuevasSucursales
      ) {
        console.error(
          "Error asignando nuevas sucursales:",
          errorNuevasSucursales
        );

        return NextResponse.json(
          {
            error:
              "El usuario fue actualizado, pero no se pudieron guardar sus nuevas sucursales.",
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * 9. Listo.
     */
    return NextResponse.json({
      ok: true,

      usuario: {
        usuario_id:
          usuarioId,

        nombre,
        rol,
        activo,

        sucursalIds:
          rol === "superadmin"
            ? []
            : sucursalIds,
      },
    });

  } catch (error) {
    console.error(
      "Error inesperado editando usuario:",
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
