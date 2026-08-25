"use client";

import Link from "next/link";

export default function ReportesPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Reportes
          </h1>

          <p className="page-description">
            Consulta, filtra y exporta información de PetFunCR.
          </p>
        </div>
      </div>

      <div className="dashboard-grid reports-menu-grid">

        <Link
          href="/reportes/estadias"
          className="card report-menu-card"
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "12px",
            }}
          >
            🏨
          </div>

          <h2
            style={{
              margin: "0 0 8px",
            }}
          >
            Reporte de estadías
          </h2>

          <p
            style={{
              margin: 0,
              color:
                "var(--color-text-secondary)",
            }}
          >
            Filtra estadías por fecha, tipo,
            estado y pago. Consulta totales y
            exporta a Excel o PDF.
          </p>

          <div
            style={{
              marginTop: "18px",
              color: "var(--color-primary)",
              fontWeight: 600,
            }}
          >
            Abrir reporte →
          </div>
        </Link>


        <Link
          href="/reportes/propietarios"
          className="card report-menu-card"
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
            Propietarios y perritos
          </h2>

          <p
            style={{
              margin: 0,
              color:
                "var(--color-text-secondary)",
            }}
          >
            Directorio general de propietarios
            y sus perritos con los datos más
            importantes.
          </p>

          <div
            style={{
              marginTop: "18px",
              color: "var(--color-primary)",
              fontWeight: 600,
            }}
          >
            Abrir reporte →
          </div>
        </Link>

      </div>
    </div>
  );
}