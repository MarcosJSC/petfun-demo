"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ========================================
// RESUMEN GENERAL
// ========================================

export default function Home() {
  const [totalPropietarios, setTotalPropietarios] =
    useState(0);

  const [totalPerritos, setTotalPerritos] =
    useState(0);

// ========================================
// VACUNAS
// ========================================


const [vacunasProximas, setVacunasProximas] =
  useState(0);

  const [vacunasVencidas, setVacunasVencidas] =
  useState(0);

  const [vacunasVigentes, setVacunasVigentes] =
  useState(0);

// ========================================
// DESPARASITACIONES
// ========================================

 const [
  desparasitacionesProximas,  setDesparasitacionesProximas,
] = useState(0); 

const [
  desparasitacionesVencidas,  setDesparasitacionesVencidas,
] = useState(0);

  const [
  desparasitacionesAlDia,  setDesparasitacionesAlDia,
] = useState(0);

// ========================================
// DETALLES Y MODALES
// ========================================

// Vacunas próximas

const [
  detalleVacunasProximas,
  setDetalleVacunasProximas,
] = useState<any[]>([]);

const [
  mostrarVacunasProximas,
  setMostrarVacunasProximas,
] = useState(false);

// Vacunas vencidas

const [
  detalleVacunasVencidas,
  setDetalleVacunasVencidas,
] = useState<any[]>([]);

const [
  mostrarVacunasVencidas,
  setMostrarVacunasVencidas,
] = useState(false);

// Desparasitaciones próximas

const [
  detalleDesparasitacionesProximas,
  setDetalleDesparasitacionesProximas,
] = useState<any[]>([]);

const [
  mostrarDesparasitacionesProximas,
  setMostrarDesparasitacionesProximas,
] = useState(false);

// Desparasitaciones vencidas

const [
  detalleDesparasitacionesVencidas,
  setDetalleDesparasitacionesVencidas,
] = useState<any[]>([]);

const [
  mostrarDesparasitacionesVencidas,
  setMostrarDesparasitacionesVencidas,
] = useState(false);

//DATOS HOSPEDADOS

const [hospedadosHoy, setHospedadosHoy] =
  useState(0);

 const [
  detalleHospedadosHoy,
  setDetalleHospedadosHoy,
] = useState<any[]>([]);

const [
  mostrarHospedadosHoy,
  setMostrarHospedadosHoy,
] = useState(false); 


const [entradasHoy, setEntradasHoy] =
  useState(0);

const [salidasHoy, setSalidasHoy] =
  useState(0);

  const [
  detalleEntradasHoy,
  setDetalleEntradasHoy,
] = useState<any[]>([]);

const [
  detalleSalidasHoy,
  setDetalleSalidasHoy,
] = useState<any[]>([]);

const [
  mostrarEntradasHoy,
  setMostrarEntradasHoy,
] = useState(false);

const [
  mostrarSalidasHoy,
  setMostrarSalidasHoy,
] = useState(false);

// CUMPLEAÑOS

const [
  cumpleanerosHoy,
  setCumpleanerosHoy,
] = useState<any[]>([]);

const [
  proximosCumpleaneros,
  setProximosCumpleaneros,
] = useState<any[]>([]);

const [
  mostrarCumpleanerosHoy,
  setMostrarCumpleanerosHoy,
] = useState(false);

const [
  mostrarProximosCumpleaneros,
  setMostrarProximosCumpleaneros,
] = useState(false);

// FECHA ACTUAL

 const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

// ========================================
// CARGA DEL DASHBOARD
// ========================================

  useEffect(() => {
    async function cargarResumen() {
      const { count: propietariosCount } =
        await supabase
          .from("propietarios")
          .select("*", {
            count: "exact",
            head: true,
          });

      const { count: perritosCount } =
        await supabase
          .from("perritos")
          .select("*", {
            count: "exact",
            head: true,
          });

 const { data: estadiasHoyData } =
  await supabase
 .from("estadias")
    .select(`
      id,
      perrito_id,
      fecha_entrada,
      fecha_salida,
      hora_entrada,
hora_salida,

      perritos (
        nombre
      ),

      tipos_estadia (
        nombre
      ),

      estados_estadia (
        nombre
      )
    `);    

const estadiasHoy =
  (estadiasHoyData ?? []) as unknown as {
    id: number;
    perrito_id: number;

    fecha_entrada: string;
    fecha_salida: string;

    hora_entrada: string | null;
    hora_salida: string | null;

    perritos: {
      nombre: string;
    } | null;

    tipos_estadia: {
      nombre: string;
    } | null;

    estados_estadia: {
      nombre: string;
    } | null;
  }[];    

const { data: perritosCumplesData } =
  await supabase
    .from("perritos")
    .select(`
      id,
      nombre,
      fecha_nacimiento,
      activo
    `)
    .eq("activo", true);


    const perritosCumples =
  (perritosCumplesData ?? []) as {
    id: number;
    nombre: string;
    fecha_nacimiento: string | null;
    activo: boolean;
  }[];

const hoyCumple = new Date();

const hoyMes =
  hoyCumple.getMonth();

const hoyDia =
  hoyCumple.getDate();

const hoyCumples =
  perritosCumples
    .filter((perrito) => {
      if (!perrito.fecha_nacimiento) {
        return false;
      }

      const nacimiento =
        new Date(
          `${perrito.fecha_nacimiento}T00:00:00`
        );

      return (
        nacimiento.getMonth() === hoyMes &&
        nacimiento.getDate() === hoyDia
      );
    })
    .map((perrito) => {
      const nacimiento =
        new Date(
          `${perrito.fecha_nacimiento}T00:00:00`
        );

      const edad =
        hoyCumple.getFullYear() -
        nacimiento.getFullYear();

      return {
        ...perrito,
        edad,
      };
    });

setCumpleanerosHoy(
  hoyCumples
);

const proximos =
  perritosCumples
    .filter((perrito) => {
      if (!perrito.fecha_nacimiento) {
        return false;
      }

      const nacimiento =
        new Date(
          `${perrito.fecha_nacimiento}T00:00:00`
        );

      const cumpleañosEsteAño =
        new Date(
          hoyCumple.getFullYear(),
          nacimiento.getMonth(),
          nacimiento.getDate()
        );

      if (
        cumpleañosEsteAño < hoyCumple
      ) {
        cumpleañosEsteAño.setFullYear(
          hoyCumple.getFullYear() + 1
        );
      }

      const diferenciaMs =
        cumpleañosEsteAño.getTime() -
        hoyCumple.getTime();

      const diferenciaDias =
        Math.ceil(
          diferenciaMs /
            (1000 * 60 * 60 * 24)
        );

      return (
        diferenciaDias >= 1 &&
        diferenciaDias <= 7
      );
    })
    .map((perrito) => {
      const nacimiento =
        new Date(
          `${perrito.fecha_nacimiento}T00:00:00`
        );

      const cumpleaños =
        new Date(
          hoyCumple.getFullYear(),
          nacimiento.getMonth(),
          nacimiento.getDate()
        );

      if (cumpleaños < hoyCumple) {
        cumpleaños.setFullYear(
          hoyCumple.getFullYear() + 1
        );
      }

      const edad =
        cumpleaños.getFullYear() -
        nacimiento.getFullYear();

      return {
        ...perrito,
        edad,
        fecha_cumple: cumpleaños,
      };
    })
    .sort(
      (a, b) =>
        a.fecha_cumple.getTime() -
        b.fecha_cumple.getTime()
    );

setProximosCumpleaneros(
  proximos
);


const { data: vacunasData } =
  await supabase
    .from("vacunas_perrito")
    .select(`
      id,
      perrito_id,
      fecha_aplicacion,
      fecha_vencimiento,
      tipo_vacuna_id,

      perritos (
        nombre
      ),

      tipos_vacuna (
        nombre
      )
    `);

 if (estadiasHoy.length > 0) {
  const hoyTexto =
    hoy.toISOString().split("T")[0];

  const activasHoy =
    estadiasHoy.filter((estadia) => {
      const estado =
        estadia.estados_estadia?.nombre;

      return (
        estado === "En curso" &&
        estadia.fecha_entrada <= hoyTexto &&
        estadia.fecha_salida >= hoyTexto
      );
    });

  setHospedadosHoy(
    activasHoy.length
  );
  setDetalleHospedadosHoy(
  activasHoy
);

const entradas =
  estadiasHoy.filter(
    (estadia) =>
      estadia.fecha_entrada === hoyTexto &&
      estadia.estados_estadia?.nombre !==
        "Cancelada"
  );

setEntradasHoy(
  entradas.length
);

setDetalleEntradasHoy(
  entradas
);


const salidas =
  estadiasHoy.filter(
    (estadia) =>
      estadia.fecha_salida === hoyTexto &&
      estadia.estados_estadia?.nombre !==
        "Cancelada"
  );

setSalidasHoy(
  salidas.length
);

setDetalleSalidasHoy(
  salidas
);

}  
    
if (vacunasData) {
  const ultimasVacunasPorTipo = Object.values(
    vacunasData.reduce(
      (
        acumulador: Record<
          string,
          (typeof vacunasData)[number]
        >,
        vacuna
      ) => {
        const clave =
          `${vacuna.perrito_id}-${vacuna.tipo_vacuna_id}`;

        const existente =
          acumulador[clave];

        if (
          !existente ||
          vacuna.fecha_aplicacion >
            existente.fecha_aplicacion
        ) {
          acumulador[clave] =
            vacuna;
        }

        return acumulador;
      },
      {}
    )
  );

  const proximas_v =
    ultimasVacunasPorTipo.filter(
      (vacuna) => {
        if (!vacuna.fecha_vencimiento) {
          return false;
        }

        const vencimiento = new Date(
          `${vacuna.fecha_vencimiento}T00:00:00`
        );

        const diferencia =
          vencimiento.getTime() -
          hoy.getTime();

        const dias = Math.ceil(
          diferencia /
            (1000 * 60 * 60 * 24)
        );

        return dias >= 0 && dias <= 30;
      }
    );

  setVacunasProximas(
    proximas_v.length
  );

  setDetalleVacunasProximas(
    proximas_v
  );

  const vencidas_v =
    ultimasVacunasPorTipo.filter(
      (vacuna) => {
        if (!vacuna.fecha_vencimiento) {
          return false;
        }

        const vencimiento = new Date(
          `${vacuna.fecha_vencimiento}T00:00:00`
        );

        const diferencia =
          vencimiento.getTime() -
          hoy.getTime();

        const dias = Math.ceil(
          diferencia /
            (1000 * 60 * 60 * 24)
        );

        return dias < 0;
      }
    );

  setVacunasVencidas(
    vencidas_v.length
  );


  setDetalleVacunasVencidas(
  vencidas_v
);

  const vigentes =
    ultimasVacunasPorTipo.filter(
      (vacuna) => {
        if (!vacuna.fecha_vencimiento) {
          return false;
        }

        const vencimiento = new Date(
          `${vacuna.fecha_vencimiento}T00:00:00`
        );

        const diferencia =
          vencimiento.getTime() -
          hoy.getTime();

        const dias = Math.ceil(
          diferencia /
            (1000 * 60 * 60 * 24)
        );

        return dias > 30;
      }
    );

  setVacunasVigentes(
    vigentes.length
  );
}


const {
  data: desparasitacionesData,
  error: desparasitacionesError,
} = await supabase
  .from("desparasitaciones_perrito")
  .select(`
    id,
    perrito_id,
    fecha_aplicacion,
    fecha_proxima,
    tipo_desparasitacion_id,

    perritos (
      nombre
    ),

    tipos_desparasitacion (
      nombre
    )
  `);

if (desparasitacionesError) {
  console.error(
    "Error cargando desparasitaciones:",
    desparasitacionesError
  );
}


if (desparasitacionesData) {
  const ultimasDesparasitaciones =
    Object.values(
      desparasitacionesData.reduce(
        (
          acumulador: Record<
            string,
            (typeof desparasitacionesData)[number]
          >,
          desparasitacion
        ) => {
          const clave =
            String(
              desparasitacion.perrito_id
            );

          const existente =
            acumulador[clave];

          if (
            !existente ||
            desparasitacion.fecha_aplicacion >
              existente.fecha_aplicacion
          ) {
            acumulador[clave] =
              desparasitacion;
          }

          return acumulador;
        },
        {}
      )
    );

  const desparasitacionesVencidasCalculadas =
    ultimasDesparasitaciones.filter(
      (desparasitacion) => {
        if (!desparasitacion.fecha_proxima) {
          return false;
        }

        const proxima = new Date(
          `${desparasitacion.fecha_proxima}T00:00:00`
        );

        const diferencia =
          proxima.getTime() -
          hoy.getTime();

        const dias = Math.ceil(
          diferencia /
            (1000 * 60 * 60 * 24)
        );

        return dias < 0;
      }
    );

  setDesparasitacionesVencidas(
    desparasitacionesVencidasCalculadas.length
  );

  setDetalleDesparasitacionesVencidas(
  desparasitacionesVencidasCalculadas
);

  const desparasitacionesProximasCalculadas =
    ultimasDesparasitaciones.filter(
      (desparasitacion) => {
        if (!desparasitacion.fecha_proxima) {
          return false;
        }

        const proxima = new Date(
          `${desparasitacion.fecha_proxima}T00:00:00`
        );

        const diferencia =
          proxima.getTime() -
          hoy.getTime();

        const dias = Math.ceil(
          diferencia /
            (1000 * 60 * 60 * 24)
        );

        return dias >= 0 && dias <= 30;
      }
    );

  setDesparasitacionesProximas(
    desparasitacionesProximasCalculadas.length
  );

  setDetalleDesparasitacionesProximas(
  desparasitacionesProximasCalculadas
);

  const alDia =
    ultimasDesparasitaciones.filter(
      (desparasitacion) => {
        if (!desparasitacion.fecha_proxima) {
          return false;
        }

        const proxima = new Date(
          `${desparasitacion.fecha_proxima}T00:00:00`
        );

        const diferencia =
          proxima.getTime() -
          hoy.getTime();

        const dias = Math.ceil(
          diferencia /
            (1000 * 60 * 60 * 24)
        );

        return dias > 30;
      }
    );

  setDesparasitacionesAlDia(
    alDia.length
  );
}

      setTotalPropietarios(
        propietariosCount ?? 0
      );

      setTotalPerritos(
        perritosCount ?? 0
      );
    }

    cargarResumen();
  }, []);

  return (
    <div>
      <h1 className="page-title">
        Dashboard
      </h1>

      <p className="page-description">
        Resumen general de PetFunCR
      </p>
      
<section style={{ marginBottom: "32px" }}>
  <div
    style={{
      marginBottom: "16px",
    }}
  >
    <h2 style={{ margin: 0 }}>
      Resumen general
    </h2>

    <p
      style={{
        color: "var(--color-text-secondary)",
        marginTop: "6px",
        marginBottom: 0,
      }}
    >
      Información principal de PetFunCR
    </p>
  </div>

 <div className="dashboard-grid dashboard-summary-grid">

   

   <button
  type="button"
  className="card"
  onClick={() =>
    setMostrarHospedadosHoy(true)
  }
  style={{
    textAlign: "left",
    cursor: "pointer",
    border: "none",
  }}
>
 <div className="card-label">
    Hospedados hoy
  </div>

 <div
  className="card-value"
  style={{
    color: "var(--color-text)",
  }}
>
  {hospedadosHoy}
</div>

  <div
    style={{
      marginTop: "8px",
      fontSize: "13px",
      color: "var(--color-text-secondary)",
    }}
  >
    Ver detalles →
  </div>
</button>


<button
  type="button"
  className="card"
  onClick={() =>
    setMostrarEntradasHoy(true)
  }
  style={{
    textAlign: "left",
    cursor: "pointer",
    border: "none",
    color: "inherit",
  }}
>
  <div className="card-label">
    Entradas hoy
  </div>

  <div
    className="card-value"
    style={{
      color: "var(--color-text)",
    }}
  >
    {entradasHoy}
  </div>

  <div
    style={{
      marginTop: "8px",
      fontSize: "13px",
      color:
        "var(--color-text-secondary)",
    }}
  >
    Ver detalles →
  </div>
</button>



<button
  type="button"
  className="card"
  onClick={() =>
    setMostrarSalidasHoy(true)
  }
  style={{
    textAlign: "left",
    cursor: "pointer",
    border: "none",
    color: "inherit",
  }}
>
  <div className="card-label">
    Salidas hoy
  </div>

  <div
    className="card-value"
    style={{
      color: "var(--color-text)",
    }}
  >
    {salidasHoy}
  </div>

  <div
    style={{
      marginTop: "8px",
      fontSize: "13px",
      color:
        "var(--color-text-secondary)",
    }}
  >
    Ver detalles →
  </div>
</button>


<button
  type="button"
  className="card"
  onClick={() =>
    setMostrarCumpleanerosHoy(true)
  }
  style={{
    textAlign: "left",
    cursor: "pointer",
    border: "none",
    color: "inherit",
  }}
>
  <div className="card-label">
    🎂 Cumpleañeros hoy
  </div>

  <div
    className="card-value"
    style={{
      color: "var(--color-text)",
    }}
  >
    {cumpleanerosHoy.length}
  </div>

  <div
    style={{
      marginTop: "8px",
      fontSize: "13px",
      color:
        "var(--color-text-secondary)",
    }}
  >
    Ver detalles →
  </div>
</button>

<button
  type="button"
  className="card"
  onClick={() =>
    setMostrarProximosCumpleaneros(true)
  }
  style={{
    textAlign: "left",
    cursor: "pointer",
    border: "none",
    color: "inherit",
  }}
>
  <div className="card-label">
    🎈 Próximos Cumples
  </div>

  <div
    className="card-value"
    style={{
      color: "var(--color-text)",
    }}
  >
    {proximosCumpleaneros.length}
  </div>

  <div
    style={{
      marginTop: "8px",
      fontSize: "13px",
      color:
        "var(--color-text-secondary)",
    }}
  >
    Próximos 7 días →
  </div>
</button>

 <div className="card">
      <div className="card-label">
        Propietarios
      </div>

      <div className="card-value">
        {totalPropietarios}
      </div>
    </div>

    <div className="card">
      <div className="card-label">
        Perritos
      </div>

      <div className="card-value">
        {totalPerritos}
      </div>
    </div>

  </div>


  
</section>



{/* MODAL VACUNAS VENCIDAS */}
{mostrarVacunasVencidas && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarVacunasVencidas(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Vacunas vencidas
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarVacunasVencidas(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {detalleVacunasVencidas.length === 0 ? (
          <div className="empty-state">
            No hay vacunas vencidas.
          </div>
        ) : (
          <table className="data-table">

            <thead>
              <tr>
                <th>Perrito</th>
                <th>Vacuna</th>
                <th>Vencimiento</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>

              {detalleVacunasVencidas.map(
                (vacuna) => {

                  const vencimiento = new Date(
                    `${vacuna.fecha_vencimiento}T00:00:00`
                  );

                  const diferencia =
                    vencimiento.getTime() -
                    hoy.getTime();

                  const dias = Math.ceil(
                    diferencia /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr
                      key={vacuna.id}
                      className="clickable-row"
                      onClick={() => {
                        window.location.href =
                          `/perritos/${vacuna.perrito_id}`;
                      }}
                    >
                      <td>
                        <strong>
                          🐶{" "}
                          {vacuna.perritos?.nombre ||
                            "—"}
                        </strong>
                      </td>

                      <td>
                        {vacuna.tipos_vacuna
                          ?.nombre || "—"}
                      </td>

                      <td>
                        {new Intl.DateTimeFormat(
                          "es-CR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        ).format(vencimiento)}
                      </td>

                      <td>
                        <span className="estado-badge vencida">
                          <span className="estado-dot" />

                          Vencida hace{" "}
                          {Math.abs(dias)}{" "}
                          {Math.abs(dias) === 1
                            ? "día"
                            : "días"}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}

            </tbody>

          </table>
        )}

      </div>
    </div>
  </div>
)}
{/* FIN MODAL VACUNAS VENCIDAS */}

{/* MODAL SALIDAS HOY */}

{mostrarSalidasHoy && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarSalidasHoy(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Salidas hoy
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarSalidasHoy(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {detalleSalidasHoy.length === 0 ? (
          <div className="empty-state">
            No hay salidas programadas para hoy.
          </div>
        ) : (
          <table className="data-table">

            <thead>
              <tr>
                <th>Perrito</th>
                <th>Tipo</th>
                <th>Hora salida</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {detalleSalidasHoy.map(
                (estadia) => (
                  <tr
                    key={estadia.id}
                    className="clickable-row"
                    onClick={() => {
                      window.location.href =
                        `/perritos/${estadia.perrito_id}`;
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
                      {estadia.tipos_estadia
                        ?.nombre || "—"}
                    </td>

                    <td>
                      {estadia.hora_salida
                        ? estadia.hora_salida.slice(
                            0,
                            5
                          )
                        : "—"}
                    </td>

                    <td>
                      {estadia.estados_estadia
                        ?.nombre || "—"}
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

{/* FIN MODAL SALIDAS HOY */}

{/* MODAL ENTRADAS HOY */}

{mostrarEntradasHoy && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarEntradasHoy(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Entradas hoy
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarEntradasHoy(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {detalleEntradasHoy.length === 0 ? (
          <div className="empty-state">
            No hay entradas programadas para hoy.
          </div>
        ) : (
          <table className="data-table">

            <thead>
              <tr>
                <th>Perrito</th>
                <th>Tipo</th>
                <th>Hora entrada</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {detalleEntradasHoy.map(
                (estadia) => (
                  <tr
                    key={estadia.id}
                    className="clickable-row"
                    onClick={() => {
                      window.location.href =
                        `/perritos/${estadia.perrito_id}`;
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
                      {estadia.tipos_estadia
                        ?.nombre || "—"}
                    </td>

                    <td>
                      {estadia.hora_entrada
                        ? estadia.hora_entrada.slice(
                            0,
                            5
                          )
                        : "—"}
                    </td>

                    <td>
                      {estadia.estados_estadia
                        ?.nombre || "—"}
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


{/* FIN MODAL ENTRADAS HOY */}

{/* MODAL CUMPLEAÑEROS HOY */}

{mostrarCumpleanerosHoy && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarCumpleanerosHoy(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          🎂 Cumpleañeros hoy
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarCumpleanerosHoy(false)
          }
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {cumpleanerosHoy.length === 0 ? (
          <div className="empty-state">
            No hay cumpleañeros hoy.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {cumpleanerosHoy.map(
              (perrito) => (
                <button
                  key={perrito.id}
                  type="button"
                  className="mobile-record-card"
                  onClick={() => {
                    window.location.href =
                      `/perritos/${perrito.id}`;
                  }}
                >
                  <div className="mobile-record-title">
                    🐶 {perrito.nombre}
                  </div>

                  <div>
                    <span className="mobile-record-label">
                      Hoy cumple
                    </span>

                    <div
                      style={{
                        marginTop: "3px",
                        fontWeight: 700,
                      }}
                    >
                      {perrito.edad}{" "}
                      {perrito.edad === 1
                        ? "año"
                        : "años"} 🎉
                    </div>
                  </div>

                  <div className="mobile-record-action">
                    Ver perrito →
                  </div>
                </button>
              )
            )}
          </div>
        )}

      </div>

    </div>
  </div>
)}

{/* FIN MODAL CUMPLEAÑEROS HOY */}

{/* MODAL CUMPLEAÑOS PRÓXIMOS */}

{mostrarProximosCumpleaneros && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarProximosCumpleaneros(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          🎈 Próximos cumpleaños
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarProximosCumpleaneros(false)
          }
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {proximosCumpleaneros.length === 0 ? (
          <div className="empty-state">
            No hay cumpleaños en los próximos 7 días.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {proximosCumpleaneros.map(
              (perrito) => (
                <button
                  key={perrito.id}
                  type="button"
                  className="mobile-record-card"
                  onClick={() => {
                    window.location.href =
                      `/perritos/${perrito.id}`;
                  }}
                >
                  <div className="mobile-record-title">
                    🐶 {perrito.nombre}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <span className="mobile-record-label">
                        Fecha
                      </span>

                      <div
                        style={{
                          marginTop: "3px",
                          fontWeight: 700,
                        }}
                      >
                {new Intl.DateTimeFormat(
  "es-CR",
  {
    day: "numeric",
    month: "long",
  }
)
  .format(perrito.fecha_cumple)
  .replace(" de ", " de ")}
                      </div>
                    </div>

                    <div>
                      <span className="mobile-record-label">
                        Cumplirá
                      </span>

                      <div
                        style={{
                          marginTop: "3px",
                          fontWeight: 700,
                        }}
                      >
                        {perrito.edad}{" "}
                        {perrito.edad === 1
                          ? "año"
                          : "años"} 🎉
                      </div>
                    </div>
                  </div>

                  <div className="mobile-record-action">
                    Ver perrito →
                  </div>
                </button>
              )
            )}
          </div>
        )}

      </div>

    </div>
  </div>
)}

{/* FIN MODAL CUMPLEAÑOS PRÓXIMOS */}

{/* MODAL VACUNAS PRÓXIMAS */}
{mostrarVacunasProximas && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarVacunasProximas(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Vacunas próximas a vencer
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarVacunasProximas(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {detalleVacunasProximas.length === 0 ? (
          <div className="empty-state">
            No hay vacunas próximas a vencer.
          </div>
        ) : (
          <table className="data-table">

            <thead>
      <tr>
  <th>Perrito</th>
  <th>Vacuna</th>
  <th>Vencimiento</th>
  <th>Estado</th>
</tr>
            </thead>

            <tbody>
              {detalleVacunasProximas.map(
                (vacuna) => (
               <tr
  key={vacuna.id}
  className="clickable-row"
  onClick={() => {
    window.location.href =
      `/perritos/${vacuna.perrito_id}`;
  }}
>
  <td>
    <strong>
      🐶 {vacuna.perritos?.nombre || "—"}
    </strong>
  </td>

  <td>
    {vacuna.tipos_vacuna?.nombre || "—"}
  </td>

  <td>
    {new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(
      new Date(
        `${vacuna.fecha_vencimiento}T00:00:00`
      )
    )}
  </td>

  <td>
    {(() => {
      const vencimiento = new Date(
        `${vacuna.fecha_vencimiento}T00:00:00`
      );

      const diferencia =
        vencimiento.getTime() -
        hoy.getTime();

      const dias = Math.ceil(
        diferencia /
          (1000 * 60 * 60 * 24)
      );

      return (
        <span className="estado-badge proxima">
          <span className="estado-dot" />
          {dias === 0
            ? "Vence hoy"
            : `Vence en ${dias} ${
                dias === 1 ? "día" : "días"
              }`}
        </span>
      );
    })()}
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

{/* FIN MODAL VACUNAS PRÓXIMAS */}

{/* MODAL DESPARACITACIONES PRÓXIMAS */}

{mostrarDesparasitacionesProximas && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarDesparasitacionesProximas(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Desparasitaciones próximas a vencer
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarDesparasitacionesProximas(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {detalleDesparasitacionesProximas.length === 0 ? (
          <div className="empty-state">
            No hay desparasitaciones próximas.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Perrito</th>
                <th>Tipo</th>
                <th>Próxima fecha</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {detalleDesparasitacionesProximas.map(
                (desparasitacion) => {
                  const proxima = new Date(
                    `${desparasitacion.fecha_proxima}T00:00:00`
                  );

                  const diferencia =
                    proxima.getTime() -
                    hoy.getTime();

                  const dias = Math.ceil(
                    diferencia /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr
                      key={desparasitacion.id}
                      className="clickable-row"
                      onClick={() => {
                        window.location.href =
                          `/perritos/${desparasitacion.perrito_id}`;
                      }}
                    >
                      <td>
                        <strong>
                          🐶{" "}
                          {desparasitacion.perritos?.nombre ||
                            "—"}
                        </strong>
                      </td>

                      <td>
                        {desparasitacion
                          .tipos_desparasitacion
                          ?.nombre || "—"}
                      </td>

                      <td>
                        {new Intl.DateTimeFormat(
                          "es-CR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        ).format(proxima)}
                      </td>

                      <td>
                        <span className="estado-badge proxima">
                          <span className="estado-dot" />

                          {dias === 0
                            ? "Vence hoy"
                            : `Vence en ${dias} ${
                                dias === 1 ? "día" : "días"
                              }`}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        )}

      </div>
    </div>
  </div>
)}


{/* FIN MODAL DESPARACITACIONES PRÓXIMAS */}


{/* MODAL DESPARASITACIONES VENCIDAS */}
{mostrarDesparasitacionesVencidas && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarDesparasitacionesVencidas(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Desparasitaciones vencidas
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarDesparasitacionesVencidas(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {detalleDesparasitacionesVencidas.length === 0 ? (
          <div className="empty-state">
            No hay desparasitaciones vencidas.
          </div>
        ) : (
          <table className="data-table">

            <thead>
              <tr>
                <th>Perrito</th>
                <th>Tipo</th>
                <th>Fecha vencida</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {detalleDesparasitacionesVencidas.map(
                (desparasitacion) => {
                  const proxima = new Date(
                    `${desparasitacion.fecha_proxima}T00:00:00`
                  );

                  const diferencia =
                    proxima.getTime() -
                    hoy.getTime();

                  const dias = Math.ceil(
                    diferencia /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr
                      key={desparasitacion.id}
                      className="clickable-row"
                      onClick={() => {
                        window.location.href =
                          `/perritos/${desparasitacion.perrito_id}`;
                      }}
                    >
                      <td>
                        <strong>
                          🐶{" "}
                          {desparasitacion.perritos?.nombre ||
                            "—"}
                        </strong>
                      </td>

                      <td>
                        {desparasitacion
                          .tipos_desparasitacion
                          ?.nombre || "—"}
                      </td>

                      <td>
                        {new Intl.DateTimeFormat(
                          "es-CR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        ).format(proxima)}
                      </td>

                      <td>
                        <span className="estado-badge vencida">
                          <span className="estado-dot" />

                          Vencida hace{" "}
                          {Math.abs(dias)}{" "}
                          {Math.abs(dias) === 1
                            ? "día"
                            : "días"}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>

          </table>
        )}

      </div>
    </div>
  </div>
)}



{/* FIN MODAL DESPARASITACIONES VENCIDAS */}

{mostrarHospedadosHoy && (
  <div
    className="modal-backdrop"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setMostrarHospedadosHoy(false);
      }
    }}
  >
    <div className="modal">

      <div className="modal-header">
        <h2>
          Hospedados hoy
        </h2>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            setMostrarHospedadosHoy(false)
          }
        >
          ×
        </button>
      </div>

      <div className="modal-body">

        {detalleHospedadosHoy.length === 0 ? (
          <div className="empty-state">
            No hay perritos hospedados hoy.
          </div>
        ) : (
          <table className="data-table">

            <thead>
              <tr>
                <th>Perrito</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Salida</th>
              </tr>
            </thead>

            <tbody>
              {detalleHospedadosHoy.map(
                (estadia) => (
                  <tr
                    key={estadia.id}
                    className="clickable-row"
                    onClick={() => {
                      window.location.href =
                        `/perritos/${estadia.perrito_id}`;
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
                      {estadia.tipos_estadia
                        ?.nombre || "—"}
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

{/* MODAL ESTADIAS */}


{/* FIN MODAL ESTADIAS */}

<section>
  <div
    style={{
      marginBottom: "16px",
    }}
  >
    <h2 style={{ margin: 0 }}>
      Estado de salud
    </h2>

    <p
      style={{
        color: "var(--color-text-secondary)",
        marginTop: "6px",
        marginBottom: 0,
      }}
    >
      Resumen de vacunas y desparasitaciones
    </p>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "20px",
    }}
  >

    {/* VACUNAS */}

    <div className="card">

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
          }}
        >
          💉 Vacunas
        </h3>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginTop: "5px",
            marginBottom: 0,
            fontSize: "14px",
          }}
        >
          Estado de las últimas vacunas por tipo
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                color: "var(--color-success)",
                marginRight: "8px",
              }}
            >
              ●
            </span>

            Vigentes
          </div>

          <strong
            style={{
              fontSize: "20px",
              color: "var(--color-success)",
            }}
          >
            {vacunasVigentes}
          </strong>
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--color-border)",
          }}
        />

 <button
  type="button"
  onClick={() =>
    setMostrarVacunasProximas(true)
  }
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    width: "100%",
    padding: 0,

    border: "none",
    background: "transparent",

    color: "var(--color-text)",
    cursor: "pointer",
    textAlign: "left",
  }}
>
  <div>
    <span
      style={{
        color: "var(--color-warning)",
        marginRight: "8px",
      }}
    >
      ●
    </span>

    Próximas a vencer
  </div>

  <strong
    style={{
      fontSize: "20px",
      color: "var(--color-warning)",
    }}
  >
    {vacunasProximas}
  </strong>
</button>

        <div
          style={{
            height: "1px",
            background: "var(--color-border)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
   <button
  type="button"
  onClick={() =>
    setMostrarVacunasVencidas(true)
  }
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    width: "100%",
    padding: 0,

    border: "none",
    background: "transparent",

    color: "var(--color-text)",
    cursor: "pointer",
    textAlign: "left",
  }}
>
  <div>
    <span
      style={{
        color: "var(--color-danger)",
        marginRight: "8px",
      }}
    >
      ●
    </span>

    Vencidas
  </div>

  <strong
    style={{
      fontSize: "20px",
      color: "var(--color-danger)",
    }}
  >
    {vacunasVencidas}
  </strong>
</button>

        </div>

  

      </div>



    </div>


    {/* DESPARASITACIÓN */}

    <div className="card">

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
          }}
        >
          🛡️ Desparasitación
        </h3>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginTop: "5px",
            marginBottom: 0,
            fontSize: "14px",
          }}
        >
          Estado de la última desparasitación
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                color: "var(--color-success)",
                marginRight: "8px",
              }}
            >
              ●
            </span>

            Al día
          </div>

          <strong
            style={{
              fontSize: "20px",
              color: "var(--color-success)",
            }}
          >
            {desparasitacionesAlDia}
          </strong>
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--color-border)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
         
<button
  type="button"
  onClick={() =>
    setMostrarDesparasitacionesProximas(true)
  }
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "var(--color-text)",
    cursor: "pointer",
    textAlign: "left",
  }}
>
  <div>
    <span
      style={{
        color: "var(--color-warning)",
        marginRight: "8px",
      }}
    >
      ●
    </span>

    Próximas a vencer
  </div>

  <strong
    style={{
      fontSize: "20px",
      color: "var(--color-warning)",
    }}
  >
    {desparasitacionesProximas}
  </strong>
</button>

          
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--color-border)",
          }}
        />

        <div>
  
<button
  type="button"
  onClick={() =>
    setMostrarDesparasitacionesVencidas(true)
  }
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "var(--color-text)",
    cursor: "pointer",
    textAlign: "left",
  }}
>
  <div>
    <span
      style={{
        color: "var(--color-danger)",
        marginRight: "8px",
      }}
    >
      ●
    </span>

    Vencidas
  </div>

  <strong
    style={{
      fontSize: "20px",
      color: "var(--color-danger)",
    }}
  >
    {desparasitacionesVencidas}
  </strong>
</button>

        </div>

      </div>
    </div>

  </div>
</section>
    
    </div>
  );
}