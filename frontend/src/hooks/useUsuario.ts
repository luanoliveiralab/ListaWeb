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

    const usuarioSalvo = localStorage.getItem("usuario");
    if (usuarioSalvo) {
      try {
        const usuarioEmCache = JSON.parse(usuarioSalvo);
        queueMicrotask(() => {
          if (ativo) setUsuario(usuarioEmCache);
        });
      } catch {
        localStorage.removeItem("usuario");
      }
    }

    const ultimaValidacao = Number(sessionStorage.getItem("usuarioValidadoEm"));
    if (usuarioSalvo && Date.now() - ultimaValidacao < 60_000) {
      return () => { ativo = false; };
    }

    authService.me()
      .then((usuarioAtual: Usuario) => {
        if (!ativo) return;
        localStorage.setItem("usuario", JSON.stringify(usuarioAtual));
        sessionStorage.setItem("usuarioValidadoEm", String(Date.now()));
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
