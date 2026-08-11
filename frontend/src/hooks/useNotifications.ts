"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Movimentacao } from "@/types/Movimentacao";
import type { Meta, Recorrencia } from "@/types/Planejamento";
import type { Orcamento } from "@/types/Orcamento";
import type { Cartao, FaturaCartao } from "@/types/Cartao";

export type TipoAvisoApp = "orcamento" | "cartao" | "meta" | "recorrencia" | "tendencia";
export interface AvisoApp { id: string; titulo: string; detalhe: string; tipo: TipoAvisoApp; href: string; importante: boolean; lido: boolean; }
interface DadosAvisos { movs: Movimentacao[]; metas: Meta[]; recorrencias: Recorrencia[]; orcamentos: Orcamento[]; cartoes: Cartao[]; faturas: Array<FaturaCartao & { cartao_id: number; cartao_nome: string }>; }

const eventoLeitura = "listaweb:avisos-lidos";
const chaveLeitura = (usuarioId: number) => `avisos-lidos:${usuarioId}`;
const lerLidos = (usuarioId?: number) => {
  if (!usuarioId || typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(chaveLeitura(usuarioId)) || "[]") as string[]; }
  catch { return []; }
};

async function carregarAvisos(usuarioId: number): Promise<DadosAvisos> {
  const hoje = new Date(); const mes = hoje.getMonth() + 1; const ano = hoje.getFullYear();
  const [movs, metas, recorrencias, orcamentos, cartoes] = await Promise.all([
    api.get(`/financas/${usuarioId}`), api.get("/metas"), api.get("/recorrencias"), api.get(`/orcamentos/${usuarioId}?mes=${mes}&ano=${ano}`), api.get("/cartoes"),
  ]) as [Movimentacao[], Meta[], Recorrencia[], Orcamento[], Cartao[]];
  const faturas = (await Promise.all(cartoes.map(async (cartao) => ((await api.get(`/cartoes/${cartao.id}/faturas`)) as FaturaCartao[]).map((fatura) => ({ ...fatura, cartao_id: cartao.id, cartao_nome: cartao.nome }))))).flat();
  return { movs, metas, recorrencias, orcamentos, cartoes, faturas };
}

function calcularAvisos(dados: DadosAvisos): Omit<AvisoApp, "lido">[] {
  const lista: Omit<AvisoApp, "lido">[] = []; const hoje = new Date(); const dia = hoje.getDate(); const mes = hoje.getMonth(); const ano = hoje.getFullYear();
  const atuais = dados.movs.filter((m) => { const d = new Date(`${m.data.slice(0, 10)}T12:00:00`); return d.getMonth() === mes && d.getFullYear() === ano; });
  for (const o of dados.orcamentos) { const gasto = atuais.filter((m) => m.tipo === "despesa" && m.impacta_resultado !== false && m.categoria === o.categoria).reduce((t, m) => t + Number(m.valor), 0); const p = gasto / Number(o.valor); if (p >= .5) lista.push({ id: `o-${o.id}-${ano}-${mes + 1}`, titulo: p >= 1 ? "Orçamento atingido" : p >= .8 ? "Orçamento próximo do limite" : "Orçamento em atenção", detalhe: `${o.categoria}: ${Math.round(p * 100)}% utilizado`, tipo: "orcamento", href: "/planejamento", importante: p >= .8 }); }
  dados.recorrencias.filter((r) => r.ativa && r.dia >= dia && r.dia <= dia + 3).forEach((r) => lista.push({ id: `r-${r.id}-${ano}-${mes + 1}`, titulo: "Lançamento recorrente próximo", detalhe: `${r.descricao} está previsto para o dia ${r.dia}`, tipo: "recorrencia", href: "/planejamento", importante: false }));
  dados.metas.filter((m) => m.concluida).forEach((m) => lista.push({ id: `m-${m.id}`, titulo: "Meta concluída", detalhe: `Você alcançou “${m.nome}”`, tipo: "meta", href: "/planejamento", importante: false }));
  for (const c of dados.cartoes) { const fatura = atuais.filter((m) => m.tipo === "despesa" && m.forma_pagamento === "credito" && Number(m.cartao_id) === c.id).reduce((t, m) => t + Number(m.valor), 0); const p = Number(c.limite_disponivel) > 0 ? fatura / Number(c.limite_disponivel) : 0; if (p >= .8) lista.push({ id: `c-${c.id}-${ano}-${mes + 1}`, titulo: p >= 1 ? "Limite do cartão atingido" : "Limite do cartão próximo do fim", detalhe: `${c.nome}: ${Math.round(p * 100)}% utilizado`, tipo: "cartao", href: "/financas", importante: true }); }
  for (const f of dados.faturas.filter((item) => item.status === "fechada")) { const dias = Math.ceil((new Date(f.vencimento).getTime() - hoje.getTime()) / 86_400_000); if (dias <= 5) lista.push({ id: `f-${f.cartao_id}-${f.ano}-${f.mes}`, titulo: dias < 0 ? "Fatura vencida" : "Fatura próxima do vencimento", detalhe: `${f.cartao_nome}: ${Number(f.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}${dias >= 0 ? ` vence em ${dias} dia${dias === 1 ? "" : "s"}` : " está em atraso"}`, tipo: "cartao", href: "/financas", importante: true }); }
  const despesas = atuais.filter((m) => m.tipo === "despesa" && m.impacta_resultado !== false); const media = despesas.length ? despesas.reduce((t, m) => t + Number(m.valor), 0) / despesas.length : 0; const maior = despesas.find((m) => media > 0 && Number(m.valor) > media * 1.8); if (maior) lista.push({ id: `d-${maior.id}`, titulo: "Despesa acima da média", detalhe: `${maior.descricao} merece atenção`, tipo: "tendencia", href: "/financas", importante: false });
  return lista;
}

export function useNotifications(usuarioId?: number, habilitado = true) {
  const [lidos, setLidos] = useState<string[]>(() => lerLidos(usuarioId));
  const query = useQuery<DadosAvisos>({ queryKey: ["avisos", usuarioId], queryFn: () => carregarAvisos(usuarioId!), enabled: Boolean(usuarioId && habilitado), staleTime: 60_000 });
  useEffect(() => {
    if (!usuarioId) return;
    const sincronizar = () => setLidos(lerLidos(usuarioId));
    sincronizar(); window.addEventListener(eventoLeitura, sincronizar); return () => window.removeEventListener(eventoLeitura, sincronizar);
  }, [usuarioId]);
  const avisos = useMemo(() => calcularAvisos(query.data ?? { movs: [], metas: [], recorrencias: [], orcamentos: [], cartoes: [], faturas: [] }).map((aviso) => ({ ...aviso, lido: lidos.includes(aviso.id) })), [lidos, query.data]);
  const salvarLidos = useCallback((ids: string[]) => { if (!usuarioId) return; const unicos = [...new Set(ids)]; localStorage.setItem(chaveLeitura(usuarioId), JSON.stringify(unicos)); setLidos(unicos); window.dispatchEvent(new Event(eventoLeitura)); }, [usuarioId]);
  const marcarComoLido = useCallback((id: string) => salvarLidos([...lidos, id]), [lidos, salvarLidos]);
  const marcarTodosComoLidos = useCallback(() => salvarLidos([...lidos, ...avisos.map((a) => a.id)]), [avisos, lidos, salvarLidos]);
  return { avisos, naoLidos: avisos.filter((a) => !a.lido).length, carregando: query.isPending, erro: query.error, marcarComoLido, marcarTodosComoLidos };
}
