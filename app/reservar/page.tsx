
"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const imagenes = [
  {
    src: "https://zepzmjitngvjuzzzodfj.supabase.co/storage/v1/object/public/branding/carrusel/navidad-booking-abierto.png",
    alt: "Reservas navideñas abiertas en PetFunCR",
    etiqueta: "TEMPORADA NAVIDEÑA",
  },
  {
    src: "https://zepzmjitngvjuzzzodfj.supabase.co/storage/v1/object/public/branding/carrusel/navidad-pocos-espacios.png",
    alt: "Recuerda mantener las vacunas y desparacitaciones al día",
    etiqueta: "VACUNAS Y DESPARACITACIONES",
  },
];

const LOGO =
  "https://zepzmjitngvjuzzzodfj.supabase.co/storage/v1/object/public/branding/logo-petfuncr.png";

export default function ReservarPage() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
    const [codigo, setCodigo] = useState("");
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState("");


const [perritos, setPerritos] = useState<
  { id: number; nombre: string }[]
>([]);

const [codigoValidado, setCodigoValidado] = useState(false);
const [perritosSeleccionados, setPerritosSeleccionados] = useState<number[]>([]);
const [seleccionConfirmada, setSeleccionConfirmada] = useState(false);

const [pasoReserva, setPasoReserva] = useState<1 | 2 | 3 | 4>(1);


const [tipoEstadia, setTipoEstadia] = useState<"1" | "2">("1");
const [fechaEntrada, setFechaEntrada] = useState("");
const [fechaSalida, setFechaSalida] = useState("");
const [turnoEntrada, setTurnoEntrada] = useState<"manana" | "tarde">("manana");

const [validandoSolicitud, setValidandoSolicitud] = useState(false);
const [errorSolicitud, setErrorSolicitud] = useState("");
const [resultadoValidacion, setResultadoValidacion] = useState<{
  valido: boolean;
  perritos: {
    id: number;
    nombre: string;
    cumple: boolean;
    requisitosPendientes: string[];
  }[];
  disponibilidad: {
    disponible: boolean;
    capacidadMaxima: number;
    dias: {
      fecha: string;
      ocupacionActual: number;
      ocupacionProyectada: number;
      capacidadMaxima: number;
      disponible: boolean;
    }[];
    motivo: string | null;
  };
} | null>(null);


const [observacionesCliente, setObservacionesCliente] = useState("");
const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
const [errorEnvio, setErrorEnvio] = useState("");



const [codigoConsulta, setCodigoConsulta] = useState("");
const [consultandoReservas, setConsultandoReservas] = useState(false);
const [errorConsultaReservas, setErrorConsultaReservas] = useState("");
const [reservasCliente, setReservasCliente] = useState<any[]>([]);
const [consultaRealizada, setConsultaRealizada] = useState(false);
const [cancelandoReserva, setCancelandoReserva] = useState<string | null>(null);
const [errorCancelacion, setErrorCancelacion] = useState("");



const [solicitudCreada, setSolicitudCreada] = useState<{
  numeroReserva: string;
} | null>(null);



  useEffect(() => {
    if (pausado) return;

    const intervalo = window.setInterval(() => {
      setIndice((actual) => (actual + 1) % imagenes.length);
    }, 6000);

    return () => window.clearInterval(intervalo);
  }, [pausado]);

  // Desplaza al usuario al siguiente paso después de cada confirmación.
  // La página contiene una vista desktop y otra móvil; seleccionamos la visible.
  useEffect(() => {
    if (!codigoValidado || solicitudCreada) return;

    let selectorObjetivo: string | null = null;

 
if (pasoReserva === 2 || (pasoReserva === 3 && !seleccionConfirmada)) {
  selectorObjetivo = ".publica-perritos-encontrados";
} else if (pasoReserva === 3 && seleccionConfirmada) {
  selectorObjetivo = ".publica-campos-reserva";
} else if (pasoReserva === 4 && resultadoValidacion?.valido) {
  selectorObjetivo = ".publica-resumen-reserva";
}


    if (!selectorObjetivo) return;

    const frame = window.requestAnimationFrame(() => {
      const objetivos = Array.from(
        document.querySelectorAll<HTMLElement>(selectorObjetivo!)
      );
      const objetivoVisible = objetivos.find(
        (elemento) => elemento.getClientRects().length > 0
      );

      objetivoVisible?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
}, [codigoValidado, pasoReserva, seleccionConfirmada, solicitudCreada, resultadoValidacion]);

  // Después de consultar, lleva al cliente directamente a sus resultados.
  // Como hay vistas separadas para escritorio y móvil, desplazamos la visible.
  useEffect(() => {
    if (!consultaRealizada) return;

    const frame = window.requestAnimationFrame(() => {
      const objetivos = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".publica-reservas-desktop .publica-mis-reservas, .publica-reservas-mobile .publica-mis-reservas"
        )
      );
      const objetivoVisible = objetivos.find(
        (elemento) => elemento.getClientRects().length > 0
      );

      objetivoVisible?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [consultaRealizada]);

  function anterior() {
    setIndice((actual) => (actual - 1 + imagenes.length) % imagenes.length);
  }

  function siguiente() {
    setIndice((actual) => (actual + 1) % imagenes.length);
  }

  function irAReserva() {
    const esMovil = window.matchMedia("(max-width: 767px)").matches;
    document
      .getElementById(esMovil ? "formulario-reserva-mobile" : "formulario-reserva")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }


  

  
function formatearFecha(fecha: string) {
  if (!fecha) return "";

  const [anio, mes, dia] = fecha.slice(0, 10).split("-");

  if (!anio || !mes || !dia) return fecha;

  return `${dia}/${mes}/${anio}`;
}


  const imagen = imagenes[indice];

  
  async function validarCodigo() {
  setErrorAcceso("");
setCodigoValidado(false);
setPerritos([]);
setPerritosSeleccionados([]);
setSeleccionConfirmada(false);

    const codigoLimpio = codigo.trim().toUpperCase();

    if (!codigoLimpio) {
      setErrorAcceso("Ingresá tu código de propietario.");
      return;
    }

    setValidandoCodigo(true);

    try {
      const respuesta = await fetch("/api/reservas/publicas/acceso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo: codigoLimpio }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setErrorAcceso(
          resultado.error || "No fue posible validar el código."
        );
        return;
      }

      setCodigo(codigoLimpio);
      setPerritos(resultado.perritos ?? []);
      setCodigoValidado(true);
      setPasoReserva(2);
    } catch {
      setErrorAcceso(
        "No pudimos conectar con el servidor. Intentá nuevamente."
      );
    } finally {
      setValidandoCodigo(false);
    }
  }

  
async function validarSolicitud() {
  setErrorSolicitud("");
  setResultadoValidacion(null);

  if (!codigoValidado) {
    setErrorSolicitud("Primero validá tu código de propietario.");
    return;
  }

  if (perritosSeleccionados.length === 0) {
    setErrorSolicitud("Seleccioná al menos un perrito.");
    return;
  }

  if (!fechaEntrada || !fechaSalida) {
    setErrorSolicitud("Seleccioná las fechas de entrada y salida.");
    return;
  }

  if (fechaSalida < fechaEntrada) {
    setErrorSolicitud(
      "La fecha de salida no puede ser anterior a la entrada."
    );
    return;
  }

  setValidandoSolicitud(true);

  try {
    const respuesta = await fetch("/api/reservas/publicas/validar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo,
        fechaEntrada,
        fechaSalida,
        perritosIds: perritosSeleccionados,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setErrorSolicitud(
        resultado.error || "No fue posible validar la solicitud."
      );
      return;
    }

  
setResultadoValidacion(resultado);

if (resultado.valido) {
  setPasoReserva(4);
} else {
  setErrorSolicitud(
    "Todavía no podemos continuar. Revisá los requisitos sanitarios y la disponibilidad."
  );
}

  } catch {
    setErrorSolicitud(
      "No pudimos conectar con el servidor. Intentá nuevamente."
    );
  } finally {
    setValidandoSolicitud(false);
  }
}


async function enviarSolicitud() {
  setErrorEnvio("");

  if (!resultadoValidacion?.valido) {
    setErrorEnvio(
      "Primero comprobá que haya disponibilidad y que los perritos cumplan los requisitos sanitarios."
    );
    return;
  }

  if (!codigoValidado || !codigo) {
    setErrorEnvio("Volvé a validar tu código de propietario.");
    return;
  }

  if (perritosSeleccionados.length === 0) {
    setErrorEnvio("Seleccioná al menos un perrito.");
    return;
  }

  setEnviandoSolicitud(true);

  try {
    const respuesta = await fetch("/api/reservas/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo,
        fechaEntrada,
        fechaSalida,
        turnoEntrada,
        tipoEstadiaId: Number(tipoEstadia),
        perritosIds: perritosSeleccionados,
        observacionesCliente,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setErrorEnvio(
        resultado.error || "No fue posible registrar la solicitud."
      );
      return;
    }

    const numeroReserva = resultado.reserva?.numero_reserva;

    if (!numeroReserva) {
      setErrorEnvio(
        "El servidor respondió, pero no pudimos confirmar el número de reserva. Contactá a PetFunCR antes de volver a enviarla."
      );
      return;
    }

    setSolicitudCreada({ numeroReserva });
  } catch {
    setErrorEnvio(
      "No pudimos confirmar la respuesta del servidor. Revisá tus reservas antes de intentar enviar otra vez."
    );
  } finally {
    setEnviandoSolicitud(false);
  }
}


const reiniciarConsulta = () => {
  setCodigoConsulta("");
  setErrorConsultaReservas("");
  setReservasCliente([]);
  setConsultaRealizada(false);
};


async function consultarMisReservas() {
  setErrorConsultaReservas("");
  setReservasCliente([]);
  setConsultaRealizada(false);

const codigoLimpio = codigoConsulta.trim().toUpperCase();

  if (!codigoLimpio) {
    setErrorConsultaReservas("Ingresá tu código de propietario.");
    return;
  }

  setConsultandoReservas(true);

  try {
    const respuesta = await fetch("/api/reservas/publicas/consultar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ codigo: codigoLimpio }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setErrorConsultaReservas(
        resultado.error || "No fue posible consultar tus reservas."
      );
      return;
    }

    setReservasCliente(resultado.reservas ?? []);
    setConsultaRealizada(true);
  } catch {
    setErrorConsultaReservas(
      "No pudimos conectar con el servidor. Intentá nuevamente."
    );
  } finally {
    setConsultandoReservas(false);
  }
}


async function cancelarReserva(numeroReserva: string) {
  const confirmar = window.confirm(
    `¿Querés cancelar la reserva ${numeroReserva}?\n\nEsta acción no se puede deshacer desde el portal público.`
  );

  if (!confirmar) return;

  setCancelandoReserva(numeroReserva);
  setErrorCancelacion("");

  try {
    const respuesta = await fetch("/api/reservas/cancelar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo: codigoConsulta,
        numeroReserva,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setErrorCancelacion(
        resultado.error || "No fue posible cancelar la reserva."
      );
      return;
    }

    // Actualizamos la tarjeta sin borrar el historial.
    setReservasCliente((reservas) =>
      reservas.map((reserva) =>
        reserva.numeroReserva === numeroReserva
          ? { ...reserva, estado: "Cancelada" }
          : reserva
      )
    );
  } catch {
    setErrorCancelacion(
      "No pudimos confirmar la cancelación. Consultá nuevamente tus reservas antes de intentarlo otra vez."
    );
  } finally {
    setCancelandoReserva(null);
  }
}



  return (
    <>
      <style jsx global>{`
        /* Cada vista tiene su propio contenedor para personalizarla por separado. */
        .publica-reservas-desktop {
          display: block;
        }

        .publica-reservas-mobile {
          display: none;
        }

        /* Evita que el paso enfocado quede pegado al borde superior. */
        .publica-perritos-encontrados,
        .publica-campos-reserva,
        .publica-reservas-desktop .publica-mis-reservas,
        .publica-reservas-mobile .publica-mis-reservas {
          scroll-margin-top: 18px;
        }

        @media (max-width: 767px) {
          .publica-reservas-desktop {
            display: none !important;
          }

          .publica-reservas-mobile {
            display: block !important;
          }
        }
      `}</style>

      {/* VISTA DESKTOP: personalizar con selectores bajo .publica-reservas-desktop */}
      <div className="publica-reservas-desktop">
<main className="publica-reservas">
  
<header className="publica-header">
  <a
    href="/reservar"
    className="publica-marca"
    aria-label="PetFunCR"
  >
    <img src={LOGO} alt="PetFunCR" />
    <h3>Hotel y Guardería Canina PetFunCR</h3>
  </a>

  <div className="publica-header-acciones">
    <ThemeToggle />

    <a
      href="#mis-reservas"
     className="publica-header-boton-reservas"
    >
      <span aria-hidden="true">📋</span>
      Mis reservas
    </a>
  </div>
</header>


      <section className="publica-hero">
        <div className="publica-reserva-card">
          <span className="publica-sobrelinea">
            HOTEL Y GUARDERÍA CANINA 
            
     
           </span>
          

          <div className="publica-patita" aria-hidden="true">
            🐶
          </div>
    

          <h1>
            Las mejores vacaciones para tu mejor amigo.
          </h1>

          <p className="publica-intro">
            En PetFunCR cuidamos a tu perrito con cariño,
            atención y diversión. Planificá su próxima estadía
            con nosotros.
          </p>

          <button
            type="button"
            className="publica-boton-reservar"
            onClick={irAReserva}
          >
            Reservar ahora
            <span aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            className="publica-enlace-consulta"
            onClick={() =>
              document.getElementById("mis-reservas")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            Ya tengo una reserva
          </button>

          <div className="publica-beneficios">
            <div>
              <span aria-hidden="true">🏡</span>
              <small>Un lugar seguro</small>
            </div>
            <div>
              <span aria-hidden="true">🐾</span>
              <small>Atención especial</small>
            </div>
            <div>
              <span aria-hidden="true">💜</span>
              <small>Mucho cariño</small>
            </div>
          </div>
        </div>

        <section
          className="publica-carrusel"
          aria-label="Anuncios de PetFunCR"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)}
          onBlur={(evento) => {
            if (!evento.currentTarget.contains(evento.relatedTarget)) {
              setPausado(false);
            }
          }}
        >
          <div className="publica-carrusel-foto">
            <img
              key={imagen.src}
              src={imagen.src}
              alt={imagen.alt}
              fetchPriority={indice === 0 ? "high" : "auto"}
              decoding="async"
            />

            <div className="publica-carrusel-sombra" />

            <span className="publica-carrusel-etiqueta">
              {imagen.etiqueta}
            </span>
          </div>

          <button
            type="button"
            className="publica-flecha publica-flecha-anterior"
            onClick={anterior}
            aria-label="Anuncio anterior"
          >
            ‹
          </button>

          <button
            type="button"
            className="publica-flecha publica-flecha-siguiente"
            onClick={siguiente}
            aria-label="Anuncio siguiente"
          >
            ›
          </button>

          <div className="publica-indicadores">
            {imagenes.map((item, i) => (
              <button
                key={item.src}
                type="button"
                className={`publica-indicador ${
                  indice === i ? "activo" : ""
                }`}
                onClick={() => setIndice(i)}
                aria-label={`Mostrar anuncio ${i + 1}`}
                aria-current={indice === i ? "true" : undefined}
              />
            ))}
          </div>
        </section>
      </section>

    
<section
  id="formulario-reserva"
  className="publica-seccion-formulario"
>
  <div className="publica-formulario-card">
    <span className="publica-formulario-icono" aria-hidden="true">
      🐾
    </span>

    <div>
      <span className="publica-sobrelinea">
        TU PRÓXIMA ESTADÍA COMIENZA AQUÍ
      </span>

      <h2>Solicitá tu reserva</h2>

      <p>
        Ingresá tu código de propietario para identificar tus perritos
        y continuar con la solicitud.
      </p>
    </div>


{!codigoValidado ? (
  <form
    className="publica-acceso-form"
    onSubmit={(evento) => {
      evento.preventDefault();
      void validarCodigo();
    }}
  >
    <label htmlFor="codigo-propietario">
      Código de propietario
    </label>

    <input
      id="codigo-propietario"
      type="text"
      value={codigo}
      onChange={(evento) => {
        setCodigo(evento.target.value.toUpperCase());
        setErrorAcceso("");
        setCodigoValidado(false);
        setPerritos([]);
        setPerritosSeleccionados([]);
        setSeleccionConfirmada(false);
        setPasoReserva(1);
      }}
      placeholder="Ingresá tu código"
      autoComplete="off"
      required
      disabled={validandoCodigo}
    />

    <button
      type="submit"
      className="publica-boton-reservar"
      disabled={validandoCodigo}
    >
      {validandoCodigo ? "Validando código..." : "Continuar"}
      {!validandoCodigo && <span aria-hidden="true">→</span>}
    </button>
  </form>
) : !solicitudCreada ? (
  <div className="publica-paso-resumen">
    <div>
      <h3>Propietario verificado ✓</h3>
      <p>Código: {codigo}</p>
    </div>

    <button
      type="button"
      className="publica-paso-editar"
      onClick={() => {
        setCodigoValidado(false);
        setPerritos([]);
        setPerritosSeleccionados([]);
        setSeleccionConfirmada(false);
        setResultadoValidacion(null);
        setPasoReserva(1);
      }}
    >
       Editar
    </button>
  </div>
) : null}


    



    {errorAcceso && (
      <p className="publica-error-acceso" role="alert">
        {errorAcceso}
      </p>
    )}

    {codigoValidado && !solicitudCreada && (
      <div className="publica-perritos-encontrados" aria-live="polite">
        <h3>¡Código validado correctamente!</h3>

        {perritos.length > 0 ? (
          <>
       
       
 
{(!seleccionConfirmada || pasoReserva === 2) && (
  <>
    <p>Estos son los perritos activos asociados a tu código:</p>

    <div className="publica-lista-seleccion">
      {perritos.map((perrito) => {
        const seleccionado = perritosSeleccionados.includes(perrito.id);

        return (
          <label
            key={perrito.id}
            className={`publica-perrito-opcion ${
              seleccionado ? "seleccionado" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={seleccionado}
              onChange={() => {
                setPerritosSeleccionados((actuales) =>
                  seleccionado
                    ? actuales.filter((id) => id !== perrito.id)
                    : [...actuales, perrito.id]
                );
                setSeleccionConfirmada(false);
                setResultadoValidacion(null);
              }}
            />

            <span className="publica-perrito-emoji" aria-hidden="true">
              🐶
            </span>

            <span className="publica-perrito-nombre">
              {perrito.nombre}
            </span>

            <span className="publica-perrito-check" aria-hidden="true">
              {seleccionado ? "✓" : ""}
            </span>
          </label>
        );
      })}
    </div>

    <p className="publica-contador-seleccion">
      {perritosSeleccionados.length === 0
        ? "Seleccioná los perritos que se hospedarán."
        : `${perritosSeleccionados.length} ${
            perritosSeleccionados.length === 1
              ? "perrito seleccionado"
              : "perritos seleccionados"
          }`}
    </p>

    <button
      type="button"
      className="publica-boton-reservar"
      disabled={perritosSeleccionados.length === 0}
      onClick={() => {
        setSeleccionConfirmada(true);
        setPasoReserva(3);
        setResultadoValidacion(null);
      }}
    >
      Confirmar selección <span aria-hidden="true">→</span>
    </button>
  </>
)}

{seleccionConfirmada && pasoReserva > 2 && (
  <div className="publica-paso-resumen">
    <div>
      <h3>🐶 Perritos seleccionados</h3>
      <p>
        {perritos
          .filter((perrito) =>
            perritosSeleccionados.includes(perrito.id)
          )
          .map((perrito) => perrito.nombre)
          .join(", ")}
      </p>
    </div>

    <button
      type="button"
      className="publica-paso-editar"
      onClick={() => {
        setPasoReserva(2);
        setResultadoValidacion(null);
        setErrorSolicitud("");
      }}
    >
      Editar
    </button>
  </div>
)}
        


{seleccionConfirmada && pasoReserva === 3 && (
  <div className="publica-seleccion-confirmada">
    <strong>¡Excelente! Ya seleccionaste tus perritos.</strong>

    <p>
      Ahora elegí el servicio, las fechas y el turno de entrada.
      Comprobaremos la disponibilidad y los requisitos sanitarios.
    </p>

    <div className="publica-campos-reserva">
<p>
     <span className="publica-sobrelineapref">
        Elegí tus preferencias del hospedaje.
      </span>
  </p>
  <p><span></span></p>
      <label htmlFor="tipo-estadia">Servicio</label>
      <select
        id="tipo-estadia"
        value={tipoEstadia}
        onChange={(evento) => {
          setTipoEstadia(evento.target.value as "1" | "2");
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
      >
        <option value="1">Hotel</option>
        <option value="2">Guardería</option>
      </select>

      <label htmlFor="fecha-entrada">Fecha de entrada</label>
      <input
        id="fecha-entrada"
        type="date"
        min={new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Costa_Rica",
        })}
        value={fechaEntrada}
        onChange={(evento) => {
          setFechaEntrada(evento.target.value);
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
        required
      />

      <label htmlFor="fecha-salida">Fecha de salida</label>
      <input
        id="fecha-salida"
        type="date"
        min={fechaEntrada || undefined}
        value={fechaSalida}
        onChange={(evento) => {
          setFechaSalida(evento.target.value);
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
        required
      />

      <label htmlFor="turno-entrada">Turno de entrada</label>
      <select
        id="turno-entrada"
        value={turnoEntrada}
        onChange={(evento) => {
          setTurnoEntrada(evento.target.value as "manana" | "tarde");
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
      >
        <option value="manana">Mañana</option>
        <option value="tarde">Tarde</option>
      </select>

      <button
        type="button"
        className="publica-boton-reservar"
        disabled={validandoSolicitud}
        onClick={() => void validarSolicitud()}
      >
        {validandoSolicitud
          ? "Comprobando disponibilidad..."
          : "Comprobar disponibilidad"}
        {!validandoSolicitud && <span aria-hidden="true"> →</span>}
      </button>
    </div>

    {errorSolicitud && (
      <p className="publica-error-acceso" role="alert">
        {errorSolicitud}
      </p>
    )}

    {resultadoValidacion && (
      <div role="status">
        {resultadoValidacion.valido ? (
          <>
            <strong>¡Todo listo para continuar!</strong>
            <p>
              Los requisitos sanitarios y la disponibilidad están correctos.
            </p>
          </>
        ) : (
          <>
            <strong>Debemos revisar algunos requisitos.</strong>

            {resultadoValidacion.perritos.map((perrito) => (
              <div key={perrito.id}>
                <p><strong>{perrito.nombre}</strong></p>
                {perrito.requisitosPendientes.length > 0 && (
                  <ul>
                    {perrito.requisitosPendientes.map((requisito) => (
                      <li key={requisito}>{requisito}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {resultadoValidacion.disponibilidad.motivo && (
              <p>{resultadoValidacion.disponibilidad.motivo}</p>
            )}
          </>
        )}
      </div>
    )}
  </div>
)}

{resultadoValidacion?.valido &&
  pasoReserva === 4 &&
  !solicitudCreada && (
  <div className="publica-resumen-reserva">
 {/*  <h3>Resumen de tu solicitud</h3> */} 
     <span className="publica-sobrelineapref">
        Resumen de tu solicitud
      </span>
      <p></p>


<button
  type="button"
  className="publica-paso-editar"
  onClick={() => {
    setPasoReserva(3);
    setResultadoValidacion(null);
    setErrorSolicitud("");
  }}
>
  Editar fechas y servicio
</button>


    <p>
      <strong>Servicio:</strong>{" "}
      {tipoEstadia === "1" ? "Hotel" : "Guardería"}
    </p>

    <p>
      <strong>Entrada:</strong> {fechaEntrada}
    </p>

    <p>
      <strong>Salida:</strong> {fechaSalida}
    </p>

    <p>
      <strong>Turno de entrada:</strong>{" "}
      {turnoEntrada === "manana" ? "Mañana" : "Tarde"}
    </p>

    <p><strong>Perritos seleccionados:</strong></p>

    <ul>
      {perritos
        .filter((perrito) =>
          perritosSeleccionados.includes(perrito.id)
        )
        .map((perrito) => (
          <li key={perrito.id}>{perrito.nombre}</li>
        ))}
    </ul>

    <label htmlFor="observaciones-cliente">
      Observaciones (opcional)
    </label>

    <textarea
      id="observaciones-cliente"
      value={observacionesCliente}
      onChange={(evento) => setObservacionesCliente(evento.target.value)}
      maxLength={2000}
      rows={3}
      placeholder="¿Hay algo que debamos saber sobre la estadía?"
    />

    <p>
      Revisá los datos antes de continuar. La solicitud quedará
      pendiente de aprobación por parte de PetFunCR.
    </p>


{errorEnvio && (
  <p className="publica-error-acceso" role="alert">
    {errorEnvio}
  </p>
)}

{!solicitudCreada && (
  <button
    type="button"
    className="publica-boton-reservar"
    disabled={enviandoSolicitud || !resultadoValidacion?.valido}
    onClick={() => void enviarSolicitud()}
  >
    {enviandoSolicitud
      ? "Enviando solicitud..."
      : "Enviar solicitud de reserva"}
    {!enviandoSolicitud && <span aria-hidden="true"> →</span>}
  </button>
)}


  </div>
)}







            <p className="publica-pendiente-siguiente">
    
            </p>
          </>
        ) : (
          <p>
            Tu código es válido, pero no encontramos perritos activos
            asociados. Contactá a PetFunCR para continuar.
          </p>
        )}
      </div>
    )}
  </div>
</section>



{solicitudCreada && (
  <div className="publica-resumen-reserva" role="status">
    <h3>¡Solicitud recibida!</h3>
    <p>
      Tu solicitud quedó registrada y está pendiente de aprobación
      por parte de PetFunCR.
    </p>
    <p>
      <strong>Número de reserva:</strong>{" "}
      {solicitudCreada.numeroReserva}
    </p>
    <p>
      Guardá este número para consultar el estado de tu solicitud.
</p>
      
<button
  type="button"
  className="publica-boton-reservar"
  onClick={() => {
    setSolicitudCreada(null);
    setCodigo("");
    setCodigoValidado(false);
    setPerritos([]);
    setPerritosSeleccionados([]);
    setSeleccionConfirmada(false);
    setPasoReserva(1);
    setTipoEstadia("1");
    setFechaEntrada("");
    setFechaSalida("");
    setTurnoEntrada("manana");
    setResultadoValidacion(null);
    setErrorAcceso("");
    setErrorSolicitud("");
    setErrorEnvio("");
    setObservacionesCliente("");
  }}
>
  + Hacer otra reserva
  <span aria-hidden="true"> →</span>
</button>

    
  </div>

)}

  
<section
  id="mis-reservas"
  className="publica-seccion-formulario"
>
  <div className="publica-formulario-card">
    <span className="publica-formulario-icono" aria-hidden="true">
      📋
    </span>

    <div>
      <span className="publica-sobrelinea">
        CONSULTÁ CUANDO QUERÁS
      </span>

      <h2>Consultar mis reservas</h2>

      <p>
        Ingresá tu código de propietario para consultar tus solicitudes
        y revisar su estado.
      </p>
    </div>

    <form
      className="publica-acceso-form"
      onSubmit={(evento) => {
        evento.preventDefault();
        void consultarMisReservas();
      }}
    >
      <label htmlFor="codigo-consulta">
        Código de propietario
      </label>

      <input
        id="codigo-consulta"
        type="text"
        value={codigoConsulta}
        onChange={(evento) => {
          setCodigoConsulta(evento.target.value.toUpperCase());
          setErrorConsultaReservas("");
          setConsultaRealizada(false);
          setReservasCliente([]);
        }}
        placeholder="Ingresá tu código"
        autoComplete="off"
        required
        disabled={consultandoReservas}
      />

      <button
        type="submit"
        className="publica-boton-reservar"
        disabled={consultandoReservas}
      >
        {consultandoReservas
          ? "Consultando reservas..."
          : "Consultar reservas"}
        {!consultandoReservas && (
          <span aria-hidden="true"> →</span>
        )}
      </button>
    </form>

    {errorConsultaReservas && (
      <p className="publica-error-acceso" role="alert">
        {errorConsultaReservas}
      </p>
    )}
  </div>



{consultaRealizada && (
  <section className="publica-mis-reservas" aria-live="polite">
    <h3>Mis reservas</h3>

    
<button
  type="button"
  className="publica-boton-reservar"
  onClick={reiniciarConsulta}
>
  Nueva consulta
</button>

{errorCancelacion && (
  <p className="publica-error-acceso" role="alert">
    {errorCancelacion}
  </p>
)}


    {reservasCliente.length === 0 ? (
      <p>No encontramos solicitudes de reserva asociadas a este código.</p>
    ) : (
      <div className="publica-lista-reservas">
        {reservasCliente.map((reserva) => (
          <article
            className="publica-reserva-item"
            key={reserva.id}
          >
          
<div className="publica-reserva-encabezado">
  <h4>{reserva.numeroReserva}</h4>

  <span
    className={`publica-reserva-estado publica-estado-${String(
      reserva.estado
    ).toLowerCase().replace(/\s+/g, "-")}`}
  >
    {reserva.estado}
  </span>
</div>



      
<div className="publica-reserva-datos">
  <p>
    <strong>Servicio:</strong> {reserva.tipoEstadia}
  </p>

    <p>
    <strong>Turno:</strong>{" "}
    {reserva.turnoEntrada === "manana"
      ? "Mañana"
      : reserva.turnoEntrada === "tarde"
        ? "Tarde"
        : reserva.turnoEntrada}
  </p>

 <p>
  <strong>Entrada:</strong>{" "}
  {formatearFecha(reserva.fechaEntrada)}
</p>

<p>
  <strong>Salida:</strong>{" "}
  {formatearFecha(reserva.fechaSalida)}
</p>


</div>


            <p><strong>Perritos:</strong></p>
            <ul>
              {reserva.perritos.map((perrito: { id: number; nombre: string }) => (
                <li key={perrito.id}>{perrito.nombre}</li>
              ))}
            </ul>

            <p>
              <strong>Monto estimado:</strong>{" "}
              ₡{Number(reserva.montoEstimado ?? 0).toLocaleString("es-CR")}
            </p>

            {reserva.observacionesCliente && (
              <p>
                <strong>Tus observaciones:</strong>{" "}
                {reserva.observacionesCliente}
              </p>
            )}

{reserva.estado === "Pendiente" && (
  <button
    type="button"
    className="publica-boton-cancelar"
    disabled={cancelandoReserva !== null}
    onClick={() => void cancelarReserva(reserva.numeroReserva)}
  >
    {cancelandoReserva === reserva.numeroReserva
      ? "Cancelando..."
      : "Cancelar reserva"}
  </button>
)}

          </article>
        ))}
      </div>
    )}
  </section>
)}


</section>



      <footer className="publica-footer">
        <img src={LOGO} alt="" />
        <span>
          PetFunCR · Cuidamos a quienes más querés.
        </span>
      </footer>
    </main>
      </div>

      {/* VISTA MÓVIL: estructura independiente; personalizar bajo .publica-reservas-mobile */}
      <div className="publica-reservas-mobile">
<main className="publica-reservas">
  
<header className="publica-header">
  <a
    href="/reservar"
    className="publica-marca"
    aria-label="PetFunCR"
  >
    <img src={LOGO} alt="PetFunCR" />
    <h4>PetFunCR Hotel 🐶</h4>
  </a>

  <div className="publica-header-acciones">
    <ThemeToggle />

    <a
      href="#mis-reservas-mobile"
     className="publica-header-boton-reservas"
    >
      <span aria-hidden="true">📋</span>
      Mis reservas
    </a>
  </div>
</header>


      <section className="publica-hero">
        <div className="publica-reserva-card">
          {/*
          <span className="publica-sobrelinea">
            HOTEL Y GUARDERÍA CANINA 
            
     
           </span>
          

          <div className="publica-patita" aria-hidden="true">
            🐶
          </div>
    */}

          <h1>
            Las mejores vacaciones para tu mejor amigo.
          </h1>

          <p className="publica-intro">
            En PetFunCR cuidamos a tu perrito con cariño,
            atención y diversión. Planificá su próxima estadía
            con nosotros.
          </p>

          <button
            type="button"
            className="publica-boton-reservar"
            onClick={irAReserva}
          >
            Reservar ahora
            <span aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            className="publica-enlace-consulta"
            onClick={() =>
              document.getElementById("mis-reservas-mobile")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            Ya tengo una reserva
          </button>
{/*
          <div className="publica-beneficios">
            <div>
              <span aria-hidden="true">🏡</span>
              <small>Un lugar seguro</small>
            </div>
            <div>
              <span aria-hidden="true">🐾</span>
              <small>Atención especial</small>
            </div>
            <div>
              <span aria-hidden="true">💜</span>
              <small>Mucho cariño</small>
            </div>
          </div>
*/}
        </div>

        <section
          className="publica-carrusel"
          aria-label="Anuncios de PetFunCR"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)}
          onBlur={(evento) => {
            if (!evento.currentTarget.contains(evento.relatedTarget)) {
              setPausado(false);
            }
          }}
        >
          <div className="publica-carrusel-foto">
            <img
              key={imagen.src}
              src={imagen.src}
              alt={imagen.alt}
              fetchPriority={indice === 0 ? "high" : "auto"}
              decoding="async"
            />

            <div className="publica-carrusel-sombra" />

            <span className="publica-carrusel-etiqueta">
              {imagen.etiqueta}
            </span>
          </div>

          <button
            type="button"
            className="publica-flecha publica-flecha-anterior"
            onClick={anterior}
            aria-label="Anuncio anterior"
          >
            ‹
          </button>

          <button
            type="button"
            className="publica-flecha publica-flecha-siguiente"
            onClick={siguiente}
            aria-label="Anuncio siguiente"
          >
            ›
          </button>

          <div className="publica-indicadores">
            {imagenes.map((item, i) => (
              <button
                key={item.src}
                type="button"
                className={`publica-indicador ${
                  indice === i ? "activo" : ""
                }`}
                onClick={() => setIndice(i)}
                aria-label={`Mostrar anuncio ${i + 1}`}
                aria-current={indice === i ? "true" : undefined}
              />
            ))}
          </div>
        </section>
      </section>

    
<section
  id="formulario-reserva-mobile"
  className="publica-seccion-formulario"
>
  <div className="publica-formulario-card">
    <span className="publica-formulario-icono" aria-hidden="true">
      🐾
    </span>

    <div>
      <span className="publica-sobrelinea">
        TU PRÓXIMA ESTADÍA COMIENZA AQUÍ
      </span>

      <h2>Solicitá tu reserva</h2>

      <p>
        Ingresá tu código de propietario para identificar tus perritos
        y continuar con la solicitud.
      </p>
    </div>


{!codigoValidado ? (
  <form
    className="publica-acceso-form"
    onSubmit={(evento) => {
      evento.preventDefault();
      void validarCodigo();
    }}
  >
    <label htmlFor="codigo-propietario-mobile">
      Código de propietario
    </label>

    <input
      id="codigo-propietario-mobile"
      type="text"
      value={codigo}
      onChange={(evento) => {
        setCodigo(evento.target.value.toUpperCase());
        setErrorAcceso("");
        setCodigoValidado(false);
        setPerritos([]);
        setPerritosSeleccionados([]);
        setSeleccionConfirmada(false);
        setPasoReserva(1);
      }}
      placeholder="Ingresá tu código"
      autoComplete="off"
      required
      disabled={validandoCodigo}
    />

    <button
      type="submit"
      className="publica-boton-reservar"
      disabled={validandoCodigo}
    >
      {validandoCodigo ? "Validando código..." : "Continuar"}
      {!validandoCodigo && <span aria-hidden="true">→</span>}
    </button>
  </form>
) : !solicitudCreada ? (
  <div className="publica-paso-resumen">
    <div>
      <h3>Propietario verificado ✓</h3>
      <p>Código: {codigo}</p>
    </div>

    <button
      type="button"
      className="publica-paso-editar"
      onClick={() => {
        setCodigoValidado(false);
        setPerritos([]);
        setPerritosSeleccionados([]);
        setSeleccionConfirmada(false);
        setResultadoValidacion(null);
        setPasoReserva(1);
      }}
    >
       Editar
    </button>
  </div>
) : null}


    



    {errorAcceso && (
      <p className="publica-error-acceso" role="alert">
        {errorAcceso}
      </p>
    )}

    {codigoValidado && !solicitudCreada && (
      <div className="publica-perritos-encontrados" aria-live="polite">
        <h3>¡Código validado correctamente!</h3>

        {perritos.length > 0 ? (
          <>
       
       
 
{(!seleccionConfirmada || pasoReserva === 2) && (
  <>
    <p>Estos son los perritos activos asociados a tu código:</p>

    <div className="publica-lista-seleccion">
      {perritos.map((perrito) => {
        const seleccionado = perritosSeleccionados.includes(perrito.id);

        return (
          <label
            key={perrito.id}
            className={`publica-perrito-opcion ${
              seleccionado ? "seleccionado" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={seleccionado}
              onChange={() => {
                setPerritosSeleccionados((actuales) =>
                  seleccionado
                    ? actuales.filter((id) => id !== perrito.id)
                    : [...actuales, perrito.id]
                );
                setSeleccionConfirmada(false);
                setResultadoValidacion(null);
              }}
            />

            <span className="publica-perrito-emoji" aria-hidden="true">
              🐶
            </span>

            <span className="publica-perrito-nombre">
              {perrito.nombre}
            </span>

            <span className="publica-perrito-check" aria-hidden="true">
              {seleccionado ? "✓" : ""}
            </span>
          </label>
        );
      })}
    </div>

    <p className="publica-contador-seleccion">
      {perritosSeleccionados.length === 0
        ? "Seleccioná los perritos que se hospedarán."
        : `${perritosSeleccionados.length} ${
            perritosSeleccionados.length === 1
              ? "perrito seleccionado"
              : "perritos seleccionados"
          }`}
    </p>

    <button
      type="button"
      className="publica-boton-reservar"
      disabled={perritosSeleccionados.length === 0}
      onClick={() => {
        setSeleccionConfirmada(true);
        setPasoReserva(3);
        setResultadoValidacion(null);
      }}
    >
      Confirmar selección <span aria-hidden="true">→</span>
    </button>
  </>
)}

{seleccionConfirmada && pasoReserva > 2 && (
  <div className="publica-paso-resumen">
    <div>
      <h3>🐶 Perritos seleccionados</h3>
      <p>
        {perritos
          .filter((perrito) =>
            perritosSeleccionados.includes(perrito.id)
          )
          .map((perrito) => perrito.nombre)
          .join(", ")}
      </p>
    </div>

    <button
      type="button"
      className="publica-paso-editar"
      onClick={() => {
        setPasoReserva(2);
        setResultadoValidacion(null);
        setErrorSolicitud("");
      }}
    >
      Editar
    </button>
  </div>
)}
        


{seleccionConfirmada && pasoReserva === 3 && (
  <div className="publica-seleccion-confirmada">
    <strong>¡Excelente! Ya seleccionaste tus perritos.</strong>

    <p>
      Ahora elegí el servicio, las fechas y el turno de entrada.
      Comprobaremos la disponibilidad y los requisitos sanitarios.
    </p>

    <div className="publica-campos-reserva">
  

  <span className="publica-sobrelineapref">
        Elegí tus preferencias del hospedaje.
      </span>
    
      <label htmlFor="tipo-estadia-mobile">Servicio</label>
      <select
        id="tipo-estadia-mobile"
        value={tipoEstadia}
        onChange={(evento) => {
          setTipoEstadia(evento.target.value as "1" | "2");
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
      >
        <option value="1">Hotel</option>
        <option value="2">Guardería</option>
      </select>

      <label htmlFor="fecha-entrada-mobile">Fecha de entrada</label>
      <input
        id="fecha-entrada-mobile"
        type="date"
        min={new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Costa_Rica",
        })}
        value={fechaEntrada}
        onChange={(evento) => {
          setFechaEntrada(evento.target.value);
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
        required
      />

      <label htmlFor="fecha-salida-mobile">Fecha de salida</label>
      <input
        id="fecha-salida-mobile"
        type="date"
        min={fechaEntrada || undefined}
        value={fechaSalida}
        onChange={(evento) => {
          setFechaSalida(evento.target.value);
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
        required
      />

      <label htmlFor="turno-entrada-mobile">Turno de entrada</label>
      <select
        id="turno-entrada-mobile"
        value={turnoEntrada}
        onChange={(evento) => {
          setTurnoEntrada(evento.target.value as "manana" | "tarde");
          setResultadoValidacion(null);
          setErrorSolicitud("");
        }}
      >
        <option value="manana">Mañana</option>
        <option value="tarde">Tarde</option>
      </select>

      <button
        type="button"
        className="publica-boton-reservar"
        disabled={validandoSolicitud}
        onClick={() => void validarSolicitud()}
      >
        {validandoSolicitud
          ? "Comprobando disponibilidad..."
          : "Comprobar disponibilidad"}
        {!validandoSolicitud && <span aria-hidden="true"> →</span>}
      </button>
    </div>

    {errorSolicitud && (
      <p className="publica-error-acceso" role="alert">
        {errorSolicitud}
      </p>
    )}

    {resultadoValidacion && (
      <div role="status">
        {resultadoValidacion.valido ? (
          <>
            <strong>¡Todo listo para continuar!</strong>
            <p>
              Los requisitos sanitarios y la disponibilidad están correctos.
            </p>
          </>
        ) : (
          <>
            <strong>Debemos revisar algunos requisitos.</strong>

            {resultadoValidacion.perritos.map((perrito) => (
              <div key={perrito.id}>
                <p><strong>{perrito.nombre}</strong></p>
                {perrito.requisitosPendientes.length > 0 && (
                  <ul>
                    {perrito.requisitosPendientes.map((requisito) => (
                      <li key={requisito}>{requisito}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {resultadoValidacion.disponibilidad.motivo && (
              <p>{resultadoValidacion.disponibilidad.motivo}</p>
            )}
          </>
        )}
      </div>
    )}
  </div>
)}

{resultadoValidacion?.valido &&
  pasoReserva === 4 &&
  !solicitudCreada && (
  <div className="publica-resumen-reserva">
  {/*  <h3>Resumen de tu solicitud</h3> */}
        <span className="publica-sobrelineapref">
        Resumen de tu solicitud
      </span>
      <p></p>


<button
  type="button"
  className="publica-paso-editar"
  onClick={() => {
    setPasoReserva(3);
    setResultadoValidacion(null);
    setErrorSolicitud("");
  }}
>
  Editar fechas y servicio
</button>



    <p>
      <strong>Servicio:</strong>{" "}
      {tipoEstadia === "1" ? "Hotel" : "Guardería"}
    </p>

    <p>
      <strong>Entrada:</strong> {fechaEntrada}
    </p>

    <p>
      <strong>Salida:</strong> {fechaSalida}
    </p>

    <p>
      <strong>Turno de entrada:</strong>{" "}
      {turnoEntrada === "manana" ? "Mañana" : "Tarde"}
    </p>

    <p><strong>Perritos seleccionados:</strong></p>

    <ul>
      {perritos
        .filter((perrito) =>
          perritosSeleccionados.includes(perrito.id)
        )
        .map((perrito) => (
          <li key={perrito.id}>{perrito.nombre}</li>
        ))}
    </ul>

    <label htmlFor="observaciones-cliente-mobile">
      Observaciones (opcional)
    </label>

    <textarea
      id="observaciones-cliente-mobile"
      value={observacionesCliente}
      onChange={(evento) => setObservacionesCliente(evento.target.value)}
      maxLength={2000}
      rows={3}
      placeholder="¿Hay algo que debamos saber sobre la estadía?"
    />

    <p>
      Revisá los datos antes de continuar. La solicitud quedará
      pendiente de aprobación por parte de PetFunCR.
    </p>


{errorEnvio && (
  <p className="publica-error-acceso" role="alert">
    {errorEnvio}
  </p>
)}

{!solicitudCreada && (
  <button
    type="button"
    className="publica-boton-reservar"
    disabled={enviandoSolicitud || !resultadoValidacion?.valido}
    onClick={() => void enviarSolicitud()}
  >
    {enviandoSolicitud
      ? "Enviando solicitud..."
      : "Enviar solicitud de reserva"}
    {!enviandoSolicitud && <span aria-hidden="true"> →</span>}
  </button>
)}


  </div>
)}







            <p className="publica-pendiente-siguiente">
    
            </p>
          </>
        ) : (
          <p>
            Tu código es válido, pero no encontramos perritos activos
            asociados. Contactá a PetFunCR para continuar.
          </p>
        )}
      </div>
    )}
  </div>
</section>



{solicitudCreada && (
  <div className="publica-resumen-reserva" role="status">
    <h3>¡Solicitud recibida!</h3>
    <p>
      Tu solicitud quedó registrada y está pendiente de aprobación
      por parte de PetFunCR.
    </p>
    <p>
      <strong>Número de reserva:</strong>{" "}
      {solicitudCreada.numeroReserva}
    </p>
    <p>
      Guardá este número para consultar el estado de tu solicitud.
</p>
      
<button
  type="button"
  className="publica-boton-reservar"
  onClick={() => {
    setSolicitudCreada(null);
    setCodigo("");
    setCodigoValidado(false);
    setPerritos([]);
    setPerritosSeleccionados([]);
    setSeleccionConfirmada(false);
    setPasoReserva(1);
    setTipoEstadia("1");
    setFechaEntrada("");
    setFechaSalida("");
    setTurnoEntrada("manana");
    setResultadoValidacion(null);
    setErrorAcceso("");
    setErrorSolicitud("");
    setErrorEnvio("");
    setObservacionesCliente("");
  }}
>
  + Hacer otra reserva
  <span aria-hidden="true"> →</span>
</button>

    
  </div>

)}

  
<section
  id="mis-reservas-mobile"
  className="publica-seccion-formulario"
>
  <div className="publica-formulario-card">
    <span className="publica-formulario-icono" aria-hidden="true">
      📋
    </span>

    <div>
      <span className="publica-sobrelinea">
        CONSULTÁ CUANDO QUERÁS
      </span>

      <h2>Consultar mis reservas</h2>

      <p>
        Ingresá tu código de propietario para consultar tus solicitudes
        y revisar su estado.
      </p>
    </div>

    <form
      className="publica-acceso-form"
      onSubmit={(evento) => {
        evento.preventDefault();
        void consultarMisReservas();
      }}
    >
      <label htmlFor="codigo-consulta-mobile">
        Código de propietario
      </label>

      <input
        id="codigo-consulta-mobile"
        type="text"
        value={codigoConsulta}
        onChange={(evento) => {
          setCodigoConsulta(evento.target.value.toUpperCase());
          setErrorConsultaReservas("");
          setConsultaRealizada(false);
          setReservasCliente([]);
        }}
        placeholder="Ingresá tu código"
        autoComplete="off"
        required
        disabled={consultandoReservas}
      />

      <button
        type="submit"
        className="publica-boton-reservar"
        disabled={consultandoReservas}
      >
        {consultandoReservas
          ? "Consultando reservas..."
          : "Consultar reservas"}
        {!consultandoReservas && (
          <span aria-hidden="true"> →</span>
        )}
      </button>
    </form>

    {errorConsultaReservas && (
      <p className="publica-error-acceso" role="alert">
        {errorConsultaReservas}
      </p>
    )}
  </div>



{consultaRealizada && (
  <section className="publica-mis-reservas" aria-live="polite">
    <h3>Mis reservas</h3>

    
<button
  type="button"
  className="publica-boton-reservar"
  onClick={reiniciarConsulta}
>
  Nueva consulta
</button>

{errorCancelacion && (
  <p className="publica-error-acceso" role="alert">
    {errorCancelacion}
  </p>
)}


    {reservasCliente.length === 0 ? (
      <p>No encontramos solicitudes de reserva asociadas a este código.</p>
    ) : (
      <div className="publica-lista-reservas">
        {reservasCliente.map((reserva) => (
          <article
            className="publica-reserva-item"
            key={reserva.id}
          >
          
<div className="publica-reserva-encabezado">
  <h4>{reserva.numeroReserva}</h4>

  <span
    className={`publica-reserva-estado publica-estado-${String(
      reserva.estado
    ).toLowerCase().replace(/\s+/g, "-")}`}
  >
    {reserva.estado}
  </span>
</div>



      
<div className="publica-reserva-datos">
  <p>
    <strong>Servicio:</strong> {reserva.tipoEstadia}
  </p>

    <p>
    <strong>Turno:</strong>{" "}
    {reserva.turnoEntrada === "manana"
      ? "Mañana"
      : reserva.turnoEntrada === "tarde"
        ? "Tarde"
        : reserva.turnoEntrada}
  </p>

 <p>
  <strong>Entrada:</strong>{" "}
  {formatearFecha(reserva.fechaEntrada)}
</p>

<p>
  <strong>Salida:</strong>{" "}
  {formatearFecha(reserva.fechaSalida)}
</p>


</div>


            <p><strong>Perritos:</strong></p>
            <ul>
              {reserva.perritos.map((perrito: { id: number; nombre: string }) => (
                <li key={perrito.id}>{perrito.nombre}</li>
              ))}
            </ul>

            <p>
              <strong>Monto estimado:</strong>{" "}
              ₡{Number(reserva.montoEstimado ?? 0).toLocaleString("es-CR")}
            </p>

            {reserva.observacionesCliente && (
              <p>
                <strong>Tus observaciones:</strong>{" "}
                {reserva.observacionesCliente}
              </p>
            )}

{reserva.estado === "Pendiente" && (
  <button
    type="button"
    className="publica-boton-cancelar"
    disabled={cancelandoReserva !== null}
    onClick={() => void cancelarReserva(reserva.numeroReserva)}
  >
    {cancelandoReserva === reserva.numeroReserva
      ? "Cancelando..."
      : "Cancelar reserva"}
  </button>
)}

          </article>
        ))}
      </div>
    )}
  </section>
)}


</section>



      <footer className="publica-footer">
        <img src={LOGO} alt="" />
        <span>
          PetFunCR · Cuidamos a quienes más querés.
        </span>
      </footer>
    </main>
      </div>
    </>
  );
}
