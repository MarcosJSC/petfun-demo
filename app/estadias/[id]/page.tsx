"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePermisos } from "@/hooks/usePermisos";
import { supabase } from "@/lib/supabase";

type EstadiaDetalle = {
  id: number;

  perrito_id: number;

  fecha_entrada: string;
  hora_entrada: string | null;

  fecha_salida: string;
  hora_salida: string | null;

  dias_hotel: number;
  dias_guarderia: number;

  precio_hotel_aplicado: number;
  precio_guarderia_aplicado: number;

  subtotal_hotel: number;
  subtotal_guarderia: number;

  descuento: number;
  total: number;
  monto_pagado: number;

  entregado_por: string | null;
  retirado_por: string | null;

  alimentacion_estadia: string | null;
  observaciones: string | null;

  perritos: {
    nombre: string;
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

  formas_pago: {
    nombre: string;
  } | null;
};

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(
    new Date(`${fecha}T00:00:00`)
  );
}

function formatearHora(
  hora: string | null
) {
  if (!hora) {
    return "—";
  }

  return hora.slice(0, 5);
}

function formatearColones(valor: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function EstadiaDetallePage() {
const { puede } = usePermisos();

  const params = useParams();

  const estadiaId =
    Number(params.id);

  const [estadia, setEstadia] =
    useState<EstadiaDetalle | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  async function cargarEstadia() {
    setCargando(true);

    const { data, error } = await supabase
      .from("estadias")
      .select(`
        id,
        perrito_id,

        fecha_entrada,
        hora_entrada,
        fecha_salida,
        hora_salida,

        dias_hotel,
        dias_guarderia,

        precio_hotel_aplicado,
        precio_guarderia_aplicado,

        subtotal_hotel,
        subtotal_guarderia,

        descuento,
        total,
        monto_pagado,

        entregado_por,
        retirado_por,

        alimentacion_estadia,
        observaciones,

        perritos (
          nombre
        ),

        tipos_estadia (
          nombre
        ),

        estados_estadia (
          nombre
        ),

        estados_pago (
          nombre
        ),

        formas_pago (
          nombre
        )
      `)
      .eq("id", estadiaId)
      .single();

    if (error) {
      console.error(error);

      setMensaje(
        "No se pudo cargar la estadía."
      );

      setCargando(false);
      return;
    }

 setEstadia(
  data as unknown as EstadiaDetalle
);

    setCargando(false);
  }

  useEffect(() => {
    if (!estadiaId) {
      return;
    }

    cargarEstadia();
  }, [estadiaId]);

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando estadía...
      </div>
    );
  }

  if (!estadia) {
    return (
      <div>
        <h1 className="page-title">
          Estadía
        </h1>

        <div className="empty-state">
          {mensaje ||
            "No se encontró la estadía."}
        </div>
      </div>
    );
  }

  const saldo =
    Math.max(
      0,
      estadia.total -
        estadia.monto_pagado
    );

  return (
    <div>

  <div className="page-header stay-detail-header">

  <div>
    <h1 className="page-title">
      🐶{" "}
      {estadia.perritos?.nombre || "Estadía"}
    </h1>

    <p className="page-description">
      {estadia.tipos_estadia?.nombre || "—"}
      {" · "}
      {estadia.estados_estadia?.nombre || "—"}
    </p>
  </div>

  <div className="page-header-actions stay-detail-actions">

    <Link
      href="/estadias"
      className="secondary-button"
    >
      ← Estadías
    </Link>

{puede("estadias.editar") && (
    <Link
      href={`/estadias?editar=${estadia.id}`}
      className="primary-button"
    >
      Editar estadía
    </Link>
    )}

    <Link
      href={`/perritos/${estadia.perrito_id}`}
      className="secondary-button"
    >
      Ver perrito
    </Link>

  </div>

</div>


    <div
  className="dashboard-grid stay-info-grid"
  style={{
    marginBottom: "24px",
  }}
>

        <div className="card">
          <div className="card-label">
            Entrada
          </div>

          <strong>
            {formatearFecha(
              estadia.fecha_entrada
            )}
            {" · "}
            {formatearHora(
              estadia.hora_entrada
            )}
          </strong>
        </div>


        <div className="card">
          <div className="card-label">
            Salida
          </div>

          <strong>
            {formatearFecha(
              estadia.fecha_salida
            )}
            {" · "}
            {formatearHora(
              estadia.hora_salida
            )}
          </strong>
        </div>


        <div className="card">
          <div className="card-label">
            Días Hotel
          </div>

          <strong>
            {estadia.dias_hotel}
          </strong>
        </div>


        <div className="card">
          <div className="card-label">
            Días Guardería
          </div>

          <strong>
            {estadia.dias_guarderia}
          </strong>
        </div>


        <div className="card">
          <div className="card-label">
            Estado de pago
          </div>

          <strong>
            {estadia.estados_pago
              ?.nombre || "—"}
          </strong>
        </div>


        <div className="card">
          <div className="card-label">
            Forma de pago
          </div>

          <strong>
            {estadia.formas_pago
              ?.nombre || "—"}
          </strong>
        </div>

      </div>


   <section
  className="list-card stay-economic-summary"
  style={{
    marginBottom: "24px",
  }}
>

        <div className="list-toolbar">
          <strong>
            Resumen económico
          </strong>
        </div>

   <div className="stay-economic-body">

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
            }}
          >
            <span>
              Hotel
            </span>

            <strong>
              {formatearColones(
                estadia.subtotal_hotel
              )}
            </strong>
          </div>


          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
            }}
          >
            <span>
              Guardería
            </span>

            <strong>
              {formatearColones(
                estadia
                  .subtotal_guarderia
              )}
            </strong>
          </div>


          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
            }}
          >
            <span>
              Descuento
            </span>

            <strong>
              -{" "}
              {formatearColones(
                estadia.descuento
              )}
            </strong>
          </div>


          <div
            style={{
              height: "1px",
              background:
                "var(--color-border)",
            }}
          />


          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
            }}
          >
            <strong>
              Total
            </strong>

            <strong
              style={{
                fontSize: "22px",
              }}
            >
              {formatearColones(
                estadia.total
              )}
            </strong>
          </div>


          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
            }}
          >
            <span>
              Monto pagado
            </span>

            <strong>
              {formatearColones(
                estadia.monto_pagado
              )}
            </strong>
          </div>


          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
            }}
          >
            <strong>
              Saldo pendiente
            </strong>

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

      </section>


    <section className="list-card stay-info-section">

        <div className="list-toolbar">
          <strong>
            Información de la estadía
          </strong>
        </div>

  <div className="stay-info-body">

          <div>
            <div className="card-label">
              Entregado por
            </div>

            <strong>
              {estadia.entregado_por ||
                "—"}
            </strong>
          </div>


          <div>
            <div className="card-label">
              Retirado por
            </div>

            <strong>
              {estadia.retirado_por ||
                "—"}
            </strong>
          </div>


          <div>
            <div className="card-label">
              Alimentación
            </div>

            <div>
              {estadia
                .alimentacion_estadia ||
                "—"}
            </div>
          </div>


          <div>
            <div className="card-label">
              Observaciones
            </div>

            <div>
              {estadia.observaciones ||
                "—"}
            </div>
          </div>

        </div>

      </section>

    </div>
  );
}