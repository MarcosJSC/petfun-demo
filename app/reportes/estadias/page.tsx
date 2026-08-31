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

type EstadiaReporte = {
  id: number;
  sucursal_id: number;
  fecha_entrada: string;
  fecha_salida: string;

  dias_hotel: number;
  dias_guarderia: number;

  total: number;
  monto_pagado: number;

  perritos: {
    nombre: string;
    propietarios: {
      nombre: string;
      apellidos: string | null;
    } | null;
  } | null;

  tipos_estadia: {
    nombre: string;
  } | null;

  estados_estadia: {
    nombre: string;
  } | null;

  estados_pago: {
    nombre: string;
  } | null;
};

export default function ReportesPage() {

  const {
  sucursalActivaId,
} = useSucursalActiva();

const {
  esSuperadmin,
} = usePermisos();

  const [estadias, setEstadias] =
    useState<EstadiaReporte[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [busqueda, setBusqueda] =
    useState("");

  const [fechaDesde, setFechaDesde] =
    useState("");

  const [fechaHasta, setFechaHasta] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [estado, setEstado] =
    useState("");

  const [estadoPago, setEstadoPago] =
    useState("");

const REGISTROS_POR_PAGINA = 20;

const [
  paginaActual,
  setPaginaActual,
] = useState(1);

 
useEffect(() => {
  async function cargarEstadias() {
    setCargando(true);

    let consulta =
      supabase
        .from("estadias")
        .select(`
          id,
          sucursal_id,
          fecha_entrada,
          fecha_salida,
          dias_hotel,
          dias_guarderia,
          total,
          monto_pagado,

          perritos (
            nombre,
            propietarios (
              nombre,
              apellidos
            )
          ),

          tipos_estadia (
            nombre
          ),

          estados_estadia (
            nombre
          ),

          estados_pago (
            nombre
          )
        `)
        .order(
          "fecha_entrada",
          { ascending: false }
        );

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
        "Error cargando reporte:",
        error
      );

      setCargando(false);
      return;
    }

    setEstadias(
      (data ?? []) as unknown as
        EstadiaReporte[]
    );

    setCargando(false);
  }

  cargarEstadias();
}, [
  esSuperadmin,
  sucursalActivaId,
]);

const estadiasFiltradas =
  useMemo(() => {
    const texto =
      busqueda
        .trim()
        .toLowerCase();

    return estadias.filter(
      (estadia) => {
        const nombrePerrito =
          estadia.perritos?.nombre
            ?.toLowerCase() || "";

        const propietario =
          `${
            estadia.perritos
              ?.propietarios
              ?.nombre || ""
          } ${
            estadia.perritos
              ?.propietarios
              ?.apellidos || ""
          }`
            .trim()
            .toLowerCase();

        const coincideBusqueda =
          !texto ||
          nombrePerrito.includes(texto) ||
          propietario.includes(texto);

        const coincideDesde =
          !fechaDesde ||
          estadia.fecha_entrada >=
            fechaDesde;

        const coincideHasta =
          !fechaHasta ||
          estadia.fecha_entrada <=
            fechaHasta;

        const coincideTipo =
          !tipo ||
          estadia.tipos_estadia
            ?.nombre === tipo;

        const coincideEstado =
          !estado ||
          estadia.estados_estadia
            ?.nombre === estado;

        const coincidePago =
          !estadoPago ||
          estadia.estados_pago
            ?.nombre === estadoPago;

           return (
          coincideBusqueda &&
          coincideDesde &&
          coincideHasta &&
          coincideTipo &&
          coincideEstado &&
          coincidePago
        );
      }
    );
  }, [
    estadias,
    busqueda,
    fechaDesde,
    fechaHasta,
    tipo,
    estado,
    estadoPago,
  ]); 


       const totalPaginas = Math.max(
  1,
  Math.ceil(
    estadiasFiltradas.length /
      REGISTROS_POR_PAGINA
  )
);


const estadiasPaginadas =
  useMemo(() => {
    const inicio =
      (paginaActual - 1) *
      REGISTROS_POR_PAGINA;

    const fin =
      inicio +
      REGISTROS_POR_PAGINA;

    return estadiasFiltradas.slice(
      inicio,
      fin
    );
  }, [
    estadiasFiltradas,
    paginaActual,
  ]);



useEffect(() => {
  setPaginaActual(1);
}, [
  busqueda,
  fechaDesde,
  fechaHasta,
  tipo,
  estado,
  estadoPago,
  sucursalActivaId,
]);

useEffect(() => {
  if (
    paginaActual > totalPaginas
  ) {
    setPaginaActual(
      totalPaginas
    );
  }
}, [
  paginaActual,
  totalPaginas,
]);

const resumen = useMemo(() => {
  return estadiasFiltradas.reduce(
    (acumulado, estadia) => {
      const total =
        Number(estadia.total) || 0;

      const pagado =
        Number(estadia.monto_pagado) || 0;

      acumulado.total += total;
      acumulado.pagado += pagado;
      acumulado.saldo +=
        total - pagado;

      return acumulado;
    },
    {
      total: 0,
      pagado: 0,
      saldo: 0,
    }
  );
}, [estadiasFiltradas]);

function formatearColones(
  monto: number
) {
  return new Intl.NumberFormat(
    "es-CR",
    {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }
  ).format(monto);
}

function formatearFecha(
  fecha: string | null
) {
  if (!fecha) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-CR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(
    new Date(`${fecha}T00:00:00`)
  );
}

function exportarExcel() {
  const filas = estadiasFiltradas.map((estadia) => {
    const saldo =
      Number(estadia.total || 0) -
      Number(estadia.monto_pagado || 0);

    const propietario =
      estadia.perritos?.propietarios
        ? `${estadia.perritos.propietarios.nombre} ${
            estadia.perritos.propietarios.apellidos ?? ""
          }`.trim()
        : "";

    return [
      estadia.perritos?.nombre || "",
      propietario,
      estadia.tipos_estadia?.nombre || "",
      formatearFecha(estadia.fecha_entrada),
      formatearFecha(estadia.fecha_salida),
      estadia.dias_hotel,
      estadia.dias_guarderia,
      estadia.estados_estadia?.nombre || "",
      estadia.estados_pago?.nombre || "",
      Number(estadia.total || 0),
      Number(estadia.monto_pagado || 0),
      saldo,
    ];
  });

  const encabezados = [
    "Perrito",
    "Propietario",
    "Tipo",
    "Entrada",
    "Salida",
    "Días Hotel",
    "Días Guardería",
    "Estado",
    "Estado de pago",
    "Total",
    "Pagado",
    "Saldo",
  ];

  const hoja =
    XLSX.utils.aoa_to_sheet([
      encabezados,
      ...filas,
    ]);

  /* Anchos de columnas */
  hoja["!cols"] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 15 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];

  /* Autofiltro */
  hoja["!autofilter"] = {
    ref: `A1:L${filas.length + 1}`,
  };

  /* Congelar primera fila */
  hoja["!freeze"] = "A2";

  /* Estilo del encabezado */
  for (let columna = 0; columna < 12; columna++) {
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

  /* Formato numérico CRC */
  for (
    let fila = 1;
    fila <= filas.length;
    fila++
  ) {
    [9, 10, 11].forEach(
      (columna) => {
        const celda =
          XLSX.utils.encode_cell({
            r: fila,
            c: columna,
          });

        if (hoja[celda]) {
          hoja[celda].z =
            '#,##0" CRC"';

          hoja[celda].s = {
            ...(hoja[celda].s || {}),

            numFmt:
              '#,##0" CRC"',
          };
        }
      }
    );
  }

  /* HOJA RESUMEN */

  const periodoDesde =
    fechaDesde
      ? formatearFecha(fechaDesde)
      : "Todas";

  const periodoHasta =
    fechaHasta
      ? formatearFecha(fechaHasta)
      : "Todas";

  const datosResumen = [
    ["PetFunCR"],
    ["Reporte de estadías"],
    [],
    ["Desde", periodoDesde],
    ["Hasta", periodoHasta],
    ["Tipo", tipo || "Todos"],
    ["Estado", estado || "Todos"],
    [
      "Estado de pago",
      estadoPago || "Todos",
    ],
    [],
    [
      "Cantidad de estadías",
      estadiasFiltradas.length,
    ],
    [
      "Total facturado",
      resumen.total,
    ],
    [
      "Monto pagado",
      resumen.pagado,
    ],
    [
      "Saldo pendiente",
      resumen.saldo,
    ],
  ];

  const hojaResumen =
    XLSX.utils.aoa_to_sheet(
      datosResumen
    );

  hojaResumen["!cols"] = [
    { wch: 24 },
    { wch: 24 },
  ];

  /* Título */
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

  /* Etiquetas */
  for (
    let fila = 3;
    fila <= 12;
    fila++
  ) {
    const celda = `A${fila + 1}`;

    if (hojaResumen[celda]) {
      hojaResumen[celda].s = {
        font: {
          bold: true,
        },
      };
    }
  }

  /* Moneda del resumen */
  ["B11", "B12", "B13"].forEach(
    (celda) => {
      if (hojaResumen[celda]) {
        hojaResumen[celda].s = {
          numFmt:
            '#,##0" CRC"',
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
    "Estadías"
  );

  XLSX.writeFile(
    libro,
    "reporte-estadias-petfuncr.xlsx"
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
    "PetFunCR - Reporte de estadías",
    14,
    15
  );

  documento.setFontSize(10);

  let periodo = "Todas las fechas";

  if (fechaDesde || fechaHasta) {
    periodo = `${fechaDesde
      ? formatearFecha(fechaDesde)
      : "Inicio"} - ${
      fechaHasta
        ? formatearFecha(fechaHasta)
        : "Hoy"
    }`;
  }

  documento.text(
    `Período: ${periodo}`,
    14,
    22
  );

  documento.text(
    `Estadías: ${estadiasFiltradas.length}`,
    14,
    28
  );

  documento.text(
    `Total facturado: ${formatearCRC(
      resumen.total
    )}`,
    65,
    28
  );

  documento.text(
    `Pagado: ${formatearCRC(
      resumen.pagado
    )}`,
    135,
    28
  );

  documento.text(
    `Saldo: ${formatearCRC(
      resumen.saldo
    )}`,
    195,
    28
  );

  const filas =
    estadiasFiltradas.map((estadia) => {
      const saldo =
        Number(estadia.total || 0) -
        Number(estadia.monto_pagado || 0);

      const propietario =
        estadia.perritos?.propietarios
          ? `${estadia.perritos.propietarios.nombre} ${
              estadia.perritos.propietarios.apellidos ?? ""
            }`.trim()
          : "—";

      return [
        estadia.perritos?.nombre || "—",
        propietario,
        estadia.tipos_estadia?.nombre || "—",
        formatearFecha(
          estadia.fecha_entrada
        ),
        formatearFecha(
          estadia.fecha_salida
        ),
        estadia.estados_estadia?.nombre ||
          "—",
        estadia.estados_pago?.nombre ||
          "—",
        formatearCRC(
          Number(estadia.total || 0)
        ),
        formatearCRC(saldo),
      ];
    });

  autoTable(documento, {
    startY: 35,

    head: [[
      "Perrito",
      "Propietario",
      "Tipo",
      "Entrada",
      "Salida",
      "Estado",
      "Pago",
      "Total",
      "Saldo",
    ]],

    body: filas,

    styles: {
      fontSize: 8,
      cellPadding: 2,
    },

    headStyles: {
      fontStyle: "bold",
    },
  });

  documento.save(
    "reporte-estadias-petfuncr.pdf"
  );
}

function formatearCRC(
  monto: number
) {
  return `CRC ${new Intl.NumberFormat(
    "es-CR",
    {
      maximumFractionDigits: 0,
    }
  ).format(monto)}`;
}

/*FIN FUNCIONES*/

return (
  <div>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          Reportes
        </h1>

        <p className="page-description">
          Consulta y análisis de información de PetFunCR.
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
            Reporte de estadías
          </strong>

          <div
            style={{
              color:
                "var(--color-text-secondary)",
              fontSize: "14px",
              marginTop: "3px",
            }}
          >
            Filtra las estadías y revisa sus totales.
          </div>
        </div>

<div
  className="report-export-actions"
>
  <button
    type="button"
    className="secondary-button"
    onClick={exportarExcel}
    disabled={
      estadiasFiltradas.length === 0
    }
  >
    📊 Exportar Excel
  </button>

  <button
    type="button"
    className="secondary-button"
    onClick={exportarPDF}
    disabled={
      estadiasFiltradas.length === 0
    }
  >
    📄 Exportar PDF
  </button>
</div>

     </div>

      <div
        style={{
          padding: "20px",
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "14px",
        }}
        className="report-filters"
      >
        <div className="form-group">
          <label className="form-label">
            Buscar
          </label>

          <input
            className="form-input"
            placeholder="Perrito o propietario..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Desde
          </label>

          <input
            className="form-input"
            type="date"
            value={fechaDesde}
            onChange={(e) =>
              setFechaDesde(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Hasta
          </label>

          <input
            className="form-input"
            type="date"
            value={fechaHasta}
            onChange={(e) =>
              setFechaHasta(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Tipo
          </label>

          <select
            className="form-input"
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value)
            }
          >
            <option value="">
              Todos
            </option>
            <option value="Hotel">
              Hotel
            </option>
            <option value="Guardería">
              Guardería
            </option>
            <option value="Mixta">
              Mixta
            </option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Estado
          </label>

          <select
            className="form-input"
            value={estado}
            onChange={(e) =>
              setEstado(e.target.value)
            }
          >
            <option value="">
              Todos
            </option>
            <option value="Reservada">
              Reservada
            </option>
            <option value="En curso">
              En curso
            </option>
            <option value="Finalizada">
              Finalizada
            </option>
            <option value="Cancelada">
              Cancelada
            </option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Estado de pago
          </label>

          <select
            className="form-input"
            value={estadoPago}
            onChange={(e) =>
              setEstadoPago(e.target.value)
            }
          >
            <option value="">
              Todos
            </option>
            <option value="Pendiente">
              Pendiente
            </option>
            <option value="Pagado">
              Pagado
            </option>
          </select>
        </div>
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
          Estadías
        </div>

        <div className="card-value">
          {estadiasFiltradas.length}
        </div>
      </div>

      <div className="card">
        <div className="card-label">
          Total facturado
        </div>

        <strong>
          {formatearColones(
            resumen.total
          )}
        </strong>
      </div>

      <div className="card">
        <div className="card-label">
          Monto pagado
        </div>

        <strong>
          {formatearColones(
            resumen.pagado
          )}
        </strong>
      </div>

      <div className="card">
        <div className="card-label">
          Saldo pendiente
        </div>

        <strong
          style={{
            color:
              resumen.saldo > 0
                ? "var(--color-danger)"
                : "var(--color-success)",
          }}
        >
          {formatearColones(
            resumen.saldo
          )}
        </strong>
      </div>
    </div>

    <section className="list-card">
      <div className="list-toolbar">
        <div>
          <strong>
            Estadías encontradas
          </strong>

          <div
            style={{
              color:
                "var(--color-text-secondary)",
              fontSize: "14px",
              marginTop: "3px",
            }}
          >
            Total: {estadiasFiltradas.length}
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="empty-state">
          Cargando reporte...
        </div>
      ) : estadiasFiltradas.length === 0 ? (
        <div className="empty-state">
          No se encontraron estadías.
        </div>
      ) : (
     

        <>
  {/* ESCRITORIO */}
  <div className="desktop-only">
    <table className="data-table">
      <thead>
        <tr>
          <th>Perrito</th>
          <th>Propietario</th>
          <th>Tipo</th>
          <th>Entrada</th>
          <th>Salida</th>
          <th>Estado</th>
          <th>Pago</th>
          <th>Total</th>
          <th>Pagado</th>
          <th>Saldo</th>
        </tr>
      </thead>

      <tbody>
        {estadiasPaginadas.map(
          (estadia) => {
            const saldo =
              Number(estadia.total || 0) -
              Number(
                estadia.monto_pagado || 0
              );

            return (
              <tr key={estadia.id}>
                <td>
                  <strong>
                    🐶{" "}
                    {estadia.perritos
                      ?.nombre || "—"}
                  </strong>
                </td>

                <td>
                  {estadia.perritos
                    ?.propietarios
                    ? `${estadia.perritos.propietarios.nombre} ${
                        estadia.perritos.propietarios.apellidos ??
                        ""
                      }`
                    : "—"}
                </td>

                <td>
                  {estadia.tipos_estadia
                    ?.nombre || "—"}
                </td>

                <td>
                  {formatearFecha(estadia.fecha_entrada)}
                </td>

                <td>
                  {estadia.estados_estadia
                    ?.nombre || "—"}
                </td>

                <td>
                  {estadia.estados_pago
                    ?.nombre || "—"}
                </td>

                <td>
                  {formatearColones(
                    estadia.total
                  )}
                </td>

                <td>
                  {formatearColones(
                    estadia.monto_pagado
                  )}
                </td>

                <td>
                  {formatearColones(
                    saldo
                  )}
                </td>
              </tr>
            );
          }
        )}
      </tbody>
    </table>
  </div>


  {/* MÓVIL */}
  <div className="mobile-only report-stays-mobile">

    {estadiasPaginadas.map(
      (estadia) => {
        const saldo =
          Number(estadia.total || 0) -
          Number(
            estadia.monto_pagado || 0
          );

        const propietario =
          estadia.perritos?.propietarios
            ? `${estadia.perritos.propietarios.nombre} ${
                estadia.perritos.propietarios.apellidos ??
                ""
              }`
            : "—";

        return (
          <div
            key={estadia.id}
            className="mobile-list-item report-stay-card"
          >
            <div className="report-stay-top">
              <div className="mobile-list-title">
                🐶{" "}
                {estadia.perritos
                  ?.nombre || "—"}
              </div>

              <span className="report-stay-type">
                {estadia.tipos_estadia
                  ?.nombre || "—"}
              </span>
            </div>

            <div className="report-stay-owner">
              <span className="mobile-list-label">
                Propietario
              </span>

              <strong>
                {propietario}
              </strong>
            </div>

            <div className="mobile-list-grid">
              <div>
                <span className="mobile-list-label">
                  Entrada
                </span>

                <strong>
                  {formatearFecha(estadia.fecha_entrada)}
                </strong>
              </div>

              <div>
                <span className="mobile-list-label">
                  Salida
                </span>

                <strong>                  
                  {formatearFecha(estadia.fecha_salida)}
                </strong>
              </div>

              <div>
                <span className="mobile-list-label">
                  Estado
                </span>

                <strong>
                  {estadia.estados_estadia
                    ?.nombre || "—"}
                </strong>
              </div>

              <div>
                <span className="mobile-list-label">
                  Pago
                </span>

                <strong>
                  {estadia.estados_pago
                    ?.nombre || "—"}
                </strong>
              </div>

              <div>
                <span className="mobile-list-label">
                  Total
                </span>

                <strong>
                  {formatearColones(
                    estadia.total
                  )}
                </strong>
              </div>

              <div>
                <span className="mobile-list-label">
                  Pagado
                </span>

                <strong>
                  {formatearColones(
                    estadia.monto_pagado
                  )}
                </strong>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <span className="mobile-list-label">
                  Saldo
                </span>

                <strong
                  style={{
                    color:
                      saldo > 0
                        ? "var(--color-danger)"
                        : "var(--color-success)",
                  }}
                >
                  {formatearColones(
                    saldo
                  )}
                </strong>
              </div>
            </div>
          </div>
        );
      }
    )}

  </div>

{estadiasFiltradas.length >
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
      ← Anterior
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
      Siguiente →
    </button>
  </div>
)}

</>


      )}
    </section>
  </div>
);

}