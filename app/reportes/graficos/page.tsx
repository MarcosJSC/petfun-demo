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

export default function GraficosPage() {

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

    const [
  anioAnalisis,
  setAnioAnalisis,
] = useState(
  new Date().getFullYear()
);

const [
  mostrarGraficosAnuales,
  setMostrarGraficosAnuales,
] = useState(true);

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

const nombresMeses = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];


const aniosDisponibles =
  useMemo(() => {
    const anios =
      estadias
        .map((estadia) =>
          Number(
            estadia.fecha_entrada.slice(
              0,
              4
            )
          )
        )
        .filter(
          (anio) =>
            Number.isFinite(anio)
        );

    anios.push(
      new Date().getFullYear()
    );

    return Array.from(
      new Set(anios)
    ).sort(
      (a, b) => b - a
    );
  }, [estadias]);


const datosAnuales =
  useMemo(() => {
    const meses =
      nombresMeses.map(
        (nombre, indice) => ({
          mes: indice,
          nombre,
          estadias: 0,
          cobrado: 0,
        })
      );

    estadias.forEach(
      (estadia) => {
        const fecha =
          new Date(
            `${estadia.fecha_entrada}T00:00:00`
          );

        if (
          fecha.getFullYear() !==
          anioAnalisis
        ) {
          return;
        }

        const mes =
          fecha.getMonth();

        meses[mes].estadias += 1;

        meses[mes].cobrado +=
          Number(
            estadia.monto_pagado || 0
          );
      }
    );

    return meses;
  }, [
    estadias,
    anioAnalisis,
  ]);


const resumenAnual =
  useMemo(() => {
    const estadiasAnuales =
      datosAnuales.reduce(
        (total, mes) =>
          total + mes.estadias,
        0
      );

    const cobradoAnual =
      datosAnuales.reduce(
        (total, mes) =>
          total + mes.cobrado,
        0
      );

    return {
      estadias:
        estadiasAnuales,

      cobrado:
        cobradoAnual,

      promedio:
        estadiasAnuales > 0
          ? cobradoAnual /
            estadiasAnuales
          : 0,
    };
  }, [datosAnuales]);


const maxEstadias =
  Math.max(
    1,
    ...datosAnuales.map(
      (mes) => mes.estadias
    )
  );


const maxCobrado =
  Math.max(
    1,
    ...datosAnuales.map(
      (mes) => mes.cobrado
    )
  );

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
          Gráficos
        </h1>

        <p className="page-description">
          Gráficos de EstadÍas e Ingresos de PetFunCR.
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
      📈 Gráficos de estadías e ingresos
    </strong>

    <div
      style={{
        color:
          "var(--color-text-secondary)",
        fontSize: "14px",
        marginTop: "3px",
      }}
    >
      Evolución mensual según fecha de entrada.
    </div>
  </div>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <select
      className="form-select"
      style={{
        width: "auto",
        minWidth: "110px",
      }}
      value={anioAnalisis}
      onChange={(e) =>
        setAnioAnalisis(
          Number(e.target.value)
        )
      }
    >
      {aniosDisponibles.map(
        (anio) => (
          <option
            key={anio}
            value={anio}
          >
            {anio}
          </option>
        )
      )}
    </select>

    <button
      type="button"
      className="secondary-button"
      onClick={() =>
        setMostrarGraficosAnuales(
          (valor) => !valor
        )
      }
      aria-label={
        mostrarGraficosAnuales
          ? "Contraer gráficos"
          : "Expandir gráficos"
      }
      title={
        mostrarGraficosAnuales
          ? "Contraer"
          : "Expandir"
      }
    >
      {mostrarGraficosAnuales
        ? "▲"
        : "▼"}
    </button>
  </div>
</div>



{mostrarGraficosAnuales && (
  <>
    <div className="annual-summary">

      <div>
        <span>
          Estadías
        </span>

        <strong>
          {resumenAnual.estadias}
        </strong>
      </div>

      <div>
        <span>
          Cobrado
        </span>

        <strong>
          {formatearColones(
            resumenAnual.cobrado
          )}
        </strong>
      </div>

      <div>
        <span>
          Promedio / estadía
        </span>

        <strong>
          {formatearColones(
            resumenAnual.promedio
          )}
        </strong>
      </div>

    </div>


    <div className="annual-charts">

      {/* ESTADÍAS */}
      <div className="annual-chart-card">

        <div className="annual-chart-title">
          📊 Estadías por mes
        </div>

        <div className="annual-chart">

          {datosAnuales.map(
            (mes) => (
              <div
                key={mes.mes}
                className="annual-bar-column"
              >
                <div className="annual-bar-value">
                  {mes.estadias}
                </div>

                <div className="annual-bar-area">
                  <div
                    className="annual-bar"
                    style={{
                      height:
                        `${Math.max(
                          2,
                          (
                            mes.estadias /
                            maxEstadias
                          ) * 100
                        )}%`,
                    }}
                  />
                </div>

                <div className="annual-bar-label">
                  {mes.nombre}
                </div>
              </div>
            )
          )}

        </div>
      </div>


      {/* INGRESOS */}
      <div className="annual-chart-card">

        <div className="annual-chart-title">
          💰 Monto cobrado por mes
        </div>

        <div className="annual-chart">

          {datosAnuales.map(
            (mes) => (
              <div
                key={mes.mes}
                className="annual-bar-column"
              >
                <div className="annual-bar-value annual-money-value">
                  {mes.cobrado > 0
                    ? new Intl.NumberFormat(
                        "es-CR",
                        {
                          notation:
                            "compact",
                          maximumFractionDigits:
                            1,
                        }
                      ).format(
                        mes.cobrado
                      )
                    : "0"}
                </div>

                <div className="annual-bar-area">
                  <div
                    className="annual-bar annual-money-bar"
                    style={{
                      height:
                        `${Math.max(
                          2,
                          (
                            mes.cobrado /
                            maxCobrado
                          ) * 100
                        )}%`,
                    }}
                  />
                </div>

                <div className="annual-bar-label">
                  {mes.nombre}
                </div>
              </div>
            )
          )}

        </div>
      </div>

    </div>
  </>
)}


  
</section>


  </div>
);

}