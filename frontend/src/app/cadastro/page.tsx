"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { MailCheck } from "lucide-react";

import { authService } from "@/services/auth.service";

import ThemeToggle from "@/components/layout/ThemeToggle";
import PasswordInput from "@/components/auth/PasswordInput";
import RegistrationTerms, { TERMS_VERSION } from "@/components/auth/RegistrationTerms";

import { useToast } from "@/providers/ToastProvider";

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState("");
  const [termosAceitos, setTermosAceitos] = useState(false);

  const { mostrarAviso } = useToast();

  useEffect(() => {
    authService.aquecerApi().catch(() => undefined);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);

    const nome = (
      e.currentTarget.elements.namedItem("nome") as HTMLInputElement
    ).value;

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;

    const senha = (
      e.currentTarget.elements.namedItem("senha") as HTMLInputElement
    ).value;

    const confirmarSenha = (
      e.currentTarget.elements.namedItem(
        "confirmarSenha"
      ) as HTMLInputElement
    ).value;

    if (senha !== confirmarSenha) {
      mostrarAviso("As senhas não conferem!", "erro");
      setLoading(false);
      return;
    }

    if (!termosAceitos) {
      mostrarAviso("Leia e aceite os Termos de Uso e Privacidade.", "erro");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.cadastro({
        nome,
        email,
        senha,
        aceitouTermos: true,
        versaoTermos: TERMS_VERSION,
      });

      setEmailEnviado(data.email || email);
    } catch (err: unknown) {
      mostrarAviso(
        err instanceof Error
          ? err.message
          : "Erro ao conectar com o servidor.",
        "erro"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 pb-10 pt-24 sm:py-10">

      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="absolute right-4 top-4 z-40 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="surface relative w-full max-w-md p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-muted/60 p-2 shadow-lg ring-1 ring-border">
            <Image src="/listaweb-logo.png" alt="Logo ListaWeb" width={52} height={52} priority className="size-13 object-contain dark:hidden" />
            <Image src="/listaweb-logo-dark.png" alt="" aria-hidden="true" width={52} height={52} priority className="hidden size-13 object-contain dark:block" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Criar Conta
          </h1>

          <p className="mt-2 text-muted-foreground">
            Comece a organizar suas compras e finanças.
          </p>
        </div>

        {emailEnviado ? (
          <div className="rounded-2xl bg-emerald-500/10 p-5 text-center">
            <MailCheck className="mx-auto text-emerald-600" size={30} />
            <p className="mt-3 font-medium">Conta criada com sucesso</p>
            <p className="mt-1 text-sm text-muted-foreground">Seu cadastro está pronto. Você já pode entrar e começar a se organizar.</p>
            <Link href="/" className="button-primary mt-5 w-full">Ir para login</Link>
          </div>
        ) : <>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          autoComplete="name"
          required
          className="control mb-4"
        />

        <input
          type="email"
          name="email"
          placeholder="E-mail"
          autoComplete="email"
          required
          className="control mb-4"
        />

        <PasswordInput
          name="senha"
          minLength={10}
          maxLength={128}
          placeholder="Senha"
          autoComplete="new-password"
          required
          className="mb-4"
        />

        <PasswordInput
          name="confirmarSenha"
          minLength={10}
          maxLength={128}
          placeholder="Confirmar senha"
          autoComplete="new-password"
          required
          className="mb-6"
        />

        <RegistrationTerms accepted={termosAceitos} onAcceptedChange={setTermosAceitos} />

        <button
          type="submit"
          disabled={loading || !termosAceitos}
          className="button-primary h-11 w-full"
        >
          {loading ? "Criando..." : "Criar Conta"}
        </button>
        </>}

        {!emailEnviado && <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Já tem conta?
          </p>

          <Link
            href="/"
            className="mt-2 inline-block font-medium text-primary hover:underline"
          >
            Entrar
          </Link>
        </div>}
      </form>
    </div>
  );
}
