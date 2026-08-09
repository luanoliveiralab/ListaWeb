"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
  titulo: string;
  subtitulo: string;
  nome: string;
}

export default function AppLayout({
  children,
  titulo,
  subtitulo,
  nome,
}: AppLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-content">
        <Header
          titulo={titulo}
          subtitulo={subtitulo}
          nome={nome}
        />

        <main key={pathname} className="app-main page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
