"use client";

import { useState } from "react";
import { PiggyBank, Plus, Trash2 } from "lucide-react";

import type { Movimentacao } from "@/types/Movimentacao";
import type { Orcamento } from "@/types/Orcamento";

interface Props {
  orcamentos: Orcamento[];
  movimentacoes: Movimentacao[];
  onSalvar: (categoria: string, valor: number) => Promise<void>;
  onRemover: (id: number) => Promise<void>;
}

const categorias = ["Mercado", "Padaria", "Carnes", "Bebidas", "Farmácia", "Limpeza", "Higiene", "Outros"];
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BudgetPanel({ orcamentos, movimentacoes, onSalvar, onRemover }: Props) {
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const valorNumero = Number(valor.replace(",", "."));
    if (!categoria || !Number.isFinite(valorNumero) || valorNumero <= 0) return;

    setSalvando(true);
    try {
      await onSalvar(categoria, valorNumero);
      setCategoria("");
      setValor("");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="surface mt-6 overflow-hidden">
      <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><PiggyBank size={22} /></span>
          <div>
            <p className="text-sm font-medium text-primary">Planejamento</p>
            <h2 className="text-xl font-semibold">Orçamentos por categoria</h2>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[150px_130px_auto]">
          <select value={categoria} onChange={(event) => setCategoria(event.target.value)} className="control">
            <option value="">Categoria</option>
            {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="number" min="0.01" step="0.01" value={valor} onChange={(event) => setValor(event.target.value)} placeholder="Limite em R$" className="control" />
          <button type="button" onClick={salvar} disabled={salvando || !categoria || !valor} className="button-primary">
            <Plus size={17} /> {salvando ? "Salvando" : "Definir"}
          </button>
        </div>
      </header>

      {orcamentos.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Defina um limite para acompanhar os gastos de cada categoria.</div>
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 sm:p-6">
          {orcamentos.map((orcamento) => {
            const gasto = movimentacoes
              .filter((mov) => mov.tipo === "despesa" && mov.categoria === orcamento.categoria)
              .reduce((total, mov) => total + Number(mov.valor), 0);
            const limite = Number(orcamento.valor);
            const percentual = Math.min((gasto / limite) * 100, 100);
            const estourado = gasto > limite;
            const alerta = !estourado && percentual >= 80;

            return (
              <article key={orcamento.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{orcamento.categoria}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{moeda(gasto)} de {moeda(limite)}</p>
                  </div>
                  <button type="button" onClick={() => onRemover(orcamento.id)} className="icon-button hover:text-destructive" aria-label={`Remover orçamento de ${orcamento.categoria}`}><Trash2 size={16} /></button>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full transition-[width] duration-700 ${estourado ? "bg-rose-500" : alerta ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percentual}%` }} />
                </div>
                <p className={`mt-2 text-xs font-medium ${estourado ? "text-rose-600" : alerta ? "text-amber-600" : "text-muted-foreground"}`}>
                  {estourado ? `${moeda(gasto - limite)} acima do limite` : `${Math.round(percentual)}% utilizado`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
