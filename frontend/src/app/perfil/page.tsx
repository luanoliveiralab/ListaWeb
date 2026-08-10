"use client";
import AppLayout from "@/components/layout/AppLayout";
import PasswordForm from "@/components/profile/PasswordForm";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileForm from "@/components/profile/ProfileForm";
import { useUsuario } from "@/hooks/useUsuario";
import { useState } from "react";
import { usuarioService } from "@/services/usuario.service";
import { useToast } from "@/providers/ToastProvider";
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
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmarEmail, setConfirmarEmail] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function atualizarPerfil() {
    if (!usuario) return;

    const novoNome = nome.trim() || usuario.nome;
    const novoEmail = email.trim() || usuario.email;

    setSalvando(true);
    try {
      const usuarioAtualizado = await usuarioService.atualizar(
        usuario.id,
        {
          nome: novoNome,
          email: novoEmail,
        }
      );

      setUsuario(usuarioAtualizado);
      setNome("");
      setEmail("");
      setConfirmarEmail(false);

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
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando}
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
