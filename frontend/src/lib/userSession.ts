import type { Usuario } from "@/types/Usuario";

let usuarioEmMemoria: Usuario | null = null;

export function obterUsuarioEmMemoria() {
  return usuarioEmMemoria;
}

export function carregarUsuarioLocal(): Usuario | null {
  if (typeof window === "undefined") return usuarioEmMemoria;
  try {
    const salvo = localStorage.getItem("usuario");
    if (!salvo) return null;
    const usuario = JSON.parse(salvo) as Usuario;
    if (!Number.isInteger(Number(usuario.id)) || typeof usuario.nome !== "string" || typeof usuario.email !== "string") {
      throw new Error("Cache de usuário inválido.");
    }
    usuarioEmMemoria = usuario;
    return usuario;
  } catch {
    try { localStorage.removeItem("usuario"); } catch { /* Armazenamento indisponível. */ }
    usuarioEmMemoria = null;
    return null;
  }
}

export function salvarUsuarioLocal(usuario: Usuario) {
  usuarioEmMemoria = usuario;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("usuario", JSON.stringify(usuario));
  } catch {
    // Fotos em base64 podem ultrapassar a cota do navegador; os dados essenciais continuam em cache.
    try { localStorage.setItem("usuario", JSON.stringify({ ...usuario, foto: null })); } catch { /* Cache em memória é suficiente. */ }
  }
}

export function limparSessaoLocal() {
  usuarioEmMemoria = null;
  if (typeof window === "undefined") return;
  try { localStorage.removeItem("usuario"); } catch { /* Armazenamento indisponível. */ }
  try {
    sessionStorage.removeItem("csrfToken");
    sessionStorage.removeItem("usuarioValidadoEm");
  } catch { /* Armazenamento indisponível. */ }
}
