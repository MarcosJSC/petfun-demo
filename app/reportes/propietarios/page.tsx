"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useSucursalActiva,
} from "@/contexts/SucursalContext";

import {
  usePermisos,
} from "@/hooks/usePermisos";

type PerritoReporte = {
  id: number;
  nombre: string;
  sexo: string | null;
  peso_kg: number | null;

  razas: {
    nombre: string;
  } | null;
};

type PropietarioReporte = {
  id: number;
  nombre: string;
  apellidos: string | null;
  cedula: string | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
sucursal_id: number;
  perritos: PerritoReporte[];
};

export default function ReportePropietariosPage() {

  const {
  sucursalActivaId,
} = useSucursalActiva();

const {
  esSuperadmin,
} = usePermisos();

  const [propietarios, setPropietarios] =
    useState<PropietarioReporte[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [busqueda, setBusqueda] =
    useState("");

    const REGISTROS_POR_PAGINA = 20;

const [
  paginaActual,
  setPaginaActual,
] = useState(1);

 
useEffect(() => {
  async function cargarPropietarios() {
    setCargando(true);

    let consulta =
      supabase
        .from("propietarios")
        .select(`
          id,
          sucursal_id,
          nombre,
          apellidos,
          cedula,
          telefono,
          whatsapp,
          correo,

          perritos (
            id,
            nombre,
            sexo,
            peso_kg,

            razas (
              nombre
            )
          )
        `)
        .order("nombre", {
          ascending: true,
        });

    /*
     * Superadmin:
     * si hay una sucursal activa,
     * filtramos el reporte.
     *
     * null = Todas las sucursales.
     */
    if (
      esSuperadmin &&
      sucursalActivaId !== null
    ) {
      consulta =
        consulta.eq(
          "sucursal_id",
          sucursalActivaId
        );
    }

    const {
      data,
      error,
    } = await consulta;

    if (error) {
      console.error(
        "Error cargando reporte de propietarios:",
        error
      );

      setCargando(false);
      return;
    }

    setPropietarios(
      (data ?? []) as unknown as
        PropietarioReporte[]
    );

    setCargando(false);
  }

  cargarPropietarios();
}, [
  esSuperadmin,
  sucursalActivaId,
]);


  const propietariosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return propietarios;
      }

      return propietarios.filter(
        (propietario) => {
          const nombreCompleto =
            `${propietario.nombre} ${
              propietario.apellidos ?? ""
            }`
              .trim()
              .toLowerCase();

          const datosPropietario =
            `
              ${nombreCompleto}
              ${propietario.cedula ?? ""}
              ${propietario.telefono ?? ""}
              ${propietario.whatsapp ?? ""}
              ${propietario.correo ?? ""}
            `.toLowerCase();

          const coincidePerrito =
            propietario.perritos.some(
              (perrito) =>
                `
                  ${perrito.nombre}
                  ${perrito.razas?.nombre ?? ""}
                  ${perrito.sexo ?? ""}
                `
                  .toLowerCase()
                  .includes(texto)
            );

          return (
            datosPropietario.includes(texto) ||
            coincidePerrito
          );
        }
      );
    }, [
      propietarios,
      busqueda,
    ]);


 const totalPaginas = Math.max(
  1,
  Math.ceil(
    propietariosFiltrados.length /
      REGISTROS_POR_PAGINA
  )
);

const propietariosPaginados =
  useMemo(() => {
    const inicio =
      (paginaActual - 1) *
      REGISTROS_POR_PAGINA;

    const fin =
      inicio +
      REGISTROS_POR_PAGINA;

    return propietariosFiltrados.slice(
      inicio,
      fin
    );
  }, [
    propietariosFiltrados,
    paginaActual,
  ]);

useEffect(() => {
  setPaginaActual(1);
}, [
  busqueda,
  sucursalActivaId,
]);

useEffect(() => {
  if (paginaActual > totalPaginas) {
    setPaginaActual(totalPaginas);
  }
}, [
  paginaActual,
  totalPaginas,
]);
    

  const totalPerritos =
    useMemo(() => {
      return propietariosFiltrados.reduce(
        (total, propietario) =>
          total +
          propietario.perritos.length,
        0
      );
    }, [propietariosFiltrados]);

    function exportarExcel() {
  const encabezados = [
    "Propietario",
    "Cédula",
    "Teléfono",
    "WhatsApp",
    "Correo",
    "Perritos",
  ];

  const filas = propietariosFiltrados.map(
    (propietario) => {
      const nombreCompleto =
        `${propietario.nombre} ${
          propietario.apellidos ?? ""
        }`.trim();

      const perritosTexto =
        propietario.perritos.length === 0
          ? "—"
          : propietario.perritos
              .map((perrito) => {
                const raza =
                  perrito.razas?.nombre || "—";

                const sexo =
                  perrito.sexo || "—";

                const peso =
                  perrito.peso_kg
                    ? `${perrito.peso_kg} kg`
                    : "—";

                return `${perrito.nombre} · ${raza} · ${sexo} · ${peso}`;
              })
              .join("\n");

      return [
        nombreCompleto,
        propietario.cedula || "—",
        propietario.telefono || "—",
        propietario.whatsapp || "—",
        propietario.correo || "—",
        perritosTexto,
      ];
    }
  );

  const hoja =
    XLSX.utils.aoa_to_sheet([
      encabezados,
      ...filas,
    ]);

  hoja["!cols"] = [
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
    { wch: 48 },
  ];

  hoja["!autofilter"] = {
    ref: `A1:F${filas.length + 1}`,
  };

  hoja["!freeze"] = "A2";

  /* Encabezado */
  for (let columna = 0; columna < 6; columna++) {
    const celda =
      XLSX.utils.encode_cell({
        r: 0,
        c: columna,
      });

    if (hoja[celda]) {
      hoja[celda].s = {
        font: {
          bold: true,
          color: {
            rgb: "FFFFFF",
          },
        },

        fill: {
          fgColor: {
            rgb: "60497A",
          },
        },

        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      };
    }
  }

  /* Ajuste de texto y alineación */
  for (
    let fila = 1;
    fila <= filas.length;
    fila++
  ) {
    for (
      let columna = 0;
      columna < 6;
      columna++
    ) {
      const celda =
        XLSX.utils.encode_cell({
          r: fila,
          c: columna,
        });

      if (hoja[celda]) {
        hoja[celda].s = {
          ...(hoja[celda].s || {}),

          alignment: {
            vertical: "top",
            wrapText: true,
          },
        };
      }
    }
  }

  /* Aumentar altura cuando hay varios perritos */
  hoja["!rows"] = [
    { hpt: 22 },
    ...propietariosFiltrados.map(
      (propietario) => ({
        hpt: Math.max(
          22,
          propietario.perritos.length * 18
        ),
      })
    ),
  ];

  /* Hoja resumen */

  const datosResumen = [
    ["PetFunCR"],
    ["Reporte de propietarios y perritos"],
    [],
    [
      "Propietarios",
      propietariosFiltrados.length,
    ],
    [
      "Perritos",
      totalPerritos,
    ],
    [],
    [
      "Filtro de búsqueda",
      busqueda || "Sin filtro",
    ],
  ];

  const hojaResumen =
    XLSX.utils.aoa_to_sheet(
      datosResumen
    );

  hojaResumen["!cols"] = [
    { wch: 24 },
    { wch: 30 },
  ];

  hojaResumen["A1"].s = {
    font: {
      bold: true,
      sz: 18,
    },
  };

  hojaResumen["A2"].s = {
    font: {
      bold: true,
      sz: 14,
    },
  };

  ["A4", "A5", "A7"].forEach(
    (celda) => {
      if (hojaResumen[celda]) {
        hojaResumen[celda].s = {
          font: {
            bold: true,
          },
        };
      }
    }
  );

  const libro =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    libro,
    hojaResumen,
    "Resumen"
  );

  XLSX.utils.book_append_sheet(
    libro,
    hoja,
    "Propietarios"
  );

  XLSX.writeFile(
    libro,
    "reporte-propietarios-petfuncr.xlsx"
  );
}

function exportarPDF() {
  const documento =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

  documento.setFontSize(18);

  documento.text(
    "PetFunCR - Reporte de propietarios y perritos",
    14,
    15
  );

  documento.setFontSize(10);

  documento.text(
    `Propietarios: ${propietariosFiltrados.length}`,
    14,
    23
  );

  documento.text(
    `Perritos: ${totalPerritos}`,
    70,
    23
  );

  if (busqueda) {
    documento.text(
      `Filtro: ${busqueda}`,
      120,
      23
    );
  }

  const filas =
    propietariosFiltrados.map(
      (propietario) => {
        const nombreCompleto =
          `${propietario.nombre} ${
            propietario.apellidos ?? ""
          }`.trim();

        const perritosTexto =
          propietario.perritos.length === 0
            ? "—"
            : propietario.perritos
                .map((perrito) => {
                  const raza =
                    perrito.razas?.nombre || "—";

                  const sexo =
                    perrito.sexo || "—";

                  const peso =
                    perrito.peso_kg
                      ? `${perrito.peso_kg} kg`
                      : "—";

                  return `${perrito.nombre} - ${raza} - ${sexo} - ${peso}`;
                })
                .join("\n");

        return [
          nombreCompleto,
          propietario.cedula || "—",
          propietario.telefono || "—",
          propietario.whatsapp || "—",
          propietario.correo || "—",
          perritosTexto,
        ];
      }
    );

  autoTable(documento, {
    startY: 30,

    head: [[
      "Propietario",
      "Cédula",
      "Teléfono",
      "WhatsApp",
      "Correo",
      "Perritos",
    ]],

    body: filas,

    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "top",
    },

    headStyles: {
      fillColor: [96, 73, 122],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },

    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 28 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 55 },
      5: { cellWidth: 85 },
    },
  });

  documento.save(
    "reporte-propietarios-petfuncr.pdf"
  );
}

/*FIN FUNCIONES*/

  return (/*RETURN PRINCIPAL*/
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Propietarios y perritos
          </h1>

          <p className="page-description">
            Directorio general de propietarios y sus perritos.
          </p>
        </div>
      </div>

      <section
        className="list-card"
        style={{
          marginBottom: "24px",
        }}
      >
        <div className="list-toolbar">
          <div>
            <strong>
              Filtros
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Busca por propietario, cédula o perrito.
            </div>
          </div>

<div className="report-export-actions">
  <button
    type="button"
    className="secondary-button"
    onClick={exportarExcel}
    disabled={
      propietariosFiltrados.length === 0
    }
  >
    📊 Exportar Excel
  </button>

  <button
    type="button"
    className="secondary-button"
    onClick={exportarPDF}
    disabled={
      propietariosFiltrados.length === 0
    }
  >
    📄 Exportar PDF
  </button>
</div>

        </div>

        <div
          style={{
            padding: "20px",
          }}
        >
          <input
            className="form-input"
            placeholder="Buscar por propietario, cédula, teléfono o perrito..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />
        </div>
      </section>

      <div
        className="dashboard-grid report-summary-grid"
        style={{
          marginBottom: "24px",
        }}
      >
        <div className="card">
          <div className="card-label">
            Propietarios
          </div>

          <div className="card-value">
            {propietariosFiltrados.length}
          </div>
        </div>

        <div className="card">
          <div className="card-label">
            Perritos
          </div>

          <div className="card-value">
            {totalPerritos}
          </div>
        </div>
      </div>

      <section className="list-card">
        <div className="list-toolbar">
          <div>
            <strong>
              Directorio
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Total: {propietariosFiltrados.length}
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            Cargando reporte...
          </div>
        ) : propietariosFiltrados.length === 0 ? (
          <div className="empty-state">
            No se encontraron propietarios.
          </div>
        ) : (
          <>
            {/* ESCRITORIO */}
            <div className="desktop-only">
             <div className="table-scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Propietario</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>WhatsApp</th>
                    <th>Correo</th>
                    <th>Perritos</th>
                  </tr>
                </thead>

                <tbody>
                  {propietariosPaginados.map(
                    (propietario) => (
                      <tr key={propietario.id}>
                        <td>
                          <strong>
                            {propietario.nombre}{" "}
                            {propietario.apellidos}
                          </strong>
                        </td>

                        <td>
                          {propietario.cedula || "—"}
                        </td>

                        <td>
                          {propietario.telefono || "—"}
                        </td>

                        <td>
                          {propietario.whatsapp || "—"}
                        </td>

                        <td>
                          {propietario.correo || "—"}
                        </td>

                        <td>
                          {propietario.perritos.length === 0
                            ? "—"
                            : propietario.perritos
                                .map(
                                  (perrito) =>
                                    `${perrito.nombre} (${perrito.razas?.nombre || "—"})`
                                )
                                .join(", ")}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
                </div>
            </div>

            {/* MÓVIL */}
            <div className="mobile-only report-owners-mobile">
              {propietariosPaginados.map(
                (propietario) => (
                  <div
                    key={propietario.id}
                    className="mobile-list-item"
                  >
                    <div className="mobile-list-title">
                      👤 {propietario.nombre}{" "}
                      {propietario.apellidos}
                    </div>

                    <div className="mobile-list-grid">
                      <div>
                        <span className="mobile-list-label">
                          Cédula
                        </span>

                        <strong>
                          {propietario.cedula || "—"}
                        </strong>
                      </div>

                      <div>
                        <span className="mobile-list-label">
                          Teléfono
                        </span>

                        <strong>
                          {propietario.telefono || "—"}
                        </strong>
                      </div>

                      <div>
                        <span className="mobile-list-label">
                          WhatsApp
                        </span>

                        <strong>
                          {propietario.whatsapp || "—"}
                        </strong>
                      </div>

                      <div>
                        <span className="mobile-list-label">
                          Correo
                        </span>

                        <strong>
                          {propietario.correo || "—"}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "14px",
                      }}
                    >
                      <span className="mobile-list-label">
                        Perritos
                      </span>

                      {propietario.perritos.length === 0 ? (
                        <div
                          style={{
                            marginTop: "5px",
                          }}
                        >
                          —
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gap: "6px",
                            marginTop: "6px",
                          }}
                        >
                          {propietario.perritos.map(
                            (perrito) => (
                              <div
                                key={perrito.id}
                              >
                                🐾{" "}
                                <strong>
                                  {perrito.nombre}
                                </strong>
                                {" · "}
                                {perrito.razas?.nombre || "—"}
                                {" · "}
                                {perrito.sexo || "—"}
                                {perrito.peso_kg
                                  ? ` · ${perrito.peso_kg} kg`
                                  : ""}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>


{propietariosFiltrados.length >
  REGISTROS_POR_PAGINA && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "14px",
      padding: "18px",
      borderTop:
        "1px solid var(--color-border)",
    }}
  >
    <button
      type="button"
      className="secondary-button"
      disabled={paginaActual === 1}
      onClick={() =>
        setPaginaActual(
          (pagina) =>
            Math.max(1, pagina - 1)
        )
      }
    >
     🔙
    </button>

    <span
      style={{
        color:
          "var(--color-text-secondary)",
        fontSize: "14px",
      }}
    >
      Página {paginaActual} de{" "}
      {totalPaginas}
    </span>

    <button
      type="button"
      className="secondary-button"
      disabled={
        paginaActual === totalPaginas
      }
      onClick={() =>
        setPaginaActual(
          (pagina) =>
            Math.min(
              totalPaginas,
              pagina + 1
            )
        )
      }
    >
      🔜
    </button>
  </div>
)}


          </>
        )}
      </section>
    </div>
  );
}