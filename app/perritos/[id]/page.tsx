"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";
import { usePermisos } from "@/hooks/usePermisos";

import {
  LOGO_PETFUNCR_URL,
  WHATSAPP_ICON_URL,
  FACEBOOK_ICON_URL,
  INSTAGRAM_ICON_URL,
  TIKTOK_ICON_URL,
} from "@/lib/branding";

import {
  toBlob,
} from "html-to-image";

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

    sucursal_id: number;

sucursales: {
  id: number;
  nombre: string;
} | null;

foto_path: string | null;

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

  const [fotoUrl, setFotoUrl] =
  useState<string | null>(null);

  const [subiendoFoto, setSubiendoFoto] =
  useState(false);

const [mensajeFoto, setMensajeFoto] =
  useState("");

  const fichaSaludRef =
  useRef<HTMLDivElement | null>(null);

  const previewFichaRef =
  useRef<HTMLDivElement | null>(null);

  const [
  modalFichaSalud,
  setModalFichaSalud,
] = useState(false);

  useEffect(() => {
  if (!mensajeFoto) {
    return;
  }

  const timer = setTimeout(() => {
    setMensajeFoto("");
  }, 3000);

  return () => {
    clearTimeout(timer);
  };
}, [mensajeFoto]);

  const { puede } = usePermisos();


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


const tiposVacunaFicha = [
  "Múltiple",
  "Rabia",
  "Bordetella",
  "Giardia",
];

const vacunasFicha =
  tiposVacunaFicha.map((tipo) => {
    const vacuna =
      vacunasActuales.find(
        (item) =>
          item.tipos_vacuna?.nombre ===
          tipo
      );

    if (!vacuna) {
      return {
        tipo,
        estado: "sin-registro",
        textoEstado: "Sin registro",
        fechaAplicacion: null,
        fechaVencimiento: null,
      };
    }

    const estado =
      obtenerEstadoFecha(
        vacuna.fecha_vencimiento
      );

    return {
      tipo,
      estado:
        estado.estado,
      textoEstado:
        estado.estado === "vigente"
          ? "Vigente"
          : estado.estado === "proxima"
            ? "Por vencer"
            : estado.estado === "vencida"
              ? "Vencida"
              : "Sin fecha",

      fechaAplicacion:
        vacuna.fecha_aplicacion,

      fechaVencimiento:
        vacuna.fecha_vencimiento,
    };
  });

const ultimaDesparasitacion =
  desparasitaciones.length > 0
    ? desparasitaciones[0]
    : null;


    function obtenerUltimaDesparasitacionPorTipo(
  tipoBuscado: "Interna" | "Externa"
) {
  return desparasitaciones.find(
    (item) => {
      const tipo =
        item.tipos_desparasitacion
          ?.nombre;

      return (
        tipo === tipoBuscado ||
        tipo === "Ambas"
      );
    }
  ) ?? null;
}

const desparasitacionesFicha = [
  "Interna",
  "Externa",
].map((tipo) => {
  const registro =
    obtenerUltimaDesparasitacionPorTipo(
      tipo as "Interna" | "Externa"
    );

  if (!registro) {
    return {
      tipo,
      estado: "sin-registro",
      textoEstado: "Sin registro",
      fechaAplicacion: null,
      fechaProxima: null,
    };
  }

  const estado =
    obtenerEstadoFecha(
      registro.fecha_proxima
    );

  return {
    tipo,
    estado:
      estado.estado,
    textoEstado:
      estado.estado === "vigente"
        ? "Al día"
        : estado.estado === "proxima"
          ? "Próxima"
          : estado.estado === "vencida"
            ? "Vencida"
            : "Sin fecha",

    fechaAplicacion:
      registro.fecha_aplicacion,

    fechaProxima:
      registro.fecha_proxima,
  };
});

const alertasSalud = [
  ...vacunasFicha
    .filter(
      (item) =>
        item.estado === "vencida" ||
        item.estado === "proxima" ||
        item.estado === "sin-registro"
    )
    .map((item) => ({
      tipo: "vacuna",
      nombre: item.tipo,
      estado: item.estado,
    })),

  ...desparasitacionesFicha
    .filter(
      (item) =>
        item.estado === "vencida" ||
        item.estado === "proxima" ||
        item.estado === "sin-registro"
    )
    .map((item) => ({
      tipo: "desparasitacion",
      nombre: item.tipo,
      estado: item.estado,
    })),
];


function generarMensajeSalud() {

   if (!perrito) {
    return "";
  }

  const alertasVacunas =
    vacunasFicha.filter(
      (item) =>
        item.estado === "vencida" ||
        item.estado === "proxima" ||
        item.estado === "sin-registro"
    );

  const alertasDesparasitacion =
    desparasitacionesFicha.filter(
      (item) =>
        item.estado === "vencida" ||
        item.estado === "proxima" ||
        item.estado === "sin-registro"
    );

  const partes: string[] = [];

  alertasVacunas.forEach((item) => {
    if (item.estado === "vencida") {
      partes.push(
        `la vacuna ${item.tipo} está vencida`
      );
    }

    if (item.estado === "proxima") {
      partes.push(
        `la vacuna ${item.tipo} está próxima a vencer`
      );
    }

    if (item.estado === "sin-registro") {
      partes.push(
        `no tenemos registro de la vacuna ${item.tipo}`
      );
    }
  });

  alertasDesparasitacion.forEach(
    (item) => {
      if (item.estado === "vencida") {
        partes.push(
          `la desparasitación ${item.tipo.toLowerCase()} está vencida`
        );
      }

      if (item.estado === "proxima") {
        partes.push(
          `la desparasitación ${item.tipo.toLowerCase()} está próxima`
        );
      }

      if (item.estado === "sin-registro") {
        partes.push(
          `no tenemos registro de desparasitación ${item.tipo.toLowerCase()}`
        );
      }
    }
  );

  if (partes.length === 0) {
    return (
      `Hola 😊 Te compartimos la ficha de salud de ${perrito.nombre}. ` +
      `Sus vacunas y desparasitaciones registradas se encuentran al día. 🐶💜`
    );
  }

  return (
    `Hola 😊 Te compartimos la ficha de salud de ${perrito.nombre}. ` +
    `Actualmente observamos que ${partes.join(
      ", "
    )}. ` +
    `Te agradecemos actualizar la información correspondiente cuando sea posible. 🐶💜`
  );
}


async function compartirFichaSalud() {
  if (
    !fichaSaludRef.current ||
    !perrito
  ) {
    return;
  }

  const elemento =
    fichaSaludRef.current;

  /*
    Guardamos los estilos actuales
    para restaurarlos después.
  */
  const estilosOriginales =
    elemento.style.cssText;

  try {
    /*
      Aplicamos temporalmente el
      formato fijo de exportación.
    */
    elemento.classList.add(
      "health-share-card-export"
    );

      /*ACA CAMBIAR SEGUN LA RESOLUCION QUE SE QUIERA    */
    elemento.style.width = "570px";
    elemento.style.minWidth = "570px";
    elemento.style.maxWidth = "570px";

    /*
      Esperamos a que el navegador
      recalcule completamente el layout.
    */
    await new Promise<void>(
      (resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }
    );

    /*
      Esperamos también las fuentes.
    */
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const blob = await toBlob(
      elemento,
      {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
      }
    );

    if (!blob) {
      throw new Error(
        "No se pudo generar la imagen."
      );
    }

    const archivo =
      new File(
        [blob],
        `ficha-salud-${perrito.nombre
          .toLowerCase()
          .replace(/\s+/g, "-")}.png`,
        {
          type: "image/png",
        }
      );

    const mensaje =
      generarMensajeSalud();

    if (
      navigator.share &&
      navigator.canShare?.({
        files: [archivo],
      })
    ) {
      await navigator.share({
        title:
          `Ficha de salud de ${perrito.nombre}`,
        text: mensaje,
        files: [archivo],
      });

      return;
    }

    const url =
      URL.createObjectURL(blob);

    const enlace =
      document.createElement("a");

    enlace.href = url;
    enlace.download =
      archivo.name;

    enlace.click();

    URL.revokeObjectURL(url);

  } catch (error) {
    console.error(
      "Error compartiendo ficha:",
      error
    );
  } finally {
    /*
      Regresamos inmediatamente
      la ficha a su tamaño normal.
    */
    elemento.classList.remove(
      "health-share-card-export"
    );

    elemento.style.cssText =
      estilosOriginales;
  }
}


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
        ),
         sucursal_id,
         sucursales (
  id,
  nombre
),
      foto_path
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

await cargarPropietariosSucursal(
  data.sucursal_id
);

await cargarFotoPerfil(
  data.foto_path ?? null
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

  async function cargarFotoPerfil(
  fotoPath: string | null
) {
  if (!fotoPath) {
    setFotoUrl(null);
    return;
  }

  const { data, error } =
    await supabase.storage
      .from("perritos")
      .createSignedUrl(
        fotoPath,
        60 * 60
      );

  if (error) {
    console.error(
      "Error cargando foto del perrito:",
      error
    );

    setFotoUrl(null);
    return;
  }

  setFotoUrl(
    data.signedUrl
  );
}

async function comprimirFoto(
  archivo: File
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();

    const url =
      URL.createObjectURL(archivo);

    imagen.onload = () => {
      const maximo = 1200;

      let ancho = imagen.width;
      let alto = imagen.height;

      if (ancho > alto && ancho > maximo) {
        alto = Math.round(
          alto * (maximo / ancho)
        );

        ancho = maximo;
      } else if (
        alto >= ancho &&
        alto > maximo
      ) {
        ancho = Math.round(
          ancho * (maximo / alto)
        );

        alto = maximo;
      }

      const canvas =
        document.createElement("canvas");

      canvas.width = ancho;
      canvas.height = alto;

      const contexto =
        canvas.getContext("2d");

      if (!contexto) {
        URL.revokeObjectURL(url);

        reject(
          new Error(
            "No se pudo procesar la imagen."
          )
        );

        return;
      }

      contexto.drawImage(
        imagen,
        0,
        0,
        ancho,
        alto
      );

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(
              new Error(
                "No se pudo comprimir la imagen."
              )
            );

            return;
          }

          resolve(blob);
        },
        "image/webp",
        0.82
      );
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);

      reject(
        new Error(
          "No se pudo leer la imagen."
        )
      );
    };

    imagen.src = url;
  });
}

async function subirFotoPerfil(
  archivo: File
) {
  if (!perrito) {
    return;
  }

  setSubiendoFoto(true);
  setMensajeFoto("");

  try {
    const fotoComprimida =
      await comprimirFoto(archivo);

    const fotoPath =
      `${perrito.sucursal_id}/${perrito.id}/perfil.webp`;

    const { error: errorStorage } =
      await supabase.storage
        .from("perritos")
        .upload(
          fotoPath,
          fotoComprimida,
          {
            contentType: "image/webp",
            upsert: true,
          }
        );

    if (errorStorage) {
      throw errorStorage;
    }

    const { error: errorTabla } =
      await supabase
        .from("perritos")
        .update({
          foto_path: fotoPath,
        })
        .eq(
          "id",
          perrito.id
        );

    if (errorTabla) {
      throw errorTabla;
    }

    setPerrito({
      ...perrito,
      foto_path: fotoPath,
    });

    await cargarFotoPerfil(
      fotoPath
    );

    setMensajeFoto(
      "Foto actualizada correctamente 📷"
    );

  } catch (error) {
    console.error(
      "Error subiendo foto:",
      error
    );

    setMensajeFoto(
      "No se pudo subir la foto."
    );
  } finally {
    setSubiendoFoto(false);
  }
}

async function cargarPropietariosSucursal(
  sucursalId: number
) {
  const { data, error } =
    await supabase
      .from("propietarios")
      .select(`
        id,
        nombre,
        apellidos
      `)
      .eq(
        "sucursal_id",
        sucursalId
      )
      .order("nombre");

  if (error) {
    console.error(
      "Error cargando propietarios de la sucursal:",
      error
    );

    setPropietarios([]);
    return;
  }

  setPropietarios(
    (data ?? []) as Propietario[]
  );
}

 async function cargarCatalogos() {
  const [
    razasResult,
    vacunasResult,
    desparasitacionesResult,
  ] = await Promise.all([
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

useEffect(() => {
  if (!modalFichaSalud) {
    return;
  }

  const centrarPreview = () => {
    const contenedor =
      previewFichaRef.current;

    if (!contenedor) {
      return;
    }

    contenedor.scrollLeft =
      (contenedor.scrollWidth -
        contenedor.clientWidth) /
      2;
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      centrarPreview();
    });
  });
}, [modalFichaSalud]);


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
  console.error(
    "ERROR GUARDANDO VACUNA:",
    {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    }
  );

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
    

<div className="page-header dog-detail-header">

  <div className="dog-detail-main">

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

    <div className="dog-profile-hero">

      <div className="dog-profile-hero-info">

        <h1 className="page-title">
          🐶 {perrito.nombre}
        </h1>

        <p className="page-description">
          Expediente general del perrito.
        </p>

      </div>

      <div className="dog-profile-photo-wrap">

    <label
  className="dog-profile-hero-photo"
  title="Cambiar foto"
>
  <div className="dog-profile-hero-photo-inner">
    {fotoUrl ? (
      <img
        src={fotoUrl}
        alt={`Foto de ${perrito.nombre}`}
      />
    ) : (
      <div className="dog-profile-hero-placeholder">
        🐶
      </div>
    )}
  </div>

{puede("perritos.editar") && (
  <span className="dog-profile-camera">
    📷
  </span>
)}

<input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  style={{
    display: "none",
  }}
  disabled={
    subiendoFoto ||
    !puede("perritos.editar")
  }
  onChange={(e) => {
    const archivo =
      e.target.files?.[0];

    if (archivo) {
      subirFotoPerfil(archivo);
    }

    e.target.value = "";
  }}
/>

</label>

        {mensajeFoto && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "13px",
              textAlign: "center",
              color:
                "var(--color-text-secondary)",
            }}
          >
            {mensajeFoto}
          </div>
        )}

      </div>

    </div>

  </div>


  <div className="page-header-actions dog-detail-actions">

    {puede("perritos.eliminar") && (
      <button
        className="danger-button"
        type="button"
        onClick={eliminarPerrito}
      >
        Eliminar perrito
      </button>
    )}

    {puede("perritos.editar") && (
      <button
        className="primary-button"
        type="button"
        onClick={() =>
          setModalEditar(true)
        }
      >
        Editar información
      </button>
    )}

  </div>

</div>

      {mensaje && (
        <div className="status-message">
          {mensaje}
        </div>
      )
        }


<button
  type="button"
  className="health-summary-card"
  onClick={() =>
    setModalFichaSalud(true)
  }
>
  <div className="health-summary-left">
    <div className="health-summary-icon">
      💉
    </div>

    <div>
      <strong className="health-summary-title">
        Ficha de salud
      </strong>

      <div className="health-summary-subtitle">
        Vacunas y desparasitación
      </div>

      <div className="health-summary-status">
        {alertasSalud.length === 0 ? (
          <span className="health-ok">
            🟢 Todo al día
          </span>
        ) : (
          <span className="health-warning">
            ⚠️ {alertasSalud.length}{" "}
            {alertasSalud.length === 1
              ? "aspecto requiere"
              : "aspectos requieren"}{" "}
            atención
          </span>
        )}
      </div>
    </div>
  </div>

  <span className="health-summary-arrow">
    →
  </span>
</button>

<div
  className="dashboard-grid dog-info-grid"
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

<div className="card">
  <div className="card-label">
    Sucursal
  </div>

  <strong>
    {perrito.sucursales?.nombre || "—"}
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

  <div className="care-list">

    <div className="care-item">
      <div className="care-label">
        Alimentación
      </div>

      <div className="care-value">
        {perrito.instrucciones_alimentacion ||
          "Sin información registrada."}
      </div>
    </div>

    <div className="care-item">
      <div className="care-label">
        Comportamiento
      </div>

      <div className="care-value">
        {perrito.observaciones_comportamiento ||
          "Sin observaciones registradas."}
      </div>
    </div>

    <div className="care-item">
      <div className="care-label">
        Observaciones médicas
      </div>

      <div className="care-value">
        {perrito.observaciones_medicas ||
          "Sin observaciones registradas."}
      </div>
    </div>

  </div>
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
   
<>
  {/* ESCRITORIO */}
  <div className="desktop-only">
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
  </div>


  {/* MÓVIL */}
  <div className="mobile-only vaccine-status-mobile">

    {vacunasActuales.map((vacuna) => {
      const estado = obtenerEstadoFecha(
        vacuna.fecha_vencimiento
      );

      return (
        <div
          key={vacuna.id}
          className="mobile-list-item"
        >
          <div className="mobile-list-title">
            💉 {vacuna.tipos_vacuna?.nombre || "—"}
          </div>

          <div className="mobile-list-grid">

            <div>
              <span className="mobile-list-label">
                Aplicación
              </span>

              <strong>
                {formatearFecha(
                  vacuna.fecha_aplicacion
                )}
              </strong>
            </div>

            <div>
              <span className="mobile-list-label">
                Vencimiento
              </span>

              <strong>
                {formatearFecha(
                  vacuna.fecha_vencimiento
                )}
              </strong>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <span className="mobile-list-label">
                Estado
              </span>

              <div
                style={{
                  marginTop: "4px",
                }}
              >
                <span
                  className={`estado-badge ${estado.estado}`}
                >
                  <span className="estado-dot" />
                  {estado.texto}
                </span>
              </div>
            </div>

          </div>
        </div>
      );
    })}

  </div>
</>

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

{puede("vacunas.crear") && (
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
)}

        </div>

        {vacunas.length === 0 ? (
          <div className="empty-state">
            No hay vacunas registradas.
          </div>
        ) : (
        
<>
  {/* ESCRITORIO */}
  <div className="desktop-only">
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
        {vacunas.map((vacuna) => (
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
              {vacuna.observaciones || "—"}
            </td>

            <td>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >

              {puede("vacunas.editar") && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    abrirEditarVacuna(vacuna)
                  }
                >
                  Editar
                </button>
                )}

{puede("vacunas.eliminar") && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    eliminarVacuna(vacuna)
                  }
                >
                  Eliminar
                </button>
)}

              </div>
            </td>

          </tr>
        ))}
      </tbody>

    </table>
  </div>


  {/* MÓVIL */}
  <div className="mobile-only vaccine-mobile-list">

    {vacunas.map((vacuna) => (

      <div
        key={vacuna.id}
        className="mobile-list-item"
      >

        <div className="mobile-list-title">
          💉 {vacuna.tipos_vacuna?.nombre || "—"}
        </div>

        <div className="mobile-list-grid">

          <div>
            <span className="mobile-list-label">
              Aplicación
            </span>

            <strong>
              {formatearFecha(
                vacuna.fecha_aplicacion
              )}
            </strong>
          </div>

          <div>
            <span className="mobile-list-label">
              Vencimiento
            </span>

            <strong>
              {formatearFecha(
                vacuna.fecha_vencimiento
              )}
            </strong>
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
            }}
          >
            <span className="mobile-list-label">
              Observaciones
            </span>

            <strong
              style={{
                overflowWrap: "anywhere",
              }}
            >
              {vacuna.observaciones || "—"}
            </strong>
          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginTop: "14px",
          }}
        >

{puede("vacunas.editar") && (
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              abrirEditarVacuna(vacuna)
            }
          >
            Editar
          </button>
)}

{puede("vacunas.eliminar") && (
          <button
            type="button"
            className="danger-button"
            onClick={() =>
              eliminarVacuna(vacuna)
            }
          >
            Eliminar
          </button>
)}

        </div>

      </div>

    ))}

  </div>
</>

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
          color:
            "var(--color-text-secondary)",
          fontSize: "14px",
          marginTop: "3px",
        }}
      >
        Último registro de cada tipo
      </div>
    </div>
  </div>

  <>
    {/* ESCRITORIO */}
    <div className="desktop-only">
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
          {desparasitacionesFicha.map(
            (item) => (
              <tr key={item.tipo}>
                <td>
                  <strong>
                    {item.tipo}
                  </strong>
                </td>

                <td>
                  {item.estado ===
                  "sin-registro"
                    ? "—"
                    : formatearFecha(
                        item.fechaAplicacion
                      )}
                </td>

                <td>
                  {item.estado ===
                  "sin-registro"
                    ? "—"
                    : formatearFecha(
                        item.fechaProxima
                      )}
                </td>

                <td>
                  {item.estado ===
                  "sin-registro" ? (
                    <span className="estado-badge sin-registro">
                      <span className="estado-dot" />
                      Sin registro
                    </span>
                  ) : (
                    <span
                      className={`estado-badge ${item.estado}`}
                    >
                      <span className="estado-dot" />
                      {item.textoEstado}
                    </span>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>

    {/* MÓVIL */}
    <div className="mobile-only deworming-status-mobile">

      {desparasitacionesFicha.map(
        (item) => (
          <div
            key={item.tipo}
            className="mobile-list-item"
          >
            <div className="mobile-list-title">
              🩺 {item.tipo}
            </div>

            <div className="mobile-list-grid">

              <div>
                <span className="mobile-list-label">
                  Aplicada
                </span>

                <strong>
                  {item.estado ===
                  "sin-registro"
                    ? "—"
                    : formatearFecha(
                        item.fechaAplicacion
                      )}
                </strong>
              </div>

              <div>
                <span className="mobile-list-label">
                  Próxima
                </span>

                <strong>
                  {item.estado ===
                  "sin-registro"
                    ? "—"
                    : formatearFecha(
                        item.fechaProxima
                      )}
                </strong>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <span className="mobile-list-label">
                  Estado
                </span>

                <div
                  style={{
                    marginTop: "4px",
                  }}
                >
                  {item.estado ===
                  "sin-registro" ? (
                    <span className="estado-badge sin-registro">
                      <span className="estado-dot" />
                      Sin registro
                    </span>
                  ) : (
                    <span
                      className={`estado-badge ${item.estado}`}
                    >
                      <span className="estado-dot" />
                      {item.textoEstado}
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        )
      )}

    </div>
  </>
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

{puede("desparasitaciones.crear") && (
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
)}

        </div>

        {desparasitaciones.length === 0 ? (
          <div className="empty-state">
            No hay desparasitaciones registradas.
          </div>
        ) : (
        
<>
  {/* ESCRITORIO */}
  <div className="desktop-only">
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
              key={desparasitacion.id}
            >
              <td>
                <strong>
                  {desparasitacion
                    .tipos_desparasitacion
                    ?.nombre || "—"}
                </strong>
              </td>

              <td>
                {formatearFecha(
                  desparasitacion
                    .fecha_aplicacion
                )}
              </td>

              <td>
                {desparasitacion.fecha_proxima
                  ? formatearFecha(
                      desparasitacion
                        .fecha_proxima
                    )
                  : "—"}
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

                  {puede("desparasitaciones.editar") && (
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
                  )}

{puede("desparasitaciones.eliminar") && (
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
)}

                </div>
              </td>
            </tr>
          )
        )}
      </tbody>

    </table>
  </div>


  {/* MÓVIL */}
  <div className="mobile-only deworming-mobile-list">

    {desparasitaciones.map(
      (desparasitacion) => (
        <div
          key={desparasitacion.id}
          className="mobile-list-item"
        >

          <div className="mobile-list-title">
            🩺{" "}
            {desparasitacion
              .tipos_desparasitacion
              ?.nombre || "—"}
          </div>

          <div className="mobile-list-grid">

            <div>
              <span className="mobile-list-label">
                Aplicación
              </span>

              <strong>
                {formatearFecha(
                  desparasitacion
                    .fecha_aplicacion
                )}
              </strong>
            </div>

            <div>
              <span className="mobile-list-label">
                Próxima
              </span>

              <strong>
                {desparasitacion.fecha_proxima
                  ? formatearFecha(
                      desparasitacion
                        .fecha_proxima
                    )
                  : "—"}
              </strong>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <span className="mobile-list-label">
                Observaciones
              </span>

              <strong
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                {desparasitacion
                  .observaciones || "—"}
              </strong>
            </div>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "8px",
              marginTop: "14px",
            }}
          >

            {puede("desparasitaciones.editar") && (
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
            )}

{puede("desparasitaciones.eliminar") && (
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
)}

          </div>

        </div>
      )
    )}

  </div>
</>

        )}

      </section>


{modalFichaSalud && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (
        e.target === e.currentTarget
      ) {
        setModalFichaSalud(false);
      }
    }}
  >
    <div className="modal health-modal">

      <div className="modal-header">
        <div>
          <h2>
            💉 Ficha de salud
          </h2>

          <div
            style={{
              color:
                "var(--color-text-secondary)",
              marginTop: "4px",
            }}
          >
            Resumen actual de vacunas y
            desparasitación
          </div>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setModalFichaSalud(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">


<div
  ref={previewFichaRef}
  className="health-preview-scroll"
>

        <div
  ref={fichaSaludRef}
  className="health-share-card"
>

        {/* DATOS DEL PERRITO */}
       <div className="health-v2-header">
  <div className="health-v2-dog">
    <div className="health-profile-photo">
      {fotoUrl ? (
        <img
          src={fotoUrl}
          alt={`Foto de ${perrito.nombre}`}
        />
      ) : (
        <span>🐶</span>
      )}
    </div>

    <div>
      <h2 className="health-v2-name">
        {perrito.nombre}
      </h2>

      <div className="health-owner">
        {perrito.propietarios
          ? `${perrito.propietarios.nombre} ${
              perrito.propietarios.apellidos ?? ""
            }`
          : "Sin propietario"}
      </div>

      <div className="health-basic-data">
        {calcularEdad(
          perrito.fecha_nacimiento
        )}
        {" · "}
        {perrito.sexo || "—"}
        {" · "}
        {perrito.peso_kg
          ? `${perrito.peso_kg} kg`
          : "—"}
      </div>
    </div>
  </div>

  <div className="health-v2-brand">
    <img
      src={LOGO_PETFUNCR_URL}
      alt="PetFunCR"
    />

    <strong>
      Ficha de salud
    </strong>
  </div>
</div>


        {/* VACUNAS */}
        <section className="health-section">

          <h3>
            💉 Vacunas
          </h3>

        <div className="health-items health-items-vaccines">

            {vacunasFicha.map(
              (vacuna) => (
                <div
                  key={vacuna.tipo}
                  className="health-item"
                >
                  <div className="health-item-top">

                    <strong>
                      {vacuna.tipo}
                    </strong>

                    <span
                      className={`estado-badge ${
                        vacuna.estado ===
                        "sin-registro"
                          ? "sin-registro"
                          : vacuna.estado
                      }`}
                    >
                      <span className="estado-dot" />

                      {vacuna.textoEstado}
                    </span>

                  </div>

                  {vacuna.estado !==
                    "sin-registro" && (
                    <div className="health-dates">

                      <span>
                        Aplicada:{" "}
                        <strong>
                          {formatearFecha(
                            vacuna.fechaAplicacion
                          )}
                        </strong>
                      </span>

                      <span>
                        {vacuna.estado ===
                        "vencida"
                          ? "Venció:"
                          : "Vence:"}{" "}
                        <strong>
                          {formatearFecha(
                            vacuna.fechaVencimiento
                          )}
                        </strong>
                      </span>

                    </div>
                  )}
                </div>
              )
            )}

          </div>
        </section>


        {/* DESPARASITACIÓN */}
        <section className="health-section">

          <h3>
            🛡️ Desparasitación
          </h3>

       <div className="health-items health-items-deworming">

            {desparasitacionesFicha.map(
              (item) => (
                <div
                  key={item.tipo}
                  className="health-item"
                >
                  <div className="health-item-top">

                    <strong>
                      {item.tipo}
                    </strong>

                    <span
                      className={`estado-badge ${
                        item.estado ===
                        "sin-registro"
                          ? "sin-registro"
                          : item.estado
                      }`}
                    >
                      <span className="estado-dot" />

                      {item.textoEstado}
                    </span>

                  </div>

                  {item.estado !==
                    "sin-registro" && (
                    <div className="health-dates">

                      <span>
                        Última:{" "}
                        <strong>
                          {formatearFecha(
                            item.fechaAplicacion
                          )}
                        </strong>
                      </span>

                      <span>
                        Próxima:{" "}
                        <strong>
                          {formatearFecha(
                            item.fechaProxima
                          )}
                        </strong>
                      </span>

                    </div>
                  )}
                </div>
              )
            )}

          </div>
        </section>


        {/* RESUMEN DE ATENCIÓN */}
        <section className="health-section health-attention">

          <h3>
            {alertasSalud.length === 0
              ? "✅ Salud al día"
              : "⚠️ Requiere atención"}
          </h3>

          {alertasSalud.length === 0 ? (
            <p>
              Las vacunas y
              desparasitaciones registradas
              se encuentran al día.
            </p>
          ) : (
            <div className="health-alert-list">

              {alertasSalud.map(
                (alerta, index) => (
                  <div
                    key={`${alerta.tipo}-${alerta.nombre}-${index}`}
                    className="health-alert-item"
                  >
                    {alerta.estado ===
                    "vencida"
                      ? "🔴"
                      : alerta.estado ===
                        "proxima"
                        ? "🟠"
                        : "⚪"}{" "}

                    <strong>
                      {alerta.nombre}
                    </strong>

                    {" — "}

                    {alerta.estado ===
                    "vencida"
                      ? "Vencida"
                      : alerta.estado ===
                        "proxima"
                        ? "Próxima a vencer"
                        : "Sin registro"}
                  </div>
                )
              )}

            </div>



          )}
        </section>
   {/* footer redes */}
   
<div className="health-v2-footer">

  <div className="health-v2-footer-row">

    {/* PetFunCR */}
    <div className="health-v2-footer-item">
      <img
        src={LOGO_PETFUNCR_URL}
        alt="PetFunCR"
        style={{
          width: "34px",
          height: "34px",
          maxWidth: "34px",
          maxHeight: "34px",
          objectFit: "contain",
          display: "block",
        }}
      />

      <strong>PetFunCR</strong>
    </div>

    {/* WhatsApp */}
    <div className="health-v2-footer-item">
      <img
        src={WHATSAPP_ICON_URL}
        alt="WhatsApp"
        style={{
          width: "24px",
          height: "24px",
          maxWidth: "24px",
          maxHeight: "24px",
          objectFit: "contain",
          display: "block",
        }}
      />

      <span>8568-9575</span>
    </div>

    {/* Redes */}
    <div className="health-v2-footer-item">
      <div className="health-v2-social-icons">
        <img
          src={FACEBOOK_ICON_URL}
          alt="Facebook"
        />

        <img
          src={INSTAGRAM_ICON_URL}
          alt="Instagram"
        />

        <img
          src={TIKTOK_ICON_URL}
          alt="TikTok"
        />
      </div>

      <span>PetFunCR</span>
    </div>

  </div>

  <div className="health-v2-footer-date">
    Información registrada al{" "}
    {new Intl.DateTimeFormat(
      "es-CR"
    ).format(new Date())}
  </div>

</div>

 {/* footer redes */}

  </div>
</div>


        {/* COMPARTIR - POR AHORA SOLO VISUAL */}
        <div className="health-share-area">

<button
  type="button"
  className="primary-button"
  onClick={compartirFichaSalud}
>
  📤 Compartir ficha
</button>

        </div>

      </div>
    </div>
  </div>
)}


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