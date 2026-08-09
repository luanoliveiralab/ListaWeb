"use client";

import { Check, Circle, Pencil, Trash2 } from "lucide-react";
import type { ItemLista } from "@/types/ItemLista";

interface ShoppingItemProps {
  item: ItemLista;
  onToggle: (item: ItemLista) => void;
  onDelete: (item: ItemLista) => void;
  onEdit: (item: ItemLista) => void;
}

const cores: Record<string, string> = {
  Mercado: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Padaria: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  Carnes: "bg-red-500/10 text-red-700 dark:text-red-300",
  Bebidas: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Farmácia: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  Limpeza: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Higiene: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Outros: "bg-muted text-muted-foreground",
};

export default function ShoppingItem({ item, onToggle, onDelete, onEdit }: ShoppingItemProps) {
  return (
    <article className={`shopping-row group ${item.comprado ? "bg-emerald-500/[0.04]" : "hover:bg-muted/30"}`}>
      <button
        type="button"
        onClick={() => !item.comprado && onToggle(item)}
        disabled={item.comprado}
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${item.comprado ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"}`}
        aria-label={item.comprado ? `${item.nome} comprado` : `Marcar ${item.nome} como comprado`}
      >
        {item.comprado ? <Check size={20} /> : <Circle size={20} />}
      </button>

      <div className="min-w-0 flex-1">
        <h3 className={`truncate font-medium ${item.comprado ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {item.nome}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-medium ${cores[item.categoria] ?? cores.Outros}`}>
            {item.categoria}
          </span>
          <span className="text-muted-foreground">{item.quantidade} un.</span>
        </div>
      </div>

      <strong className="hidden shrink-0 text-sm tabular-nums sm:block">
        {Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </strong>

      <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        {!item.comprado && (
          <button type="button" onClick={() => onEdit(item)} className="icon-button" aria-label={`Editar ${item.nome}`}>
            <Pencil size={17} />
          </button>
        )}
        <button type="button" onClick={() => onDelete(item)} className="icon-button hover:text-destructive" aria-label={`Excluir ${item.nome}`}>
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
