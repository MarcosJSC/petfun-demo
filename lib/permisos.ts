export type RolUsuario =
  | "superadmin"
  | "administrador"
  | "operador"
  | "consulta";

export type Permiso =
  | "propietarios.crear"
  | "propietarios.editar"
  | "propietarios.eliminar"

  | "perritos.crear"
  | "perritos.editar"
  | "perritos.eliminar"

  | "estadias.crear"
  | "estadias.editar"
  | "estadias.eliminar"

  | "vacunas.crear"
  | "vacunas.editar"
  | "vacunas.eliminar"

  | "desparasitaciones.crear"
  | "desparasitaciones.editar"
  | "desparasitaciones.eliminar"

  | "reportes.ver"
  | "configuracion.ver"
  | "usuarios.administrar"
  | "sucursales.administrar";


const permisosPorRol: Record<
  RolUsuario,
  Permiso[]
> = {
  superadmin: [
    "propietarios.crear",
    "propietarios.editar",
    "propietarios.eliminar",

    "perritos.crear",
    "perritos.editar",
    "perritos.eliminar",

    "estadias.crear",
    "estadias.editar",
    "estadias.eliminar",

    "vacunas.crear",
    "vacunas.editar",
    "vacunas.eliminar",

    "desparasitaciones.crear",
    "desparasitaciones.editar",
    "desparasitaciones.eliminar",

    "reportes.ver",
    "configuracion.ver",
    "usuarios.administrar",
    "sucursales.administrar",
  ],

  administrador: [
    "propietarios.crear",
    "propietarios.editar",

    "perritos.crear",
    "perritos.editar",

    "estadias.crear",
    "estadias.editar",
    "estadias.eliminar",

    "vacunas.crear",
    "vacunas.editar",
    "vacunas.eliminar",

    "desparasitaciones.crear",
    "desparasitaciones.editar",
    "desparasitaciones.eliminar",

    "reportes.ver",
  ],

  operador: [
    "propietarios.crear",
    "propietarios.editar",

    "perritos.crear",
    "perritos.editar",

    "estadias.crear",
    "estadias.editar",

    "vacunas.crear",
    "vacunas.editar",

    "desparasitaciones.crear",
    "desparasitaciones.editar",

    "reportes.ver",
  ],

  consulta: [
    "reportes.ver",
  ],
};


export function tienePermiso(
  rol: RolUsuario | null,
  permiso: Permiso
) {
  if (!rol) {
    return false;
  }

  return permisosPorRol[
    rol
  ].includes(permiso);
}