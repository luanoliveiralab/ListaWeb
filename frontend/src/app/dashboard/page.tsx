"use client";

import { useQuery } from "@tanstack/react-query";

import AppLayout from "@/components/layout/AppLayout";
import Welcome from "@/components/layout/Welcome";
import DashboardCards from "@/components/dashboard/DashboardCards";

import { useUsuario } from "@/hooks/useUsuario";
import { dashboardService } from "@/services/dashboard.service";

import RecentMovimentacoes from "@/components/dashboard/RecentMovimentacoes";

import FinancePieChart from "@/components/financas/FinancePieChart";
import FinanceLineChart from "@/components/financas/FinanceLineChart";

import PeriodSelector from "@/components/shared/PeriodSelector";

import { usePeriod } from "@/context/PeriodContext";

export default function Dashboard() {
  const { usuario } = useUsuario();

  const {
    mes,
    ano,
    setMes,
    setAno,
  } = usePeriod();

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", usuario?.id, ano, mes],
    queryFn: () => dashboardService.buscar(mes, ano),
    enabled: Boolean(usuario?.id),
    placeholderData: (anterior) => anterior,
  });
  const lista = data?.lista ?? [];
  const movimentacoes = data?.movimentacoes ?? [];
  const cartoes = data?.cartoes ?? [];

  if (!usuario || (isPending && !data)) {
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
    const [anoMov, mesMov] = mov.data.slice(0, 10).split("-").map(Number);

    return (
      mesMov === mes &&
      anoMov === ano
    );
  });


  const movimentacoesAnaliticas = movimentacoesFiltradas.filter((mov) => !mov.fatura_pagamento_id && mov.impacta_resultado !== false);
  const receitas = movimentacoesAnaliticas
    .filter((mov) => mov.tipo === "receita")
    .reduce((acc, mov) => acc + Number(mov.valor), 0);

  const despesas = movimentacoesAnaliticas
    .filter((mov) => mov.tipo === "despesa")
    .reduce((acc, mov) => acc + Number(mov.valor), 0);

  const despesasNoSaldo = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "despesa" && (mov.forma_pagamento ?? "saldo") === "saldo")
    .reduce((acc, mov) => acc + Number(mov.valor), 0);
  const entradasNoSaldo = movimentacoesFiltradas
    .filter((mov) => mov.tipo === "receita")
    .reduce((acc, mov) => acc + Number(mov.valor), 0);
  const saldo = Number(data?.saldo_anterior ?? 0) + entradasNoSaldo - despesasNoSaldo;

  const quantidadeMovimentacoes =
    movimentacoesFiltradas.length;

  const ultimasMovimentacoes = [...movimentacoesFiltradas]
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
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
        cartoes={cartoes}
        movimentacoesDoPeriodo={movimentacoesFiltradas}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        <FinancePieChart
          movimentacoes={movimentacoesAnaliticas}
        />

        <FinanceLineChart
          movimentacoes={movimentacoesAnaliticas}
        />

      </div>

      <RecentMovimentacoes
        movimentacoes={ultimasMovimentacoes}
      />
    </AppLayout>
  );
}
