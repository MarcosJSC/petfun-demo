"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  useSucursalActiva,
} from "@/contexts/SucursalContext";

import {
  usePermisos,
} from "@/hooks/usePermisos";

import {
  RequierePermiso,
} from "@/components/RequierePermiso";


type EstadiaGrafico = {
  fecha_entrada: string;
  monto_pagado: number;
};


const NOMBRES_MESES = [
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


export default function GraficosPage() {
  const {
    sucursalActivaId,
  } = useSucursalActiva();

  const {
    esSuperadmin,
  } = usePermisos();


  const [
    estadias,
    setEstadias,
  ] = useState<EstadiaGrafico[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

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


  useEffect(() => {
    async function cargarEstadias() {
      setCargando(true);

      let consulta =
        supabase
          .from("estadias")
          .select(`
            fecha_entrada,
            monto_pagado
          `)
          .order(
            "fecha_entrada",
            {
              ascending: false,
            }
          );

      /*
       * Superadmin:
       * si seleccionó una sucursal,
       * filtramos explícitamente.
       *
       * En modo global dejamos
       * todas las sucursales.
       *
       * Los demás roles dependen
       * de RLS para limitar sus datos.
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
          "Error cargando gráficos:",
          error
        );

        setEstadias([]);
        setCargando(false);
        return;
      }

      setEstadias(
        (data ?? []) as EstadiaGrafico[]
      );

      setCargando(false);
    }

    cargarEstadias();
  }, [
    esSuperadmin,
    sucursalActivaId,
  ]);


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
        NOMBRES_MESES.map(
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


  return (
    <RequierePermiso permiso="reportes.ver">
      <div>

        <div className="page-header">
          <div>
            <h1 className="page-title">
              Gráficos
            </h1>

            <p className="page-description">
              Gráficos de estadías e ingresos de PetFunCR.
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
                    Number(
                      e.target.value
                    )
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


          {cargando ? (
            <div className="empty-state">
              Cargando gráficos...
            </div>
          ) : (
            mostrarGraficosAnuales && (
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
            )
          )}

        </section>

      </div>
    </RequierePermiso>
  );
}