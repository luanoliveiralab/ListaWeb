"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Usuario } from "@/types/Usuario";
import { authService } from "@/services/auth.service";

export function useUsuario() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    let ativo = true;
    authService.me()
      .then((usuarioAtual: Usuario) => {
        if (!ativo) return;
        localStorage.setItem("usuario", JSON.stringify(usuarioAtual));
        setUsuario(usuarioAtual);
      })
      .catch(() => {
        if (ativo) router.replace("/");
      });
    return () => { ativo = false; };
  }, [router]);

  function atualizarUsuario(novoUsuario: Usuario) {
    localStorage.setItem("usuario", JSON.stringify(novoUsuario));
    setUsuario(novoUsuario);
  }

  return {
    usuario,
    setUsuario: atualizarUsuario,
  };
}
