"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { usuarioService } from "@/services/usuario.service";
import { useToast } from "@/providers/ToastProvider";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function PasswordForm() {
  const { mostrarAviso } = useToast();
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  async function alterarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      mostrarAviso("Preencha todos os campos.", "erro");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      mostrarAviso("As senhas não coincidem.", "erro");
      return;
    }

    if (novaSenha.length < 10 || novaSenha.length > 128) {
      mostrarAviso("A nova senha deve ter entre 10 e 128 caracteres.", "erro");
      return;
    }

    try {
      await usuarioService.alterarSenha(senhaAtual, novaSenha);

      mostrarAviso("Senha alterada com sucesso!");
      await authService.logout();
      localStorage.removeItem("usuario");
      sessionStorage.removeItem("csrfToken");
      router.replace("/");
    } catch (err) {
      const mensagem =
        err instanceof Error
          ? err.message
          : "Erro ao alterar senha.";

      mostrarAviso(mensagem, "erro");
    }
  }

  return (
    <Card className="lg:col-span-3">
      <CardContent className="p-8">
        <p className="text-sm font-medium text-primary">Segurança</p>
        <h2 className="mb-2 mt-1 text-2xl font-semibold tracking-tight">
          Alterar Senha
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">Use uma senha diferente das utilizadas em outros serviços.</p>

        <div className="space-y-6">
          <div>
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <Input
              id="senhaAtual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Inserir"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="novaSenha">Nova senha</Label>
            <Input
              id="novaSenha"
              type="password"
              minLength={10}
              maxLength={128}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Inserir"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="confirmarSenha">
              Confirmar nova senha
            </Label>
            <Input
              id="confirmarSenha"
              type="password"
              minLength={10}
              maxLength={128}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Inserir"
              className="mt-2"
            />
          </div>

          <Button onClick={alterarSenha} className="w-full sm:w-auto">
            Alterar Senha
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
