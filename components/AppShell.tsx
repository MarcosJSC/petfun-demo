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

  const [revisandoSesion, setRevisandoSesion] = useState(true);

  const esLogin = pathname === "/login";
  const rutaPublica =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/actualizar-password" ||
    pathname === "/reservar" ||
    pathname === "/servicios" ||
    pathname === "/instalaciones" ||
    pathname === "/preguntas-frecuentes" ||
    pathname === "/contacto" ||
  pathname === "/nosotros";


  useEffect(() => {
    let activo = true;

    async function revisarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!activo) return;

      if (session) {
        const { data: perfil, error: errorPerfil } = await supabase
          .from("perfiles_usuario")
          .select("activo")
          .eq("usuario_id", session.user.id)
          .single();

        if (!activo) return;

        if (errorPerfil || !perfil || !perfil.activo) {
          sessionStorage.setItem(
            "petfun_auth_message",
            "Este usuario se encuentra inactivo. Contacta al administrador."
          );
          await supabase.auth.signOut();
          if (activo) router.replace("/login");
          return;
        }
      }

      if (!session && !rutaPublica) {
        router.replace("/login");
      }

      if (session && esLogin) {
        router.replace("/dashboard");
      }

      setRevisandoSesion(false);
    }

    void revisarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !rutaPublica) {
        router.replace("/login");
      }

      if (session && esLogin) {
        router.replace("/dashboard");
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [esLogin, rutaPublica, pathname, router]);

  // Las páginas públicas no necesitan esperar para mostrar su contenido.
  if (revisandoSesion && !rutaPublica) {
    return (
      <div className="auth-loading">
        <div>
          🐶
          <div>Cargando PetFunCR...</div>
        </div>
      </div>
    );
  }

  if (rutaPublica) {
    return <main>{children}</main>;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="app-content">{children}</main>
    </div>
  );
}
