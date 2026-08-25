import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

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
  <AppShell>
    {children}
  </AppShell>
</body>
    </html>
  );
}