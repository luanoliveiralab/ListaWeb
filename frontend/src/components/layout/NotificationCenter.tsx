"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarClock, CircleAlert, Target, TrendingUp } from "lucide-react";
import { api } from "@/services/api";
import type { Movimentacao } from "@/types/Movimentacao";
import type { Meta, Recorrencia } from "@/types/Planejamento";
import type { Orcamento } from "@/types/Orcamento";

interface Aviso { id: string; titulo: string; detalhe: string; tipo: "alerta" | "meta" | "agenda" | "tendencia"; }

export default function NotificationCenter() {
  const [aberto, setAberto] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [dados, setDados] = useState<{ movs: Movimentacao[]; metas: Meta[]; recorrencias: Recorrencia[]; orcamentos: Orcamento[] }>({ movs: [], metas: [], recorrencias: [], orcamentos: [] });

  useEffect(() => {
    if (!aberto || carregado) return;

    let ativo = true;
    async function carregar() {
      try {
        const usuario = await api.get("/me");
        const hoje = new Date(); const mes = hoje.getMonth() + 1; const ano = hoje.getFullYear();
        const [movs, metas, recorrencias, orcamentos] = await Promise.all([api.get(`/financas/${usuario.id}`), api.get("/metas"), api.get("/recorrencias"), api.get(`/orcamentos/${usuario.id}?mes=${mes}&ano=${ano}`)]);
        if (ativo) {
          setDados({ movs, metas, recorrencias, orcamentos });
          setCarregado(true);
        }
      } catch { /* A página continua funcional mesmo sem os alertas. */ }
    }
    carregar(); return () => { ativo = false; };
  }, [aberto, carregado]);

  const avisos = useMemo(() => {
    const lista: Aviso[] = []; const hoje = new Date(); const dia = hoje.getDate(); const mes = hoje.getMonth(); const ano = hoje.getFullYear();
    const atuais = dados.movs.filter((m) => { const d = new Date(`${m.data.slice(0, 10)}T12:00:00`); return d.getMonth() === mes && d.getFullYear() === ano; });
    for (const orcamento of dados.orcamentos) { const gasto = atuais.filter((m) => m.tipo === "despesa" && m.categoria === orcamento.categoria).reduce((t, m) => t + Number(m.valor), 0); const percentual = gasto / Number(orcamento.valor); if (percentual >= .8) lista.push({ id: `o-${orcamento.id}`, titulo: percentual > 1 ? "Orçamento ultrapassado" : "Orçamento próximo do limite", detalhe: `${orcamento.categoria}: ${Math.round(percentual * 100)}% utilizado`, tipo: "alerta" }); }
    dados.recorrencias.filter((r) => r.ativa && r.dia >= dia && r.dia <= dia + 3).forEach((r) => lista.push({ id: `r-${r.id}`, titulo: "Lançamento recorrente próximo", detalhe: `${r.descricao} está previsto para o dia ${r.dia}`, tipo: "agenda" }));
    dados.metas.filter((m) => m.concluida).slice(0, 2).forEach((m) => lista.push({ id: `m-${m.id}`, titulo: "Meta concluída", detalhe: `Você alcançou “${m.nome}”`, tipo: "meta" }));
    const despesas = atuais.filter((m) => m.tipo === "despesa"); const media = despesas.length ? despesas.reduce((t, m) => t + Number(m.valor), 0) / despesas.length : 0; const maior = despesas.find((m) => media > 0 && Number(m.valor) > media * 1.8); if (maior) lista.push({ id: `d-${maior.id}`, titulo: "Despesa acima da média", detalhe: `${maior.descricao} merece atenção`, tipo: "tendencia" });
    return lista;
  }, [dados]);

  const Icone = ({ tipo }: { tipo: Aviso["tipo"] }) => tipo === "alerta" ? <CircleAlert /> : tipo === "agenda" ? <CalendarClock /> : tipo === "meta" ? <Target /> : <TrendingUp />;
  return <div className="relative"><button className="icon-button relative border border-border bg-background" onClick={() => setAberto(!aberto)} aria-label="Notificações"><Bell size={18} />{avisos.length > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">{Math.min(9, avisos.length)}</span>}</button>{aberto && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl"><div className="border-b border-border p-4"><h2 className="font-semibold">Notificações</h2><p className="text-xs text-muted-foreground">Alertas calculados com seus dados atuais</p></div><div className="max-h-80 overflow-y-auto p-2">{avisos.map((aviso) => <div key={aviso.id} className="flex gap-3 rounded-xl p-3 hover:bg-muted"><span className="mt-0.5 text-primary [&_svg]:size-4"><Icone tipo={aviso.tipo} /></span><div><p className="text-sm font-medium">{aviso.titulo}</p><p className="mt-0.5 text-xs text-muted-foreground">{aviso.detalhe}</p></div></div>)}{!avisos.length && <p className="p-6 text-center text-sm text-muted-foreground">Tudo sob controle por aqui.</p>}</div></div>}</div>;
}
