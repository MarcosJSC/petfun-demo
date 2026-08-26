"use client";

import {
  tienePermiso,
  type Permiso,
} from "@/lib/permisos";

import {
  useRolUsuario,
} from "@/hooks/useRolUsuario";


export function usePermisos() {
  const {
    rol,
    cargandoRol,
  } =
    useRolUsuario();


  function puede(
    permiso: Permiso
  ) {
    return tienePermiso(
      rol,
      permiso
    );
  }


  return {
    rol,
    cargandoRol,
    puede,

    esSuperadmin:
      rol === "superadmin",

    esAdministrador:
      rol === "administrador",

    esOperador:
      rol === "operador",

    esConsulta:
      rol === "consulta",
  };
}