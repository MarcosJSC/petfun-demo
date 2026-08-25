"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";

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

      setCargando(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    
    <div className="login-page">

<div className="login-theme-toggle">
  <ThemeToggle />
</div>

      <div className="login-card">

        <div className="login-brand">
          <div className="login-brand-icon">
            🐶
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