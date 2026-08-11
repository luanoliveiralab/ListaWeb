"use client";
import AppLayout from "@/components/layout/AppLayout";
import PasswordForm from "@/components/profile/PasswordForm";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileForm from "@/components/profile/ProfileForm";
import { useUsuario } from "@/hooks/useUsuario";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usuarioService } from "@/services/usuario.service";
import { useToast } from "@/providers/ToastProvider";
import PasswordInput from "@/components/auth/PasswordInput";
import { limparSessaoLocal } from "@/lib/userSession";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function PerfilPage() {
  const { usuario, setUsuario } = useUsuario();
  const { mostrarAviso } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmarEmail, setConfirmarEmail] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");

  async function atualizarPerfil() {
    if (!usuario) return;

    const novoNome = nome.trim() || usuario.nome;
    const novoEmail = email.trim() || usuario.email;

    setSalvando(true);
    try {
      const resposta = await usuarioService.atualizar(
        usuario.id,
        {
          nome: novoNome,
          email: novoEmail,
          ...(email.trim() ? { senhaAtual } : {}),
        }
      );

      if (resposta.email_verification_required) {
        limparSessaoLocal();
        queryClient.clear();
        setConfirmarEmail(false);
        setSenhaAtual("");
        mostrarAviso(resposta.mensagem || "Confirme o novo e-mail para entrar novamente.");
        router.replace("/");
        return;
      }

      setUsuario(resposta);
      setNome("");
      setEmail("");
      setConfirmarEmail(false);
      setSenhaAtual("");

      mostrarAviso("Perfil atualizado com sucesso!", "sucesso");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Erro ao atualizar perfil.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  function salvarPerfil() {
    if (!usuario) return;

    if (!nome.trim() && !email.trim()) {
      mostrarAviso("Insira um novo nome ou e-mail.", "erro");
      return;
    }

    if (nome.trim() && nome.trim().toLocaleLowerCase("pt-BR") === usuario.nome.trim().toLocaleLowerCase("pt-BR")) {
      mostrarAviso("Este nome já existe no seu perfil.", "erro");
      return;
    }

    if (email.trim() && email.trim().toLowerCase() === usuario.email.trim().toLowerCase()) {
      mostrarAviso("Este e-mail já existe no seu perfil.", "erro");
      return;
    }

    const emailMudou = Boolean(email.trim());
    if (emailMudou) {
      setConfirmarEmail(true);
      return;
    }

    atualizarPerfil();
  }


  return (
    <AppLayout
      titulo="Meu Perfil"
      subtitulo="Gerencie suas informações pessoais."
      nome={usuario?.nome ?? "Usuário"}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <ProfileCard
          id={usuario?.id ?? 0}
          nome={usuario?.nome || "Usuário"}
          email={usuario?.email || "usuario@email.com"}
          foto={usuario?.foto}
          setUsuario={setUsuario}
        />

        <ProfileForm
          nome={nome}
          email={email}
          setNome={setNome}
          setEmail={setEmail}
          onSave={salvarPerfil}
        />

        <PasswordForm />
      </div>

      <AlertDialog open={confirmarEmail} onOpenChange={(aberto) => { if (!salvando) setConfirmarEmail(aberto); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar seu e-mail?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu e-mail de acesso será alterado de <strong>{usuario?.email}</strong> para <strong>{email.trim()}</strong>. Use o novo endereço no próximo login.
            </AlertDialogDescription>
            <div className="mt-3 w-full text-left">
              <label htmlFor="senha-confirmar-email" className="field-label">Confirme sua senha atual</label>
              <PasswordInput
                id="senha-confirmar-email"
                name="senhaAtual"
                value={senhaAtual}
                onChange={(event) => setSenhaAtual(event.target.value)}
                autoComplete="current-password"
                className="mt-2"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando} onClick={() => setSenhaAtual("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando || !senhaAtual}
              onClick={(event) => {
                event.preventDefault();
                atualizarPerfil();
              }}
            >
              {salvando ? "Alterando..." : "Sim, alterar e-mail"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
