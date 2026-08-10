"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CalendarClock, CheckCheck, CircleAlert, Target, TrendingUp } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useUsuario } from "@/hooks/useUsuario";
import { useNotifications, type TipoAvisoApp } from "@/hooks/useNotifications";

type Filtro = "todos" | "nao-lidos" | "importantes";
const Icone = ({ tipo }: { tipo: TipoAvisoApp }) => tipo === "orcamento" || tipo === "cartao" ? <CircleAlert /> : tipo === "recorrencia" ? <CalendarClock /> : tipo === "meta" ? <Target /> : <TrendingUp />;
const rotuloTipo: Record<TipoAvisoApp, string> = { orcamento: "Orçamento", cartao: "Cartão", meta: "Meta", recorrencia: "Recorrência", tendencia: "Finanças" };

export default function AvisosPage() {
  const { usuario } = useUsuario();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const { avisos, naoLidos, carregando, erro, marcarComoLido, marcarTodosComoLidos } = useNotifications(usuario?.id);
  if (!usuario) return <div className="page-loader"><div className="page-loader-indicator" /></div>;
  const filtrados = avisos.filter((aviso) => filtro === "todos" || filtro === "nao-lidos" ? filtro === "todos" || !aviso.lido : aviso.importante);

  return <AppLayout titulo="Avisos" subtitulo="Acompanhe o que merece sua atenção." nome={usuario.nome}>
    <section className="surface overflow-hidden">
      <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Bell size={21} /></span><div><h2 className="text-xl font-semibold">Central de avisos</h2><p className="text-sm text-muted-foreground">{naoLidos ? `${naoLidos} aviso${naoLidos === 1 ? "" : "s"} não lido${naoLidos === 1 ? "" : "s"}` : "Tudo lido por aqui"}</p></div></div>
        {naoLidos > 0 && <button type="button" onClick={marcarTodosComoLidos} className="button-secondary"><CheckCheck size={17} /> Marcar todos como lidos</button>}
      </header>
      <div className="flex gap-2 overflow-x-auto border-b border-border p-4 sm:px-6">{([['todos','Todos'],['nao-lidos','Não lidos'],['importantes','Importantes']] as const).map(([valor, label]) => <button key={valor} type="button" onClick={() => setFiltro(valor)} className={filtro === valor ? "button-primary shrink-0" : "button-secondary shrink-0"}>{label}</button>)}</div>
      <div className="divide-y divide-border">
        {filtrados.map((aviso) => <article key={aviso.id} className={`flex flex-col gap-4 p-5 transition sm:flex-row sm:items-center sm:p-6 ${aviso.lido ? "bg-muted/20 opacity-70" : ""}`}>
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5 ${aviso.importante ? "bg-rose-500/10 text-rose-600" : "bg-primary/10 text-primary"}`}><Icone tipo={aviso.tipo} /></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{aviso.titulo}</h3>{!aviso.lido && <span className="size-2 rounded-full bg-primary" aria-label="Não lido" />}{aviso.importante && <span className="status-pill paused">Importante</span>}</div><p className="mt-1 text-sm text-muted-foreground">{aviso.detalhe}</p><p className="mt-2 text-xs font-medium text-primary">{rotuloTipo[aviso.tipo]}</p></div>
          <div className="flex flex-wrap gap-2">{!aviso.lido && <button type="button" onClick={() => marcarComoLido(aviso.id)} className="button-secondary">Marcar como lido</button>}<Link href={aviso.href} onClick={() => marcarComoLido(aviso.id)} className="button-primary">Ver detalhes</Link></div>
        </article>)}
        {carregando && <p className="p-10 text-center text-sm text-muted-foreground">Carregando avisos...</p>}
        {!carregando && !erro && !filtrados.length && <div className="p-10 text-center"><CheckCheck className="mx-auto text-emerald-600" size={30} /><p className="mt-3 font-medium">Nenhum aviso neste filtro</p><p className="mt-1 text-sm text-muted-foreground">Você está em dia por aqui.</p></div>}
        {erro && <p className="p-10 text-center text-sm text-destructive">Não foi possível carregar os avisos.</p>}
      </div>
    </section>
  </AppLayout>;
}
