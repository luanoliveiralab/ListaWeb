"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import type { Movimentacao } from "@/types/Movimentacao";

interface Props {
  movimentacoes: Movimentacao[];
}

export default function RecentMovimentacoes({ movimentacoes }: Props) {
  const ultimas = movimentacoes.slice(0, 5);

  return (
    <section className="surface mt-8 overflow-hidden">
      <header className="flex items-center justify-between border-b border-border p-5 sm:p-6">
        <div>
          <p className="text-sm font-medium text-primary">Atividade recente</p>
          <h2 className="mt-1 text-xl font-semibold">Últimas movimentações</h2>
        </div>
        <Link href="/financas" className="button-secondary">
          Ver todas <ArrowRight size={16} />
        </Link>
      </header>

      {ultimas.length === 0 ? (
        <div className="empty-state m-5 shadow-none">Nenhuma movimentação encontrada.</div>
      ) : (
        <div className="divide-y divide-border">
          {ultimas.map((mov, index) => {
            const receita = mov.tipo === "receita";
            return (
              <div key={mov.id} className="transaction-row" style={{ animationDelay: `${index * 40}ms` }}>
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${receita ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                  {receita ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{mov.descricao}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {mov.categoria} · {new Date(mov.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <strong className={`shrink-0 tabular-nums ${receita ? "text-emerald-600" : "text-rose-600"}`}>
                  {receita ? "+" : "−"} {Number(mov.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
