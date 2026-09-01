export type RolUsuario =
  | "superadmin"
  | "administrador"
  | "operador"
  | "consulta";

export type Permiso =
  | "propietarios.ver"
  | "propietarios.crear"
  | "propietarios.editar"
  | "propietarios.eliminar"

  | "perritos.ver"
  | "perritos.crear"
  | "perritos.editar"
  | "perritos.eliminar"

  | "estadias.ver"
  | "estadias.crear"
  | "estadias.editar"
  | "estadias.eliminar"

  | "vacunas.ver"
  | "vacunas.crear"
  | "vacunas.editar"
  | "vacunas.eliminar"

  | "desparasitaciones.ver"
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
  "propietarios.ver",
  "propietarios.crear",
  "propietarios.editar",
  "propietarios.eliminar",

  "perritos.ver",
  "perritos.crear",
  "perritos.editar",
  "perritos.eliminar",

  "estadias.ver",
  "estadias.crear",
  "estadias.editar",
  "estadias.eliminar",

  "vacunas.ver",
  "vacunas.crear",
  "vacunas.editar",
  "vacunas.eliminar",

  "desparasitaciones.ver",
  "desparasitaciones.crear",
  "desparasitaciones.editar",
  "desparasitaciones.eliminar",

  "reportes.ver",
  "configuracion.ver",
  "usuarios.administrar",
  "sucursales.administrar",
],

administrador: [
  "propietarios.ver",
  "propietarios.crear",
  "propietarios.editar",
  "propietarios.eliminar",

  "perritos.ver",
  "perritos.crear",
  "perritos.editar",
  "perritos.eliminar",

  "estadias.ver",
  "estadias.crear",
  "estadias.editar",
  "estadias.eliminar",

  "vacunas.ver",
  "vacunas.crear",
  "vacunas.editar",
  "vacunas.eliminar",

  "desparasitaciones.ver",
  "desparasitaciones.crear",
  "desparasitaciones.editar",
  "desparasitaciones.eliminar",

  "reportes.ver",
],

operador: [
  "propietarios.ver",
  "propietarios.crear",
  "propietarios.editar",

  "perritos.ver",
  "perritos.crear",
  "perritos.editar",

  "estadias.ver",
  "estadias.crear",
  "estadias.editar",

  "vacunas.ver",
  "vacunas.crear",
  "vacunas.editar",

  "desparasitaciones.ver",
  "desparasitaciones.crear",
  "desparasitaciones.editar",

  "reportes.ver",
],

consulta: [
  "propietarios.ver",
  "perritos.ver",
  "estadias.ver",
  "vacunas.ver",
  "desparasitaciones.ver",

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