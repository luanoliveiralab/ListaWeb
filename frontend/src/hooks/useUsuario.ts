"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Usuario } from "@/types/Usuario";
import { authService } from "@/services/auth.service";
import { carregarUsuarioLocal, obterUsuarioEmMemoria, salvarUsuarioLocal } from "@/lib/userSession";

export function useUsuario() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(obterUsuarioEmMemoria());

  useEffect(() => {
    let ativo = true;

    const usuarioEmCache = carregarUsuarioLocal();
    const usuarioSalvo = Boolean(usuarioEmCache);
    if (usuarioEmCache) queueMicrotask(() => { if (ativo) setUsuario(usuarioEmCache); });

    const ultimaValidacao = Number(sessionStorage.getItem("usuarioValidadoEm"));
    if (usuarioSalvo && Date.now() - ultimaValidacao < 60_000) {
      return () => { ativo = false; };
    }

    authService.me()
      .then((usuarioAtual: Usuario) => {
        if (!ativo) return;
        salvarUsuarioLocal(usuarioAtual);
        sessionStorage.setItem("usuarioValidadoEm", String(Date.now()));
        setUsuario(usuarioAtual);
      })
      .catch(() => {
        if (ativo) router.replace("/");
      });
    return () => { ativo = false; };
  }, [router]);

  function atualizarUsuario(novoUsuario: Usuario) {
    salvarUsuarioLocal(novoUsuario);
    setUsuario(novoUsuario);
  }

  return {
    usuario,
    setUsuario: atualizarUsuario,
  };
}
