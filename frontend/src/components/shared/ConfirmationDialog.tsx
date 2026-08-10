"use client";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  aberto: boolean;
  titulo: string;
  descricao: React.ReactNode;
  confirmar: string;
  processando?: boolean;
  textoProcessando?: string;
  onConfirmar: () => void | Promise<void>;
  onAlterar: (aberto: boolean) => void;
}

export default function ConfirmationDialog({ aberto, titulo, descricao, confirmar, processando = false, textoProcessando = "Processando...", onConfirmar, onAlterar }: Props) {
  return <AlertDialog open={aberto} onOpenChange={(novoEstado) => { if (!processando) onAlterar(novoEstado); }}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{titulo}</AlertDialogTitle><AlertDialogDescription>{descricao}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
        <AlertDialogAction disabled={processando} onClick={(event) => { event.preventDefault(); onConfirmar(); }}>{processando ? textoProcessando : confirmar}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
