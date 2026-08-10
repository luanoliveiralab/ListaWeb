"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CalendarClock, CircleAlert, Target, TrendingUp } from "lucide-react";
import { useUsuario } from "@/hooks/useUsuario";
import { useNotifications, type TipoAvisoApp } from "@/hooks/useNotifications";

const Icone = ({ tipo }: { tipo: TipoAvisoApp }) => tipo === "orcamento" || tipo === "cartao" ? <CircleAlert /> : tipo === "recorrencia" ? <CalendarClock /> : tipo === "meta" ? <Target /> : <TrendingUp />;

export default function NotificationCenter() {
  const [aberto, setAberto] = useState(false);
  const { usuario } = useUsuario();
  const { avisos, naoLidos, carregando, marcarComoLido } = useNotifications(usuario?.id, aberto);

  return <div className="relative">
    <button className="icon-button relative border border-border bg-background" onClick={() => setAberto(!aberto)} aria-label="Notificações"><Bell size={18} />{naoLidos > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">{Math.min(9, naoLidos)}</span>}</button>
    {aberto && <div data-slot="notification-panel" className="fixed left-4 right-4 top-20 z-50 w-auto overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[min(22rem,calc(100vw-2rem))]">
      <div className="border-b border-border p-4"><h2 className="font-semibold">Notificações</h2><p className="text-xs text-muted-foreground">Seus avisos mais recentes</p></div>
      <div className="max-h-72 overflow-y-auto p-2">{avisos.slice(0, 5).map((aviso) => <Link href={aviso.href} onClick={() => { marcarComoLido(aviso.id); setAberto(false); }} key={aviso.id} className={`flex gap-3 rounded-xl p-3 hover:bg-muted ${aviso.lido ? "opacity-60" : ""}`}><span className="mt-0.5 text-primary [&_svg]:size-4"><Icone tipo={aviso.tipo} /></span><div><p className="text-sm font-medium">{aviso.titulo}</p><p className="mt-0.5 text-xs text-muted-foreground">{aviso.detalhe}</p></div></Link>)}{carregando && <p className="p-6 text-center text-sm text-muted-foreground">Carregando avisos...</p>}{!carregando && !avisos.length && <p className="p-6 text-center text-sm text-muted-foreground">Tudo sob controle por aqui.</p>}</div>
      <div className="border-t border-border p-2"><Link href="/avisos" onClick={() => setAberto(false)} className="button-secondary w-full">Ver todos os avisos</Link></div>
    </div>}
  </div>;
}
