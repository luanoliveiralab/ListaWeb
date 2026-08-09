"use client";
import AppLayout from "@/components/layout/AppLayout";
import PasswordForm from "@/components/profile/PasswordForm";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileForm from "@/components/profile/ProfileForm";
import { useUsuario } from "@/hooks/useUsuario";
import { useState } from "react";
import { usuarioService } from "@/services/usuario.service";
import { useToast } from "@/providers/ToastProvider";


export default function PerfilPage() {
  const { usuario, setUsuario } = useUsuario();
  const { mostrarAviso } = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  async function salvarPerfil() {
    if (!usuario) return;

    if (!nome && !email) {
      mostrarAviso("Insira um novo nome ou e-mail.", "erro");
      return;
    }

    const novoNome = nome || usuario.nome;
    const novoEmail = email || usuario.email;

    try {
      const usuarioAtualizado = await usuarioService.atualizar(
        usuario.id,
        {
          nome: novoNome,
          email: novoEmail,
        }
      );

      setUsuario(usuarioAtualizado);

      mostrarAviso("Perfil atualizado com sucesso!", "sucesso");
    } catch {
      mostrarAviso("Erro ao atualizar perfil.", "erro");
    }
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
    </AppLayout>
  );
}
