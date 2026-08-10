"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleAlert, MailCheck } from "lucide-react";

import ThemeToggle from "@/components/layout/ThemeToggle";
import { authService } from "@/services/auth.service";

function ConfirmacaoEmail() {
  const token = useSearchParams().get("token") ?? "";
  const iniciou = useRef(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;

    if (!token) {
      Promise.resolve().then(() => setErro("Link de confirmação inválido."));
      return;
    }

    authService.verificarEmail(token)
      .then((resposta) => setMensagem(resposta.mensagem))
      .catch((error) => setErro(error instanceof Error ? error.message : "Não foi possível confirmar o e-mail."));
  }, [token]);

  const carregando = !mensagem && !erro;

  return (
    <section className="surface w-full max-w-md p-6 text-center shadow-xl sm:p-8">
      {carregando ? (
        <><div className="page-loader-indicator mx-auto" /><h1 className="mt-5 text-2xl font-semibold">Confirmando seu e-mail...</h1></>
      ) : mensagem ? (
        <><MailCheck className="mx-auto text-emerald-600" size={42} /><h1 className="mt-4 text-2xl font-semibold">E-mail confirmado!</h1><p className="mt-2 text-sm text-muted-foreground">Sua conta está ativa e pronta para usar.</p><Link href="/" className="button-primary mt-6 w-full">Entrar no ListaWeb</Link></>
      ) : (
        <><CircleAlert className="mx-auto text-destructive" size={42} /><h1 className="mt-4 text-2xl font-semibold">Não foi possível confirmar</h1><p className="mt-2 text-sm text-muted-foreground">{erro}</p><Link href="/cadastro" className="button-secondary mt-6 w-full">Voltar ao cadastro</Link></>
      )}
    </section>
  );
}

export default function VerificarEmailPage() {
  return (
    <main className="auth-page">
      <div className="absolute right-6 top-6"><ThemeToggle /></div>
      <Suspense fallback={<div className="page-loader-indicator" />}><ConfirmacaoEmail /></Suspense>
    </main>
  );
}
