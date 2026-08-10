"use client";

import { useState } from "react";
import { Building2, CreditCard, Plus, Trash2, Wifi } from "lucide-react";

import type { Cartao } from "@/types/Cartao";
import type { Movimentacao } from "@/types/Movimentacao";

interface Props {
  cartoes: Cartao[];
  carregando?: boolean;
  movimentacoes: Movimentacao[];
  onAdicionar: (dados: {
    nome: string;
    instituicao: string;
    limite_disponivel: number;
    dia_vencimento: number;
  }) => Promise<void>;
  onRemover: (id: number) => Promise<void>;
}

const instituicoes = [
  "Nubank", "Itaú", "Bradesco", "Santander", "Banco do Brasil",
  "Caixa", "Inter", "C6 Bank", "PicPay", "Mercado Pago", "Neon", "Outra instituição",
];

const estilos: Record<string, { fundo: string; sigla: string }> = {
  Nubank: { fundo: "from-violet-700 via-purple-700 to-fuchsia-600", sigla: "nu" },
  "Itaú": { fundo: "from-orange-500 via-orange-600 to-blue-800", sigla: "itaú" },
  Bradesco: { fundo: "from-rose-600 via-red-600 to-red-800", sigla: "bradesco" },
  Santander: { fundo: "from-red-600 via-red-700 to-red-900", sigla: "santander" },
  "Banco do Brasil": { fundo: "from-yellow-400 via-yellow-500 to-blue-700", sigla: "BB" },
  Caixa: { fundo: "from-sky-500 via-blue-600 to-orange-500", sigla: "CAIXA" },
  Inter: { fundo: "from-orange-400 via-orange-500 to-orange-700", sigla: "inter" },
  "C6 Bank": { fundo: "from-neutral-700 via-neutral-900 to-black", sigla: "C6 BANK" },
  PicPay: { fundo: "from-emerald-400 via-emerald-500 to-green-700", sigla: "PicPay" },
  "Mercado Pago": { fundo: "from-sky-400 via-sky-500 to-blue-700", sigla: "mercado pago" },
  Neon: { fundo: "from-cyan-400 via-cyan-500 to-blue-600", sigla: "neon" },
};

const padrao = { fundo: "from-slate-600 via-slate-700 to-slate-900", sigla: "CARD" };
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CreditCardsPanel({ cartoes, carregando, movimentacoes, onAdicionar, onRemover }: Props) {
  const [nome, setNome] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [outraInstituicao, setOutraInstituicao] = useState("");
  const [limite, setLimite] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState<number | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);

  const instituicaoFinal = instituicao === "Outra instituição" ? outraInstituicao.trim() : instituicao;

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const valor = Number(limite.replace(/\s/g, "").replace(".", "").replace(",", "."));
    const dia = Number(vencimento);
    if (!nome.trim() || !instituicaoFinal || !Number.isFinite(valor) || valor < 0 || dia < 1 || dia > 31) return;

    setSalvando(true);
    try {
      await onAdicionar({ nome: nome.trim(), instituicao: instituicaoFinal, limite_disponivel: valor, dia_vencimento: dia });
      setNome(""); setInstituicao(""); setOutraInstituicao(""); setLimite(""); setVencimento("");
      setFormularioAberto(false);
    } catch {
      // O componente pai exibe a mensagem adequada sem limpar o formulário.
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number) {
    setRemovendo(id);
    try { await onRemover(id); } finally { setRemovendo(null); }
  }

  function cancelarCadastro() {
    setNome(""); setInstituicao(""); setOutraInstituicao(""); setLimite(""); setVencimento("");
    setFormularioAberto(false);
  }

  return (
    <section className="surface mt-6 overflow-hidden">
      <header className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><CreditCard size={22} /></span>
            <div>
              <p className="text-sm font-medium text-primary">Meus cartões</p>
              <h2 className="text-xl font-semibold">Limites e vencimentos</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tenha seus cartões e limites disponíveis sempre à vista.</p>
            </div>
          </div>
          {!formularioAberto && (
            <button type="button" onClick={() => setFormularioAberto(true)} disabled={cartoes.length >= 4} className="button-primary shrink-0">
              <Plus size={17} /> {cartoes.length >= 4 ? "Limite atingido" : "Criar novo cartão"}
            </button>
          )}
        </div>

        {formularioAberto && cartoes.length < 4 && (
        <form onSubmit={salvar} className="mt-5 grid animate-in gap-3 border-t border-border pt-5 fade-in slide-in-from-top-2 duration-300 md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1fr_.75fr_auto]">
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-nome">Nome do cartão</label>
            <input id="cartao-nome" className="control" maxLength={80} placeholder="Ex.: Cartão principal" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-banco">Instituição</label>
            <select id="cartao-banco" className="control" value={instituicao} onChange={(e) => setInstituicao(e.target.value)} required>
              <option value="">Selecione o banco</option>
              {instituicoes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-limite">Limite disponível</label>
            <input id="cartao-limite" className="control" inputMode="decimal" placeholder="R$ 0,00" value={limite} onChange={(e) => setLimite(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-vencimento">Vencimento</label>
            <select id="cartao-vencimento" className="control" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required>
              <option value="">Selecione o dia</option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((dia) => <option key={dia} value={dia}>Dia {dia}</option>)}
            </select>
          </div>
          <div className="flex gap-2 self-end xl:flex-col">
            <button className="button-primary flex-1" disabled={salvando || !nome || !instituicaoFinal || !limite || !vencimento}>
              <Plus size={17} /> {salvando ? "Salvando" : "Adicionar"}
            </button>
            <button type="button" onClick={cancelarCadastro} disabled={salvando} className="button-secondary flex-1">Cancelar</button>
          </div>
          {instituicao === "Outra instituição" && (
            <div className="field-group md:col-span-2 xl:col-span-5">
              <label className="field-label" htmlFor="cartao-outra-instituicao">Nome da instituição</label>
              <input id="cartao-outra-instituicao" className="control max-w-md" maxLength={80} placeholder="Digite o nome da instituição" value={outraInstituicao} onChange={(e) => setOutraInstituicao(e.target.value)} required />
            </div>
          )}
        </form>
        )}
      </header>

      {carregando ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Carregando cartões...</div>
      ) : cartoes.length === 0 ? (
        <div className="flex flex-col items-center p-8 text-center text-sm text-muted-foreground">
          <Building2 className="mb-3 opacity-50" size={30} />
          Nenhum cartão cadastrado. Use “Criar novo cartão” para começar.
        </div>
      ) : (
        <div className="flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain p-5 pr-[18vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-6 sm:pr-6 xl:grid-cols-4">
          {cartoes.map((cartao) => {
            const estilo = estilos[cartao.instituicao] ?? { ...padrao, sigla: cartao.instituicao };
            const fatura = movimentacoes
              .filter((mov) => mov.tipo === "despesa" && mov.forma_pagamento === "credito" && Number(mov.cartao_id) === cartao.id)
              .reduce((total, mov) => total + Number(mov.valor), 0);
            const limite = Number(cartao.limite_disponivel);
            const disponivel = Math.max(limite - fatura, 0);
            const uso = limite > 0 ? Math.min((fatura / limite) * 100, 100) : 0;
            return (
              <article key={cartao.id} className={`relative aspect-[1.586/1] min-h-48 w-[82vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${estilo.fundo} p-5 text-white shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:w-auto sm:max-w-none`}>
                <div className="absolute -right-12 -top-16 size-44 rounded-full bg-white/10" />
                <div className="absolute -bottom-24 -left-12 size-52 rounded-full bg-black/10" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs text-white/70">{cartao.nome}</p><p className="mt-1 max-w-40 truncate text-lg font-bold">{estilo.sigla}</p></div>
                    <button type="button" onClick={() => remover(cartao.id)} disabled={removendo === cartao.id} className="rounded-lg p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label={`Excluir ${cartao.nome}`}><Trash2 size={16} /></button>
                  </div>
                  <div className="flex items-center gap-3"><span className="h-8 w-10 rounded-md bg-gradient-to-br from-yellow-200 to-amber-400 shadow-inner" /><Wifi className="rotate-90 text-white/80" size={20} /></div>
                  <div>
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white/80 transition-[width]" style={{ width: `${uso}%` }} /></div>
                    <div className="flex items-end justify-between gap-3">
                      <div><p className="text-[10px] uppercase tracking-widest text-white/65">Fatura atual</p><p className="mt-0.5 text-lg font-semibold">{moeda.format(fatura)}</p><p className="text-[10px] text-white/70">{moeda.format(disponivel)} disponível</p></div>
                      <div className="text-right"><p className="text-[10px] uppercase tracking-widest text-white/65">Vence</p><p className="font-semibold">Dia {cartao.dia_vencimento}</p></div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
