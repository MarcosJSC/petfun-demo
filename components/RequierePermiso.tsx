"use client";

import { useRouter } from "next/navigation";

import {
  usePermisos,
} from "@/hooks/usePermisos";

import type {
  Permiso,
} from "@/lib/permisos";

export function RequierePermiso({
  permiso,
  children,
}: {
  permiso: Permiso;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    puede,
    cargandoRol,
  } = usePermisos();

  if (cargandoRol) {
    return (
      <div className="empty-state">
        Cargando permisos...
      </div>
    );
  }

  if (!puede(permiso)) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">
              🔐 Acceso restringido
            </h1>

            <p className="page-description">
              No tienes permiso para consultar esta sección.
            </p>
          </div>
        </div>

        <section className="card">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              router.push("/")
            }
          >
            ← Volver al inicio
          </button>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}