"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePermisos } from "@/hooks/usePermisos";

type ImagenCarrusel = {
  id: number | string;
  imagen_url: string;
  storage_path: string;
  etiqueta: string | null;
  alt_text: string | null;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
};

type RespuestaCarrusel = {
  error?: string;
  mensaje?: string;
  imagenes?: ImagenCarrusel[];
  imagen?: ImagenCarrusel;
  limpiezaStorage?: "pendiente" | "completa";
};

const TAMANO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

export default function CarruselConfiguracionPage() {
  const { esSuperadmin, cargandoRol } = usePermisos();
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const [imagenes, setImagenes] = useState<ImagenCarrusel[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [etiqueta, setEtiqueta] = useState("");
  const [altText, setAltText] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState("");
  const [cargandoLista, setCargandoLista] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error">("exito");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicionEtiqueta, setEdicionEtiqueta] = useState("");
  const [edicionAltText, setEdicionAltText] = useState("");
  const [edicionOrden, setEdicionOrden] = useState("1");
  const [edicionActivo, setEdicionActivo] = useState(true);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!archivo) {
      setVistaPrevia("");
      return;
    }

    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const obtenerToken = useCallback(async (): Promise<string> => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error("Tu sesión no está activa. Iniciá sesión nuevamente.");
    }

    return session.access_token;
  }, []);

  const cargarImagenes = useCallback(async () => {
    setCargandoLista(true);

    try {
      const token = await obtenerToken();
      const respuesta = await fetch("/api/admin/carrusel", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const datos: RespuestaCarrusel = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudieron cargar las imágenes.");
      }

      setImagenes(datos.imagenes ?? []);
    } catch (error) {
      console.error("Error cargando imágenes del carrusel:", error);
      setTipoMensaje("error");
      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar las imágenes."
      );
    } finally {
      setCargandoLista(false);
    }
  }, [obtenerToken]);

  useEffect(() => {
    if (!cargandoRol && esSuperadmin) {
      void cargarImagenes();
    }
  }, [cargandoRol, esSuperadmin, cargarImagenes]);

  function seleccionarArchivo(file: File | null) {
    setMensaje("");

    if (!file) {
      setArchivo(null);
      return;
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setArchivo(null);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
      setTipoMensaje("error");
      setMensaje("Formato no permitido. Seleccioná una imagen JPG, PNG o WebP.");
      return;
    }

    if (file.size > TAMANO_MAXIMO) {
      setArchivo(null);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
      setTipoMensaje("error");
      setMensaje("La imagen no puede superar los 5 MB.");
      return;
    }

    setArchivo(file);
    if (!altText.trim()) setAltText(file.name.replace(/\.[^.]+$/, ""));
  }

  async function subirImagen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensaje("");

    if (!archivo) {
      setTipoMensaje("error");
      setMensaje("Seleccioná una imagen antes de subirla.");
      return;
    }

    if (etiqueta.trim().length > 160) {
      setTipoMensaje("error");
      setMensaje("La leyenda no puede superar los 160 caracteres.");
      return;
    }

    if (altText.trim().length > 300) {
      setTipoMensaje("error");
      setMensaje("El texto alternativo no puede superar los 300 caracteres.");
      return;
    }

    setSubiendo(true);

    try {
      const token = await obtenerToken();
      const formulario = new FormData();
      // Este nombre debe coincidir con el que espera POST en la API.
      formulario.append("archivo", archivo);
      formulario.append("etiqueta", etiqueta.trim());
      formulario.append("alt_text", altText.trim());

      const respuesta = await fetch("/api/admin/carrusel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formulario,
        cache: "no-store",
      });
      const datos: RespuestaCarrusel = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo subir la imagen.");
      }

      setTipoMensaje("exito");
      setMensaje(datos.mensaje || "Imagen subida correctamente.");
      setArchivo(null);
      setEtiqueta("");
      setAltText("");
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
      await cargarImagenes();
    } catch (error) {
      console.error("Error subiendo imagen al carrusel:", error);
      setTipoMensaje("error");
      setMensaje(
        error instanceof Error ? error.message : "Ocurrió un error al subir la imagen."
      );
    } finally {
      setSubiendo(false);
    }
  }

  function iniciarEdicion(imagen: ImagenCarrusel) {
    setEditandoId(String(imagen.id));
    setEdicionEtiqueta(imagen.etiqueta ?? "");
    setEdicionAltText(imagen.alt_text ?? "");
    setEdicionOrden(String(imagen.orden));
    setEdicionActivo(imagen.activo);
    setMensaje("");
  }

  function cancelarEdicion() {
    if (guardandoEdicion) return;
    setEditandoId(null);
    setEdicionEtiqueta("");
    setEdicionAltText("");
    setEdicionOrden("1");
    setEdicionActivo(true);
  }

  async function guardarEdicion(event: FormEvent<HTMLFormElement>, imagen: ImagenCarrusel) {
    event.preventDefault();
    setMensaje("");

    const orden = Number(edicionOrden);
    if (!Number.isInteger(orden) || orden < 1) {
      setTipoMensaje("error");
      setMensaje("El orden debe ser un número entero mayor que cero.");
      return;
    }
    if (edicionEtiqueta.trim().length > 160) {
      setTipoMensaje("error");
      setMensaje("La leyenda no puede superar los 160 caracteres.");
      return;
    }
    if (edicionAltText.trim().length > 300) {
      setTipoMensaje("error");
      setMensaje("El texto alternativo no puede superar los 300 caracteres.");
      return;
    }

    setGuardandoEdicion(true);
    try {
      const token = await obtenerToken();
      const respuesta = await fetch("/api/admin/carrusel", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: imagen.id,
          etiqueta: edicionEtiqueta.trim(),
          alt_text: edicionAltText.trim(),
          orden,
          activo: edicionActivo,
        }),
        cache: "no-store",
      });

      const datos: RespuestaCarrusel = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudieron guardar los cambios.");
      }

      setTipoMensaje("exito");
      setMensaje(datos.mensaje || "Cambios guardados correctamente.");
      setEditandoId(null);
      await cargarImagenes();
    } catch (error) {
      console.error("Error editando imagen del carrusel:", error);
      setTipoMensaje("error");
      setMensaje(
        error instanceof Error ? error.message : "Ocurrió un error al guardar los cambios."
      );
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function eliminarImagen(imagen: ImagenCarrusel) {
    const nombre = imagen.etiqueta?.trim() || `imagen en orden ${imagen.orden}`;
    const confirmar = window.confirm(
      `¿Querés eliminar definitivamente "${nombre}" del carrusel?\n\n` +
        "Esta acción quitará el registro y tratará de borrar el archivo de Supabase Storage. No se puede deshacer."
    );
    if (!confirmar) return;

    setMensaje("");
    setEliminandoId(String(imagen.id));

    try {
      const token = await obtenerToken();
      const respuesta = await fetch("/api/admin/carrusel", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: imagen.id }),
        cache: "no-store",
      });

      const datos: RespuestaCarrusel = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo eliminar la imagen.");
      }

      setTipoMensaje(datos.limpiezaStorage === "pendiente" ? "error" : "exito");
      setMensaje(
        datos.mensaje ||
          (datos.limpiezaStorage === "pendiente"
            ? "La imagen se quitó del carrusel, pero hay que revisar el archivo en Storage."
            : "Imagen eliminada correctamente.")
      );
      setEditandoId((actual) => (actual === String(imagen.id) ? null : actual));
      await cargarImagenes();
    } catch (error) {
      console.error("Error eliminando imagen del carrusel:", error);
      setTipoMensaje("error");
      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al eliminar la imagen."
      );
    } finally {
      setEliminandoId(null);
    }
  }

  const estiloCampo = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "11px 12px",
    border: "1px solid var(--color-border, #d5d5d5)",
    borderRadius: "8px",
    background: "var(--color-card, var(--color-background, #fff))",
    color: "var(--color-text, inherit)",
    font: "inherit",
  };

  if (cargandoRol) {
    return <div className="empty-state">Verificando permisos...</div>;
  }

  if (!esSuperadmin) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">🔐 Acceso restringido</h1>
            <p className="page-description">
              Solo el superadministrador puede administrar el carrusel de reservas.
            </p>
          </div>
        </div>
        <section className="card">
          <Link href="/configuracion" className="secondary-button">
            ← Volver a Configuración
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Carrusel de reservas</h1>
          <p className="page-description">
            Subí imágenes y administrá el contenido que se mostrará en la página pública de reservas.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/configuracion" className="secondary-button">
            ← Configuración
          </Link>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Agregar imagen</h2>
        <p style={{ color: "var(--color-text-secondary)", marginTop: 0 }}>
          Formatos admitidos: JPG, PNG y WebP. Tamaño máximo: 5 MB. La imagen nueva se agregará al final del carrusel y quedará activa.
        </p>

        <form onSubmit={subirImagen}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 20 }}>
            <div>
              <label htmlFor="imagen-carrusel" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Archivo de imagen <span aria-hidden="true">*</span>
              </label>
              <input
                ref={inputArchivoRef}
                id="imagen-carrusel"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                disabled={subiendo}
                onChange={(event) => seleccionarArchivo(event.currentTarget.files?.[0] ?? null)}
                style={{ ...estiloCampo, padding: 9 }}
              />
              {archivo && (
                <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 0 }}>
                  {archivo.name} · {(archivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}

              <div style={{ marginTop: 18 }}>
                <label htmlFor="etiqueta-carrusel" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                  Leyenda sobre la imagen
                </label>
                <input
                  id="etiqueta-carrusel"
                  type="text"
                  value={etiqueta}
                  maxLength={160}
                  disabled={subiendo}
                  onChange={(event) => setEtiqueta(event.target.value)}
                  placeholder="Ej.: TEMPORADA NAVIDEÑA"
                  style={estiloCampo}
                />
                <small style={{ color: "var(--color-text-secondary)" }}>{etiqueta.length}/160 caracteres</small>
              </div>

              <div style={{ marginTop: 18 }}>
                <label htmlFor="alt-text-carrusel" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                  Texto alternativo (accesibilidad)
                </label>
                <textarea
                  id="alt-text-carrusel"
                  value={altText}
                  maxLength={300}
                  rows={3}
                  disabled={subiendo}
                  onChange={(event) => setAltText(event.target.value)}
                  placeholder="Describí brevemente lo que aparece en la imagen."
                  style={{ ...estiloCampo, resize: "vertical" }}
                />
                <small style={{ color: "var(--color-text-secondary)" }}>{altText.length}/300 caracteres</small>
              </div>
            </div>

            <div>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Vista previa</h3>
              <div style={{ border: "1px solid var(--color-border, #ddd)", borderRadius: 12, overflow: "hidden", background: "var(--color-background-secondary, #f7f7f7)", minHeight: 180, aspectRatio: "16 / 9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {vistaPrevia ? (
                  // La URL se crea localmente solo para mostrar la vista previa.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vistaPrevia} alt="Vista previa de la imagen seleccionada" style={{ display: "block", width: "100%", height: "100%", maxHeight: 360, objectFit: "contain" }} />
                ) : (
                  <p style={{ color: "var(--color-text-secondary)", padding: 20, textAlign: "center", margin: 0 }}>
                    Seleccioná un archivo para ver cómo se ve.
                  </p>
                )}
              </div>
              {etiqueta.trim() && (
                <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "var(--color-background-secondary, #f7f7f7)", textAlign: "center", fontWeight: 700, letterSpacing: "0.04em" }}>
                  {etiqueta.trim()}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <button type="submit" className="primary-button" disabled={subiendo || !archivo}>
              {subiendo ? "Subiendo imagen…" : "Subir imagen al carrusel"}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={subiendo}
              onClick={() => {
                setArchivo(null);
                setEtiqueta("");
                setAltText("");
                setMensaje("");
                if (inputArchivoRef.current) inputArchivoRef.current.value = "";
              }}
            >
              Limpiar formulario
            </button>
          </div>
        </form>

        {mensaje && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: 18,
              padding: "12px 14px",
              borderRadius: 8,
              border: `1px solid ${tipoMensaje === "exito" ? "#86b99a" : "#d99b9b"}`,
              background: tipoMensaje === "exito" ? "rgba(34, 139, 76, 0.08)" : "rgba(190, 40, 40, 0.08)",
            }}
          >
            {mensaje}
          </div>
        )}
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Imágenes registradas</h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "6px 0 0" }}>
              {imagenes.length} {imagenes.length === 1 ? "imagen" : "imágenes"} en la tabla del carrusel.
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={() => void cargarImagenes()} disabled={cargandoLista || subiendo || eliminandoId !== null}>
            {cargandoLista ? "Actualizando…" : "Actualizar lista"}
          </button>
        </div>

        {cargandoLista && imagenes.length === 0 ? (
          <div className="empty-state">Cargando imágenes del carrusel…</div>
        ) : imagenes.length === 0 ? (
          <div className="card empty-state">Todavía no hay imágenes registradas en el carrusel.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 18 }}>
            {imagenes.map((imagen) => {
              const estaEditando = editandoId === String(imagen.id);
              const camposDeshabilitados = guardandoEdicion || subiendo || eliminandoId !== null;

              return (
                <article className="card" key={String(imagen.id)} style={{ padding: 14 }}>
                  <div style={{ overflow: "hidden", borderRadius: 8, aspectRatio: "16 / 9", background: "var(--color-background-secondary, #f7f7f7)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagen.imagen_url}
                      alt={imagen.alt_text || imagen.etiqueta || "Imagen del carrusel de reservas"}
                      loading="lazy"
                      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
                    <strong>Orden {imagen.orden}</strong>
                    <span style={{ borderRadius: 999, padding: "4px 9px", fontSize: 12, fontWeight: 700, background: imagen.activo ? "rgba(34, 139, 76, 0.12)" : "rgba(120, 120, 120, 0.14)", color: imagen.activo ? "#21834a" : "var(--color-text-secondary)" }}>
                      {imagen.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  {estaEditando ? (
                    <form onSubmit={(event) => void guardarEdicion(event, imagen)} style={{ marginTop: 14 }}>
                      <div style={{ marginBottom: 12 }}>
                        <label htmlFor={`etiqueta-edicion-${imagen.id}`} style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                          Leyenda sobre la imagen
                        </label>
                        <input
                          id={`etiqueta-edicion-${imagen.id}`}
                          type="text"
                          value={edicionEtiqueta}
                          maxLength={160}
                          disabled={camposDeshabilitados}
                          onChange={(event) => setEdicionEtiqueta(event.target.value)}
                          placeholder="Ej.: TEMPORADA NAVIDEÑA"
                          style={estiloCampo}
                        />
                        <small style={{ color: "var(--color-text-secondary)" }}>{edicionEtiqueta.length}/160 caracteres</small>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label htmlFor={`alt-edicion-${imagen.id}`} style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                          Texto alternativo
                        </label>
                        <textarea
                          id={`alt-edicion-${imagen.id}`}
                          value={edicionAltText}
                          maxLength={300}
                          rows={3}
                          disabled={camposDeshabilitados}
                          onChange={(event) => setEdicionAltText(event.target.value)}
                          placeholder="Describí brevemente la imagen."
                          style={{ ...estiloCampo, resize: "vertical" }}
                        />
                        <small style={{ color: "var(--color-text-secondary)" }}>{edicionAltText.length}/300 caracteres</small>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label htmlFor={`orden-edicion-${imagen.id}`} style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                          Orden en el carrusel
                        </label>
                        <input
                          id={`orden-edicion-${imagen.id}`}
                          type="number"
                          min={1}
                          step={1}
                          required
                          value={edicionOrden}
                          disabled={camposDeshabilitados}
                          onChange={(event) => setEdicionOrden(event.target.value)}
                          style={estiloCampo}
                        />
                      </div>

                      <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "4px 0 16px", cursor: camposDeshabilitados ? "default" : "pointer" }}>
                        <input
                          type="checkbox"
                          checked={edicionActivo}
                          disabled={camposDeshabilitados}
                          onChange={(event) => setEdicionActivo(event.target.checked)}
                        />
                        Mostrar esta imagen en el carrusel público
                      </label>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <button type="submit" className="primary-button" disabled={camposDeshabilitados}>
                          {guardandoEdicion ? "Guardando…" : "Guardar cambios"}
                        </button>
                        <button type="button" className="secondary-button" disabled={guardandoEdicion} onClick={cancelarEdicion}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p style={{ margin: "10px 0 4px", fontWeight: 700 }}>
                        {imagen.etiqueta?.trim() || "Sin leyenda"}
                      </p>
                      <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 13, overflowWrap: "anywhere" }}>
                        {imagen.alt_text?.trim() || "Sin texto alternativo"}
                      </p>
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={guardandoEdicion || subiendo || cargandoLista || eliminandoId !== null || (editandoId !== null && !estaEditando)}
                            onClick={() => iniciarEdicion(imagen)}
                          >
                            Editar imagen
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={guardandoEdicion || subiendo || cargandoLista || eliminandoId !== null || editandoId !== null}
                            onClick={() => void eliminarImagen(imagen)}
                            style={{ borderColor: "#dc6262", color: "#dc6262" }}
                          >
                            {eliminandoId === String(imagen.id) ? "Eliminando…" : "Eliminar imagen"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
