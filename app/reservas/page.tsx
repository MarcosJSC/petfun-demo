
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePermisos } from "@/hooks/usePermisos";
import { RequierePermiso } from "@/components/RequierePermiso";
import { useSucursalActiva } from "@/contexts/SucursalContext";

type PerritoReserva = {
  id: number;
  perrito_id: number;
  dias_calculados: number | null;
  precio_hotel_aplicado: number | null;
  precio_guarderia_aplicado: number | null;
  subtotal_hotel_estimado: number | null;
  subtotal_guarderia_estimado: number | null;
  perritos: { nombre: string } | { nombre: string }[] | null;
};

type Reserva = {
  id: number;
  numero_reserva: string;
  propietario_id: number;
  sucursal_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  turno_entrada: string;
  tipo_estadia_id: number;
  estado: string;
  monto_estimado: number | null;
  observaciones_cliente: string | null;
  observaciones_admin: string | null;
  created_at: string;
  propietarios:
    | {
        nombre: string;
        apellidos: string | null;
        telefono: string | null;
      }
    | {
        nombre: string;
        apellidos: string | null;
        telefono: string | null;
      }[]
    | null;
  sucursales:
    | { id: number; nombre: string }
    | { id: number; nombre: string }[]
    | null;
  tipos_estadia:
    | { nombre: string }
    | { nombre: string }[]
    | null;
  reserva_perritos: PerritoReserva[] | null;
};

type RespuestaAPI = {
  ok?: boolean;
  mensaje?: string;
  error?: string;
  reservas?: Reserva[];
};

type FiltroEstado =
  | "Pendiente"
  | "Aprobada"
  | "Rechazada"
  | "Cancelada"
  | "Todas";

function primero<T>(
  valor: T | T[] | null | undefined
): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function fechaCorta(fecha: string) {
  if (!fecha) return "—";

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function moneda(valor: number | null | undefined) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
}

function nombrePropietario(reserva: Reserva) {
  const propietario = primero(reserva.propietarios);

  if (!propietario) return "Propietario no disponible";

  return `${propietario.nombre} ${propietario.apellidos ?? ""}`.trim();
}

function nombresPerritos(reserva: Reserva) {
  return (reserva.reserva_perritos ?? [])
    .map((detalle) => primero(detalle.perritos)?.nombre)
    .filter(Boolean)
    .join(", ");
}

function etiquetaEstado(estado: string) {
  switch (estado) {
    case "Pendiente":
      return {
        texto: "Pendiente",
        fondo: "#fff3cd",
        color: "#856404",
      };
    case "Aprobada":
      return {
        texto: "Aprobada",
        fondo: "#d1e7dd",
        color: "#0f5132",
      };
    case "Rechazada":
      return {
        texto: "Rechazada",
        fondo: "#f8d7da",
        color: "#842029",
      };
    case "Cancelada":
      return {
        texto: "Cancelada",
        fondo: "#e2e3e5",
        color: "#41464b",
      };
    default:
      return {
        texto: estado || "Sin estado",
        fondo: "#e9ecef",
        color: "#343a40",
      };
  }
}

function totalEstimadoReserva(reserva: Reserva): number {
  const totalSubtotales = (reserva.reserva_perritos ?? []).reduce(
    (total, detalle) => {
      const subtotal =
        reserva.tipo_estadia_id === 1
          ? detalle.subtotal_hotel_estimado
          : detalle.subtotal_guarderia_estimado;
      return total + Math.max(0, Number(subtotal ?? 0));
    },
    0
  );

  return totalSubtotales > 0
    ? totalSubtotales
    : Math.max(0, Number(reserva.monto_estimado ?? 0));
}

function textoConfirmacionWhatsApp(
  reserva: Reserva,
  incluirMonto: boolean,
  total: number
): string {
  const perritos = (reserva.reserva_perritos ?? [])
    .map((detalle) => primero(detalle.perritos)?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre));
  const listaPerritos = perritos.length
    ? perritos.map((nombre) => `🐶 ${nombre}`).join("\n")
    : "🐾 Tus peluditos";

  const lineas = [
    "🐾 *PetFunCR | ¡Hospedaje confirmado!*",
    "",
    `¡Hola, ${nombrePropietario(reserva)}!`,
    "",
    "Nos da mucho gusto confirmar el hospedaje para:",
    listaPerritos,
    "",
    `📅 *Del ${fechaCorta(reserva.fecha_entrada)} al ${fechaCorta(reserva.fecha_salida)}*`,
    "",
    "Unos días antes nos pondremos en contacto para coordinar los últimos detalles de su estadía.",
  ];

  if (incluirMonto) {
    lineas.push(
      "",
      `💜 *Total del hospedaje: ${moneda(total)} colones*`,
      "📲 *SINPE Móvil: 8568 9575*"
    );
  }

  lineas.push(
    "",
    "¡Muchas gracias por confiar en PetFunCR para cuidar a los miembros de tu familia! 🐶💜",
    "¡Los esperamos con mucha alegría!"
  );

  return lineas.join("\n");
}

function dibujarPata(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  escala = 1
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + 7 * escala, 13 * escala, 10 * escala, 0, 0, Math.PI * 2);
  ctx.fill();

  const dedos = [
    [-12, -8, 5.5],
    [0, -13, 6],
    [12, -8, 5.5],
    [20, 1, 4.5],
  ];
  dedos.forEach(([dx, dy, radio]) => {
    ctx.beginPath();
    ctx.arc(x + dx * escala, y + dy * escala, radio * escala, 0, Math.PI * 2);
    ctx.fill();
  });
}

function rectanguloRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
  relleno: string,
  borde?: string
) {
  ctx.beginPath();
  ctx.roundRect(x, y, ancho, alto, radio);
  ctx.fillStyle = relleno;
  ctx.fill();
  if (borde) {
    ctx.strokeStyle = borde;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function envolverTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  anchoMaximo: number
): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let linea = "";

  for (const palabra of palabras) {
    const propuesta = linea ? `${linea} ${palabra}` : palabra;
    if (linea && ctx.measureText(propuesta).width > anchoMaximo) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = propuesta;
    }
  }

  if (linea) lineas.push(linea);
  return lineas.length ? lineas : [""];
}

async function dibujarTarjetaConfirmacion(
  canvas: HTMLCanvasElement,
  reserva: Reserva,
  incluirMonto: boolean,
  total: number
): Promise<void> {
  const ancho = 1080;
  const ctxInicial = canvas.getContext("2d");
  if (!ctxInicial) throw new Error("No se pudo preparar la tarjeta.");

  canvas.width = ancho;
  canvas.height = 1200;
  ctxInicial.font = "34px Arial, sans-serif";
  const perros = (reserva.reserva_perritos ?? [])
    .map((detalle) => primero(detalle.perritos)?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre));
  const listaPerros = perros.length ? perros : ["Tus peluditos"];
  const renglonesPerros = listaPerros.map((nombre) => ({
    nombre,
    lineas: envolverTexto(ctxInicial, nombre, 815),
  }));
  const altoRenglones = renglonesPerros.reduce(
    (alto, item) => alto + Math.max(58, item.lineas.length * 42 + 12),
    0
  );

  const yPerros = 500;
  const altoTarjetaPerros = 90 + altoRenglones + 20;
  const yFechas = yPerros + altoTarjetaPerros + 24;
  const yNota = yFechas + 158;
  const yAgradecimiento = yNota + 143;
  const yPago = yAgradecimiento + 100;
  const altoPago = incluirMonto ? 180 : 0;
  const altoFinal = (incluirMonto ? yPago + altoPago : yAgradecimiento + 70) + 78;

  canvas.height = altoFinal;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo dibujar la tarjeta.");

  // Fondo blanco y adornos en los tonos morados de PetFunCR.
  ctx.fillStyle = "#FFFDFF";
  ctx.fillRect(0, 0, ancho, altoFinal);
  const fondo = ctx.createLinearGradient(0, 0, ancho, altoFinal);
  fondo.addColorStop(0, "rgba(229, 213, 255, 0.68)");
  fondo.addColorStop(0.24, "rgba(255, 255, 255, 0.10)");
  fondo.addColorStop(1, "rgba(242, 231, 255, 0.80)");
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ancho, altoFinal);

  ctx.fillStyle = "rgba(203, 175, 248, 0.23)";
  ctx.beginPath();
  ctx.ellipse(-40, 40, 230, 150, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ancho + 40, 265, 200, 160, -0.4, 0, Math.PI * 2);
  ctx.fill();
  dibujarPata(ctx, 92, 180, "rgba(126, 78, 184, 0.22)", 1.8);
  dibujarPata(ctx, 974, 350, "rgba(126, 78, 184, 0.20)", 1.4);

  // Logo oficial. Si aún no está en /public, la tarjeta conserva el nombre de marca.
  try {
    const logo = new Image();
    await new Promise<void>((resolve) => {
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
      logo.crossOrigin = "anonymous";
      logo.src = "https://zepzmjitngvjuzzzodfj.supabase.co/storage/v1/object/public/branding/logo-petfuncr.png";
    });
    if (logo.complete && logo.naturalWidth > 0) {
      const lado = 238;
      ctx.drawImage(logo, (ancho - lado) / 2, 28, lado, lado);
    } else {
      ctx.fillStyle = "#512080";
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PetFunCR", ancho / 2, 152);
    }
  } catch {
    ctx.fillStyle = "#512080";
    ctx.font = "bold 48px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PetFunCR", ancho / 2, 152);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#42166D";
  ctx.font = "bold 53px Arial, sans-serif";
  ctx.fillText("¡Hospedaje confirmado!", ancho / 2, 310, 980);
  ctx.fillStyle = "#68429A";
  ctx.font = "italic 34px Arial, sans-serif";
  ctx.fillText("¡Nos alegra recibir a tus peluditos!", ancho / 2, 360, 960);

  rectanguloRedondeado(ctx, 55, 390, 970, 82, 27, "rgba(236, 224, 255, 0.94)");
  ctx.fillStyle = "#42166D";
  ctx.font = "bold 35px Arial, sans-serif";
  const saludo = envolverTexto(ctx, `Hola, ${nombrePropietario(reserva)}`, 890);
  saludo.slice(0, 2).forEach((linea, i) => {
    ctx.fillText(linea, ancho / 2, saludo.length > 1 ? 426 + i * 37 : 442, 900);
  });

  rectanguloRedondeado(ctx, 55, yPerros, 970, altoTarjetaPerros, 30, "rgba(255, 255, 255, 0.94)", "#E5D2FC");
  dibujarPata(ctx, 112, yPerros + 46, "#7543A7", 1.35);
  ctx.textAlign = "left";
  ctx.fillStyle = "#42166D";
  ctx.font = "bold 39px Arial, sans-serif";
  ctx.fillText("Perritos", 160, yPerros + 60);

  let cursorY = yPerros + 112;
  for (const item of renglonesPerros) {
    dibujarPata(ctx, 112, cursorY + 3, "#8C5CC4", 0.75);
    ctx.fillStyle = "#4E2679";
    ctx.font = "34px Arial, sans-serif";
    item.lineas.forEach((linea, index) => {
      ctx.fillText(linea, 158, cursorY + index * 40, 830);
    });
    cursorY += Math.max(58, item.lineas.length * 42 + 12);
  }

  rectanguloRedondeado(ctx, 55, yFechas, 970, 132, 28, "#F0E6FF");
  ctx.strokeStyle = "#C8A5F2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(540, yFechas + 22);
  ctx.lineTo(540, yFechas + 110);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = "#512080";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillText("Entrada", 110, yFechas + 47);
  ctx.fillText("Salida", 590, yFechas + 47);
  ctx.font = "32px Arial, sans-serif";
  ctx.fillText(fechaCorta(reserva.fecha_entrada), 110, yFechas + 91, 410);
  ctx.fillText(fechaCorta(reserva.fecha_salida), 590, yFechas + 91, 410);

  rectanguloRedondeado(ctx, 80, yNota, 920, 112, 25, "rgba(236, 224, 255, 0.82)");
  ctx.textAlign = "center";
  ctx.fillStyle = "#3F1D65";
  ctx.font = "29px Arial, sans-serif";
  ctx.fillText("Unos días antes nos pondremos en contacto", ancho / 2, yNota + 44, 880);
  ctx.fillText("para coordinar los últimos detalles de su estadía.", ancho / 2, yNota + 82, 880);

  ctx.fillStyle = "#512080";
  ctx.font = "italic bold 36px Arial, sans-serif";
  ctx.fillText("¡Gracias por confiar en PetFunCR!", ancho / 2, yAgradecimiento + 4, 970);
  ctx.font = "27px Arial, sans-serif";
  ctx.fillStyle = "#7543A7";
  ctx.fillText("¡Los esperamos con mucha alegría!  ♥", ancho / 2, yAgradecimiento + 45, 960);

  if (incluirMonto) {
    rectanguloRedondeado(ctx, 55, yPago, 970, altoPago, 28, "#FFFFFF", "#C8A5F2");
    ctx.textAlign = "left";
    ctx.fillStyle = "#512080";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillText("Información de pago", 95, yPago + 48);
    ctx.fillStyle = "#42166D";
    ctx.font = "29px Arial, sans-serif";
    ctx.fillText("Total del hospedaje:", 95, yPago + 94);
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.fillText(`${moneda(total)} colones`, 95, yPago + 139, 480);
    ctx.fillStyle = "#68429A";
    ctx.fillRect(555, yPago + 65, 2, 88);
    ctx.fillStyle = "#42166D";
    ctx.font = "29px Arial, sans-serif";
    ctx.fillText("SINPE Móvil:", 595, yPago + 94);
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.fillText("8568 9575 / 8583 5179", 595, yPago + 139);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#8B65B2";
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText("PetFunCR · 8568 9575 · Cuidamos a los miembros de tu familia", ancho / 2, altoFinal - 28, 980);
}

async function blobDeCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen de la tarjeta."));
    }, "image/png");
  });
}

function descargarTarjeta(blob: Blob, numeroReserva: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `PetFunCR-confirmacion-${numeroReserva}.png`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function ReservasPage() {
  const { puede, esSuperadmin } = usePermisos();
  const { sucursalActivaId } = useSucursalActiva();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstado>("Pendiente");

  const [reservaSeleccionada, setReservaSeleccionada] =
    useState<Reserva | null>(null);

  const [observacionesAdmin, setObservacionesAdmin] =
    useState("");

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState<"exito" | "error" | "info">("info");

  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] =
    useState<number | null>(null);

  const [confirmarAprobacion, setConfirmarAprobacion] =
    useState(false);

  const [confirmarRechazo, setConfirmarRechazo] =
    useState(false);

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [incluirMontoConfirmacion, setIncluirMontoConfirmacion] = useState(false);
  const [compartiendoConfirmacion, setCompartiendoConfirmacion] = useState(false);
  const [mensajeCompartir, setMensajeCompartir] = useState("");
  const [enlaceWhatsApp, setEnlaceWhatsApp] = useState("");
  const tarjetaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const cargarReservas = useCallback(async () => {
    setCargando(true);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion) {
        throw new Error(
          "No se pudo comprobar la sesión actual."
        );
      }

      if (!session?.access_token) {
        throw new Error(
          "Tu sesión no está activa. Iniciá sesión nuevamente."
        );
      }

      const sucursalParam = sucursalActivaId ?? "global";
      const respuesta = await fetch(
        `/api/admin/reservas?sucursalId=${sucursalParam}`,
        {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        }
      );

      const datos: RespuestaAPI = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ?? "No se pudieron cargar las reservas."
        );
      }

      setReservas(datos.reservas ?? []);
    } catch (error) {
      console.error("Error cargando reservas:", error);

      setTipoMensaje("error");
      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar las reservas."
      );
    } finally {
      setCargando(false);
    }
  }, [sucursalActivaId]);

  useEffect(() => {
    void cargarReservas();
  }, [cargarReservas]);

  // Si cambia la sucursal activa, cerramos el detalle anterior para no
  // dejar abierto un registro de otra sucursal.
  useEffect(() => {
    setReservaSeleccionada(null);
    setObservacionesAdmin("");
    setConfirmarAprobacion(false);
    setConfirmarRechazo(false);
    setMostrarConfirmacion(false);
    setMensajeCompartir("");
    setEnlaceWhatsApp("");
  }, [sucursalActivaId]);

  useEffect(() => {
    const canvas = tarjetaCanvasRef.current;
    if (!mostrarConfirmacion || !canvas || !reservaSeleccionada) return;

    let activo = true;
    dibujarTarjetaConfirmacion(
      canvas,
      reservaSeleccionada,
      incluirMontoConfirmacion,
      totalEstimadoReserva(reservaSeleccionada)
    ).catch((error) => {
      if (activo) {
        console.error("Error generando la tarjeta de confirmación:", error);
        setMensajeCompartir("No se pudo generar la vista previa. Probá descargar la tarjeta nuevamente.");
      }
    });

    return () => {
      activo = false;
    };
  }, [mostrarConfirmacion, reservaSeleccionada, incluirMontoConfirmacion]);

  const reservasDeSucursal = useMemo(() => {
    // Solo el superadministrador dispone del selector global de sucursal.
    // En vista global (null) conserva todas las sucursales autorizadas.
    if (!esSuperadmin || sucursalActivaId === null) {
      return reservas;
    }

    return reservas.filter(
      (reserva) => Number(reserva.sucursal_id) === Number(sucursalActivaId)
    );
  }, [reservas, esSuperadmin, sucursalActivaId]);

  const reservasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return reservasDeSucursal.filter((reserva) => {
      const propietario = nombrePropietario(reserva);
      const sucursal = primero(reserva.sucursales)?.nombre ?? "";
      const numero = reserva.numero_reserva ?? "";
      const perritos = nombresPerritos(reserva);

      const coincideTexto =
        !texto ||
        `${numero} ${propietario} ${sucursal} ${perritos}`
          .toLowerCase()
          .includes(texto);

      const coincideEstado =
        filtroEstado === "Todas" ||
        reserva.estado === filtroEstado;

      return coincideTexto && coincideEstado;
    });
  }, [reservasDeSucursal, busqueda, filtroEstado]);

  const pendientes = reservasDeSucursal.filter(
    (reserva) => reserva.estado === "Pendiente"
  ).length;

  const aprobadas = reservasDeSucursal.filter(
    (reserva) => reserva.estado === "Aprobada"
  ).length;

  const rechazadas = reservasDeSucursal.filter(
    (reserva) => reserva.estado === "Rechazada"
  ).length;

  function abrirDetalle(reserva: Reserva) {
    setReservaSeleccionada(reserva);
    setObservacionesAdmin(reserva.observaciones_admin ?? "");
    setConfirmarAprobacion(false);
    setConfirmarRechazo(false);
    setMostrarConfirmacion(false);
    setMensajeCompartir("");
    setEnlaceWhatsApp("");
    setMensaje("");
  }

  function cerrarDetalle() {
    if (procesandoId !== null) return;

    setReservaSeleccionada(null);
    setObservacionesAdmin("");
    setConfirmarAprobacion(false);
    setConfirmarRechazo(false);
    setMostrarConfirmacion(false);
    setMensajeCompartir("");
    setEnlaceWhatsApp("");
  }

  function abrirConfirmacionWhatsApp() {
    setIncluirMontoConfirmacion(false);
    setMensajeCompartir("");
    setEnlaceWhatsApp("");
    setMostrarConfirmacion(true);
  }

  async function obtenerBlobConfirmacion(): Promise<Blob> {
    if (!reservaSeleccionada) {
      throw new Error("No hay una reserva seleccionada.");
    }

    const canvas = document.createElement("canvas");
    await dibujarTarjetaConfirmacion(
      canvas,
      reservaSeleccionada,
      incluirMontoConfirmacion,
      totalEstimadoReserva(reservaSeleccionada)
    );
    return blobDeCanvas(canvas);
  }

  async function descargarConfirmacion() {
    if (!reservaSeleccionada || compartiendoConfirmacion) return;
    setCompartiendoConfirmacion(true);
    setMensajeCompartir("");
    try {
      const blob = await obtenerBlobConfirmacion();
      descargarTarjeta(blob, reservaSeleccionada.numero_reserva);
      setMensajeCompartir("Tarjeta descargada. Ya podés adjuntarla en WhatsApp.");
    } catch (error) {
      setMensajeCompartir(
        error instanceof Error ? error.message : "No se pudo descargar la tarjeta."
      );
    } finally {
      setCompartiendoConfirmacion(false);
    }
  }

  async function compartirConfirmacion() {
    if (!reservaSeleccionada || compartiendoConfirmacion) return;

    const reserva = reservaSeleccionada;
    const texto = textoConfirmacionWhatsApp(
      reserva,
      incluirMontoConfirmacion,
      totalEstimadoReserva(reserva)
    );
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(texto)}`;

    // En navegadores sin compartir archivos, abrimos la pestaña desde el clic
    // del usuario para reducir la posibilidad de que el navegador la bloquee.
    let ventanaWhatsApp: Window | null = null;
    let puedeCompartirArchivo = false;
    try {
      if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        const archivoPrueba = new File([""], "petfuncr-prueba.png", { type: "image/png" });
        puedeCompartirArchivo = navigator.canShare({ files: [archivoPrueba] });
      }
    } catch {
      puedeCompartirArchivo = false;
    }
    if (!puedeCompartirArchivo) {
      ventanaWhatsApp = window.open("about:blank", "_blank");
    }

    setCompartiendoConfirmacion(true);
    setMensajeCompartir("");
    try {
      const blob = await obtenerBlobConfirmacion();
      const archivo = new File(
        [blob],
        `PetFunCR-confirmacion-${reserva.numero_reserva}.png`,
        { type: "image/png" }
      );

      if (
        puedeCompartirArchivo &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [archivo] })
      ) {
        if (ventanaWhatsApp && !ventanaWhatsApp.closed) ventanaWhatsApp.close();
        await navigator.share({
          title: "Confirmación de hospedaje PetFunCR",
          text: texto,
          files: [archivo],
        });
        setMensajeCompartir(
          "Se abrió el menú para compartir. Elegí WhatsApp y luego el contacto del cliente."
        );
      } else {
        descargarTarjeta(blob, reserva.numero_reserva);
        if (ventanaWhatsApp && !ventanaWhatsApp.closed) {
          ventanaWhatsApp.location.href = urlWhatsApp;
        } else {
          setEnlaceWhatsApp(urlWhatsApp);
        }
        setMensajeCompartir(
          "La tarjeta se descargó y preparamos el mensaje. En WhatsApp elegí el contacto y adjuntá el PNG descargado."
        );
      }
    } catch (error) {
      if (ventanaWhatsApp && !ventanaWhatsApp.closed) ventanaWhatsApp.close();
      if (error instanceof Error && error.name === "AbortError") {
        setMensajeCompartir("No se compartió nada. Podés intentarlo de nuevo cuando querás.");
      } else {
        setMensajeCompartir(
          error instanceof Error ? error.message : "No se pudo preparar la confirmación."
        );
      }
    } finally {
      setCompartiendoConfirmacion(false);
    }
  }

  async function ejecutarAccion(
    accion: "aprobar" | "rechazar"
  ) {
    if (!reservaSeleccionada) return;

    if (reservaSeleccionada.estado !== "Pendiente") {
      setTipoMensaje("error");
      setMensaje(
        "Esta solicitud ya no está pendiente. Actualizá la lista."
      );
      return;
    }

    if (accion === "aprobar" && !confirmarAprobacion) {
      setTipoMensaje("error");
      setMensaje("Marcá la confirmación antes de aprobar.");
      return;
    }

    if (accion === "rechazar" && !confirmarRechazo) {
      setTipoMensaje("error");
      setMensaje("Marcá la confirmación antes de rechazar.");
      return;
    }

    const propietario = nombrePropietario(reservaSeleccionada);
    const numero = reservaSeleccionada.numero_reserva;

    const confirmacion =
      accion === "aprobar"
        ? `¿Confirmás aprobar la reserva ${numero} de ${propietario}? La operación intentará crear las estadías de los perritos.`
        : `¿Confirmás rechazar la reserva ${numero} de ${propietario}? No se crearán estadías.`;

    if (!window.confirm(confirmacion)) return;

    setProcesandoId(reservaSeleccionada.id);
    setMensaje("");

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session?.access_token) {
        throw new Error(
          "Tu sesión no está activa. Iniciá sesión nuevamente."
        );
      }

      const ruta =
        accion === "aprobar"
          ? "/api/admin/reservas/aprobar"
          : "/api/admin/reservas/rechazar";

      const respuesta = await fetch(ruta, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservaId: reservaSeleccionada.id,
          observacionesAdmin: observacionesAdmin.trim(),
        }),
        cache: "no-store",
      });

      const datos: RespuestaAPI = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ?? `No se pudo ${accion} la reserva.`
        );
      }

      setTipoMensaje("exito");
      setMensaje(
        datos.mensaje ??
          (accion === "aprobar"
            ? "Reserva aprobada correctamente."
            : "Reserva rechazada correctamente.")
      );

      setReservaSeleccionada(null);
      setObservacionesAdmin("");
      setConfirmarAprobacion(false);
      setConfirmarRechazo(false);

      await cargarReservas();
    } catch (error) {
      console.error(`Error al ${accion} reserva:`, error);
      setTipoMensaje("error");
      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al procesar la reserva."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <RequierePermiso permiso="reservas.ver">
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Reservas</h1>
            <p className="page-description">
              Consultá y gestioná las solicitudes de hotel y guardería
              de PetFunCR.
            </p>
          </div>

          <div className="page-header-actions">
           <p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void cargarReservas()}
              disabled={cargando || procesandoId !== null}
            >
              {cargando ? "Actualizando..." : "↻ Actualizar"}
            </button>
            </p>
          </div>
        </div>

        {mensaje && (
          <div
            className="status-message"
            role="status"
            style={{
              marginBottom: 16,
              borderLeft:
                tipoMensaje === "error"
                  ? "4px solid #b42318"
                  : tipoMensaje === "exito"
                    ? "4px solid #198754"
                    : undefined,
            }}
          >
            {mensaje}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div className="list-card" style={{ padding: 18 }}>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              Solicitudes pendientes
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 5 }}>
              {pendientes}
            </div>
          </div>

          <div className="list-card" style={{ padding: 18 }}>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              Aprobadas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 5 }}>
              {aprobadas}
            </div>
          </div>

          <div className="list-card" style={{ padding: 18 }}>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              Rechazadas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 5 }}>
              {rechazadas}
            </div>
          </div>
        </div>

        <section className="list-card">
          <div
            className="list-toolbar"
            style={{ flexWrap: "wrap", gap: 12 }}
          >
            <div>
              <strong>Solicitudes recibidas</strong>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: 14,
                  marginTop: 3,
                }}
              >
                Resultados: {reservasFiltradas.length}
              </div>
            </div>

            <input
              className="search-input"
              placeholder="Buscar número, propietario, perrito o sucursal..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />

            <select
              className="form-input"
              value={filtroEstado}
              onChange={(event) =>
                setFiltroEstado(event.target.value as FiltroEstado)
              }
              style={{ maxWidth: 210 }}
              aria-label="Filtrar reservas por estado"
            >
              <option value="Pendiente">Pendientes</option>
              <option value="Aprobada">Aprobadas</option>
              <option value="Rechazada">Rechazadas</option>
              <option value="Cancelada">Canceladas</option>
              <option value="Todas">Todos los estados</option>
            </select>
          </div>

          {cargando ? (
            <div className="empty-state">
              Cargando solicitudes de reserva...
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="empty-state">
              No se encontraron reservas con estos criterios.
            </div>
          ) : (
            <>
              <div className="desktop-only">
                <div className="table-scroll-x">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Reserva</th>
                        <th>Propietario</th>
                        <th>Perritos</th>
                        <th>Sucursal</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Servicio</th>
                        <th>Estado</th>
                        <th>Detalle</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reservasFiltradas.map((reserva) => {
                        const estado = etiquetaEstado(reserva.estado);

                        return (
                          <tr key={reserva.id}>
                            <td>
                              <strong>{reserva.numero_reserva}</strong>
                            </td>
                            <td>{nombrePropietario(reserva)}</td>
                            <td>{nombresPerritos(reserva) || "—"}</td>
                            <td>
                              {primero(reserva.sucursales)?.nombre ?? "—"}
                            </td>
                            <td>{fechaCorta(reserva.fecha_entrada)}</td>
                            <td>{fechaCorta(reserva.fecha_salida)}</td>
                            <td>
                              {primero(reserva.tipos_estadia)?.nombre ??
                                (reserva.tipo_estadia_id === 1
                                  ? "Hotel"
                                  : reserva.tipo_estadia_id === 2
                                    ? "Guardería"
                                    : "—")}
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  background: estado.fondo,
                                  color: estado.color,
                                  padding: "5px 9px",
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {estado.texto}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => abrirDetalle(reserva)}
                              >
                                Ver detalle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mobile-only">
                <div className="mobile-list">
                  {reservasFiltradas.map((reserva) => {
                    const estado = etiquetaEstado(reserva.estado);

                    return (
                      <div
                        key={reserva.id}
                        className="mobile-record-card"
                        style={{
                          // Usa los colores del tema activo; evita texto claro sobre fondo blanco.
                          background: "var(--color-card, var(--color-background, #202127))",
                          color: "inherit",
                          border: "1px solid var(--color-border, #3a3b43)",
                          textAlign: "left",
                        }}
                      >
                        <div className="mobile-record-title">
                          {reserva.numero_reserva}
                        </div>

                        <div className="mobile-record-grid">
                          <div className="mobile-record-full">
                            <span className="mobile-record-label">
                              Propietario
                            </span>
                            <strong>{nombrePropietario(reserva)}</strong>
                          </div>

                          <div className="mobile-record-full">
                            <span className="mobile-record-label">
                              Perritos
                            </span>
                            <strong>{nombresPerritos(reserva) || "—"}</strong>
                          </div>

                          <div>
                            <span className="mobile-record-label">Entrada</span>
                            <strong>{fechaCorta(reserva.fecha_entrada)}</strong>
                          </div>

                          <div>
                            <span className="mobile-record-label">Salida</span>
                            <strong>{fechaCorta(reserva.fecha_salida)}</strong>
                          </div>

                          <div className="mobile-record-full">
                            <span className="mobile-record-label">Sucursal</span>
                            <strong>
                              {primero(reserva.sucursales)?.nombre ?? "—"}
                            </strong>
                          </div>
                        </div>

                        <div style={{ margin: "12px 0" }}>
                          <span
                            style={{
                              display: "inline-block",
                              background: estado.fondo,
                              color: estado.color,
                              padding: "5px 9px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {estado.texto}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => abrirDetalle(reserva)}
                        >
                          Ver detalle →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {reservaSeleccionada && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                cerrarDetalle();
              }
            }}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-detalle-reserva"
              style={{
                maxWidth: 760,
                width: "100%",
                maxHeight: "calc(100dvh - 24px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div className="modal-header">
                <h2 id="titulo-detalle-reserva">
                  Detalle de reserva
                </h2>

                <button
                  type="button"
                  className="icon-button"
                  onClick={cerrarDetalle}
                  disabled={procesandoId !== null}
                  aria-label="Cerrar detalle"
                >
                  ×
                </button>
              </div>

              <div
                className="modal-body"
                style={{ minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 14,
                    alignItems: "start",
                  }}
                >
                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Número de reserva</div>
                    <strong>{reservaSeleccionada.numero_reserva}</strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Estado</div>
                    <strong>{reservaSeleccionada.estado}</strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Propietario</div>
                    <strong>{nombrePropietario(reservaSeleccionada)}</strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Teléfono</div>
                    <strong>
                      {primero(reservaSeleccionada.propietarios)?.telefono ??
                        "—"}
                    </strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Sucursal</div>
                    <strong>
                      {primero(reservaSeleccionada.sucursales)?.nombre ?? "—"}
                    </strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Servicio</div>
                    <strong>
                      {primero(reservaSeleccionada.tipos_estadia)?.nombre ??
                        (reservaSeleccionada.tipo_estadia_id === 1
                          ? "Hotel"
                          : reservaSeleccionada.tipo_estadia_id === 2
                            ? "Guardería"
                            : "—")}
                    </strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Fecha de entrada</div>
                    <strong>
                      {fechaCorta(reservaSeleccionada.fecha_entrada)}
                    </strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Fecha de salida</div>
                    <strong>
                      {fechaCorta(reservaSeleccionada.fecha_salida)}
                    </strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Turno de entrada</div>
                    <strong>
                      {reservaSeleccionada.turno_entrada === "manana"
                        ? "Mañana"
                        : reservaSeleccionada.turno_entrada === "tarde"
                          ? "Tarde"
                          : reservaSeleccionada.turno_entrada || "—"}
                    </strong>
                  </div>

                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="form-label">Monto estimado</div>
                    <strong>
                      {moneda(reservaSeleccionada.monto_estimado)}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <h3 style={{ marginBottom: 12 }}>Perritos incluidos</h3>

                  {(reservaSeleccionada.reserva_perritos ?? []).length ===
                  0 ? (
                    <p>No hay perritos asociados a esta solicitud.</p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                        gap: 12,
                        alignItems: "stretch",
                      }}
                    >
                      {(reservaSeleccionada.reserva_perritos ?? []).map(
                        (detalle) => {
                          const subtotal =
                            reservaSeleccionada.tipo_estadia_id === 1
                              ? detalle.subtotal_hotel_estimado
                              : detalle.subtotal_guarderia_estimado;
                          const nombre = primero(detalle.perritos)?.nombre ?? "Perrito sin nombre";
                          const tipoSubtotal =
                            reservaSeleccionada.tipo_estadia_id === 1
                              ? "Subtotal hotel"
                              : "Subtotal guardería";

                          return (
                            <div
                              key={detalle.id}
                              style={{
                                minWidth: 0,
                                padding: 14,
                                border: "1px solid var(--color-border, #3a3b43)",
                                borderRadius: 12,
                                background: "var(--color-card, var(--color-background, #202127))",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 10,
                                  minWidth: 0,
                                }}
                              >
                                <span
                                  aria-hidden="true"
                                  style={{
                                    flex: "0 0 38px",
                                    width: 38,
                                    height: 38,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: 10,
                                    background: "rgba(151, 116, 255, 0.14)",
                                    color: "var(--color-primary, #9b80ff)",
                                    fontSize: 19,
                                  }}
                                >
                                  🐾
                                </span>
                                <strong
                                  style={{
                                    minWidth: 0,
                                    paddingTop: 2,
                                    overflowWrap: "anywhere",
                                    lineHeight: 1.35,
                                    fontSize: 15,
                                  }}
                                >
                                  {nombre}
                                </strong>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)",
                                  gap: 10,
                                  paddingTop: 11,
                                  borderTop: "1px solid var(--color-border, #3a3b43)",
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      color: "var(--color-text-secondary)",
                                      fontSize: 12,
                                      marginBottom: 4,
                                    }}
                                  >
                                    Días
                                  </div>
                                  <strong style={{ fontSize: 15 }}>
                                    {detalle.dias_calculados ?? "—"}
                                  </strong>
                                </div>

                                <div style={{ minWidth: 0, textAlign: "right" }}>
                                  <div
                                    style={{
                                      color: "var(--color-text-secondary)",
                                      fontSize: 12,
                                      marginBottom: 4,
                                    }}
                                  >
                                    {tipoSubtotal}
                                  </div>
                                  <strong
                                    style={{
                                      fontSize: 15,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {moneda(subtotal)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 18 }}>
                  <label className="form-label" htmlFor="observaciones-admin">
                    Observaciones administrativas
                  </label>
                  <textarea
                    id="observaciones-admin"
                    className="form-textarea"
                    value={observacionesAdmin}
                    onChange={(event) =>
                      setObservacionesAdmin(event.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                    placeholder="Notas internas sobre esta solicitud..."
                    disabled={procesandoId !== null}
                  />
                  <div
                    style={{
                      textAlign: "right",
                      color: "var(--color-text-secondary)",
                      fontSize: 12,
                    }}
                  >
                    {observacionesAdmin.length}/2000
                  </div>
                </div>

                {reservaSeleccionada.observaciones_cliente && (
                  <div style={{ marginTop: 16 }}>
                    <div className="form-label">
                      Observaciones del cliente
                    </div>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {reservaSeleccionada.observaciones_cliente}
                    </p>
                  </div>
                )}

                {reservaSeleccionada.estado === "Pendiente" && (
                  <div
                    style={{
                      marginTop: 22,
                      padding: 14,
                      borderRadius: 8,
                      background: "var(--color-background, #f8f9fa)",
                    }}
                  >
                    {puede("reservas.gestionar") ? (
                      <>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                            marginBottom: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={confirmarAprobacion}
                            onChange={(event) =>
                              setConfirmarAprobacion(
                                event.target.checked
                              )
                            }
                            disabled={procesandoId !== null}
                            style={{ marginTop: 4 }}
                          />
                          <span>
                            Confirmo que revisé las fechas, los perritos y
                            los requisitos de esta solicitud. Entiendo que
                            aprobarla intentará crear las estadías.
                          </span>
                        </label>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => void ejecutarAccion("aprobar")}
                          disabled={
                            procesandoId !== null ||
                            !confirmarAprobacion
                          }
                        >
                          {procesandoId === reservaSeleccionada.id
                            ? "Procesando..."
                            : "✓ Aprobar reserva"}
                        </button>

                        <div
                          style={{
                            height: 1,
                            background: "var(--color-border, #ddd)",
                            margin: "18px 0",
                          }}
                        />

                        <label
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 9,
                            marginBottom: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={confirmarRechazo}
                            onChange={(event) =>
                              setConfirmarRechazo(event.target.checked)
                            }
                            disabled={procesandoId !== null}
                            style={{ marginTop: 4 }}
                          />
                          <span>
                            Confirmo que deseo rechazar esta solicitud.
                          </span>
                        </label>
<strong>
         <button
  type="button"
  className="secondary-button"
  onClick={() => void ejecutarAccion("rechazar")}
  disabled={
    procesandoId !== null ||
    !confirmarRechazo
  }
  style={{
    backgroundColor: "#DC2626",
    border: "1px solid #DC2626",
    color: "#FFFFFF",    
  }}
>
  Rechazar reserva
</button></strong>

                      </>
                    ) : (
                      <p>
                        Tu perfil puede consultar las reservas, pero no
                        aprobarlas ni rechazarlas.
                      </p>
                    )}
                  </div>
                )}

                {reservaSeleccionada.estado === "Aprobada" && puede("reservas.gestionar") && (
                  <div
                    style={{
                      marginTop: 22,
                      padding: 14,
                      borderRadius: 12,
                      background: "rgba(132, 83, 186, 0.10)",
                      border: "1px solid rgba(132, 83, 186, 0.28)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Confirmación para el cliente
                    </div>
                    <p style={{ marginTop: 0, marginBottom: 12, color: "var(--color-text-secondary)" }}>
                      Generá una tarjeta personalizada con el logo de PetFunCR y prepará el mensaje para escoger el contacto en WhatsApp.
                    </p>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={abrirConfirmacionWhatsApp}
                      disabled={procesandoId !== null}
                    >
                      💜 Preparar confirmación por WhatsApp
                    </button>
                  </div>
                )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={cerrarDetalle}
                    disabled={procesandoId !== null}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mostrarConfirmacion && reservaSeleccionada?.estado === "Aprobada" && (
          <div
            className="modal-backdrop"
            style={{ zIndex: 1200 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !compartiendoConfirmacion) {
                setMostrarConfirmacion(false);
                setMensajeCompartir("");
                setEnlaceWhatsApp("");
              }
            }}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-confirmacion-whatsapp"
              style={{
                maxWidth: 760,
                width: "100%",
                maxHeight: "calc(100dvh - 24px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div className="modal-header">
                <div>
                  <h2 id="titulo-confirmacion-whatsapp" style={{ marginBottom: 4 }}>
                    Confirmación por WhatsApp
                  </h2>
                  <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 13 }}>
                    {reservaSeleccionada.numero_reserva}
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => {
                    if (compartiendoConfirmacion) return;
                    setMostrarConfirmacion(false);
                    setMensajeCompartir("");
                    setEnlaceWhatsApp("");
                  }}
                  disabled={compartiendoConfirmacion}
                  aria-label="Cerrar confirmación"
                >
                  ×
                </button>
              </div>

              <div className="modal-body" style={{ minHeight: 0, overflowY: "auto" }}>
                <div
                  style={{
                    padding: 14,
                    border: "1px solid rgba(132, 83, 186, 0.28)",
                    borderRadius: 12,
                    background: "rgba(132, 83, 186, 0.08)",
                    marginBottom: 16,
                  }}
                >
                  <label
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={incluirMontoConfirmacion}
                      onChange={(event) => {
                        setIncluirMontoConfirmacion(event.target.checked);
                        setMensajeCompartir("");
                        setEnlaceWhatsApp("");
                      }}
                      disabled={compartiendoConfirmacion}
                      style={{ marginTop: 4 }}
                    />
                    <span>
                      <strong>Incluir monto del hospedaje y datos de SINPE</strong>
                      <span style={{ display: "block", marginTop: 4, color: "var(--color-text-secondary)", fontSize: 13 }}>
                        Si activás esta opción, incluiremos el total calculado a partir de los subtotales de la reserva y el SINPE Móvil 8568 9575.
                      </span>
                    </span>
                  </label>
                  {incluirMontoConfirmacion && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border, #ddd)" }}>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Total que aparecerá en la tarjeta</div>
                      <strong style={{ color: "#7543A7", fontSize: 22 }}>
                        {moneda(totalEstimadoReserva(reservaSeleccionada))}
                      </strong>
                      {totalEstimadoReserva(reservaSeleccionada) <= 0 && (
                        <p style={{ marginBottom: 0, color: "#b42318", fontSize: 13 }}>
                          Atención: el total calculado es ₡0. Revisá los subtotales de esta reserva antes de compartir el precio.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    border: "1px solid var(--color-border, #ddd)",
                    borderRadius: 12,
                    padding: 8,
                    background: "#f8f5fc",
                    maxHeight: "48vh",
                    overflow: "auto",
                    textAlign: "center",
                  }}
                >
                  <canvas
                    ref={tarjetaCanvasRef}
                    aria-label="Vista previa de la tarjeta de confirmación PetFunCR"
                    style={{ display: "block", width: "100%", height: "auto", margin: "0 auto", maxWidth: 540 }}
                  />
                </div>
                <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
                  La tarjeta usa el logo guardado como <code>public/petfuncr-logo.png</code>. Si todavía no lo agregaste, se mostrará el nombre PetFunCR como respaldo.
                </p>

                {mensajeCompartir && (
                  <div
                    role="status"
                    style={{
                      marginTop: 14,
                      padding: 12,
                      borderRadius: 9,
                      background: "var(--color-background, #f8f9fa)",
                      borderLeft: "4px solid #7543A7",
                    }}
                  >
                    {mensajeCompartir}
                    {enlaceWhatsApp && (
                      <div style={{ marginTop: 8 }}>
                        <a href={enlaceWhatsApp} target="_blank" rel="noreferrer" style={{ color: "#7543A7", fontWeight: 700 }}>
                          Abrir WhatsApp con el mensaje preparado
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>


<div
  className="modal-footer"
  style={{
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  }}
>
  <button
    type="button"
    className="secondary-button"
    onClick={() => void descargarConfirmacion()}
    disabled={compartiendoConfirmacion}
  >
    {compartiendoConfirmacion ? "Preparando..." : "Descargar tarjeta PNG"}
  </button>

  <button
    type="button"
    className="primary-button"
    onClick={() => void compartirConfirmacion()}
    disabled={compartiendoConfirmacion}
  >
    {compartiendoConfirmacion ? "Preparando..." : "Compartir tarjeta y mensaje"}
  </button>

  <button
    type="button"
    className="secondary-button"
    style={{
      backgroundColor: "#25D366",
      color: "#FFFFFF",
      borderColor: "#25D366",
    }}
    onClick={() => {
      const texto = textoConfirmacionWhatsApp(
        reservaSeleccionada,
        incluirMontoConfirmacion,
        totalEstimadoReserva(reservaSeleccionada)
      );
      const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
      setEnlaceWhatsApp(url);
      window.open(url, "_blank", "noopener,noreferrer");
    }}
  >
    Abrir WhatsApp con texto
  </button>

  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      if (compartiendoConfirmacion) return;
      setMostrarConfirmacion(false);
      setMensajeCompartir("");
      setEnlaceWhatsApp("");
    }}
    disabled={compartiendoConfirmacion}
  >
    Volver al detalle
  </button>
 
</div>

           
            </div>
          </div>
        )}
      </div>
    </RequierePermiso>
  );
}
