"use client";

import { AlertTriangle, CalendarDays, CreditCard, WalletCards } from "lucide-react";
import type { Movimentacao } from "@/types/Movimentacao";

interface Props {
  movimentacoes: Movimentacao[];
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function FinancialAgenda({ movimentacoes }: Props) {
  const agenda = movimentacoes
    .filter((item) => item.pendente)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 8);

  if (!agenda.length) return null;

  return (
    <section className="surface mt-6 p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title flex items-center gap-2"><CalendarDays size={20} /> Agenda financeira</h2>
          <p className="section-description">Próximos lançamentos previstos para o período selecionado.</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{agenda.length} {agenda.length === 1 ? "compromisso" : "compromissos"}</span>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {agenda.map((item) => {
          const data = new Date(`${item.data.slice(0, 10)}T12:00:00`);
          return (
            <article key={`${item.id}-${item.data}`} className={`rounded-xl border p-3.5 ${item.falha_programacao ? "border-red-500/35 bg-red-500/5" : "border-border bg-background/45"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.tipo === "receita" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {item.falha_programacao ? <AlertTriangle size={16} /> : item.forma_pagamento === "credito" ? <CreditCard size={16} /> : <WalletCards size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.descricao}</p>
                    <p className="text-xs text-muted-foreground">{data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {item.recorrencia_pendente ? "Recorrente" : "Programada"}</p>
                  </div>
                </div>
                <strong className={`shrink-0 text-sm tabular-nums ${item.tipo === "receita" ? "text-emerald-500" : "text-rose-500"}`}>{item.tipo === "receita" ? "+" : "−"}{moeda.format(Number(item.valor))}</strong>
              </div>
              {item.falha_programacao && <p className="mt-2 line-clamp-2 text-xs text-red-500">{item.erro_programacao || "O lançamento precisa de atenção."}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
