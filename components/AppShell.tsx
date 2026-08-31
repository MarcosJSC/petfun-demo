"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [revisandoSesion, setRevisandoSesion] =
    useState(true);

  const esLogin =
    pathname === "/login";

    const rutaPublica =
  pathname === "/login" ||
  pathname === "/actualizar-password";

  useEffect(() => {
    let activo = true;

    async function revisarSesion() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!activo) {
        return;
      }

      /*
       * No hay sesión y estamos intentando
       * entrar al sistema.
       */
if (session) {
  const {
    data: perfil,
    error: errorPerfil,
  } = await supabase
    .from("perfiles_usuario")
    .select(`
      activo
    `)
    .eq(
      "usuario_id",
      session.user.id
    )
    .single();

  if (
    errorPerfil ||
    !perfil ||
    !perfil.activo
  ) {
    sessionStorage.setItem(
      "petfun_auth_message",
      "Este usuario se encuentra inactivo. Contacta al administrador."
    );

    await supabase.auth.signOut();

    router.replace("/login");
    return;
  }
}


if (
  !session &&
  !rutaPublica
) {
if (!session && !rutaPublica) {
  router.replace("/login");
}
}

      /*
       * Ya hay sesión y alguien entra
       * manualmente a /login.
       */
      if (session && esLogin) {
        router.replace("/");
        setRevisandoSesion(false);
        return;
      }

      setRevisandoSesion(false);
    }

    revisarSesion();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session && !esLogin) {
            router.replace("/login");
          }

          if (session && esLogin) {
            router.replace("/");
          }
        }
      );

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [
    esLogin,
    rutaPublica,
    pathname,
    router,
  ]);

  /*
   * Mientras Supabase revisa si existe
   * sesión, no mostramos contenido privado.
   */
  if (revisandoSesion) {
    return (
      <div className="auth-loading">
        <div>
          🐶
          <div>
            Cargando PetFunCR...
          </div>
        </div>
      </div>
    );
  }

  /*
   * Login:
   * sin Sidebar ni contenido del sistema.
   */
if (rutaPublica) {
  return (
    <main>
      {children}
    </main>
  );
}

  /*
   * Aplicación autenticada.
   */
  return (
    <div className="app-container">
      <Sidebar />

      <main className="app-content">
        {children}
      </main>
    </div>
  );
}