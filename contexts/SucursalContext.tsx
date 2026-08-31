"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type SucursalContextType = {
  sucursalActivaId: number | null;

  setSucursalActivaId: (
    id: number | null
  ) => void;

  modoGlobal: boolean;
};

const SucursalContext =
  createContext<
    SucursalContextType | undefined
  >(undefined);

export function SucursalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    sucursalActivaId,
    setSucursalActivaIdState,
  ] = useState<number | null>(null);

  useEffect(() => {
    const guardada =
      localStorage.getItem(
        "petfun_sucursal_activa"
      );

    if (!guardada) {
      return;
    }

    if (guardada === "global") {
      setSucursalActivaIdState(null);
      return;
    }

    const id = Number(guardada);

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      setSucursalActivaIdState(id);
    }
  }, []);

  function setSucursalActivaId(
    id: number | null
  ) {
    setSucursalActivaIdState(id);

    if (id === null) {
      localStorage.setItem(
        "petfun_sucursal_activa",
        "global"
      );

      return;
    }

    localStorage.setItem(
      "petfun_sucursal_activa",
      String(id)
    );
  }

  return (
    <SucursalContext.Provider
      value={{
        sucursalActivaId,
        setSucursalActivaId,
        modoGlobal:
          sucursalActivaId === null,
      }}
    >
      {children}
    </SucursalContext.Provider>
  );
}

export function useSucursalActiva() {
  const contexto =
    useContext(SucursalContext);

  if (!contexto) {
    throw new Error(
      "useSucursalActiva debe usarse dentro de SucursalProvider."
    );
  }

  return contexto;
}