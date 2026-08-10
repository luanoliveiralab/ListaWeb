import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/providers/ThemeProvider";

import { PeriodProvider } from "@/context/PeriodContext";

import { ToastProvider } from "@/providers/ToastProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ScrollRevealProvider } from "@/providers/ScrollRevealProvider";

export const metadata: Metadata = {
  title: "ListaWeb",
  description: "Sistema de Lista de Compras",
  icons: {
    icon: [
      { url: "/favicon-light.ico", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.ico", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <PeriodProvider>
                <ScrollRevealProvider />
                {children}
              </PeriodProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
