"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import NotificationCenter from "./NotificationCenter";
import { limparSessaoLocal } from "@/lib/userSession";
import { useQueryClient } from "@tanstack/react-query";

interface HeaderProps {
  titulo: string;
  subtitulo: string;
  nome: string;
}

export default function Header({
  titulo,
  subtitulo,
  nome,
}: HeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function sair() {
    try {
      await authService.logout();
    } catch {
      // A limpeza local ainda encerra a interface se a API estiver indisponível.
    }
    limparSessaoLocal();
    queryClient.clear();
    router.replace("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6 md:left-72 lg:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
          {titulo}
        </h1>

        <p className="hidden truncate text-sm text-muted-foreground sm:block">
          {subtitulo}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <NotificationCenter />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">
            {nome}
          </p>

          <p className="text-xs text-muted-foreground">
            Usuário conectado
          </p>
        </div>

        <button
          onClick={sair}
          className="button-secondary"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </header>
  );
}
