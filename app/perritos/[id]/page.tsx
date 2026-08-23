"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

type Propietario = {
  id: number;
  nombre: string;
  apellidos: string | null;
};

type Raza = {
  id: number;
  nombre: string;
};

type TipoVacuna = {
  id: number;
  nombre: string;
};

type TipoDesparasitacion = {
  id: number;
  nombre: string;
};

type Perrito = {
  id: number;
  nombre: string;
  fecha_nacimiento: string | null;
  sexo: string | null;
  peso_kg: number | null;
  precio_hotel: number | null;
  precio_guarderia: number | null;
  instrucciones_alimentacion: string | null;
  observaciones_comportamiento: string | null;
  observaciones_medicas: string | null;
  propietario_id: number;
  raza_id: number | null;

  propietarios: {
    nombre: string;
    apellidos: string | null;
  } | null;

  razas: {
    nombre: string;
  } | null;
};

type Vacuna = {
  id: number;
  fecha_aplicacion: string;
  fecha_vencimiento: string | null;
  observaciones: string | null;

  tipos_vacuna: {
    nombre: string;
  } | null;
};

type Desparasitacion = {
  id: number;
  fecha_aplicacion: string;
  fecha_proxima: string | null;
  observaciones: string | null;

  tipos_desparasitacion: {
    nombre: string;
  } | null;
};

function calcularEdad(fechaNacimiento: string | null) {
  if (!fechaNacimiento) {
    return "—";
  }

function obtenerEstadoFecha(fecha: string | null) {
  if (!fecha) {
    return {
      estado: "sin-fecha",
      texto: "Sin fecha",
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaObjetivo = new Date(
    `${fecha}T00:00:00`
  );

  const diferencia =
    fechaObjetivo.getTime() -
    hoy.getTime();

  const dias = Math.ceil(
    diferencia / (1000 * 60 * 60 * 24)
  );

  if (dias < 0) {
    return {
      estado: "vencida",
      texto: `Vencida hace ${Math.abs(dias)} ${
        Math.abs(dias) === 1 ? "día" : "días"
      }`,
    };
  }

  if (dias === 0) {
    return {
      estado: "proxima",
      texto: "Vence hoy",
    };
  }

  if (dias <= 30) {
    return {
      estado: "proxima",
      texto: `Vence en ${dias} ${
        dias === 1 ? "día" : "días"
      }`,
    };
  }

  return {
    estado: "vigente",
    texto: `Vigente · ${dias} días`,
  };
}

  const nacimiento = new Date(
    `${fechaNacimiento}T00:00:00`
  );

  const hoy = new Date();

  let anos =
    hoy.getFullYear() -
    nacimiento.getFullYear();

  let meses =
    hoy.getMonth() -
    nacimiento.getMonth();

  if (hoy.getDate() < nacimiento.getDate()) {
    meses--;
  }

  if (meses < 0) {
    anos--;
    meses += 12;
  }

  if (anos < 1) {
    return `${meses} ${
      meses === 1 ? "mes" : "meses"
    }`;
  }

  if (meses === 0) {
    return `${anos} ${
      anos === 1 ? "año" : "años"
    }`;
  }

  return `${anos} ${
    anos === 1 ? "año" : "años"
  } y ${meses} ${
    meses === 1 ? "mes" : "meses"
  }`;
}

function obtenerEstadoFecha(
  fecha: string | null
) {
  if (!fecha) {
    return {
      estado: "sin-fecha",
      texto: "Sin fecha",
      dias: null,
    };
  }

  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  const fechaObjetivo = new Date(
    `${fecha}T00:00:00`
  );

  const diferencia =
    fechaObjetivo.getTime() -
    hoy.getTime();

  const dias = Math.ceil(
    diferencia / (1000 * 60 * 60 * 24)
  );

  if (dias < 0) {
    return {
      estado: "vencida",
      texto: `Vencida hace ${Math.abs(dias)} ${
        Math.abs(dias) === 1
          ? "día"
          : "días"
      }`,
      dias,
    };
  }

  if (dias === 0) {
    return {
      estado: "proxima",
      texto: "Vence hoy",
      dias,
    };
  }

  if (dias <= 30) {
    return {
      estado: "proxima",
      texto: `Vence en ${dias} ${
        dias === 1 ? "día" : "días"
      }`,
      dias,
    };
  }

  return {
    estado: "vigente",
    texto: `Vigente · ${dias} días`,
    dias,
  };
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

export default function PerritoDetallePage() {
  const params = useParams();
  const router = useRouter();

  const perritoId = Number(params.id);

  const [perrito, setPerrito] =
    useState<Perrito | null>(null);

  const [propietarios, setPropietarios] =
    useState<Propietario[]>([]);

  const [razas, setRazas] =
    useState<Raza[]>([]);

  const [tiposVacuna, setTiposVacuna] =
    useState<TipoVacuna[]>([]);

  const [
    tiposDesparasitacion,
    setTiposDesparasitacion,
  ] = useState<TipoDesparasitacion[]>([]);

  const [vacunas, setVacunas] =
    useState<Vacuna[]>([]);

  const [
    desparasitaciones,
    setDesparasitaciones,
  ] = useState<Desparasitacion[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  const [modalEditar, setModalEditar] =
    useState(false);

  const [modalVacuna, setModalVacuna] =
    useState(false);

const [vacunaEditando, setVacunaEditando] =
  useState<Vacuna | null>(null);

const [precioHotel, setPrecioHotel] =
  useState("");

const [precioGuarderia, setPrecioGuarderia] =
  useState("");

  const [
    modalDesparasitacion,
    setModalDesparasitacion,
  ] = useState(false);

  const [
  desparasitacionEditando,
  setDesparasitacionEditando,
] = useState<Desparasitacion | null>(null);

  const [guardando, setGuardando] =
    useState(false);

  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] =
    useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [propietarioId, setPropietarioId] =
    useState("");
  const [razaId, setRazaId] = useState("");

  const [
    instruccionesAlimentacion,
    setInstruccionesAlimentacion,
  ] = useState("");

  const [
    observacionesComportamiento,
    setObservacionesComportamiento,
  ] = useState("");

  const [
    observacionesMedicas,
    setObservacionesMedicas,
  ] = useState("");

  const [tipoVacunaId, setTipoVacunaId] =
    useState("");

  const [
    fechaAplicacionVacuna,
    setFechaAplicacionVacuna,
  ] = useState("");

  const [
    fechaVencimientoVacuna,
    setFechaVencimientoVacuna,
  ] = useState("");

  const [
    observacionesVacuna,
    setObservacionesVacuna,
  ] = useState("");

  const [
    tipoDesparasitacionId,
    setTipoDesparasitacionId,
  ] = useState("");

  const [
    fechaAplicacionDesparasitacion,
    setFechaAplicacionDesparasitacion,
  ] = useState("");

  const [
    fechaProximaDesparasitacion,
    setFechaProximaDesparasitacion,
  ] = useState("");

  const [
    observacionesDesparasitacion,
    setObservacionesDesparasitacion,
  ] = useState("");



const vacunasActuales = Object.values(
  vacunas.reduce(
    (
      acumulador: Record<
        string,
        Vacuna
      >,
      vacuna
    ) => {
      const tipo =
        vacuna.tipos_vacuna?.nombre;

      if (!tipo) {
        return acumulador;
      }

      const existente =
        acumulador[tipo];

      if (
        !existente ||
        vacuna.fecha_aplicacion >
          existente.fecha_aplicacion
      ) {
        acumulador[tipo] = vacuna;
      }

      return acumulador;
    },
    {}
  )
);

const ultimaDesparasitacion =
  desparasitaciones.length > 0
    ? desparasitaciones[0]
    : null;


  async function cargarPerrito() {
    const { data, error } = await supabase
      .from("perritos")
      .select(`
        id,
        nombre,
        fecha_nacimiento,
        sexo,
        peso_kg,
        precio_hotel,
        precio_guarderia,
        instrucciones_alimentacion,
        observaciones_comportamiento,
        observaciones_medicas,
        propietario_id,
        raza_id,
        propietarios (
          nombre,
          apellidos
        ),
        razas (
          nombre
        )
      `)
      .eq("id", perritoId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

   setPerrito(
  data as unknown as Perrito
);

    setNombre(data.nombre ?? "");
    setFechaNacimiento(
      data.fecha_nacimiento ?? ""
    );

    setSexo(data.sexo ?? "");

    setPeso(
      data.peso_kg != null
        ? String(data.peso_kg)
        : ""
    );

    setPrecioHotel(
  data.precio_hotel != null
    ? String(data.precio_hotel)
    : ""
);

setPrecioGuarderia(
  data.precio_guarderia != null
    ? String(data.precio_guarderia)
    : ""
);

    setPropietarioId(
      String(data.propietario_id)
    );

    setRazaId(
      data.raza_id
        ? String(data.raza_id)
        : ""
    );

    setInstruccionesAlimentacion(
      data.instrucciones_alimentacion ?? ""
    );

    setObservacionesComportamiento(
      data.observaciones_comportamiento ?? ""
    );

    setObservacionesMedicas(
      data.observaciones_medicas ?? ""
    );
  }

  async function cargarCatalogos() {
    const [
      propietariosResult,
      razasResult,
      vacunasResult,
      desparasitacionesResult,
    ] = await Promise.all([
      supabase
        .from("propietarios")
        .select("id, nombre, apellidos")
        .order("nombre"),

      supabase
        .from("razas")
        .select("id, nombre")
        .eq("activa", true)
        .order("nombre"),

      supabase
        .from("tipos_vacuna")
        .select("id, nombre")
        .eq("activa", true)
        .order("nombre"),

      supabase
        .from("tipos_desparasitacion")
        .select("id, nombre")
        .eq("activa", true)
        .order("nombre"),
    ]);

    setPropietarios(
      propietariosResult.data ?? []
    );

    setRazas(
      razasResult.data ?? []
    );

    setTiposVacuna(
      vacunasResult.data ?? []
    );

    setTiposDesparasitacion(
      desparasitacionesResult.data ?? []
    );
  }

  async function cargarVacunas() {
    const { data, error } = await supabase
      .from("vacunas_perrito")
      .select(`
        id,
        fecha_aplicacion,
        fecha_vencimiento,
        observaciones,
        tipos_vacuna (
          nombre
        )
      `)
      .eq("perrito_id", perritoId)
      .order("fecha_aplicacion", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setVacunas(
     (data ?? []) as unknown as Vacuna[]
    );
  }

  async function cargarDesparasitaciones() {
    const { data, error } = await supabase
      .from("desparasitaciones_perrito")
      .select(`
        id,
        fecha_aplicacion,
        fecha_proxima,
        observaciones,
        tipos_desparasitacion (
          nombre
        )
      `)
      .eq("perrito_id", perritoId)
      .order("fecha_aplicacion", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setDesparasitaciones(
      (data ?? []) as unknown as Desparasitacion[]
    );
  }

  useEffect(() => {
    async function cargarTodo() {
      setCargando(true);

      await Promise.all([
        cargarPerrito(),
        cargarCatalogos(),
        cargarVacunas(),
        cargarDesparasitaciones(),
      ]);

      setCargando(false);
    }

    cargarTodo();
  }, [perritoId]);

  async function guardarCambios(
    e: FormEvent
  ) {
    e.preventDefault();

    setGuardando(true);
    setMensaje("");

    const { error } = await supabase
      .from("perritos")
      .update({
        nombre,
        fecha_nacimiento:
          fechaNacimiento || null,
        sexo: sexo || null,

        peso_kg:
          peso
            ? Number(peso)
            : null,

 precio_hotel:
    precioHotel
      ? Number(precioHotel)
      : null,

  precio_guarderia:
    precioGuarderia
      ? Number(precioGuarderia)
      : null,            

        propietario_id:
          Number(propietarioId),

        raza_id:
          razaId
            ? Number(razaId)
            : null,

        instrucciones_alimentacion:
          instruccionesAlimentacion || null,

        observaciones_comportamiento:
          observacionesComportamiento || null,

        observaciones_medicas:
          observacionesMedicas || null,
      })
      .eq("id", perritoId);

    setGuardando(false);

    if (error) {
      console.error(error);

      setMensaje(
        "No se pudieron guardar los cambios."
      );

      return;
    }

    setModalEditar(false);

    setMensaje(
      "Información del perrito actualizada."
    );

    await cargarPerrito();
  }

async function eliminarPerrito() {
  if (!perrito) {
    return;
  }

  const confirmar = window.confirm(
    `¿Seguro que deseas eliminar a ${perrito.nombre}?\n\nSe eliminarán también sus vacunas y desparasitaciones registradas.\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmar) {
    return;
  }

  setMensaje("");

  const { error } = await supabase
    .from("perritos")
    .delete()
    .eq("id", perrito.id);

  if (error) {
    console.error(error);

    setMensaje(
      "No se pudo eliminar el perrito."
    );

    return;
  }

  router.push("/perritos");
}

function abrirNuevaVacuna() {
  setVacunaEditando(null);

  setTipoVacunaId("");
  setFechaAplicacionVacuna("");
  setFechaVencimientoVacuna("");
  setObservacionesVacuna("");

  setModalVacuna(true);
}

function abrirEditarVacuna(vacuna: Vacuna) {
  setVacunaEditando(vacuna);

  const tipo = tiposVacuna.find(
    (t) =>
      t.nombre ===
      vacuna.tipos_vacuna?.nombre
  );

  setTipoVacunaId(
    tipo ? String(tipo.id) : ""
  );

  setFechaAplicacionVacuna(
    vacuna.fecha_aplicacion
  );

  setFechaVencimientoVacuna(
    vacuna.fecha_vencimiento ?? ""
  );

  setObservacionesVacuna(
    vacuna.observaciones ?? ""
  );

  setModalVacuna(true);
}

  async function guardarVacuna(
    e: FormEvent
  ) {
    e.preventDefault();

    setGuardando(true);
    setMensaje("");

const editando = vacunaEditando !== null;

  let error;

  if (editando) {
    const resultado = await supabase
      .from("vacunas_perrito")
      .update({
        tipo_vacuna_id:
          Number(tipoVacunaId),

        fecha_aplicacion:
          fechaAplicacionVacuna,

        fecha_vencimiento:
          fechaVencimientoVacuna || null,

        observaciones:
          observacionesVacuna || null,
      })
      .eq("id", vacunaEditando!.id);

    error = resultado.error;
  } else {
    const resultado = await supabase
      .from("vacunas_perrito")
      .insert({
        perrito_id: perritoId,

        tipo_vacuna_id:
          Number(tipoVacunaId),

        fecha_aplicacion:
          fechaAplicacionVacuna,

        fecha_vencimiento:
          fechaVencimientoVacuna || null,

        observaciones:
          observacionesVacuna || null,
      });

    error = resultado.error;
  }

  setGuardando(false);

  if (error) {
    console.error(error);

    setMensaje(
      editando
        ? "No se pudo actualizar la vacuna."
        : "No se pudo registrar la vacuna."
    );

    return;
  }

  setTipoVacunaId("");
  setFechaAplicacionVacuna("");
  setFechaVencimientoVacuna("");
  setObservacionesVacuna("");

  setVacunaEditando(null);
  setModalVacuna(false);

  setMensaje(
    editando
      ? "Vacuna actualizada correctamente."
      : "Vacuna registrada correctamente."
  );

  await cargarVacunas();
}

async function eliminarVacuna(
  vacuna: Vacuna
) {
  const nombreVacuna =
    vacuna.tipos_vacuna?.nombre || "esta vacuna";

  const confirmar = window.confirm(
    `¿Seguro que deseas eliminar el registro de ${nombreVacuna}?\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmar) {
    return;
  }

  setMensaje("");

  const { error } = await supabase
    .from("vacunas_perrito")
    .delete()
    .eq("id", vacuna.id);

  if (error) {
    console.error(error);

    setMensaje(
      "No se pudo eliminar la vacuna."
    );

    return;
  }

  setMensaje(
    "Vacuna eliminada correctamente."
  );

  await cargarVacunas();
}

function abrirNuevaDesparasitacion() {
  setDesparasitacionEditando(null);

  setTipoDesparasitacionId("");
  setFechaAplicacionDesparasitacion("");
  setFechaProximaDesparasitacion("");
  setObservacionesDesparasitacion("");

  setModalDesparasitacion(true);
}

function abrirEditarDesparasitacion(
  desparasitacion: Desparasitacion
) {
  setDesparasitacionEditando(
    desparasitacion
  );

  const tipo = tiposDesparasitacion.find(
    (t) =>
      t.nombre ===
      desparasitacion
        .tipos_desparasitacion?.nombre
  );

  setTipoDesparasitacionId(
    tipo ? String(tipo.id) : ""
  );

  setFechaAplicacionDesparasitacion(
    desparasitacion.fecha_aplicacion
  );

  setFechaProximaDesparasitacion(
    desparasitacion.fecha_proxima ?? ""
  );

  setObservacionesDesparasitacion(
    desparasitacion.observaciones ?? ""
  );

  setModalDesparasitacion(true);
}
  
 async function guardarDesparasitacion(
  e: FormEvent
) {
  e.preventDefault();

  setGuardando(true);
  setMensaje("");

  const editando =
    desparasitacionEditando !== null;

  let error;

  if (editando) {
    const resultado = await supabase
      .from("desparasitaciones_perrito")
      .update({
        tipo_desparasitacion_id:
          Number(tipoDesparasitacionId),

        fecha_aplicacion:
          fechaAplicacionDesparasitacion,

        fecha_proxima:
          fechaProximaDesparasitacion || null,

        observaciones:
          observacionesDesparasitacion || null,
      })
      .eq(
        "id",
        desparasitacionEditando!.id
      );

    error = resultado.error;
  } else {
    const resultado = await supabase
      .from("desparasitaciones_perrito")
      .insert({
        perrito_id: perritoId,

        tipo_desparasitacion_id:
          Number(tipoDesparasitacionId),

        fecha_aplicacion:
          fechaAplicacionDesparasitacion,

        fecha_proxima:
          fechaProximaDesparasitacion || null,

        observaciones:
          observacionesDesparasitacion || null,
      });

    error = resultado.error;
  }

  setGuardando(false);

  if (error) {
    console.error(error);

    setMensaje(
      editando
        ? "No se pudo actualizar la desparasitación."
        : "No se pudo registrar la desparasitación."
    );

    return;
  }

  setTipoDesparasitacionId("");
  setFechaAplicacionDesparasitacion("");
  setFechaProximaDesparasitacion("");
  setObservacionesDesparasitacion("");

  setDesparasitacionEditando(null);
  setModalDesparasitacion(false);

  setMensaje(
    editando
      ? "Desparasitación actualizada correctamente."
      : "Desparasitación registrada correctamente."
  );

  await cargarDesparasitaciones();
}


async function eliminarDesparasitacion(
  desparasitacion: Desparasitacion
) {
  const tipo =
    desparasitacion
      .tipos_desparasitacion
      ?.nombre || "esta desparasitación";

  const confirmar = window.confirm(
    `¿Seguro que deseas eliminar el registro de ${tipo}?\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmar) {
    return;
  }

  setMensaje("");

  const { error } = await supabase
    .from("desparasitaciones_perrito")
    .delete()
    .eq("id", desparasitacion.id);

  if (error) {
    console.error(error);

    setMensaje(
      "No se pudo eliminar la desparasitación."
    );

    return;
  }

  setMensaje(
    "Desparasitación eliminada correctamente."
  );

  await cargarDesparasitaciones();
}

  if (cargando) {
    return (
      <h1 className="page-title">
        Cargando...
      </h1>
    );
  }

  if (!perrito) {
    return (
      <div>
        <h1 className="page-title">
          Perrito no encontrado
        </h1>

        <button
          className="secondary-button"
          onClick={() =>
            router.push("/perritos")
          }
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div>

      <div className="page-header">

        <div>

          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              router.push("/perritos")
            }
            style={{
              marginBottom: "18px",
            }}
          >
            ← Volver a perritos
          </button>

          <h1 className="page-title">
            🐶 {perrito.nombre}
          </h1>

          <p className="page-description">
            Expediente general del perrito.
          </p>

        </div>

<div className="page-header-actions">

  <button
   className="danger-button"
    type="button"
    onClick={eliminarPerrito}
  >
    Eliminar perrito
  </button>

  <button
    className="primary-button"
    type="button"
    onClick={() =>
      setModalEditar(true)
    }
  >
    Editar información
  </button>

</div>

      </div>

      {mensaje && (
        <div className="status-message">
          {mensaje}
        </div>
      )}

      <div
        className="dashboard-grid"
        style={{
          marginBottom: "24px",
        }}
      >

<div className="card">
  <div className="card-label">
    Raza
  </div>

  <strong>
    {perrito.razas?.nombre || "—"}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Edad
  </div>

  <strong>
    {calcularEdad(
      perrito.fecha_nacimiento
    )}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Sexo
  </div>

  <strong>
    {perrito.sexo || "—"}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Peso
  </div>

  <strong>
    {perrito.peso_kg
      ? `${perrito.peso_kg} kg`
      : "—"}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Fecha de nacimiento
  </div>

  <strong>
    {formatearFecha(
      perrito.fecha_nacimiento
    )}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Propietario
  </div>

  <strong>
    {perrito.propietarios
      ? `${perrito.propietarios.nombre} ${
          perrito.propietarios.apellidos ?? ""
        }`
      : "—"}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Precio Hotel
  </div>

  <strong>
    {perrito.precio_hotel != null
      ? new Intl.NumberFormat("es-CR", {
          style: "currency",
          currency: "CRC",
          maximumFractionDigits: 0,
        }).format(perrito.precio_hotel)
      : "—"}
  </strong>
</div>

<div className="card">
  <div className="card-label">
    Precio Guardería
  </div>

  <strong>
    {perrito.precio_guarderia != null
      ? new Intl.NumberFormat("es-CR", {
          style: "currency",
          currency: "CRC",
          maximumFractionDigits: 0,
        }).format(perrito.precio_guarderia)
      : "—"}
  </strong>
</div>

      </div>

      <section
        className="card"
        style={{ marginBottom: "24px" }}
      >
        <h2 style={{ marginTop: 0 }}>
          Cuidados
        </h2>

        <p>
          <strong>Alimentación:</strong>
          <br />
          {perrito.instrucciones_alimentacion ||
            "Sin información registrada."}
        </p>

        <p>
          <strong>Comportamiento:</strong>
          <br />
          {perrito.observaciones_comportamiento ||
            "Sin observaciones registradas."}
        </p>

        <p style={{ marginBottom: 0 }}>
          <strong>
            Observaciones médicas:
          </strong>
          <br />
          {perrito.observaciones_medicas ||
            "Sin observaciones registradas."}
        </p>
      </section>

<section
  className="list-card"
  style={{ marginBottom: "24px" }}
>
  <div className="list-toolbar">
    <div>
      <strong>
        Estado actual de vacunas
      </strong>

      <div
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "14px",
          marginTop: "3px",
        }}
      >
        Último registro de cada tipo
      </div>
    </div>
  </div>

  {vacunasActuales.length === 0 ? (
    <div className="empty-state">
      No hay vacunas registradas.
    </div>
  ) : (
    <table className="data-table">
      <thead>
<tr>
  <th>Vacuna</th>
  <th>Aplicación</th>
  <th>Vencimiento</th>
  <th>Observaciones</th>
  <th>Acciones</th>
</tr>
      </thead>

      <tbody>
        {vacunasActuales.map((vacuna) => {
          const estado = obtenerEstadoFecha(
            vacuna.fecha_vencimiento
          );

          return (
            <tr key={vacuna.id}>
              <td>
                <strong>
                  {vacuna.tipos_vacuna?.nombre || "—"}
                </strong>
              </td>

              <td>
                {formatearFecha(
    vacuna.fecha_aplicacion
  )}
              </td>

              <td>
                 {formatearFecha(
    vacuna.fecha_vencimiento
  )}
              </td>

              <td>
                  <span
    className={`estado-badge ${estado.estado}`}
  >
    <span className="estado-dot" />

    {estado.texto}
  </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  )}
</section>

      <section
        className="list-card"
        style={{ marginBottom: "24px" }}
      >

        <div className="list-toolbar">

          <div>
            <strong>Historial de vacunas</strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Todos los registros de vacunación
            </div>
          </div>

<button
  className="primary-button"
  type="button"
  onClick={abrirNuevaVacuna}
>
  {guardando
  ? "Guardando..."
  : vacunaEditando
    ? "Guardar cambios"
    : "Registrar vacuna"}
</button>

        </div>

        {vacunas.length === 0 ? (
          <div className="empty-state">
            No hay vacunas registradas.
          </div>
        ) : (
          <table className="data-table">

            <thead>
              <tr>
                <th>Vacuna</th>
                <th>Aplicación</th>
                <th>Vencimiento</th>
                <th>Observaciones</th>
              </tr>
            </thead>

            <tbody>
              {vacunas.map((vacuna) => (
                <tr key={vacuna.id}>
                  <td>
                    <strong>
                      {vacuna.tipos_vacuna
                        ?.nombre || "—"}
                    </strong>
                  </td>

                  <td>
                    {formatearFecha(
  vacuna.fecha_aplicacion
)}
                  </td>

                  <td>
                  {formatearFecha(
  vacuna.fecha_vencimiento
)}
                  </td>

                  <td>
                    {vacuna.observaciones || "—"}
                  </td>
<td>
  <div
    style={{
      display: "flex",
      gap: "8px",
    }}
  >
    <button
      type="button"
      className="secondary-button"
      onClick={() =>
        abrirEditarVacuna(vacuna)
      }
    >
      Editar
    </button>

    <button
      type="button"
      className="danger-button"
      onClick={() =>
        eliminarVacuna(vacuna)
      }
    >
      Eliminar
    </button>
  </div>
</td>
                </tr>
              ))}
            </tbody>

          </table>
        )}

      </section>

<section
  className="list-card"
  style={{ marginBottom: "24px" }}
>
  <div className="list-toolbar">
    <div>
      <strong>
        Estado actual de desparasitación
      </strong>

      <div
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "14px",
          marginTop: "3px",
        }}
      >
        Último registro disponible
      </div>
    </div>
  </div>

  {!ultimaDesparasitacion ? (
    <div className="empty-state">
      No hay desparasitaciones registradas.
    </div>
  ) : (
    <table className="data-table">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Aplicada</th>
          <th>Próxima</th>
          <th>Estado</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            <strong>
              {ultimaDesparasitacion
                .tipos_desparasitacion
                ?.nombre || "—"}
            </strong>
          </td>

          <td>
            {formatearFecha(
              ultimaDesparasitacion.fecha_aplicacion
            )}
          </td>

          <td>
            {formatearFecha(
              ultimaDesparasitacion.fecha_proxima
            )}
          </td>

<td>
  {(() => {
    const estado = obtenerEstadoFecha(
      ultimaDesparasitacion.fecha_proxima
    );

    return (
      <span
        className={`estado-badge ${estado.estado}`}
      >
        <span className="estado-dot" />

        {estado.texto}
      </span>
    );
  })()}
</td>
        </tr>
      </tbody>
    </table>
  )}
</section>

      <section className="list-card">

        <div className="list-toolbar">

          <div>
            <strong>
              Historial de desparasitaciones
            </strong>

            <div
              style={{
                color:
                  "var(--color-text-secondary)",
                fontSize: "14px",
                marginTop: "3px",
              }}
            >
              Todos los registros anteriores
            </div>
          </div>

<button
  className="primary-button"
  type="button"
  onClick={abrirNuevaDesparasitacion}
>
 {guardando
  ? "Guardando..."
  : desparasitacionEditando
    ? "Guardar cambios"
    : "Registrar desparasitación"}
</button>

        </div>

        {desparasitaciones.length === 0 ? (
          <div className="empty-state">
            No hay desparasitaciones registradas.
          </div>
        ) : (
          <table className="data-table">

            <thead>
         <tr>
  <th>Tipo</th>
  <th>Aplicación</th>
  <th>Próxima</th>
  <th>Observaciones</th>
  <th>Acciones</th>
</tr>
            </thead>

            <tbody>
              {desparasitaciones.map(
                (desparasitacion) => (
                  <tr
                    key={
                      desparasitacion.id
                    }
                  >
                    <td>
                      <strong>
                        {desparasitacion
                          .tipos_desparasitacion
                          ?.nombre || "—"}
                      </strong>
                    </td>

                    <td>
                      {
                        desparasitacion
                          .fecha_aplicacion
                      }
                    </td>

                    <td>
                      {desparasitacion
                        .fecha_proxima || "—"}
                    </td>

                    <td>
                      {desparasitacion
                        .observaciones || "—"}
                    </td>
                    <td>
  <div
    style={{
      display: "flex",
      gap: "8px",
    }}
  >
    <button
      type="button"
      className="secondary-button"
      onClick={() =>
        abrirEditarDesparasitacion(
          desparasitacion
        )
      }
    >
      Editar
    </button>

    <button
      type="button"
      className="danger-button"
      onClick={() =>
        eliminarDesparasitacion(
          desparasitacion
        )
      }
    >
      Eliminar
    </button>
  </div>
</td>
                  </tr>
                )
              )}
            </tbody>

          </table>
        )}

      </section>

      {modalEditar && (
        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-header">
              <h2>
                Editar información
              </h2>

              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setModalEditar(false)
                }
              >
                ×
              </button>
            </div>

            <div className="modal-body">

              <form
                onSubmit={guardarCambios}
              >

                <div className="form-grid">

                  <div className="form-group">
                    <label className="form-label">
                      Nombre *
                    </label>

                    <input
                      className="form-input"
                      value={nombre}
                      onChange={(e) =>
                        setNombre(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Fecha nacimiento
                    </label>

                    <input
                      className="form-input"
                      type="date"
                      value={fechaNacimiento}
                      onChange={(e) =>
                        setFechaNacimiento(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Sexo
                    </label>

                    <select
                      className="form-select"
                      value={sexo}
                      onChange={(e) =>
                        setSexo(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecciona
                      </option>

                      <option value="Macho">
                        Macho
                      </option>

                      <option value="Hembra">
                        Hembra
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Peso kg
                    </label>

                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      value={peso}
                      onChange={(e) =>
                        setPeso(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
  <label className="form-label">
    Precio Hotel
  </label>

  <input
    className="form-input"
    type="number"
    min="0"
    step="100"
    placeholder="Ej: 10000"
    value={precioHotel}
    onChange={(e) =>
      setPrecioHotel(e.target.value)
    }
  />
</div>

<div className="form-group">
  <label className="form-label">
    Precio Guardería
  </label>

  <input
    className="form-input"
    type="number"
    min="0"
    step="100"
    placeholder="Ej: 7000"
    value={precioGuarderia}
    onChange={(e) =>
      setPrecioGuarderia(e.target.value)
    }
  />
</div>

                  <div className="form-group">
                    <label className="form-label">
                      Propietario
                    </label>

                    <select
                      className="form-select"
                      value={propietarioId}
                      onChange={(e) =>
                        setPropietarioId(
                          e.target.value
                        )
                      }
                      required
                    >
                      {propietarios.map(
                        (propietario) => (
                          <option
                            key={propietario.id}
                            value={
                              propietario.id
                            }
                          >
                            {
                              propietario.nombre
                            }{" "}
                            {
                              propietario.apellidos
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Raza
                    </label>

                    <select
                      className="form-select"
                      value={razaId}
                      onChange={(e) =>
                        setRazaId(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecciona
                      </option>

                      {razas.map((raza) => (
                        <option
                          key={raza.id}
                          value={raza.id}
                        >
                          {raza.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">
                      Alimentación
                    </label>

                    <textarea
                      className="form-textarea"
                      value={
                        instruccionesAlimentacion
                      }
                      onChange={(e) =>
                        setInstruccionesAlimentacion(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">
                      Comportamiento
                    </label>

                    <textarea
                      className="form-textarea"
                      value={
                        observacionesComportamiento
                      }
                      onChange={(e) =>
                        setObservacionesComportamiento(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">
                      Observaciones médicas
                    </label>

                    <textarea
                      className="form-textarea"
                      value={
                        observacionesMedicas
                      }
                      onChange={(e) =>
                        setObservacionesMedicas(
                          e.target.value
                        )
                      }
                    />
                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setModalEditar(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={guardando}
                  >
                    {guardando
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

      {modalVacuna && (
        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-header">
              <h2>
                {vacunaEditando
    ? "Editar vacuna"
    : "Registrar vacuna"}
              </h2>

              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setModalVacuna(false)
                }
              >
                ×
              </button>
            </div>

            <div className="modal-body">

              <form
                onSubmit={guardarVacuna}
              >

                <div className="form-grid">

                  <div className="form-group full">
                    <label className="form-label">
                      Tipo de vacuna *
                    </label>

                    <select
                      className="form-select"
                      value={tipoVacunaId}
                      onChange={(e) =>
                        setTipoVacunaId(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecciona vacuna
                      </option>

                      {tiposVacuna.map(
                        (tipo) => (
                          <option
                            key={tipo.id}
                            value={tipo.id}
                          >
                            {tipo.nombre}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Fecha aplicación *
                    </label>

                    <input
                      className="form-input"
                      type="date"
                      value={
                        fechaAplicacionVacuna
                      }
                      onChange={(e) =>
                        setFechaAplicacionVacuna(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Fecha vencimiento
                    </label>

                    <input
                      className="form-input"
                      type="date"
                      value={
                        fechaVencimientoVacuna
                      }
                      onChange={(e) =>
                        setFechaVencimientoVacuna(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">
                      Observaciones
                    </label>

                    <textarea
                      className="form-textarea"
                      value={
                        observacionesVacuna
                      }
                      onChange={(e) =>
                        setObservacionesVacuna(
                          e.target.value
                        )
                      }
                    />
                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setModalVacuna(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={guardando}
                  >
                    Registrar vacuna
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

      {modalDesparasitacion && (
        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-header">
       <h2>
  {desparasitacionEditando
    ? "Editar desparasitación"
    : "Registrar desparasitación"}
</h2>

              <button
                className="icon-button"
                type="button"
                onClick={() =>
                  setModalDesparasitacion(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="modal-body">

              <form
                onSubmit={
                  guardarDesparasitacion
                }
              >

                <div className="form-grid">

                  <div className="form-group full">
                    <label className="form-label">
                      Tipo *
                    </label>

                    <select
                      className="form-select"
                      value={
                        tipoDesparasitacionId
                      }
                      onChange={(e) =>
                        setTipoDesparasitacionId(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecciona tipo
                      </option>

                      {tiposDesparasitacion.map(
                        (tipo) => (
                          <option
                            key={tipo.id}
                            value={tipo.id}
                          >
                            {tipo.nombre}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Fecha aplicación *
                    </label>

                    <input
                      className="form-input"
                      type="date"
                      value={
                        fechaAplicacionDesparasitacion
                      }
                      onChange={(e) =>
                        setFechaAplicacionDesparasitacion(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Próxima fecha
                    </label>

                    <input
                      className="form-input"
                      type="date"
                      value={
                        fechaProximaDesparasitacion
                      }
                      onChange={(e) =>
                        setFechaProximaDesparasitacion(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">
                      Observaciones
                    </label>

                    <textarea
                      className="form-textarea"
                      value={
                        observacionesDesparasitacion
                      }
                      onChange={(e) =>
                        setObservacionesDesparasitacion(
                          e.target.value
                        )
                      }
                    />
                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setModalDesparasitacion(
                        false
                      )
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={guardando}
                  >
                    Registrar desparasitación
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}