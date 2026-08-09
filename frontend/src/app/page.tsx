"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

import { authService } from "@/services/auth.service";

import ThemeToggle from "@/components/layout/ThemeToggle";

import { useToast } from "@/providers/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { mostrarAviso } = useToast();

  useEffect(() => {
    authService.aquecerApi().catch(() => undefined);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);

    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;

    const senha = (
      e.currentTarget.elements.namedItem("senha") as HTMLInputElement
    ).value;

    try {
      const data = await authService.login({
        email,
        senha,
      });

      localStorage.setItem(
        "usuario",
        JSON.stringify(data.usuario)
      );

      router.replace("/dashboard");
    } catch (err: unknown) {

      const mensagem =
        err instanceof Error
          ? err.message
          : "Erro ao conectar com o servidor.";

      if (mensagem === "Usuário não encontrado.") {
        mostrarAviso(
          "Usuário não encontrado. Vamos criar sua conta?",
          "erro"
        );

        router.push("/cadastro");
        return;
      }

      mostrarAviso(
        mensagem,
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
            ListaWeb
          </h1>

          <p className="mt-2 text-muted-foreground">
            Controle suas compras e finanças em um só lugar.
          </p>
        </div>

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
          placeholder="Senha"
          required
          className="control mb-3"
        />

        <div className="mb-5 text-right">
          <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button-primary h-11 w-full"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Não tem uma conta?
          </p>

          <Link
            href="/cadastro"
            className="mt-2 inline-block font-medium text-primary hover:underline"
          >
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  );
}
