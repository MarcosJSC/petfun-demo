import type { Metadata } from "next";
import "./globals.css";

import AppShell from "@/components/AppShell";

import {
  SucursalProvider,
} from "@/contexts/SucursalContext";

export const metadata: Metadata = {
  title: "PetFunCR",
  description: "Sistema de gestión PetFunCR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
    >
      <body>
        <SucursalProvider>
          <AppShell>
            {children}
          </AppShell>
        </SucursalProvider>
      </body>
    </html>
  );
}