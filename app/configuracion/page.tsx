"use client";

import Link from "next/link";

export default function ConfiguracionPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Configuración
          </h1>

          <p className="page-description">
            Administra sucursales, usuarios,
            permisos y opciones generales de PetFunCR.
          </p>
        </div>
      </div>

      <div className="dashboard-grid config-menu-grid">

        <Link
          href="/configuracion/sucursales"
          className="card config-menu-card"
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "12px",
            }}
          >
            🏢
          </div>

          <h2
            style={{
              margin: "0 0 8px",
            }}
          >
            Sucursales
          </h2>

          <p
            style={{
              margin: 0,
              color:
                "var(--color-text-secondary)",
            }}
          >
            Crea y administra las sucursales
            de PetFunCR.
          </p>

          <div className="config-menu-link">
            Administrar sucursales →
          </div>
        </Link>


        <Link
          href="/configuracion/usuarios"
          className="card config-menu-card"
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "12px",
            }}
          >
            👥
          </div>

          <h2
            style={{
              margin: "0 0 8px",
            }}
          >
            Usuarios
          </h2>

          <p
            style={{
              margin: 0,
              color:
                "var(--color-text-secondary)",
            }}
          >
            Administra accesos, usuarios,
            roles y sucursales asignadas.
          </p>

          <div className="config-menu-link">
            Administrar usuarios →
          </div>
        </Link>


        <Link
          href="/configuracion/permisos"
          className="card config-menu-card"
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "12px",
            }}
          >
            🔐
          </div>

          <h2
            style={{
              margin: "0 0 8px",
            }}
          >
            Roles y permisos
          </h2>

          <p
            style={{
              margin: 0,
              color:
                "var(--color-text-secondary)",
            }}
          >
            Define qué acciones puede realizar
            cada tipo de usuario.
          </p>

          <div className="config-menu-link">
            Configurar permisos →
          </div>
        </Link>

      </div>
    </div>
  );
}