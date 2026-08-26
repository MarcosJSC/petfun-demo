import { supabase } from "@/lib/supabase";

type SucursalUsuario = {
  id: number;
  nombre: string;
  activa: boolean;
};

type ContextoSucursal = {
  rol: string;
  sucursalActivaId: number | null;
  sucursales: SucursalUsuario[];
};

export async function obtenerContextoSucursal():
  Promise<ContextoSucursal> {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      rol: "",
      sucursalActivaId: null,
      sucursales: [],
    };
  }

  const { data: perfil, error: errorPerfil } =
    await supabase
      .from("perfiles_usuario")
      .select(`
        rol,
        activo
      `)
      .eq("usuario_id", user.id)
      .single();

  if (
    errorPerfil ||
    !perfil ||
    !perfil.activo
  ) {
    return {
      rol: "",
      sucursalActivaId: null,
      sucursales: [],
    };
  }

  /*
   * SUPERADMIN:
   * puede trabajar con todas las sucursales activas.
   */
  if (perfil.rol === "superadmin") {
    const { data: sucursalesData } =
      await supabase
        .from("sucursales")
        .select(`
          id,
          nombre,
          activa
        `)
        .eq("activa", true)
        .order("id", {
          ascending: true,
        });

    const sucursales =
      (sucursalesData ?? []) as
        SucursalUsuario[];

    return {
      rol: perfil.rol,

      /*
       * Por ahora usamos la primera
       * sucursal activa como predeterminada.
       *
       * Luego agregaremos un selector
       * para que el superadmin cambie
       * de sucursal.
       */
      sucursalActivaId:
        sucursales.length > 0
          ? sucursales[0].id
          : null,

      sucursales,
    };
  }

  /*
   * USUARIOS NORMALES:
   * solo sus sucursales asignadas.
   */
  const { data: relaciones } =
    await supabase
      .from("usuario_sucursales")
      .select(`
        sucursal_id,

        sucursales (
          id,
          nombre,
          activa
        )
      `)
      .eq("usuario_id", user.id);

  const sucursales =
    (relaciones ?? [])
      .map((relacion: any) =>
        relacion.sucursales
      )
      .filter(
        (sucursal: any) =>
          sucursal &&
          sucursal.activa
      ) as SucursalUsuario[];

  return {
    rol: perfil.rol,

    sucursalActivaId:
      sucursales.length > 0
        ? sucursales[0].id
        : null,

    sucursales,
  };
}