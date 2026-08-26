"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import type {
  RolUsuario,
} from "@/lib/permisos";

export function useRolUsuario() {
  const [rol, setRol] =
    useState<RolUsuario | null>(
      null
    );

  const [cargandoRol, setCargandoRol] =
    useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarRol() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        if (activo) {
          setRol(null);
          setCargandoRol(false);
        }

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("perfiles_usuario")
          .select(`
            rol,
            activo
          `)
          .eq(
            "usuario_id",
            user.id
          )
          .single();

      if (
        error ||
        !data ||
        !data.activo
      ) {
        if (activo) {
          setRol(null);
          setCargandoRol(false);
        }

        return;
      }

      if (activo) {
        setRol(
          data.rol as RolUsuario
        );

        setCargandoRol(false);
      }
    }

    cargarRol();

    return () => {
      activo = false;
    };
  }, []);

  return {
    rol,
    cargandoRol,
  };
}