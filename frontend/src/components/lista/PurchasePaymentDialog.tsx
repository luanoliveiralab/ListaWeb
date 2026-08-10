"use client";

import { useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import type { ItemLista } from "@/types/ItemLista";
import type { Cartao } from "@/types/Cartao";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AppSelect from "@/components/shared/AppSelect";

interface Props { item: ItemLista | null; cartoes: Cartao[]; carregandoCartoes: boolean; processando: boolean; onConfirmar: (forma: "saldo" | "credito", cartaoId?: number) => void | Promise<void>; onFechar: () => void; }

export default function PurchasePaymentDialog({ item, cartoes, carregandoCartoes, processando, onConfirmar, onFechar }: Props) {
  const [forma, setForma] = useState<"saldo" | "credito">("saldo");
  const [cartaoId, setCartaoId] = useState("");
  return <AlertDialog open={Boolean(item)} onOpenChange={(aberto) => { if (!aberto && !processando) onFechar(); }}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>Como você pagou este item?</AlertDialogTitle><AlertDialogDescription>Escolha a forma de pagamento de <strong>{item?.nome}</strong>. A despesa será registrada automaticamente.</AlertDialogDescription></AlertDialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setForma("saldo")} className={`rounded-xl border p-4 text-left transition ${forma === "saldo" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:bg-muted"}`}><Wallet size={20} /><strong className="mt-3 block">Saldo</strong><span className="mt-1 block text-xs text-muted-foreground">Descontar do saldo em conta</span></button>
        <button type="button" disabled={!cartoes.length || carregandoCartoes} onClick={() => setForma("credito")} className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${forma === "credito" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:bg-muted"}`}><CreditCard size={20} /><strong className="mt-3 block">Cartão de crédito</strong><span className="mt-1 block text-xs text-muted-foreground">Adicionar à fatura do cartão</span></button>
      </div>
      {!carregandoCartoes && !cartoes.length && <p className="text-xs text-muted-foreground">Cadastre um cartão em Finanças para utilizar crédito.</p>}
      {forma === "credito" && <div><label className="field-label" htmlFor="cartao-compra">Qual cartão?</label><AppSelect id="cartao-compra" value={cartaoId} onValueChange={setCartaoId} className="mt-2" placeholder="Selecionar cartão" options={cartoes.map((cartao) => ({ value: String(cartao.id), label: `${cartao.nome} · ${cartao.instituicao}` }))} /></div>}
      <AlertDialogFooter><AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel><button type="button" disabled={processando || (forma === "credito" && !cartaoId)} onClick={() => onConfirmar(forma, cartaoId ? Number(cartaoId) : undefined)} className="button-primary">{processando ? "Registrando..." : "Confirmar compra"}</button></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
