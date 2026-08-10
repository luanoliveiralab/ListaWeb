"use client";

import { useEffect } from "react";
import type { Movimentacao } from "@/types/Movimentacao";
import type { Orcamento } from "@/types/Orcamento";
import { useToast } from "@/providers/ToastProvider";

interface Opcoes {
  usuarioId?: number;
  mes: number;
  ano: number;
  orcamentos: Orcamento[];
  movimentacoes: Movimentacao[];
  carregado: boolean;
}

const marcoAlcancado = (percentual: number) => percentual >= 100 ? 100 : percentual >= 80 ? 80 : percentual >= 50 ? 50 : 0;

export function useBudgetThresholdAlerts({ usuarioId, mes, ano, orcamentos, movimentacoes, carregado }: Opcoes) {
  const { mostrarAviso } = useToast();

  useEffect(() => {
    const hoje = new Date();
    if (!usuarioId || !carregado || mes !== hoje.getMonth() + 1 || ano !== hoje.getFullYear()) return;

    for (const orcamento of orcamentos) {
      const limite = Number(orcamento.valor);
      if (!Number.isFinite(limite) || limite <= 0) continue;

      const gasto = movimentacoes
        .filter((item) => item.tipo === "despesa" && item.categoria === orcamento.categoria)
        .reduce((total, item) => total + Number(item.valor), 0);
      const marco = marcoAlcancado((gasto / limite) * 100);
      if (!marco) continue;

      const chave = `orcamento-alerta:${usuarioId}:${ano}:${mes}:${orcamento.id}`;
      const ultimoMarco = Number(localStorage.getItem(chave) || 0);
      if (marco <= ultimoMarco) continue;

      localStorage.setItem(chave, String(marco));
      const mensagem = marco === 100
        ? `Você atingiu 100% do orçamento de ${orcamento.categoria}.`
        : `Você já utilizou ${marco}% do orçamento de ${orcamento.categoria}.`;
      mostrarAviso(mensagem, "alerta");
      break;
    }
  }, [ano, carregado, mes, mostrarAviso, movimentacoes, orcamentos, usuarioId]);
}
