"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";

import {
  LOGO_PETFUNCR_URL,
} from "@/lib/branding";

export default function LoginPage() {
  const router = useRouter();

  const [correo, setCorreo] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");


useEffect(() => {
  const mensajeAuth =
    sessionStorage.getItem(
      "petfun_auth_message"
    );

  if (mensajeAuth) {
    setMensaje(mensajeAuth);

    sessionStorage.removeItem(
      "petfun_auth_message"
    );
  }

  async function revisarSesion() {
    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (session) {
      router.replace("/");
    }
  }

  revisarSesion();
}, [router]);

 

async function iniciarSesion(
  e: FormEvent<HTMLFormElement>
) {
  e.preventDefault();

  if (!correo.trim() || !password) {
    setMensaje(
      "Ingresa tu correo y contraseña."
    );
    return;
  }

  setCargando(true);
  setMensaje("");

  try {
    const { error } =
      await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password,
      });

    if (error) {
      console.error(
        "Error iniciando sesión:",
        error
      );

      setMensaje(
        "Correo o contraseña incorrectos."
      );

      return;
    }

    router.replace("/");
    router.refresh();

  } catch (error) {
    console.error(
      "Error inesperado iniciando sesión:",
      error
    );

    setMensaje(
      "No se pudo iniciar sesión. Intenta nuevamente."
    );

  } finally {
    setCargando(false);
  }
}

async function recuperarPassword() {
  if (!correo.trim()) {
    setMensaje(
      "Ingresa tu correo para recuperar la contraseña."
    );
    return;
  }

  setCargando(true);
  setMensaje("");

  try {
    const { error } =
      await supabase.auth.resetPasswordForEmail(
        correo.trim(),
        {
          redirectTo:
            `${window.location.origin}/actualizar-password`,
        }
      );

    if (error) {
      console.error(
        "Error recuperando contraseña:",
        error
      );

      setMensaje(
        "No se pudo enviar el correo de recuperación."
      );

      return;
    }

    setMensaje(
      "Si existe una cuenta asociada a este correo, recibirás un enlace para cambiar tu contraseña."
    );

  } catch (error) {
    console.error(
      "Error inesperado recuperando contraseña:",
      error
    );

    setMensaje(
      "No se pudo procesar la solicitud."
    );

  } finally {
    setCargando(false);
  }
}

  return (
    
    <div className="login-page">

<div className="login-theme-toggle">
  <ThemeToggle />
</div>

      <div className="login-card">

<div className="login-brand">
  <div className="login-brand-icon">
    <img
      src={LOGO_PETFUNCR_URL}
      alt="PetFunCR"
 style={{
    width: "100px",
    height: "100px",
    objectFit: "contain",
    display: "block",
    margin: "0 auto",
  }}
    />
  </div>

  <h1>
    PetFunCR
  </h1>

  <p>
    Sistema de gestión de guardería y hotel
  </p>
</div>


        <form
          onSubmit={iniciarSesion}
          className="login-form"
        >

          <div className="form-group">
            <label className="form-label">
              Correo
            </label>

            <input
              className="form-input"
              type="email"
              value={correo}
              onChange={(e) =>
                setCorreo(
                  e.target.value
                )
              }
              autoComplete="email"
              autoFocus
              required
            />
          </div>


          <div className="form-group">
            <label className="form-label">
              Contraseña
            </label>

            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="current-password"
              required
            />
          </div>

<button
  type="button"
  onClick={recuperarPassword}
  disabled={cargando}
  className="login-forgot-password"
>
  ¿Olvidaste tu contraseña?
</button>

          {mensaje && (
            <div className="login-message">
              {mensaje}
            </div>
          )}


          <button
            type="submit"
            className="primary-button login-submit"
            disabled={cargando}
          >
            {cargando
              ? "Ingresando..."
              : "Ingresar"}
          </button>

        </form>

      </div>
    </div>
  );
}