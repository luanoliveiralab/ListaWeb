"use client";

import { useEffect, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import Welcome from "@/components/layout/Welcome";
import DashboardCards from "@/components/dashboard/DashboardCards";

import { useUsuario } from "@/hooks/useUsuario";
import { listaService } from "@/services/lista.service";

import type { ItemLista } from "@/types/ItemLista";

import { financasService } from "@/services/financas.service";

import type { Movimentacao } from "@/types/Movimentacao";

import RecentMovimentacoes from "@/components/dashboard/RecentMovimentacoes";

import FinancePieChart from "@/components/financas/FinancePieChart";
import FinanceLineChart from "@/components/financas/FinanceLineChart";

import PeriodSelector from "@/components/shared/PeriodSelector";

import { usePeriod } from "@/context/PeriodContext";

export default function Dashboard() {
  const { usuario } = useUsuario();

  const [lista, setLista] = useState<ItemLista[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    mes,
    ano,
    setMes,
    setAno,
  } = usePeriod();

  useEffect(() => {
    if (!usuario?.id) return;

    async function load() {
      try {
        setLoading(true);

        const usuarioId = usuario!.id;

        const data = await listaService.buscarPorUsuario(usuarioId);
        const movs = await financasService.buscarPorUsuario(usuarioId);
        setMovimentacoes(movs);
        setLista(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [usuario]);

  if (!usuario || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  const listaFiltrada = lista.filter((item) => {
    if (!item.created_at) return false;

    const data = new Date(item.created_at);

    return (
      data.getMonth() + 1 === mes &&
      data.getFullYear() === ano
    );
  });

  const totalItens = listaFiltrada.length;

  const itensComprados = listaFiltrada.filter(
    item => item.comprado
  ).length;

  const itensPendentes = listaFiltrada.filter(
    item => !item.comprado
  ).length;

  const movimentacoesFiltradas = movimentacoes.filter((mov) => {
    const data = new Date(mov.data);

    return (
      data.getMonth() + 1 === mes &&
      data.getFullYear() === ano
    );
  });


  const receitas = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "receita")
    .reduce((acc, mov) => acc + Number(mov.valor), 0);

  const despesas = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "despesa")
    .reduce((acc, mov) => acc + Number(mov.valor), 0);

  const saldo = receitas - despesas;

  const quantidadeMovimentacoes =
    movimentacoesFiltradas.length;

  const ticketMedio =
    quantidadeMovimentacoes === 0
      ? 0
      : movimentacoesFiltradas.reduce(
        (acc, mov) => acc + Number(mov.valor),
        0
      ) / quantidadeMovimentacoes;

  const ultimasMovimentacoes = [...movimentacoesFiltradas]
    .sort(
      (a, b) =>
        new Date(b.data).getTime() -
        new Date(a.data).getTime()
    )
    .slice(0, 5);

  return (
    <AppLayout
      titulo="Dashboard"
      subtitulo="Acompanhe um resumo das suas atividades."
      nome={usuario.nome}
    >
      <Welcome
        nome={usuario.nome}
        foto={usuario.foto}
      />

      <PeriodSelector
        mes={mes}
        ano={ano}
        onMesChange={setMes}
        onAnoChange={setAno}
      />

      <DashboardCards
        total={totalItens}
        comprados={itensComprados}
        pendentes={itensPendentes}
        saldo={saldo}
        receitas={receitas}
        despesas={despesas}
        movimentacoes={quantidadeMovimentacoes}
        ticketMedio={ticketMedio}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        <FinancePieChart
          movimentacoes={movimentacoesFiltradas}
        />

        <FinanceLineChart
          movimentacoes={movimentacoesFiltradas}
        />

      </div>

      <RecentMovimentacoes
        movimentacoes={ultimasMovimentacoes}
      />
    </AppLayout>
  );
}