
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DIAS_TOLERANCIA = 15;

const VACUNAS_OBLIGATORIAS = [
  "Múltiple",
  "Rabia",
  "Bordetella",
  "Giardia",
] as const;

const DESPARASITACIONES_OBLIGATORIAS = [
  "Interna",
  "Externa",
] as const;

type Vacuna = {
  fecha_aplicacion: string;
  fecha_vencimiento: string | null;
  tipos_vacuna: {
    nombre: string;
  } | null;
};

type Desparasitacion = {
  fecha_aplicacion: string;
  fecha_proxima: string | null;
  tipos_desparasitacion: {
    nombre: string;
  } | null;
};

export type ResultadoSaludPerrito = {
  cumple: boolean;
  fechaEvaluacion: string;
  requisitosPendientes: string[];
};

function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  const resultado = new Date(
    Date.UTC(anio, mes - 1, dia + dias)
  );

  return [
    resultado.getUTCFullYear(),
    String(resultado.getUTCMonth() + 1).padStart(2, "0"),
    String(resultado.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function fechaFueraDeMargen(
  fechaLimite: string | null,
  fechaEvaluacion: string
): boolean {
  if (!fechaLimite) {
    return true;
  }

  const ultimoDiaPermitido = sumarDias(
    fechaLimite,
    DIAS_TOLERANCIA
  );

  return fechaEvaluacion > ultimoDiaPermitido;
}

function obtenerVacunasMasRecientes(
  vacunas: Vacuna[]
): Map<string, Vacuna> {
  const resultado = new Map<string, Vacuna>();

  for (const vacuna of vacunas) {
    const tipo = vacuna.tipos_vacuna?.nombre;

    if (!tipo) continue;

    const existente = resultado.get(tipo);

    if (
      !existente ||
      vacuna.fecha_aplicacion >
        existente.fecha_aplicacion
    ) {
      resultado.set(tipo, vacuna);
    }
  }

  return resultado;
}

function obtenerDesparasitacionesMasRecientes(
  registros: Desparasitacion[]
): Map<string, Desparasitacion> {
  const resultado = new Map<string, Desparasitacion>();

  for (const registro of registros) {
    const tipo = registro.tipos_desparasitacion?.nombre;

    if (!tipo) continue;

    const tiposCubiertos =
      tipo === "Ambas"
        ? ["Interna", "Externa"]
        : tipo === "Interna" || tipo === "Externa"
          ? [tipo]
          : [];

    for (const tipoCubierto of tiposCubiertos) {
      const existente = resultado.get(tipoCubierto);

      if (
        !existente ||
        registro.fecha_aplicacion >
          existente.fecha_aplicacion
      ) {
        resultado.set(tipoCubierto, registro);
      }
    }
  }

  return resultado;
}

export async function validarSaludPerrito(
  perritoId: number,
  fechaSalida: string
): Promise<ResultadoSaludPerrito> {
  const pendientes: string[] = [];

  const [vacunasResult, desparasitacionesResult] =
    await Promise.all([
      supabaseAdmin
        .from("vacunas_perrito")
        .select(`
          fecha_aplicacion,
          fecha_vencimiento,
          tipos_vacuna (
            nombre
          )
        `)
        .eq("perrito_id", perritoId),

      supabaseAdmin
        .from("desparasitaciones_perrito")
        .select(`
          fecha_aplicacion,
          fecha_proxima,
          tipos_desparasitacion (
            nombre
          )
        `)
        .eq("perrito_id", perritoId),
    ]);

  if (vacunasResult.error) {
    throw new Error("No se pudieron consultar las vacunas.");
  }

  if (desparasitacionesResult.error) {
    throw new Error(
      "No se pudieron consultar las desparasitaciones."
    );
  }

  const vacunas = (vacunasResult.data ?? []) as unknown as Vacuna[];

  const desparasitaciones =
    (desparasitacionesResult.data ?? []) as unknown as Desparasitacion[];

  const vacunasRecientes = obtenerVacunasMasRecientes(vacunas);

  const desparasitacionesRecientes =
    obtenerDesparasitacionesMasRecientes(desparasitaciones);

  for (const tipo of VACUNAS_OBLIGATORIAS) {
    const vacuna = vacunasRecientes.get(tipo);

    if (!vacuna) {
      pendientes.push(`Falta registrar la vacuna ${tipo}.`);
      continue;
    }

    if (
      fechaFueraDeMargen(
        vacuna.fecha_vencimiento,
        fechaSalida
      )
    ) {
      pendientes.push(
        `La vacuna ${tipo} requiere actualización para la fecha de salida.`
      );
    }
  }

  for (const tipo of DESPARASITACIONES_OBLIGATORIAS) {
    const registro = desparasitacionesRecientes.get(tipo);

    if (!registro) {
      pendientes.push(
        `Falta registrar la desparasitación ${tipo.toLowerCase()}.`
      );
      continue;
    }

    if (
      fechaFueraDeMargen(
        registro.fecha_proxima,
        fechaSalida
      )
    ) {
      pendientes.push(
        `La desparasitación ${tipo.toLowerCase()} requiere actualización para la fecha de salida.`
      );
    }
  }

  return {
    cumple: pendientes.length === 0,
    fechaEvaluacion: fechaSalida,
    requisitosPendientes: pendientes,
  };
}
