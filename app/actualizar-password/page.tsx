"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";

export default function ActualizarPasswordPage() {
  const router = useRouter();

  const [
    nuevaPassword,
    setNuevaPassword,
  ] = useState("");

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    sesionLista,
    setSesionLista,
  ] = useState(false);

useEffect(() => {
  const {
    data: { subscription },
  } =
    supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" ||
          session
        ) {
          setSesionLista(true);
        }
      }
    );

  return () => {
    subscription.unsubscribe();
  };
}, []);

  async function actualizarPassword(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !nuevaPassword ||
      !confirmarPassword
    ) {
      setMensaje(
        "Completa ambos campos."
      );

      return;
    }

    if (
      nuevaPassword !==
      confirmarPassword
    ) {
      setMensaje(
        "Las contraseñas no coinciden."
      );

      return;
    }

    if (
      nuevaPassword.length < 8
    ) {
      setMensaje(
        "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: nuevaPassword,
        });

      if (error) {
        console.error(
          "Error actualizando contraseña:",
          error
        );

        setMensaje(
          "No se pudo actualizar la contraseña."
        );

        return;
      }

      setMensaje(
        "Contraseña actualizada correctamente."
      );

      setTimeout(() => {
        router.replace("/login");
      }, 1500);

    } catch (error) {
      console.error(
        "Error inesperado:",
        error
      );

      setMensaje(
        "No se pudo actualizar la contraseña."
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
            🐶
          </div>

          <h1>
            Nueva contraseña
          </h1>

          <p>
            Crea una nueva contraseña para tu cuenta.
          </p>
        </div>

        {!sesionLista ? (
          <div className="login-message">
            Abre esta página desde el enlace recibido por correo.
          </div>
        ) : (
          <form
            onSubmit={actualizarPassword}
            className="login-form"
          >

            <div className="form-group">
              <label className="form-label">
                Nueva contraseña
              </label>

              <input
                className="form-input"
                type="password"
                value={nuevaPassword}
                onChange={(e) =>
                  setNuevaPassword(
                    e.target.value
                  )
                }
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Confirmar contraseña
              </label>

              <input
                className="form-input"
                type="password"
                value={confirmarPassword}
                onChange={(e) =>
                  setConfirmarPassword(
                    e.target.value
                  )
                }
                autoComplete="new-password"
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
                ? "Actualizando..."
                : "Actualizar contraseña"}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}