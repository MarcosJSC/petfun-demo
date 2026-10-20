"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { LOGO_PETFUNCR_URL } from "@/lib/branding";
import styles from "./contacto.module.css";

type EstadoEnvio = "inactivo" | "enviando" | "exito" | "error";

export default function ContactoPage() {
  const [estado, setEstado] = useState<EstadoEnvio>("inactivo");
  const [mensajeEstado, setMensajeEstado] = useState("");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sitioWeb, setSitioWeb] = useState("");

  async function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado("enviando");
    setMensajeEstado("");

    try {
      const respuesta = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, asunto, mensaje, sitioWeb }),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setEstado("error");
        setMensajeEstado(
          resultado?.error ||
            "No pudimos enviar tu mensaje. Intentá nuevamente o escribinos por WhatsApp."
        );
        return;
      }

      setEstado("exito");
      setMensajeEstado(
        resultado?.mensaje || "¡Gracias por escribirnos! Recibimos tu mensaje."
      );
      setNombre("");
      setCorreo("");
      setAsunto("");
      setMensaje("");
      setSitioWeb("");
    } catch {
      setEstado("error");
      setMensajeEstado(
        "No pudimos conectar con el servidor. Intentá nuevamente o escribinos por WhatsApp."
      );
    }
  }

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="contacto-titulo">
          <span className={styles.eyebrow}>ESTAMOS PARA AYUDARTE</span>
          <h1 id="contacto-titulo">¡Hablemos de tu mejor amigo!</h1>
          <p>
            ¿Tenés alguna consulta sobre nuestro hotel o guardería canina?
            Escribinos. Nos alegra conocer a las familias que confían en PetFunCR.
          </p>
        </section>

        <section className={styles.content} aria-label="Opciones de contacto">
          <div className={styles.details}>
            <div className={styles.detailsHeading}>
              <span className={styles.paw} aria-hidden="true">🐾</span>
              <div>
                <h2>Conversemos</h2>
                <p>Elegí la forma que te resulte más cómoda.</p>
              </div>
            </div>

            <a
              className={styles.contactItem}
              href="https://wa.me/50685689575"
              target="_blank"
              rel="noreferrer"
              aria-label="Escribir a PetFunCR por WhatsApp"
            >
              <span className={styles.contactIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" />
                  <path d="M9 8.5c.3-.5.6-.5.9-.5.2 0 .4 0 .5.4l.7 1.6c.1.3 0 .5-.2.7l-.5.6c-.2.2-.2.4 0 .7.5.8 1.1 1.4 2 1.9.3.2.5.2.7-.1l.7-.8c.2-.2.4-.3.7-.2l1.5.7c.3.1.4.3.4.5 0 .4-.2.9-.5 1.1-.4.4-1.1.6-1.8.4-1-.2-2.4-.8-3.7-2.1-1.1-1.1-1.8-2.5-2-3.3-.2-.7.1-1.3.6-1.6Z" />
                </svg>
              </span>
              <span className={styles.contactText}>
                <strong>WhatsApp</strong>
                <span>8568-9575</span>
                <small>Escribinos para coordinar una primera visita.</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>

            <div className={styles.contactItem}>
              <span className={styles.contactIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <span className={styles.contactText}>
                <strong>Ubicación</strong>
                <span>San Rafael de Heredia, Costa Rica</span>
                <small>Las visitas se coordinan previamente.</small>
              </span>
            </div>

            <div className={styles.contactItem}>
              <span className={styles.contactIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </svg>
              </span>
              <span className={styles.contactText}>
                <strong>Horario de atención</strong>
                <span>Todos los días, de 7:00 a. m. a 6:00 p. m.</span>
                <small>Incluye fines de semana y feriados. Cualquier cambio se anuncia en nuestras redes.</small>
              </span>
            </div>

            <div className={styles.note}>
              <span aria-hidden="true">💜</span>
              <p>
                Para la primera visita, escribinos por WhatsApp para coordinar
                la cita y la prueba de socialización. No recibimos visitas sin cita previa.
              </p>
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeading}>
              <span className={styles.formKicker}>FORMULARIO DE CONTACTO</span>
              <h2>Mandanos un mensaje</h2>
              <p>Completá los datos y tu consulta llegará al equipo de PetFunCR.</p>
            </div>

            <form className={styles.form} onSubmit={enviarFormulario}>
              <div className={styles.field}>
                <label htmlFor="contacto-nombre">Nombre completo</label>
                <input
                  id="contacto-nombre"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  minLength={2}
                  maxLength={80}
                  placeholder="¿Cómo te llamás?"
                  required
                  disabled={estado === "enviando"}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="contacto-correo">Correo electrónico</label>
                <input
                  id="contacto-correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  value={correo}
                  onChange={(evento) => setCorreo(evento.target.value)}
                  maxLength={254}
                  placeholder="nombre@correo.com"
                  required
                  disabled={estado === "enviando"}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="contacto-asunto">Asunto</label>
                <input
                  id="contacto-asunto"
                  name="asunto"
                  type="text"
                  value={asunto}
                  onChange={(evento) => setAsunto(evento.target.value)}
                  minLength={3}
                  maxLength={120}
                  placeholder="¿En qué podemos ayudarte?"
                  required
                  disabled={estado === "enviando"}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="contacto-mensaje">Mensaje</label>
                <textarea
                  id="contacto-mensaje"
                  name="mensaje"
                  value={mensaje}
                  onChange={(evento) => setMensaje(evento.target.value)}
                  minLength={10}
                  maxLength={4000}
                  rows={5}
                  placeholder="Contanos tu consulta..."
                  required
                  disabled={estado === "enviando"}
                />
                <span className={styles.fieldHint}>Máximo 4000 caracteres.</span>
              </div>

              {/* Campo trampa: los visitantes reales no lo ven ni deben completarlo. */}
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor="contacto-sitio-web">Dejá este campo vacío</label>
                <input
                  id="contacto-sitio-web"
                  name="sitioWeb"
                  type="text"
                  autoComplete="off"
                  tabIndex={-1}
                  value={sitioWeb}
                  onChange={(evento) => setSitioWeb(evento.target.value)}
                />
              </div>

              {mensajeEstado && (
                <div
                  className={`${styles.status} ${estado === "error" ? styles.statusError : styles.statusSuccess}`}
                  role={estado === "error" ? "alert" : "status"}
                >
                  {mensajeEstado}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={estado === "enviando"}
              >
                {estado === "enviando" ? "Enviando mensaje…" : "Enviar mensaje"}
                {estado !== "enviando" && <span aria-hidden="true">→</span>}
              </button>
              <p className={styles.privacyNote}>
                Usaremos tus datos únicamente para responder tu consulta.
              </p>
            </form>
          </div>
        </section>

        <div className={styles.bottomCta}>
          <p>¿Ya conocés PetFunCR y querés reservar una estadía?</p>
          <Link href="/reservar">Solicitá tu reserva <span aria-hidden="true">→</span></Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <Link href="/" aria-label="PetFunCR, página de inicio">
          <img src={LOGO_PETFUNCR_URL} alt="Logo oficial de PetFunCR" />
        </Link>
        <span>PetFunCR · Cuidamos a quienes más querés.</span>
      </footer>
    </div>
  );
}
