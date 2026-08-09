"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import { authService } from "@/services/auth.service";

import ThemeToggle from "@/components/layout/ThemeToggle";

import { useToast } from "@/providers/ToastProvider";

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { mostrarAviso } = useToast();

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

    try {
      const data = await authService.cadastro({
        nome,
        email,
        senha,
      });

      localStorage.setItem(
        "usuario",
        JSON.stringify(data.usuario)
      );

      router.replace("/dashboard");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">

      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="absolute top-6 right-6">
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

        <input
          type="text"
          name="nome"
          placeholder="Nome"
          required
          className="control mb-4"
        />

        <input
          type="email"
          name="email"
          placeholder="E-mail"
          required
          className="control mb-4"
        />

        <input
          type="password"
          name="senha"
          minLength={10}
          maxLength={128}
          placeholder="Senha"
          required
          className="control mb-4"
        />

        <input
          type="password"
          name="confirmarSenha"
          minLength={10}
          maxLength={128}
          placeholder="Confirmar senha"
          required
          className="control mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="button-primary h-11 w-full"
        >
          {loading ? "Criando..." : "Criar Conta"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Já tem conta?
          </p>

          <Link
            href="/"
            className="mt-2 inline-block font-medium text-primary hover:underline"
          >
            Entrar
          </Link>
        </div>
      </form>
    </div>
  );
}
