import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { autorizarSuperadminCarrusel } from "@/lib/carrusel/autorizarSuperadminCarrusel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "branding";
const PREFIJO_STORAGE = "carrusel";
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type TipoImagen = "image/jpeg" | "image/png" | "image/webp";
type ObjetoJson = Record<string, unknown>;

function respuestaError(mensaje: string, status: number) {
  return NextResponse.json(
    { error: mensaje },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function esObjetoJson(valor: unknown): valor is ObjetoJson {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarId(valor: unknown): string | null {
  if (typeof valor === "number") {
    if (!Number.isSafeInteger(valor) || valor <= 0) return null;
    return String(valor);
  }

if (typeof valor === "string" && /^[1-9]\d*$/.test(valor)) {
  try {
    return BigInt(valor) > BigInt(0) ? valor : null;
  } catch {
    return null;
  }
}

  return null;
}

function firmaValida(buffer: Buffer, tipo: TipoImagen): boolean {
  if (tipo === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (tipo === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    );
  }

  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  );
}

function rutaStorageCarruselValida(ruta: unknown): ruta is string {
  // Solo permitimos archivos directamente dentro de branding/carrusel.
  // No se permite una ruta externa, traversal ni subcarpetas inesperadas.
  return typeof ruta === "string" && /^carrusel\/[^/]+$/.test(ruta);
}

// GET: lista todas las imágenes (activas e inactivas) para administración.
export async function GET(request: NextRequest) {
  try {
    const autorizacion = await autorizarSuperadminCarrusel(request);
    if (!autorizacion.autorizado) return autorizacion.respuesta;

    const { data, error } = await supabaseAdmin
      .from("carrusel_reservas_imagenes")
      .select(
        "id, imagen_url, storage_path, etiqueta, alt_text, orden, activo, created_at, updated_at"
      )
      .order("orden", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Error consultando imágenes del carrusel:", error.message);
      return respuestaError("No se pudieron consultar las imágenes del carrusel.", 500);
    }

    return NextResponse.json(
      { imagenes: data ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Error inesperado consultando el carrusel:",
      error instanceof Error ? error.message : error
    );
    return respuestaError("Ocurrió un error al consultar el carrusel.", 500);
  }
}

// POST: sube una imagen al bucket branding/carrusel y registra sus metadatos.
// FormData: archivo (requerido), etiqueta (opcional), alt_text (opcional).
export async function POST(request: NextRequest) {
  let rutaSubida: string | null = null;

  try {
    const autorizacion = await autorizarSuperadminCarrusel(request);
    if (!autorizacion.autorizado) return autorizacion.respuesta;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return respuestaError("El formulario de subida no es válido.", 400);
    }

    const archivo = formData.get("archivo");
    if (!(archivo instanceof File)) {
      return respuestaError("Seleccioná una imagen para subir.", 400);
    }
    if (archivo.size <= 0) return respuestaError("El archivo está vacío.", 400);
    if (archivo.size > TAMANO_MAXIMO) {
      return respuestaError("La imagen no puede superar los 5 MB.", 413);
    }

    const extension = TIPOS_PERMITIDOS.get(archivo.type);
    if (!extension) {
      return respuestaError("Formato no permitido. Usá JPG, PNG o WEBP.", 415);
    }

    const etiquetaRaw = formData.get("etiqueta");
    const altTextRaw = formData.get("alt_text");
    const etiqueta = typeof etiquetaRaw === "string" ? etiquetaRaw.trim() : "";
    const altText = typeof altTextRaw === "string" ? altTextRaw.trim() : "";

    if (etiqueta.length > 160) {
      return respuestaError("La leyenda no puede superar 160 caracteres.", 400);
    }
    if (altText.length > 300) {
      return respuestaError("El texto alternativo no puede superar 300 caracteres.", 400);
    }

    const { data: ultimaImagen, error: errorOrden } = await supabaseAdmin
      .from("carrusel_reservas_imagenes")
      .select("orden")
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorOrden) {
      console.error("Error calculando orden del carrusel:", errorOrden.message);
      return respuestaError("No se pudo preparar el orden de la nueva imagen.", 500);
    }

    const orden = (ultimaImagen?.orden ?? 0) + 1;
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const tipo = archivo.type as TipoImagen;
    if (!firmaValida(buffer, tipo)) {
      return respuestaError("El contenido del archivo no coincide con su formato de imagen.", 415);
    }

    rutaSubida = `${PREFIJO_STORAGE}/${randomUUID()}.${extension}`;
    const { error: errorStorage } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(rutaSubida, buffer, {
        contentType: tipo,
        cacheControl: "3600",
        upsert: false,
      });

    if (errorStorage) {
      console.error("Error subiendo imagen del carrusel:", errorStorage.message);
      rutaSubida = null;
      return respuestaError("No se pudo subir la imagen a Supabase Storage.", 500);
    }

    const { data: urlPublica } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(rutaSubida);

    const { data: imagen, error: errorInsert } = await supabaseAdmin
      .from("carrusel_reservas_imagenes")
      .insert({
        imagen_url: urlPublica.publicUrl,
        storage_path: rutaSubida,
        etiqueta,
        alt_text: altText,
        orden,
        activo: true,
      })
      .select(
        "id, imagen_url, storage_path, etiqueta, alt_text, orden, activo, created_at, updated_at"
      )
      .single();

    if (errorInsert || !imagen) {
      console.error(
        "Error registrando imagen del carrusel:",
        errorInsert?.message ?? "No se recibió el registro insertado."
      );
      const { error: errorLimpieza } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([rutaSubida]);
      if (errorLimpieza) {
        console.error("No se pudo limpiar la imagen subida:", errorLimpieza.message);
      }
      rutaSubida = null;
      return respuestaError("La imagen se subió, pero no se pudo registrar. Intentá nuevamente.", 500);
    }

    rutaSubida = null;
    return NextResponse.json(
      { ok: true, imagen, mensaje: "Imagen subida correctamente." },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Error inesperado subiendo imagen del carrusel:",
      error instanceof Error ? error.message : error
    );

    if (rutaSubida) {
      const { error: errorLimpieza } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([rutaSubida]);
      if (errorLimpieza) {
        console.error("No se pudo limpiar la imagen tras el error:", errorLimpieza.message);
      }
    }

    return respuestaError("Ocurrió un error inesperado al subir la imagen.", 500);
  }
}

// PATCH: actualiza uno o varios campos de una imagen existente.
// JSON: { id, etiqueta?, alt_text?, orden?, activo? }
export async function PATCH(request: NextRequest) {
  try {
    const autorizacion = await autorizarSuperadminCarrusel(request);
    if (!autorizacion.autorizado) return autorizacion.respuesta;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return respuestaError("El cuerpo de la solicitud debe ser JSON válido.", 400);
    }
    if (!esObjetoJson(body)) return respuestaError("Los datos enviados no son válidos.", 400);

    const id = normalizarId(body.id);
    if (!id) return respuestaError("El identificador de la imagen no es válido.", 400);

    const camposPermitidos = new Set(["id", "etiqueta", "alt_text", "orden", "activo"]);
    if (Object.keys(body).some((campo) => !camposPermitidos.has(campo))) {
      return respuestaError("La solicitud contiene campos no permitidos.", 400);
    }

    const cambios: Record<string, string | number | boolean | null> = {};

    if (Object.prototype.hasOwnProperty.call(body, "etiqueta")) {
      if (body.etiqueta !== null && typeof body.etiqueta !== "string") {
        return respuestaError("La leyenda debe ser texto o null.", 400);
      }
      const etiqueta = typeof body.etiqueta === "string" ? body.etiqueta.trim() : "";
      if (etiqueta.length > 160) {
        return respuestaError("La leyenda no puede superar 160 caracteres.", 400);
      }
      cambios.etiqueta = etiqueta || null;
    }

    if (Object.prototype.hasOwnProperty.call(body, "alt_text")) {
      if (body.alt_text !== null && typeof body.alt_text !== "string") {
        return respuestaError("El texto alternativo debe ser texto o null.", 400);
      }
      const altText = typeof body.alt_text === "string" ? body.alt_text.trim() : "";
      if (altText.length > 300) {
        return respuestaError("El texto alternativo no puede superar 300 caracteres.", 400);
      }
      cambios.alt_text = altText || null;
    }

    if (Object.prototype.hasOwnProperty.call(body, "orden")) {
      if (typeof body.orden !== "number" || !Number.isInteger(body.orden) || body.orden < 1) {
        return respuestaError("El orden debe ser un número entero mayor que cero.", 400);
      }
      cambios.orden = body.orden;
    }

    if (Object.prototype.hasOwnProperty.call(body, "activo")) {
      if (typeof body.activo !== "boolean") {
        return respuestaError("El estado activo debe ser true o false.", 400);
      }
      cambios.activo = body.activo;
    }

    if (Object.keys(cambios).length === 0) {
      return respuestaError("Indicá al menos un campo para actualizar.", 400);
    }

    const { data: existente, error: errorConsulta } = await supabaseAdmin
      .from("carrusel_reservas_imagenes")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (errorConsulta) {
      console.error("Error consultando imagen para actualizar:", errorConsulta.message);
      return respuestaError("No se pudo consultar la imagen seleccionada.", 500);
    }
    if (!existente) return respuestaError("La imagen indicada no existe.", 404);

    const { data: imagen, error: errorActualizacion } = await supabaseAdmin
      .from("carrusel_reservas_imagenes")
      .update(cambios)
      .eq("id", id)
      .select(
        "id, imagen_url, storage_path, etiqueta, alt_text, orden, activo, created_at, updated_at"
      )
      .single();

    if (errorActualizacion || !imagen) {
      console.error(
        "Error actualizando imagen del carrusel:",
        errorActualizacion?.message ?? "No se recibió el registro actualizado."
      );
      return respuestaError("No se pudo actualizar la imagen del carrusel.", 500);
    }

    return NextResponse.json(
      { ok: true, imagen, mensaje: "Imagen actualizada correctamente." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Error inesperado actualizando imagen del carrusel:",
      error instanceof Error ? error.message : error
    );
    return respuestaError("Ocurrió un error inesperado al actualizar la imagen.", 500);
  }
}

// DELETE: elimina el registro y luego intenta limpiar el archivo en Storage.
// JSON: { id }. La ruta de Storage debe estar dentro de branding/carrusel.
export async function DELETE(request: NextRequest) {
  try {
    const autorizacion = await autorizarSuperadminCarrusel(request);
    if (!autorizacion.autorizado) return autorizacion.respuesta;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return respuestaError("El cuerpo de la solicitud debe ser JSON válido.", 400);
    }
    if (!esObjetoJson(body)) return respuestaError("Los datos enviados no son válidos.", 400);

    const id = normalizarId(body.id);
    if (!id) return respuestaError("El identificador de la imagen no es válido.", 400);
    if (Object.keys(body).some((campo) => campo !== "id")) {
      return respuestaError("La solicitud de eliminación contiene campos no permitidos.", 400);
    }

    const { data: existente, error: errorConsulta } = await supabaseAdmin
      .from("carrusel_reservas_imagenes")
      .select("id, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (errorConsulta) {
      console.error("Error consultando imagen para eliminar:", errorConsulta.message);
      return respuestaError("No se pudo consultar la imagen seleccionada.", 500);
    }
    if (!existente) return respuestaError("La imagen indicada no existe.", 404);

    if (!rutaStorageCarruselValida(existente.storage_path)) {
      console.error("Ruta de Storage inesperada para imagen del carrusel:", existente.storage_path);
      return respuestaError(
        "No se puede eliminar esta imagen porque su ruta de almacenamiento no pertenece a la carpeta del carrusel.",
        409
      );
    }

    const { error: errorBorradoDB } = await supabaseAdmin
      .from("carrusel_reservas_imagenes")
      .delete()
      .eq("id", id);

    if (errorBorradoDB) {
      console.error("Error eliminando registro del carrusel:", errorBorradoDB.message);
      return respuestaError("No se pudo eliminar el registro de la imagen.", 500);
    }

    const { error: errorStorage } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([existente.storage_path]);

    if (errorStorage) {
      console.error(
        "El registro fue eliminado, pero no se pudo eliminar el archivo de Storage:",
        errorStorage.message
      );
      return NextResponse.json(
        {
          ok: true,
          limpiezaStorage: "pendiente",
          mensaje:
            "La imagen se quitó del carrusel, pero no se pudo borrar su archivo de almacenamiento. Revisá Storage.",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true, limpiezaStorage: "completa", mensaje: "Imagen eliminada correctamente." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "Error inesperado eliminando imagen del carrusel:",
      error instanceof Error ? error.message : error
    );
    return respuestaError("Ocurrió un error inesperado al eliminar la imagen.", 500);
  }
}
