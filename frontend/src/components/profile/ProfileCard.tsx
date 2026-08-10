"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/services/api";
import { useToast } from "@/providers/ToastProvider";
import type { Usuario } from "@/types/Usuario";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

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

interface ProfileCardProps {
    id: number;
    nome: string;
    email: string;
    foto?: string | null;
    setUsuario: (usuario: Usuario) => void;
}

export default function ProfileCard({
    id,
    nome,
    email,
    foto,
    setUsuario,
}: ProfileCardProps) {
    const inputFotoRef = useRef<HTMLInputElement | null>(null);

    const { mostrarAviso } = useToast();
    const router = useRouter();

    const [mostrarConfirmacao, setMostrarConfirmacao] =
        useState(false);

    const [excluindoConta, setExcluindoConta] =
        useState(false);
    const [confirmarRemocaoFoto, setConfirmarRemocaoFoto] = useState(false);
    const [removendoFoto, setRemovendoFoto] = useState(false);

    async function selecionarFoto(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const arquivo = e.target.files?.[0];

        if (!arquivo) return;

        if (arquivo.size > 2 * 1024 * 1024) {
            mostrarAviso(
                "A foto deve ter no máximo 2 MB.",
                "erro"
            );
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            mostrarAviso(
                "Selecione apenas arquivos de imagem.",
                "erro"
            );
            return;
        }

        try {
            const reader = new FileReader();

            reader.onloadend = async () => {
                const foto = reader.result;

                if (typeof foto !== "string") return;

                const usuarioAtualizado = await api.put(
                    `/usuarios/${id}/foto`,
                    { foto }
                );

                setUsuario(usuarioAtualizado);

                mostrarAviso(
                    "Foto atualizada com sucesso!"
                );
            };

            reader.readAsDataURL(arquivo);
        } catch (err) {
            console.error(
                "Erro ao atualizar foto:",
                err
            );

            mostrarAviso(
                "Erro ao atualizar foto.",
                "erro"
            );
        }
    }

    async function removerFoto() {
        setRemovendoFoto(true);
        try {
            const usuarioAtualizado = await api.delete(
                `/usuarios/${id}/foto`
            );

            setUsuario(usuarioAtualizado);
            setConfirmarRemocaoFoto(false);

            mostrarAviso(
                "Foto removida com sucesso!"
            );
        } catch (err) {
            console.error(
                "Erro ao remover foto:",
                err
            );

            mostrarAviso(
                "Erro ao remover foto.",
                "erro"
            );
        } finally { setRemovendoFoto(false); }
    }

    async function excluirConta() {
        setExcluindoConta(true);

        try {
            await api.delete(`/usuarios/${id}`);

            localStorage.removeItem("usuario");

            setMostrarConfirmacao(false);

            mostrarAviso(
                "Conta excluída com sucesso!",
                "sucesso"
            );

            router.replace("/");
        } catch (err) {
            console.error(
                "Erro ao excluir conta:",
                err
            );

            mostrarAviso(
                "Erro ao excluir conta.",
                "erro"
            );
        } finally {
            setExcluindoConta(false);
        }
    }

    return (
        <Card className="relative overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="relative -mt-12 flex flex-col items-center p-8 pt-0">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                    {foto ? (
                        <Image
                            src={foto}
                            alt={`Foto de ${nome}`}
                            width={96}
                            height={96}
                            unoptimized
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <AvatarFallback>
                            {nome
                                .charAt(0)
                                .toUpperCase()}
                        </AvatarFallback>
                    )}
                </Avatar>

                <h2 className="mt-5 text-xl font-semibold">
                    {nome}
                </h2>

                <p className="text-sm text-muted-foreground">
                    {email}
                </p>

                <Button
                    className="mt-6 w-full"
                    onClick={() =>
                        inputFotoRef.current?.click()
                    }
                >
                    {foto
                        ? "Alterar foto"
                        : "Adicionar foto"}
                </Button>

                {foto && (
                    <Button
                        variant="destructive"
                        className="mt-2 w-full"
                        onClick={() => setConfirmarRemocaoFoto(true)}
                    >
                        Remover foto
                    </Button>
                )}

                <ConfirmationDialog
                    aberto={confirmarRemocaoFoto}
                    titulo="Remover sua foto?"
                    descricao="A foto atual será removida do seu perfil. Você poderá adicionar outra imagem quando quiser."
                    confirmar="Sim, remover foto"
                    processando={removendoFoto}
                    textoProcessando="Removendo..."
                    onConfirmar={removerFoto}
                    onAlterar={setConfirmarRemocaoFoto}
                />

                <input
                    ref={inputFotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={selecionarFoto}
                />

                <Button
                    variant="destructive"
                    className="mt-2 w-full"
                    onClick={() =>
                        setMostrarConfirmacao(true)
                    }
                >
                    Excluir minha conta
                </Button>

                <AlertDialog
                    open={mostrarConfirmacao}
                    onOpenChange={(aberto: boolean) => {
                        if (!excluindoConta) {
                            setMostrarConfirmacao(aberto);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Excluir sua conta?
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                                Essa ação é permanente. Sua
                                conta, lista de compras e
                                movimentações serão excluídas
                                e não poderão ser recuperadas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={excluindoConta}
                            >
                                Cancelar
                            </AlertDialogCancel>

                            <AlertDialogAction
                                disabled={excluindoConta}
                                onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>
                                ) => {
                                    e.preventDefault();
                                    excluirConta();
                                }}
                            >
                                {excluindoConta
                                    ? "Excluindo..."
                                    : "Sim, excluir conta"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
