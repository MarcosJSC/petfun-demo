import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/Sidebar";

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
    <html lang="es" suppressHydrationWarning>
      <body>
        <div className="app-container">
          <Sidebar />

          <main className="app-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}