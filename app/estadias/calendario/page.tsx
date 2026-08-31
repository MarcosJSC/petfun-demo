"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { usePermisos } from "@/hooks/usePermisos";

import {
  useSucursalActiva,
} from "@/contexts/SucursalContext";

const diasSemana = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

type EstadiaCalendario = {
  id: number;
  perrito_id: number;

  fecha_entrada: string;
  fecha_salida: string;

  perritos: {
    nombre: string;
  } | null;

  tipos_estadia: {
    nombre: string;
  } | null;

  estados_estadia: {
    nombre: string;
  } | null;

 sucursales: {
    id: number;
    nombre: string;
  } | null;

};

function obtenerDiasMes(fecha: Date) {
  const año = fecha.getFullYear();
  const mes = fecha.getMonth();

  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);

  const totalDias = ultimoDia.getDate();

  // JS: domingo = 0
  // Queremos lunes = 0
  const desplazamiento =
    (primerDia.getDay() + 6) % 7;

  const celdas: (number | null)[] = [];

  for (let i = 0; i < desplazamiento; i++) {
    celdas.push(null);
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    celdas.push(dia);
  }

  return celdas;
}

export default function CalendarioEstadiasPage() {

  

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

const {
  puede,
  esSuperadmin,
} = usePermisos();

const {
  sucursalActivaId,
} = useSucursalActiva();

useEffect(() => {
  if (!esSuperadmin) {
    return;
  }

  setSucursalFiltro(
    sucursalActivaId === null
      ? ""
      : String(sucursalActivaId)
  );
}, [
  esSuperadmin,
  sucursalActivaId,
]);

const [
  mostrarDetalleDia,
  setMostrarDetalleDia,
] = useState(false);

const [
  fechaDetalle,
  setFechaDetalle,
] = useState("");

const [
  estadiasDetalle,
  setEstadiasDetalle,
] = useState<EstadiaCalendario[]>([]);

const [estadias, setEstadias] =
  useState<EstadiaCalendario[]>([]);

const [cargando, setCargando] =
  useState(true);

  const [mesActual, setMesActual] =
    useState(new Date());

  const dias = obtenerDiasMes(mesActual);

  const tituloMes =
    new Intl.DateTimeFormat("es-CR", {
      month: "long",
      year: "numeric",
    }).format(mesActual);

  function mesAnterior() {
    setMesActual(
      new Date(
        mesActual.getFullYear(),
        mesActual.getMonth() - 1,
        1
      )
    );
  }

  function mesSiguiente() {
    setMesActual(
      new Date(
        mesActual.getFullYear(),
        mesActual.getMonth() + 1,
        1
      )
    );
  }

  function irHoy() {
    setMesActual(new Date());
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
  

  /*CARGAR ESTADIAS*/

  async function cargarEstadiasCalendario() {
  setCargando(true);

  const { data, error } = await supabase
    .from("estadias")
    .select(`
      id,
      perrito_id,
      fecha_entrada,
      fecha_salida,

      perritos (
        nombre
      ),

      tipos_estadia (
        nombre
      ),

      estados_estadia (
        nombre
      ),
      sucursales (
        id,
        nombre
      )   
    `)
    .neq(
      "estados_estadia.nombre",
      "Cancelada"
    );

  if (error) {
    console.error(error);
    setCargando(false);
    return;
  }



setEstadias(
  (data ?? []) as unknown as EstadiaCalendario[]
);

  setCargando(false);
}

/*FIN CARGARESTADIAS*/

/*USEEFFECTS*/

useEffect(() => {
  cargarEstadiasCalendario();
  cargarSucursalesFiltro();
}, []);

/*FIN USEEFFECTS*/

/*OBTENER FECHAS*/

function obtenerFechaCelda(dia: number) {
  const año =
    mesActual.getFullYear();

  const mes =
    String(
      mesActual.getMonth() + 1
    ).padStart(2, "0");

  const diaTexto =
    String(dia).padStart(2, "0");

  return `${año}-${mes}-${diaTexto}`;
}

const estadiasVisibles =
  estadias.filter((estadia) => {
    if (!sucursalFiltro) {
      return true;
    }

    return (
      Number(estadia.sucursales?.id) ===
      Number(sucursalFiltro)
    );
  });




function estadiasDelDia(dia: number) {
  const fecha =
    obtenerFechaCelda(dia);

  return estadiasVisibles.filter(
    (estadia) =>
      estadia.fecha_entrada <= fecha &&
      estadia.fecha_salida >= fecha &&
      estadia.estados_estadia?.nombre !==
        "Cancelada"
  );
}

/*ABRIR DETALLE DIA*/

function abrirDetalleDia(dia: number) {
  const fecha =
    obtenerFechaCelda(dia);

  const detalle =
    estadiasDelDia(dia);

  setFechaDetalle(fecha);
  setEstadiasDetalle(detalle);
  setMostrarDetalleDia(true);
}

/*ABRIR DETALLE DIA*/

/*FIN OBTENER FECHAS*/

/*FIN OBTENER ESTILO*/

function obtenerEstiloTipo(
  tipo: string | undefined
) {
  if (tipo === "Hotel") {
    return {
      background: "rgba(124, 58, 237, 0.14)",
      color: "#8b5cf6",
    };
  }

  if (tipo === "Guardería") {
    return {
      background: "rgba(34, 197, 94, 0.14)",
      color: "#22c55e",
    };
  }

  if (tipo === "Mixta") {
    return {
      background: "rgba(59, 130, 246, 0.14)",
      color: "#3b82f6",
    };
  }

  return {
    background:
      "var(--color-surface-secondary)",
    color: "var(--color-text)",
  };
}

/*OBTENER ESTILO*/

/*RESALTA HOY*/

function esHoy(dia: number) {
  const hoy = new Date();

  return (
    dia === hoy.getDate() &&
    mesActual.getMonth() === hoy.getMonth() &&
    mesActual.getFullYear() === hoy.getFullYear()
  );
}

/*FIN HOY*/

/*CREAR ESTADIA*/


function crearEstadiaDesdeDia(
  dia: number
) {
  const fecha =
    obtenerFechaCelda(dia);

  window.location.href =
    `/estadias?nueva=${fecha}`;
}


/*FIN CREAR ESTADIA*/

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Calendario de estadías
          </h1>

          <p className="page-description">
            Visualiza las estadías, entradas y salidas
            de PetFunCR.
          </p>
        </div>

    
      </div>

      <section className="card">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={mesAnterior}
            >
              ←
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={irHoy}
            >
              Hoy
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={mesSiguiente}
            >
              →
            </button>


          </div>



          <h2
            style={{
              margin: 0,
              textTransform: "capitalize",
            }}
          >
            {tituloMes}
          </h2>
        </div>
 

<div
  style={{
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "16px",
    fontSize: "13px",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
    }}
  >
    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#8b5cf6",
      }}
    />
    Hotel
  </div>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
    }}
  >
    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#22c55e",
      }}
    />
    Guardería
  </div>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
    }}
  >
    <span
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#3b82f6",
      }}
    />
    Mixta
  </div>
</div>


<div className="desktop-only">

<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "16px",
  }}
>
  <Link
    href="/estadias"
    className="secondary-button"
  >
    ← Lista de estadías
  </Link>
</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(7, minmax(0, 1fr))",
            borderLeft:
              "1px solid var(--color-border)",
            borderTop:
              "1px solid var(--color-border)",
          }}
        >
          {diasSemana.map((dia) => (
            <div
              key={dia}
              style={{
                padding: "10px",
                fontWeight: 600,
                textAlign: "center",
                borderRight:
                  "1px solid var(--color-border)",
                borderBottom:
                  "1px solid var(--color-border)",
                color:
                  "var(--color-text-secondary)",
              }}
            >



              {dia}
            </div>
          ))}

          {dias.map((dia, index) => (
            <div
              key={index}
               onClick={() => {
    if (dia !== null) {
      crearEstadiaDesdeDia(dia);
    }
  }}
              style={{
                minHeight: "110px",
                padding: "10px",
                borderRight:
                  "1px solid var(--color-border)",
                borderBottom:
                  "1px solid var(--color-border)",
           background:
  dia === null
    ? "var(--color-surface-secondary)"
    : esHoy(dia)
      ? "rgba(124, 58, 237, 0.08)"
      : "transparent",
      boxShadow:
  dia !== null && esHoy(dia)
    ? "inset 0 0 0 2px var(--color-primary)"
    : "none",
              }}
            >
         {dia !== null && (
  <>
  
  <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  }}
>
  <strong
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
    }}
  >
    {dia}

    {esHoy(dia) && (
      <span
        style={{
          fontSize: "10px",
          padding: "2px 6px",
          borderRadius: "999px",
          background:
            "var(--color-primary)",
          color: "white",
          fontWeight: 700,
        }}
      >
        HOY
      </span>
    )}
  </strong>

  {estadiasDelDia(dia).length > 0 && (
    <span
      style={{
        minWidth: "22px",
        height: "22px",
        padding: "0 6px",
        borderRadius: "999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 700,
        background:
          "var(--color-surface-secondary)",
        color: "var(--color-text)",
      }}
      title="Ocupación del día"
    >
      {estadiasDelDia(dia).length}
    </span>
  )}
</div>


    <div
      style={{
        marginTop: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
      }}
    >

{estadiasDelDia(dia)
  .slice(0, 4)
  .map((estadia) => (
    <button
      key={estadia.id}
      type="button"
onClick={(e) => {
  e.stopPropagation();

  window.location.href =
    `/estadias/${estadia.id}`;
}}
      style={{
        fontSize: "12px",
        padding: "5px 7px",
        borderRadius: "6px",
            background:
      obtenerEstiloTipo(
        estadia.tipos_estadia?.nombre
      ).background,

    color:
      obtenerEstiloTipo(
        estadia.tipos_estadia?.nombre
      ).color,

    border: "none",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      🐶{" "}
      {estadia.perritos?.nombre ||
        "Sin nombre"}
    </button>
  ))}

{estadiasDelDia(dia).length > 4 && (
  <button
    type="button"
onClick={(e) => {
  e.stopPropagation();
  abrirDetalleDia(dia);
}}
    style={{
      border: "none",
      background: "transparent",
      padding: "2px 0",
      fontSize: "12px",
      fontWeight: 600,
      color: "var(--color-primary)",
      cursor: "pointer",
      textAlign: "left",
    }}
  >
    + {estadiasDelDia(dia).length - 4} más
  </button>
)}


    </div>
  </>
)}
            </div>
          ))}
          
        </div>

         </div>
        
{/* ACA TERMINA EL CALENDARIO DESKTOP */}

{/* ACA COMIENZA EL CALENDARIO MOBILE */}

<div className="mobile-only">

  <div className="calendar-mobile">

    <div className="calendar-mobile-header">
      {diasSemana.map((dia) => (
        <div key={dia}>
          {dia}
        </div>
      ))}
    </div>

    <div className="calendar-mobile-grid">

      {dias.map((dia, index) => {
        if (dia === null) {
          return (
            <div
              key={index}
              className="calendar-mobile-empty"
            />
          );
        }

        const cantidad =
          estadiasDelDia(dia).length;

        return (
          <button
            key={index}
            type="button"
            className={`calendar-mobile-day ${
              esHoy(dia)
                ? "calendar-mobile-today"
                : ""
            }`}
            onClick={() =>
              abrirDetalleDia(dia)
            }
          >


     <div className="calendar-mobile-top">
    <span className="calendar-mobile-number">
      {dia}
    </span>

    {cantidad > 0 && (
      <span className="calendar-mobile-count">
        {cantidad}
      </span>
    )}
  </div>

  <div className="calendar-mobile-dogs">
    {estadiasDelDia(dia)
      .slice(0, 4)
      .map((estadia) => (
        <div
          key={estadia.id}
          className="calendar-mobile-dog"
        >
          {estadia.perritos?.nombre || "—"}
        </div>
      ))}

    {estadiasDelDia(dia).length > 4 && (
      <div className="calendar-mobile-more">
        +{estadiasDelDia(dia).length - 4} 
      </div>
    )}
  </div>
{/*
  {esHoy(dia) && (
    <span className="calendar-mobile-hoy">
      HOY
    </span>
  )}*/}
</button>
        );
      })}


    </div>

{/* ACA TERMINAN LOS CALENDARIOS */}

<div
  style={{
    marginTop: "18px",
  }}
>
  <Link
    href="/estadias"
    className="secondary-button"
  >
    ← Lista de estadías
  </Link>
</div>

  </div>

</div>



      </section>

 
        

{mostrarDetalleDia && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarDetalleDia(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Ocupación del día
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarDetalleDia(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        <div
          style={{
            marginBottom: "16px",
            color:
              "var(--color-text-secondary)",
          }}
        >
     

  {/* controles: ← Hoy → + mes */}

 

  {/* leyenda */}

  {/* calendario */}


          {fechaDetalle
            ? new Intl.DateTimeFormat(
                "es-CR",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              ).format(
                new Date(
                  `${fechaDetalle}T00:00:00`
                )
              )
            : ""}
        </div>

        <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "14px",
  }}
>

{puede("estadias.crear") && (
  <button
    type="button"
    className="primary-button"
    onClick={() => {
      window.location.href =
        `/estadias?nueva=${fechaDetalle}`;
    }}
  >
    + Nueva estadía este día
  </button>
  )}
</div>




        {estadiasDetalle.length === 0 ? (
          <div className="empty-state">
            No hay estadías ese día.
          </div>
        ) : (
          <table className="data-table">

            <thead>
              <tr>
                <th>Perrito</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Sucursal</th>
              </tr>
            </thead>

            <tbody>
              {estadiasDetalle.map(
                (estadia) => (
                  <tr
                    key={estadia.id}
                    className="clickable-row"
            onClick={() => {
  window.location.href =
    `/estadias/${estadia.id}`;
}}
                  >
                    <td>
                      <strong>
                        🐶{" "}
                        {estadia.perritos?.nombre ||
                          "—"}
                      </strong>
                    </td>

<td>
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "5px 9px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,

      background:
        obtenerEstiloTipo(
          estadia.tipos_estadia?.nombre
        ).background,

      color:
        obtenerEstiloTipo(
          estadia.tipos_estadia?.nombre
        ).color,
    }}
  >
    {estadia.tipos_estadia
      ?.nombre || "—"}
  </span>
</td>

                    <td>
                      {new Intl.DateTimeFormat(
                        "es-CR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      ).format(
                        new Date(
                          `${estadia.fecha_entrada}T00:00:00`
                        )
                      )}
                    </td>

                    <td>
                      {new Intl.DateTimeFormat(
                        "es-CR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      ).format(
                        new Date(
                          `${estadia.fecha_salida}T00:00:00`
                        )
                      )}
                    </td>
                    <td>
                      {esSuperadmin && !sucursalFiltro && (
    <div
      style={{
        marginTop: "6px",
      }}
    >

  <span className="branch-status active">
  {estadia.sucursales?.nombre || "—"}
</span>
       </div>
       )}
                    </td>
                  </tr>
                )
              )}
            </tbody>

          </table>
        )}

      </div>
    </div>
  </div>
)}

    </main>
  );
}