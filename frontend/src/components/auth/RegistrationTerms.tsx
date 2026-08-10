"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}

export const TERMS_VERSION = "2026-08-10";

export default function RegistrationTerms({ accepted, onAcceptedChange }: Props) {
  const [open, setOpen] = useState(false);
  const [readToEnd, setReadToEnd] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const element = contentRef.current;
      if (element && element.scrollHeight <= element.clientHeight + 4) setReadToEnd(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  function checkReading() {
    const element = contentRef.current;
    if (!element) return;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 12) setReadToEnd(true);
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-muted/35 p-4">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${accepted ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`} aria-hidden="true">
            {accepted && <Check size={14} />}
          </span>
          <div className="text-sm leading-6">
            <p className="text-foreground">{accepted ? "Termos lidos e aceitos." : "Leia e aceite os termos para criar sua conta."}</p>
            <button type="button" onClick={() => { setReadToEnd(false); setOpen(true); }} className="font-medium text-primary underline-offset-4 hover:underline">
              {accepted ? "Ler novamente" : "Ler Termos de Uso e Privacidade"}
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <AlertDialogHeader className="items-start border-b border-border p-5 text-left sm:p-6">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText size={20} /></span><div><AlertDialogTitle className="text-lg">Termos de Uso e Privacidade</AlertDialogTitle><AlertDialogDescription>Versão {TERMS_VERSION}</AlertDialogDescription></div></div>
          </AlertDialogHeader>
          <div ref={contentRef} data-testid="registration-terms-content" onScroll={checkReading} className="max-h-[55vh] space-y-5 overflow-y-auto p-5 text-sm leading-6 text-muted-foreground sm:p-6" tabIndex={0}>
            <section><h3 className="font-semibold text-foreground">1. Sobre o ListaWeb</h3><p>O ListaWeb é uma ferramenta gratuita de organização de compras, finanças e planejamento pessoal. Ele não é uma instituição financeira, não movimenta dinheiro e não oferece aconselhamento financeiro profissional.</p></section>
            <section><h3 className="font-semibold text-foreground">2. Uso responsável</h3><p>Você é responsável pela veracidade dos dados inseridos, pela segurança da sua senha e pelas decisões tomadas com base nas informações do aplicativo. Não utilize o serviço para atividades ilegais ou para prejudicar outras pessoas.</p></section>
            <section><h3 className="font-semibold text-foreground">3. Dados e privacidade</h3><p>O aplicativo armazena os dados necessários para autenticar sua conta e entregar suas funcionalidades, como perfil, listas, movimentações, cartões, categorias, metas e preferências. Senhas são protegidas por hash e os registros são separados por usuário.</p></section>
            <section><h3 className="font-semibold text-foreground">4. Serviços externos</h3><p>Hospedagem, banco de dados e envio de e-mails podem depender de fornecedores externos. O serviço pode sofrer indisponibilidades, alterações ou interrupções decorrentes desses fornecedores ou de manutenção.</p></section>
            <section><h3 className="font-semibold text-foreground">5. Controle da conta</h3><p>Você pode corrigir informações pessoais e excluir sua conta nas configurações do perfil. A exclusão remove os dados associados conforme o fluxo informado no aplicativo, ressalvadas obrigações legais aplicáveis.</p></section>
            <section><h3 className="font-semibold text-foreground">6. Aceite</h3><p>Ao aceitar, você confirma que leu e concorda com estes termos. Se não concordar, escolha “Não aceito”; nenhum pedido de criação de conta será enviado.</p></section>
            {!readToEnd && <p className="sticky bottom-0 rounded-xl bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary">Role até o fim para liberar o aceite.</p>}
          </div>
          <AlertDialogFooter className="m-0 rounded-none px-5 py-4 sm:px-6">
            <button type="button" className="button-secondary" onClick={() => { onAcceptedChange(false); setOpen(false); }}>Não aceito</button>
            <button type="button" className="button-primary" disabled={!readToEnd} onClick={() => { onAcceptedChange(true); setOpen(false); }}>Li e aceito</button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
