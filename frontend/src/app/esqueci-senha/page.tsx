"use client";
import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { authService } from "@/services/auth.service";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState(""); const [enviado, setEnviado] = useState(false); const [loading, setLoading] = useState(false);
  async function enviar(event: FormEvent) { event.preventDefault(); setLoading(true); try { await authService.solicitarRecuperacao(email); setEnviado(true); } finally { setLoading(false); } }
  return <main className="auth-page"><div className="absolute right-6 top-6"><ThemeToggle /></div><section className="surface relative w-full max-w-md p-6 shadow-xl sm:p-8"><div className="mb-7 text-center"><span className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-muted/60 p-2 ring-1 ring-border"><Image src="/listaweb-logo.png" alt="Logo ListaWeb" width={52} height={52} className="size-13 object-contain dark:hidden" /><Image src="/listaweb-logo-dark.png" alt="" width={52} height={52} className="hidden size-13 object-contain dark:block" /></span><h1 className="text-2xl font-semibold">Recuperar senha</h1><p className="mt-2 text-sm text-muted-foreground">Enviaremos um link seguro, válido por 30 minutos.</p></div>{enviado ? <div className="rounded-2xl bg-emerald-500/10 p-5 text-center"><MailCheck className="mx-auto text-emerald-600" /><p className="mt-3 font-medium">Confira sua caixa de entrada</p><p className="mt-1 text-sm text-muted-foreground">Se o e-mail estiver cadastrado, as instruções chegarão em breve.</p></div> : <form onSubmit={enviar} className="space-y-4"><div className="field-group"><label htmlFor="email" className="field-label">E-mail da conta</label><input id="email" type="email" className="control" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div><button className="button-primary h-11 w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar instruções"}</button></form>}<Link href="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">Voltar para o login</Link></section></main>;
}
