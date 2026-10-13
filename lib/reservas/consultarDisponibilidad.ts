
import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ConsultarDisponibilidadParams = {
  sucursalId: number;
  fechaEntrada: string;
  fechaSalida: string;
  cantidadPerritos: number;
};

type DiaDisponibilidad = {
  fecha: string;
  ocupacionActual: number;
  ocupacionProyectada: number;
  capacidadMaxima: number;
  disponible: boolean;
};

type ResultadoDisponibilidad = {
  disponible: boolean;
  capacidadMaxima: number;
  dias: DiaDisponibilidad[];
  motivo?: string;
};

function obtenerFechasIncluidas(
  fechaEntrada: string,
  fechaSalida: string
): string[] {
  const fechas: string[] = [];

  const [anioInicio, mesInicio, diaInicio] =
    fechaEntrada.split("-").map(Number);

  const [anioFin, mesFin, diaFin] =
    fechaSalida.split("-").map(Number);

  const actual = new Date(
    Date.UTC(anioInicio, mesInicio - 1, diaInicio)
  );

  const final = new Date(
    Date.UTC(anioFin, mesFin - 1, diaFin)
  );

  while (actual <= final) {
    fechas.push(actual.toISOString().slice(0, 10));
    actual.setUTCDate(actual.getUTCDate() + 1);
  }

  return fechas;
}

export async function consultarDisponibilidad({
  sucursalId,
  fechaEntrada,
  fechaSalida,
  cantidadPerritos,
}: ConsultarDisponibilidadParams): Promise<ResultadoDisponibilidad> {
  if (
    !Number.isSafeInteger(sucursalId) ||
    sucursalId <= 0 ||
    !Number.isSafeInteger(cantidadPerritos) ||
    cantidadPerritos <= 0 ||
    !fechaEntrada ||
    !fechaSalida ||
    fechaSalida < fechaEntrada
  ) {
    throw new Error("Datos inválidos para consultar disponibilidad.");
  }

  // 1. Consultar la capacidad máxima de la sucursal.
  const { data: sucursal, error: errorSucursal } =
    await supabaseAdmin
      .from("sucursales")
      .select("id, capacidad_maxima")
      .eq("id", sucursalId)
      .maybeSingle();

  if (errorSucursal) {
    throw new Error(
      `Error consultando la sucursal: ${errorSucursal.message}`
    );
  }

  if (
    !sucursal ||
    !Number.isSafeInteger(Number(sucursal.capacidad_maxima)) ||
    Number(sucursal.capacidad_maxima) <= 0
  ) {
    throw new Error(
      "La sucursal no existe o no tiene una capacidad máxima válida."
    );
  }

  const capacidadMaxima = Number(sucursal.capacidad_maxima);

  // 2. Obtener todas las fechas, incluyendo entrada y salida.
  const fechas = obtenerFechasIncluidas(
    fechaEntrada,
    fechaSalida
  );

  // 3. Consultar estadías que realmente ocupan capacidad.
  // Reservada = 1; En curso = 2.
  // No se cuentan solicitudes pendientes de la tabla reservas.
  const { data: estadias, error: errorEstadias } =
    await supabaseAdmin
      .from("estadias")
      .select(
        "id, fecha_entrada, fecha_salida, estado_estadia_id"
      )
      .eq("sucursal_id", sucursalId)
      .in("estado_estadia_id", [1, 2])
      .lte("fecha_entrada", fechaSalida)
      .gte("fecha_salida", fechaEntrada);

  if (errorEstadias) {
    throw new Error(
      `Error consultando las estadías: ${errorEstadias.message}`
    );
  }

  // 4. Consultar bloqueos activos que se cruzan con el período.
  const { data: bloqueos, error: errorBloqueos } =
    await supabaseAdmin
      .from("bloqueos_reservas")
      .select("id, fecha_inicio, fecha_fin")
      .eq("sucursal_id", sucursalId)
      .eq("activo", true)
      .lte("fecha_inicio", fechaSalida)
      .gte("fecha_fin", fechaEntrada);

  if (errorBloqueos) {
    throw new Error(
      `Error consultando bloqueos: ${errorBloqueos.message}`
    );
  }

  // 5. Calcular la ocupación proyectada para cada día.
  const dias: DiaDisponibilidad[] = fechas.map((fecha) => {
    const ocupacionActual = (estadias ?? []).filter(
      (estadia) =>
        estadia.fecha_entrada <= fecha &&
        estadia.fecha_salida >= fecha
    ).length;

    const ocupacionProyectada =
      ocupacionActual + cantidadPerritos;

    const tieneBloqueo = (bloqueos ?? []).some(
      (bloqueo) =>
        bloqueo.fecha_inicio <= fecha &&
        bloqueo.fecha_fin >= fecha
    );

    return {
      fecha,
      ocupacionActual,
      ocupacionProyectada,
      capacidadMaxima,
      disponible:
        !tieneBloqueo &&
        ocupacionProyectada <= capacidadMaxima,
    };
  });

  const diaSinDisponibilidad = dias.find(
    (dia) => !dia.disponible
  );

  return {
    disponible: !diaSinDisponibilidad,
    capacidadMaxima,
    dias,
    ...(diaSinDisponibilidad
      ? {
          motivo:
            diaSinDisponibilidad.ocupacionProyectada >
            capacidadMaxima
              ? `Se supera la capacidad máxima el ${diaSinDisponibilidad.fecha}.`
              : `Existe un bloqueo activo para el ${diaSinDisponibilidad.fecha}.`,
        }
      : {}),
  };
}
