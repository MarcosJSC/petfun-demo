"use client";

import {
FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { usePermisos } from "@/hooks/usePermisos";
import Link from "next/link";
import { obtenerContextoSucursal } from "@/lib/sucursalActiva";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";


type Estadia = {
   id: number;

  perrito_id: number;
  tipo_estadia_id: number;
  estado_estadia_id: number;
  estado_pago_id: number;
  forma_pago_id: number | null;

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

sucursal_id: number;

sucursales: {
  id: number;
  nombre: string;
} | null;
};


type Perrito = {
  id: number;
  nombre: string;
  precio_hotel: number | null;
  precio_guarderia: number | null;

  propietarios: {
    nombre: string;
    apellidos: string | null;
  } | null;
};

type TipoEstadia = {
  id: number;
  nombre: string;
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

function formatearColones(valor: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor);
}




function EstadiasContent() {

const router = useRouter();  

const searchParams = useSearchParams();

const {
  puede,
  esSuperadmin,
} = usePermisos();

const [
  sucursalFiltro,
  setSucursalFiltro,
] = useState("");

const [
  sucursalesFiltro,
  setSucursalesFiltro,
] = useState<
  {
    id: number;
    nombre: string;
  }[]
>([]);

const estadiaEditarDesdeUrl =
  searchParams.get("editar");

const fechaNuevaDesdeUrl =
  searchParams.get("nueva");

  const [estadias, setEstadias] =
    useState<Estadia[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

 const [perritos, setPerritos] =
  useState<Perrito[]>([]);

const [tiposEstadia, setTiposEstadia] =
  useState<TipoEstadia[]>([]);

const [modalAbierto, setModalAbierto] =
  useState(false);

const [perritoId, setPerritoId] =
  useState("");

  const [busquedaPerrito, setBusquedaPerrito] =
  useState("");

const [tipoEstadiaId, setTipoEstadiaId] =
  useState("");   

  const [fechaEntrada, setFechaEntrada] =
  useState("");

const [horaEntrada, setHoraEntrada] =
  useState("");

const [fechaSalida, setFechaSalida] =
  useState("");

const [horaSalida, setHoraSalida] =
  useState("");

const [diasHotel, setDiasHotel] =
   useState<number | "">(0);

const [diasGuarderia, setDiasGuarderia] =
  useState<number | "">(0);

  const [precioHotel, setPrecioHotel] =
   useState<number | "">(0);

const [precioGuarderia, setPrecioGuarderia] =
  useState<number | "">(0);

const [descuento, setDescuento] =
  useState<number | "">(0);

 const [estadosPago, setEstadosPago] =
  useState<{ id: number; nombre: string }[]>([]);

const [formasPago, setFormasPago] =
  useState<{ id: number; nombre: string }[]>([]);

const [estadoPagoId, setEstadoPagoId] =
  useState("");

const [formaPagoId, setFormaPagoId] =
  useState("");

const [montoPagado, setMontoPagado] =
   useState<number | "">(0);

const [estadosEstadia, setEstadosEstadia] =
  useState<{ id: number; nombre: string }[]>([]);

const [estadoEstadiaId, setEstadoEstadiaId] =
  useState("");

const [entregadoPor, setEntregadoPor] =
  useState("");

const [retiradoPor, setRetiradoPor] =
  useState("");

const [alimentacionEstadia, setAlimentacionEstadia] =
  useState("");

const [observaciones, setObservaciones] =
  useState("");  

  const [guardando, setGuardando] =
  useState(false);

  const [estadiaEditando, setEstadiaEditando] =
  useState<Estadia | null>(null);

  const [busqueda, setBusqueda] =
  useState("");

  const [paginaActual, setPaginaActual] =
  useState(1);

const registrosPorPagina = 8;

  const [
  permitirRecalculoEdicion,
  setPermitirRecalculoEdicion,
] = useState(false);

  async function cargarEstadias() {
    setCargando(true);

    const { data, error } = await supabase
      .from("estadias")
      .select(`
    id,
    sucursal_id,
perrito_id,
tipo_estadia_id,
estado_estadia_id,
estado_pago_id,
forma_pago_id,

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
        ),

          sucursales (
        id,
        nombre
      )

      `)
      .order("fecha_entrada", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      setMensaje(
        "No se pudieron cargar las estadías."
      );

      setCargando(false);
      return;
    }

  setEstadias(
  (data ?? []) as unknown as Estadia[]
);

    setCargando(false);
  }

async function cargarSucursalesFiltro() {
  const { data, error } =
    await supabase
      .from("sucursales")
      .select(`
        id,
        nombre
      `)
      .eq("activa", true)
      .order("nombre");

  if (error) {
    console.error(
      "Error cargando sucursales:",
      error
    );
    return;
  }

  setSucursalesFiltro(
    data ?? []
  );
}


  async function cargarCatalogos() {
const [
  perritosResult,
  tiposResult,
  estadosPagoResult,
  formasPagoResult,
  estadosEstadiaResult,
] = await Promise.all([
supabase
  .from("perritos")
  .select(`
    id,
    nombre,
    precio_hotel,
    precio_guarderia,

    propietarios (
      nombre,
      apellidos
    )
  `)
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("tipos_estadia")
      .select("id, nombre")
      .order("id"),

  supabase
  .from("estados_pago")
  .select("id, nombre")
  .order("id"),

supabase
  .from("formas_pago")
  .select("id, nombre")
  .order("id"),  
  
 supabase
  .from("estados_estadia")
  .select("id, nombre")
  .order("id"),


  ]);



  if (perritosResult.error) {
    console.error(
      perritosResult.error
    );
  } else {
    setPerritos(
  (perritosResult.data ?? []) as unknown as Perrito[]
);
  }

  if (tiposResult.error) {
    console.error(
      tiposResult.error
    );
  } else {
    setTiposEstadia(
      (tiposResult.data ?? []) as TipoEstadia[]
    );
  }

if (estadosPagoResult.error) {
  console.error(estadosPagoResult.error);
} else {
  setEstadosPago(
    estadosPagoResult.data ?? []
  );
}

if (formasPagoResult.error) {
  console.error(formasPagoResult.error);
} else {
  setFormasPago(
    formasPagoResult.data ?? []
  );
}

if (estadosEstadiaResult.error) {
  console.error(estadosEstadiaResult.error);
} else {
  setEstadosEstadia(
    estadosEstadiaResult.data ?? []
  );
}

}




function limpiarFormulario() {
  setPerritoId("");
  setBusquedaPerrito("");
  setTipoEstadiaId("");

  setFechaEntrada("");
  setHoraEntrada("");
  setFechaSalida("");
  setHoraSalida("");

  setDiasHotel(0);
  setDiasGuarderia(0);

  setPrecioHotel(0);
  setPrecioGuarderia(0);

  setDescuento(0);

  setFormaPagoId("");
  setMontoPagado(0);

  setEntregadoPor("");
  setRetiradoPor("");
  setAlimentacionEstadia("");
  setObservaciones("");

  // Los dejamos vacíos para que el useEffect
  // vuelva a seleccionar automáticamente
  // Reservada y Pendiente.
  setEstadoEstadiaId("");
  setEstadoPagoId("");
}

function cerrarModal() {
  if (guardando) {
    return;
  }

  limpiarFormulario();
  setEstadiaEditando(null);
  setModalAbierto(false);

if (
  estadiaEditarDesdeUrl ||
  fechaNuevaDesdeUrl
) {
  router.replace("/estadias");
}
}

function abrirEditarEstadia(estadia: Estadia) {

   setPermitirRecalculoEdicion(false);

  setEstadiaEditando(estadia);

  setPerritoId(
    String(estadia.perrito_id)
  );

  setBusquedaPerrito("");

  setTipoEstadiaId(
    String(estadia.tipo_estadia_id)
  );

  setFechaEntrada(
    estadia.fecha_entrada
  );

  setHoraEntrada(
    estadia.hora_entrada ?? ""
  );

  setFechaSalida(
    estadia.fecha_salida
  );

  setHoraSalida(
    estadia.hora_salida ?? ""
  );

  setDiasHotel(
    estadia.dias_hotel
  );

  setDiasGuarderia(
    estadia.dias_guarderia
  );

  setPrecioHotel(
    Number(
      estadia.precio_hotel_aplicado
    )
  );

  setPrecioGuarderia(
    Number(
      estadia.precio_guarderia_aplicado
    )
  );

  setDescuento(
    Number(estadia.descuento)
  );

  setEstadoEstadiaId(
    String(estadia.estado_estadia_id)
  );

  setEstadoPagoId(
    String(estadia.estado_pago_id)
  );

  setFormaPagoId(
    estadia.forma_pago_id
      ? String(estadia.forma_pago_id)
      : ""
  );

  setMontoPagado(
    Number(estadia.monto_pagado)
  );

  setEntregadoPor(
    estadia.entregado_por ?? ""
  );

  setRetiradoPor(
    estadia.retirado_por ?? ""
  );

  setAlimentacionEstadia(
    estadia.alimentacion_estadia ?? ""
  );

  setObservaciones(
    estadia.observaciones ?? ""
  );

  setMensaje("");
  setModalAbierto(true);
}

async function eliminarEstadia(
  estadia: Estadia
) {
  const confirmar = window.confirm(
    `¿Seguro que deseas eliminar esta estadía de ${
      estadia.perritos?.nombre ?? "este perrito"
    }?\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmar) {
    return;
  }

  const { error } = await supabase
    .from("estadias")
    .delete()
    .eq("id", estadia.id);

  if (error) {
    console.error(error);

    setMensaje(
      "No se pudo eliminar la estadía."
    );

    return;
  }

  setMensaje(
    "Estadía eliminada correctamente."
  );

  await cargarEstadias();
}

function abrirModal() {
  setEstadiaEditando(null);
  setPermitirRecalculoEdicion(true);

  limpiarFormulario();
  setMensaje("");
  setModalAbierto(true);
}

async function guardarEstadia(
  e: FormEvent
) {
  e.preventDefault();

  if (
    !perritoId ||
    !tipoEstadiaId ||
    !fechaEntrada ||
    !fechaSalida ||
    !estadoEstadiaId ||
    !estadoPagoId
  ) {
    setMensaje(
      "Completa los campos obligatorios."
    );

    return;
  }

  setGuardando(true);
  setMensaje("");


  const contextoSucursal =
  await obtenerContextoSucursal();

if (!contextoSucursal.sucursalActivaId) {
  setGuardando(false);

  setMensaje(
    "No hay una sucursal activa disponible para guardar la estadía."
  );

  return;
}


const { data: perritoSeleccionado, error: errorPerrito } =
  await supabase
    .from("perritos")
    .select(`
      id,
      sucursal_id
    `)
    .eq(
      "id",
      Number(perritoId)
    )
    .single();

if (
  errorPerrito ||
  !perritoSeleccionado
) {
  setGuardando(false);

  setMensaje(
    "No se pudo validar la sucursal del perrito."
  );

  return;
}


if (
  perritoSeleccionado.sucursal_id !==
  contextoSucursal.sucursalActivaId
) {
  setGuardando(false);

  setMensaje(
    "El perrito seleccionado pertenece a otra sucursal."
  );

  return;
}


  const datosEstadia = {
    perrito_id:
      Number(perritoId),

    tipo_estadia_id:
      Number(tipoEstadiaId),

    estado_estadia_id:
      Number(estadoEstadiaId),

    estado_pago_id:
      Number(estadoPagoId),

    forma_pago_id:
      formaPagoId
        ? Number(formaPagoId)
        : null,

    fecha_entrada:
      fechaEntrada,

    hora_entrada:
      horaEntrada || null,

    fecha_salida:
      fechaSalida,

    hora_salida:
      horaSalida || null,

 dias_hotel:
  Number(diasHotel || 0),

dias_guarderia:
  Number(diasGuarderia || 0),

precio_hotel_aplicado:
  Number(precioHotel || 0),

precio_guarderia_aplicado:
  Number(precioGuarderia || 0),

    subtotal_hotel:
      subtotalHotel,

    subtotal_guarderia:
      subtotalGuarderia,

  descuento:
  Number(descuento || 0),

    total:
      total,

   monto_pagado:
  Number(montoPagado || 0),

    entregado_por:
      entregadoPor || null,

    retirado_por:
      retiradoPor || null,

    alimentacion_estadia:
      alimentacionEstadia || null,

    observaciones:
      observaciones || null,

 sucursal_id:
    perritoSeleccionado.sucursal_id,

  };

  let error;

  if (estadiaEditando) {
    const resultado = await supabase
      .from("estadias")
      .update(datosEstadia)
      .eq("id", estadiaEditando.id);

    error = resultado.error;
  } else {
    const resultado = await supabase
      .from("estadias")
      .insert(datosEstadia);

    error = resultado.error;
  }

  setGuardando(false);

  if (error) {
    console.error(error);

    setMensaje(
      estadiaEditando
        ? "No se pudo actualizar la estadía."
        : "No se pudo guardar la estadía."
    );

    return;
  }

  setMensaje(
    estadiaEditando
      ? "Estadía actualizada correctamente 🐶"
      : "Estadía guardada correctamente 🐶"
  );

limpiarFormulario();
setEstadiaEditando(null);
setModalAbierto(false);

if (
  estadiaEditarDesdeUrl ||
  fechaNuevaDesdeUrl
) {
  router.replace("/estadias");
}

await cargarEstadias();
}

useEffect(() => {
  cargarEstadias();
  cargarCatalogos();
  cargarSucursalesFiltro();
}, []);




useEffect(() => {
  if (
    estadosEstadia.length > 0 &&
    !estadoEstadiaId
  ) {
    const reservada =
      estadosEstadia.find(
        (estado) =>
          estado.nombre === "Reservada"
      );

    if (reservada) {
      setEstadoEstadiaId(
        String(reservada.id)
      );
    }
  }

  if (
    estadosPago.length > 0 &&
    !estadoPagoId
  ) {
    const pendiente =
      estadosPago.find(
        (estado) =>
          estado.nombre === "Pendiente"
      );

    if (pendiente) {
      setEstadoPagoId(
        String(pendiente.id)
      );
    }
  }
}, [
  estadosEstadia,
  estadosPago,
  estadoEstadiaId,
  estadoPagoId,
]);


useEffect(() => {
  if (!fechaNuevaDesdeUrl) {
    return;
  }

  setEstadiaEditando(null);

  limpiarFormulario();

  setFechaEntrada(
    fechaNuevaDesdeUrl
  );

  setFechaSalida(
    fechaNuevaDesdeUrl
  );

  setMensaje("");
  setModalAbierto(true);

}, [fechaNuevaDesdeUrl]);


useEffect(() => {
if (
  estadiaEditando &&
  !permitirRecalculoEdicion) {
  return;
}
  if (
    !fechaEntrada ||
    !fechaSalida ||
    !tipoEstadiaId
  ) {
    return;
  }

  const entrada = new Date(
    `${fechaEntrada}T00:00:00`
  );

  const salida = new Date(
    `${fechaSalida}T00:00:00`
  );

  const diferencia =
    salida.getTime() -
    entrada.getTime();

const dias = Math.max(
  1,
  Math.round(
    diferencia /
      (1000 * 60 * 60 * 24)
  ) + 1
);

  const tipoSeleccionado =
    tiposEstadia.find(
      (tipo) =>
        tipo.id === Number(tipoEstadiaId)
    );

  if (!tipoSeleccionado) {
    return;
  }

if (
  tipoSeleccionado.nombre === "Hotel"
) {
  setDiasHotel(dias);
  setDiasGuarderia(0);
}

if (
  tipoSeleccionado.nombre === "Guardería"
) {
  setDiasHotel(0);
  setDiasGuarderia(dias);
}

if (
  tipoSeleccionado.nombre === "Mixta"
) {
  setDiasHotel(
    Math.max(0, dias - 1)
  );

  setDiasGuarderia(1);
}
}, [
  fechaEntrada,
  fechaSalida,
  tipoEstadiaId,
  tiposEstadia,
  estadiaEditando,
  permitirRecalculoEdicion,
]);



const perritoSeleccionado =
  perritos.find(
    (perrito) =>
      perrito.id === Number(perritoId)
  );


  useEffect(() => {
  if (!perritoSeleccionado) {
    setPrecioHotel(0);
    setPrecioGuarderia(0);
    return;
  }

  setPrecioHotel(
    Number(
      perritoSeleccionado.precio_hotel ?? 0
    )
  );

  setPrecioGuarderia(
    Number(
      perritoSeleccionado.precio_guarderia ?? 0
    )
  );
}, [perritoSeleccionado]);


useEffect(() => {
  if (
    !estadiaEditarDesdeUrl ||
    estadias.length === 0
  ) {
    return;
  }

  const estadia =
    estadias.find(
      (item) =>
        item.id ===
        Number(estadiaEditarDesdeUrl)
    );

  if (!estadia) {
    return;
  }

  abrirEditarEstadia(estadia);

}, [
  estadiaEditarDesdeUrl,
  estadias,
]);




const subtotalHotel =
  Number(diasHotel || 0) * Number(precioHotel || 0)



const subtotalGuarderia =
  Number(diasGuarderia || 0) * Number(precioGuarderia || 0)

const subtotal =
  subtotalHotel +
  subtotalGuarderia;

const total =
  Math.max(
    0,
    subtotal - Number(descuento || 0)
  );

const saldoPendiente =
  Math.max(
    0,
    Number(total || 0) -
      Number(montoPagado || 0)
  );

const perritosFiltrados =
  perritos.filter((perrito) => {
    const propietario =
      perrito.propietarios
        ? `${perrito.propietarios.nombre} ${
            perrito.propietarios.apellidos ?? ""
          }`
        : "";

    const texto =
      `${perrito.nombre} ${propietario}`
        .toLowerCase();

    return texto.includes(
      busquedaPerrito
        .trim()
        .toLowerCase()
    );
  }
); 



const estadiasFiltradas =
  estadias.filter((estadia) => {
   
   
   const coincideSucursal =
  !sucursalFiltro ||
  String(estadia.sucursal_id) ===
    sucursalFiltro;
   
    const texto =
      [
        estadia.perritos?.nombre,

        estadia.perritos?.propietarios
          ?.nombre,

        estadia.perritos?.propietarios
          ?.apellidos,

        estadia.tipos_estadia?.nombre,
        estadia.estados_estadia?.nombre,
        estadia.estados_pago?.nombre,
        estadia.fecha_entrada,
        estadia.fecha_salida,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

 const coincideBusqueda =
  texto.includes(
    busqueda.trim().toLowerCase()
  );

return (
  coincideBusqueda &&
  coincideSucursal
);
  });

const totalPaginas =
  Math.max(
    1,
    Math.ceil(
      estadiasFiltradas.length /
        registrosPorPagina
    )
  );

const indiceInicio =
  (paginaActual - 1) *
  registrosPorPagina;

const indiceFin =
  indiceInicio +
  registrosPorPagina;

const estadiasPaginadas =
  estadiasFiltradas.slice(
    indiceInicio,
    indiceFin
  );

  useEffect(() => {
  const estadoSeleccionado =
    estadosPago.find(
      (estado) =>
        estado.id === Number(estadoPagoId)
    );

  if (
    estadoSeleccionado?.nombre === "Pagado"
  ) {
    setMontoPagado(
      Number(total || 0)
    );
  }
}, [
  estadoPagoId,
  total,
  estadosPago,
]);

useEffect(() => {
  setPaginaActual(1);
}, [
  busqueda,
  sucursalFiltro,
]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Estadías
          </h1>

          <p className="page-description">
            Administración de hotel y guardería
          </p>
        </div>

<div
  style={{
    display: "flex",
    gap: "10px",
    alignItems: "center",
  }}
>
  <Link
    href="/estadias/calendario"
    className="secondary-button"
  >
    📅 Calendario
  </Link>
{puede("estadias.crear") && (
  <button
    type="button"
    className="primary-button"
    onClick={abrirModal}
  >
    + Nueva estadía
  </button>
)}
</div>
      </div>

      {mensaje && (
        <div className="status-message">
          {mensaje}
        </div>
      )}

      <section className="list-card">
  
 <div className="list-toolbar">
  <div>
    <strong>
      Estadías registradas
    </strong>

    <div
      style={{
        color:
          "var(--color-text-secondary)",
        fontSize: "14px",
        marginTop: "3px",
      }}
    >
      Total: {estadias.length}
    </div>
  </div>

  <input
    className="search-input"
    placeholder="Buscar por perrito, propietario, tipo, estado o fecha..."
    value={busqueda}
    onChange={(e) =>
      setBusqueda(e.target.value)
    }
  />

{esSuperadmin && (
  <select
    className="search-input"
    value={sucursalFiltro}
    onChange={(e) =>
      setSucursalFiltro(
        e.target.value
      )
    }
  >
    <option value="">
      Todas las sucursales
    </option>

    {sucursalesFiltro.map(
      (sucursal) => (
        <option
          key={sucursal.id}
          value={sucursal.id}
        >
          {sucursal.nombre}
        </option>
      )
    )}
  </select>
)}

</div>

        {cargando ? (
          <div className="empty-state">
            Cargando estadías...
          </div>
      
      ) : estadias.length === 0 ? (
  <div className="empty-state">
    Todavía no hay estadías registradas.
  </div>
) : estadiasFiltradas.length === 0 ? (
  <div className="empty-state">
    No se encontraron estadías.
  </div>
) : (


 <>
  {/* Vista escritorio */}
<div className="desktop-only">
  <div className="table-scroll-x">
    <table className="data-table">
      <thead>
        <tr>
          <th>Perrito</th>
          <th>Tipo</th>
          <th>Entrada</th>
          <th>Salida</th>
          <th>Hotel</th>
          <th>Guardería</th>
          <th>Estado</th>
          <th>Pago</th>
          <th>Total</th>
          <th>Saldo</th>
          <th>Acciones</th>
          <th>Sucursal</th>
        </tr>
      </thead>

      <tbody>
       {estadiasPaginadas.map((estadia) => {
          const saldo =
            estadia.total -
            estadia.monto_pagado;

          return (
            <tr key={estadia.id}>
              <td>
                <strong>
                  🐶{" "}
                  {estadia.perritos?.nombre || "—"}
                </strong>
              </td>

              <td>
                {estadia.tipos_estadia?.nombre || "—"}
              </td>

              <td>
                {formatearFecha(
                  estadia.fecha_entrada
                )}
              </td>

              <td>
                {formatearFecha(
                  estadia.fecha_salida
                )}
              </td>

              <td>
                {estadia.dias_hotel}
              </td>

              <td>
                {estadia.dias_guarderia}
              </td>

              <td>
                {estadia.estados_estadia?.nombre || "—"}
              </td>

              <td>
                {estadia.estados_pago?.nombre || "—"}
              </td>

              <td>
                {formatearColones(
                  estadia.total
                )}
              </td>

              <td>
                {formatearColones(
                  Math.max(0, saldo)
                )}
              </td>

              <td>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >

                {puede("estadias.editar") && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      abrirEditarEstadia(estadia)
                    }
                  >
                    Editar
                  </button>
                  )}

{puede("estadias.eliminar") && (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      eliminarEstadia(estadia)
                    }
                  >
                    Eliminar
                  </button>
)}

                </div>
              </td>

<td>
  <span className="branch-status active">
    {estadia.sucursales?.nombre || "—"}
  </span>
</td>

            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

  {/* Vista móvil */}
  <div className="mobile-only">
    <div className="mobile-list">

      {estadiasPaginadas.map((estadia) => {
        const saldo =
          Math.max(
            0,
            estadia.total -
              estadia.monto_pagado
          );

        return (
  <div
  key={estadia.id}
  className="mobile-record-card"
  role="button"
  tabIndex={0}
  onClick={() => {
    window.location.href =
      `/estadias/${estadia.id}`;
  }}
  onKeyDown={(e) => {
    if (
      e.key === "Enter" ||
      e.key === " "
    ) {
      window.location.href =
        `/estadias/${estadia.id}`;
    }
  }}
>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "flex-start",
                marginBottom: "14px",
              }}
            >
              <div className="mobile-record-title">
                🐶{" "}
                {estadia.perritos?.nombre ||
                  "—"}
              </div>

              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background:
                    "var(--color-primary-soft)",
                  color:
                    "var(--color-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {estadia.tipos_estadia?.nombre ||
                  "—"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span>
                {formatearFecha(
                  estadia.fecha_entrada
                )}
              </span>

              <span
                style={{
                  color:
                    "var(--color-text-secondary)",
                }}
              >
                →
              </span>

              <span>
                {formatearFecha(
                  estadia.fecha_salida
                )}
              </span>
            </div>

            <div className="mobile-record-grid">

              <div>
                <span className="mobile-record-label">
                  Estado
                </span>

                <strong>
                  {estadia.estados_estadia?.nombre ||
                    "—"}
                </strong>
              </div>

              <div>
                <span className="mobile-record-label">
                  Pago
                </span>

                <strong>
                  {estadia.estados_pago?.nombre ||
                    "—"}
                </strong>
              </div>

              <div>
                <span className="mobile-record-label">
                  Total
                </span>

                <strong>
                  {formatearColones(
                    estadia.total
                  )}
                </strong>
              </div>

              <div>
                <span className="mobile-record-label">
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
<p></p>
           <div
  style={{
    gridColumn: "1 / -1",
  }}
>
  <span className="mobile-list-label">
    Sucursal
  </span>

  <strong>
    {estadia.sucursales?.nombre || "—"}
  </strong>
</div> 

         <div className="mobile-record-action">
  Ver estadía →
</div>


<div
  style={{
    marginTop: "12px",
  }}
>
  {puede("estadias.eliminar") && (
  <button
    type="button"
    className="danger-button"
    style={{
      width: "100%",
    }}
    onClick={(e) => {
      e.stopPropagation();
      eliminarEstadia(estadia);
    }}
  >
    Eliminar estadía
  </button>
  )}
</div>
          </div>
        );
      })}

    </div>
  </div>
{estadiasFiltradas.length > 0 && (
  <div className="pagination">

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

    <span className="pagination-info">
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


{modalAbierto && (
  <div
    className="modal-backdrop"
 onMouseDown={(e) => {
  if (e.target === e.currentTarget) {
    cerrarModal();
  }
}}
  >
    <div className="modal">

      <div className="modal-header">
   <h2>
  {estadiaEditando
    ? "Editar estadía"
    : "Nueva estadía"}
</h2>

        <button
          type="button"
          className="icon-button"
         onClick={cerrarModal}
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        <form onSubmit={guardarEstadia}>

        <div className="form-grid">

          <div className="form-group full">
            <label className="form-label">
              Perrito *
            </label>

<div style={{ marginBottom: "10px" }}>
  <input
    type="text"
    className="form-input"
    placeholder="Buscar por perrito o propietario..."
    value={busquedaPerrito}
    onChange={(e) =>
      setBusquedaPerrito(e.target.value)
    }
  />
</div>

            <select
              className="form-select"
              value={perritoId}
              onChange={(e) =>
                setPerritoId(
                  e.target.value
                )
              }
            >
              <option value="">
                Selecciona perrito
              </option>

{perritosFiltrados.map((perrito) => (
  <option
    key={perrito.id}
    value={perrito.id}
  >
    {perrito.nombre}
    {" — "}
    {perrito.propietarios
      ? `${perrito.propietarios.nombre} ${
          perrito.propietarios.apellidos ?? ""
        }`
      : "Sin propietario"}
  </option>
))}
            </select>
          </div>

          <div className="form-group full">
            <label className="form-label">
              Tipo de estadía *
            </label>

            <select
              className="form-select"
              value={tipoEstadiaId}
       onChange={(e) => {
  setPermitirRecalculoEdicion(true);
  setTipoEstadiaId(e.target.value);
}}
            >
              <option value="">
                Selecciona tipo
              </option>

              {tiposEstadia.map(
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

        </div>

     <div className="form-group full">
  <label className="form-label">
    Estado de la estadía
  </label>

  <select
    className="form-select"
    value={estadoEstadiaId}
    onChange={(e) =>
      setEstadoEstadiaId(e.target.value)
    }
  >
    <option value="">
      Selecciona estado
    </option>

    {estadosEstadia.map((estado) => (
      <option
        key={estado.id}
        value={estado.id}
      >
        {estado.nombre}
      </option>
    ))}
  </select>
</div>   

        <div className="form-group">
  <label className="form-label">
    Fecha de entrada *
  </label>

  <input
    type="date"
    className="form-input"
    value={fechaEntrada}
onChange={(e) => {
  setPermitirRecalculoEdicion(true);
  setFechaEntrada(e.target.value);
}}
  />
</div>

<div className="form-group">
  <label className="form-label">
    Hora de entrada
  </label>

  <input
    type="time"
    className="form-input"
    value={horaEntrada}
    onChange={(e) =>
      setHoraEntrada(e.target.value)
    }
  />
</div>

<div className="form-group">
  <label className="form-label">
    Fecha de salida *
  </label>

  <input
    type="date"
    className="form-input"
    value={fechaSalida}
    min={fechaEntrada || undefined}
 onChange={(e) => {
  setPermitirRecalculoEdicion(true);
  setFechaSalida(e.target.value);
}}
  />
</div>

<div className="form-group">
  <label className="form-label">
    Hora de salida
  </label>

  <input
    type="time"
    className="form-input"
    value={horaSalida}
    onChange={(e) =>
      setHoraSalida(e.target.value)
    }
  />
</div>

<div className="form-group">
  <label className="form-label">
    Días de hotel
  </label>

<input
  type="number"
  min="0"
  className="form-input"
  value={diasHotel}
  onChange={(e) => {
    const valor = e.target.value;

    setDiasHotel(
      valor === ""
        ? ""
        : Math.max(0, Number(valor))
    );
  }}
/>
</div>

<div className="form-group">
  <label className="form-label">
    Días de guardería
  </label>

<input
  type="number"
  min="0"
  className="form-input"
  value={diasGuarderia}
  onChange={(e) => {
    const valor = e.target.value;

    setDiasGuarderia(
      valor === ""
        ? ""
        : Math.max(0, Number(valor))
    );
  }}
/>
</div>

<div className="form-group">
  <label className="form-label">
    Precio hotel
  </label>

<input
  type="number"
  min="0"
  className="form-input"
  value={precioHotel}
  onChange={(e) => {
    const valor = e.target.value;

    setPrecioHotel(
      valor === ""
        ? ""
        : Math.max(0, Number(valor))
    );
  }}
/>
</div>

<div className="form-group">
  <label className="form-label">
    Precio guardería
  </label>

<input
  type="number"
  min="0"
  className="form-input"
  value={precioGuarderia}
  onChange={(e) => {
    const valor = e.target.value;

    setPrecioGuarderia(
      valor === ""
        ? ""
        : Math.max(0, Number(valor))
    );
  }}
/>
</div>

<div className="form-group full">
  <label className="form-label">
    Descuento
  </label>

<input
  type="number"
  min="0"
  className="form-input"
  value={descuento}
  onChange={(e) => {
    const valor = e.target.value;

    setDescuento(
      valor === ""
        ? ""
        : Math.max(0, Number(valor))
    );
  }}
/>
</div>

<div className="form-group">
  <label className="form-label">
    Estado de pago
  </label>

  <select
    className="form-select"
    value={estadoPagoId}
    onChange={(e) =>
      setEstadoPagoId(e.target.value)
    }
  >
    <option value="">
      Selecciona estado
    </option>

    {estadosPago.map((estado) => (
      <option
        key={estado.id}
        value={estado.id}
      >
        {estado.nombre}
      </option>
    ))}
  </select>
</div>

<div className="form-group">
  <label className="form-label">
    Forma de pago
  </label>

  <select
    className="form-select"
    value={formaPagoId}
    onChange={(e) =>
      setFormaPagoId(e.target.value)
    }
  >
    <option value="">
      Selecciona forma
    </option>

    {formasPago.map((forma) => (
      <option
        key={forma.id}
        value={forma.id}
      >
        {forma.nombre}
      </option>
    ))}
  </select>
</div>

<div className="form-group full">
  <label className="form-label">
    Monto pagado
  </label>

 <input
  type="number"
  min="0"
  className="form-input"
  value={montoPagado}
  onChange={(e) => {
    const valor = e.target.value;

    setMontoPagado(
      valor === ""
        ? ""
        : Math.max(0, Number(valor))
    );
  }}
/>
</div>

<div
  className="card"
  style={{
    marginTop: "20px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
    }}
  >
    <span>
      Hotel
    </span>

    <strong>
      {formatearColones(
        subtotalHotel
      )}
    </strong>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
    }}
  >
    <span>
      Guardería
    </span>

    <strong>
      {formatearColones(
        subtotalGuarderia
      )}
    </strong>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
    }}
  >
    <span>
      Subtotal
    </span>

    <strong>
      {formatearColones(
        subtotal
      )}
    </strong>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "12px",
    }}
  >
    <span>
      Descuento
    </span>

    <strong>
    {formatearColones(
  Number(descuento || 0)
)}
    </strong>
  </div>

  <div
    style={{
      height: "1px",
      background:
        "var(--color-border)",
      marginBottom: "12px",
    }}
  />

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <strong>
      Total
    </strong>

    <strong
      style={{
        fontSize: "24px",
      }}
    >
   {formatearColones(
  Number(descuento || 0)
)}
    </strong>
  </div>
</div>

<div
  style={{
    height: "1px",
    background: "var(--color-border)",
    marginTop: "12px",
    marginBottom: "12px",
  }}
/>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  }}
>
  <span>
    Monto pagado
  </span>

  <strong>
 {formatearColones(
  Number(montoPagado || 0)
)}
  </strong>
</div>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <strong>
    Saldo pendiente
  </strong>

  <strong
    style={{
      fontSize: "20px",
      color:
        saldoPendiente > 0
          ? "var(--color-danger)"
          : "var(--color-success)",
    }}
  >
    {formatearColones(
      saldoPendiente
    )}
  </strong>
</div>



<div
  className="form-group"
  style={{ marginTop: "24px" }}
>
  <label className="form-label">
    Entregado por
  </label>

  <input
    className="form-input"
    value={entregadoPor}
    onChange={(e) =>
      setEntregadoPor(e.target.value)
    }
    placeholder="Nombre de quien entrega"
  />
</div>

<div className="form-group">
  <label className="form-label">
    Retirado por
  </label>

  <input
    className="form-input"
    value={retiradoPor}
    onChange={(e) =>
      setRetiradoPor(e.target.value)
    }
    placeholder="Nombre de quien retira"
  />
</div>

<div className="form-group full">
  <label className="form-label">
    Alimentación durante la estadía
  </label>

  <textarea
    className="form-textarea"
    value={alimentacionEstadia}
    onChange={(e) =>
      setAlimentacionEstadia(
        e.target.value
      )
    }
    placeholder="Indicaciones especiales de alimentación..."
  />
</div>

<div className="form-group full">
  <label className="form-label">
    Observaciones
  </label>

  <textarea
    className="form-textarea"
    value={observaciones}
    onChange={(e) =>
      setObservaciones(e.target.value)
    }
    placeholder="Notas adicionales de esta estadía..."
  />
</div>

        <div className="modal-footer">

<button
  type="submit"
  className="primary-button"
  disabled={guardando}
>
{guardando
  ? "Guardando..."
  : estadiaEditando
    ? "Guardar cambios"
    : "Guardar estadía"}
</button>

<button
  type="button"
  className="secondary-button"
  onClick={cerrarModal}
  disabled={guardando}
>
  Cancelar
</button>

        </div>
 </form>
      </div>
    </div>
   
  </div>
  
)}


    </div>
  );

  }/*return estadias*/

export default function EstadiasPage() {
  return (
    <Suspense
      fallback={
        <div className="empty-state">
          Cargando estadías...
        </div>
      }
    >
      <EstadiasContent />
    </Suspense>
  );


}