"use client";

import { CheckCircle2, Clock3, ShoppingBasket } from "lucide-react";
import ShoppingItem from "./ShoppingItem";
import type { ItemLista } from "@/types/ItemLista";

interface ShoppingListProps {
  pendentes: ItemLista[];
  comprados: ItemLista[];
  loading: boolean;
  onToggle: (item: ItemLista) => void;
  onDelete: (item: ItemLista) => void;
  onEdit: (item: ItemLista) => void;
}

export default function ShoppingList({ pendentes, comprados, loading, onToggle, onDelete, onEdit }: ShoppingListProps) {
  if (loading) {
    return (
      <section className="surface mt-8 p-5 sm:p-6">
        <div className="mb-5 h-7 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-muted/70" />)}
        </div>
      </section>
    );
  }

  if (pendentes.length === 0 && comprados.length === 0) {
    return (
      <div className="empty-state mt-8">
        <ShoppingBasket size={34} className="mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Sua lista está vazia</h2>
        <p className="mt-1 text-sm">Adicione um item para começar a organizar suas compras.</p>
      </div>
    );
  }

  const grupos = [
    { titulo: "Pendentes", itens: pendentes, Icone: Clock3, cor: "text-amber-600", fundo: "bg-amber-500/10" },
    { titulo: "Comprados", itens: comprados, Icone: CheckCircle2, cor: "text-emerald-600", fundo: "bg-emerald-500/10" },
  ];

  return (
    <section className="mt-8 grid items-start gap-6 xl:grid-cols-2">
      {grupos.map(({ titulo, itens, Icone, cor, fundo }) => (
        <div key={titulo} className="surface overflow-hidden">
          <header className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-3">
              <span className={`flex size-10 items-center justify-center rounded-xl ${fundo} ${cor}`}><Icone size={20} /></span>
              <div>
                <h2 className="font-semibold">{titulo}</h2>
                <p className="text-xs text-muted-foreground">{itens.length} {itens.length === 1 ? "item" : "itens"}</p>
              </div>
            </div>
          </header>
          {itens.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhum item {titulo.toLowerCase()}.</p>
          ) : (
            <div className="divide-y divide-border">
              {itens.map((item) => (
                <ShoppingItem key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
