"use client";
import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { authService } from "@/services/auth.service";

function FormularioRedefinicao() {
  const token = useSearchParams().get("token") ?? ""; const [senha, setSenha] = useState(""); const [confirmacao, setConfirmacao] = useState(""); const [mensagem, setMensagem] = useState(""); const [erro, setErro] = useState(""); const [loading, setLoading] = useState(false);
  async function salvar(event: FormEvent) { event.preventDefault(); setErro(""); if (senha !== confirmacao) return setErro("As senhas não coincidem."); if (senha.length < 10) return setErro("A senha deve ter pelo menos 10 caracteres."); setLoading(true); try { const resposta = await authService.redefinirSenha(token, senha); setMensagem(resposta.mensagem); } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível redefinir a senha."); } finally { setLoading(false); } }
  return <section className="surface w-full max-w-md p-6 shadow-xl sm:p-8"><h1 className="text-2xl font-semibold">Criar nova senha</h1><p className="mt-2 text-sm text-muted-foreground">Use ao menos 10 caracteres e evite senhas de outros serviços.</p>{mensagem ? <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{mensagem}<Link href="/" className="mt-3 block font-semibold underline">Entrar no ListaWeb</Link></div> : <form onSubmit={salvar} className="mt-6 space-y-4"><div className="field-group"><label className="field-label" htmlFor="senha">Nova senha</label><input id="senha" type="password" minLength={10} maxLength={128} className="control" value={senha} onChange={(e) => setSenha(e.target.value)} required /></div><div className="field-group"><label className="field-label" htmlFor="confirmacao">Confirmar senha</label><input id="confirmacao" type="password" minLength={10} maxLength={128} className="control" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} required /></div>{erro && <p className="text-sm text-destructive">{erro}</p>}<button className="button-primary h-11 w-full" disabled={loading || !token}>{loading ? "Salvando..." : "Redefinir senha"}</button></form>}</section>;
}
export default function RedefinirSenhaPage() { return <main className="auth-page"><div className="absolute right-6 top-6"><ThemeToggle /></div><Suspense fallback={<div className="page-loader-indicator" />}><FormularioRedefinicao /></Suspense></main>; }
