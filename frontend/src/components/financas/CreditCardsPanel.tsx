"use client";

import { useState } from "react";
import { Building2, CreditCard, Pencil, Plus, ReceiptText, Trash2, Wifi, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { Cartao } from "@/types/Cartao";
import type { Movimentacao } from "@/types/Movimentacao";
import type { FaturaCartao } from "@/types/Cartao";
import { cartoesService } from "@/services/cartoes.service";
import { useToast } from "@/providers/ToastProvider";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import AppSelect from "@/components/shared/AppSelect";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface Props {
  cartoes: Cartao[];
  carregando?: boolean;
  movimentacoes: Movimentacao[];
  onAdicionar: (dados: {
    nome: string;
    instituicao: string;
    limite_disponivel: number;
    dia_vencimento: number;
    dia_fechamento?: number;
  }) => Promise<void>;
  onEditar: (id: number, dados: { nome: string; instituicao: string; limite_disponivel: number; dia_vencimento: number; dia_fechamento?: number }) => Promise<void>;
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

export default function CreditCardsPanel({ cartoes, carregando, movimentacoes, onAdicionar, onEditar, onRemover }: Props) {
  const queryClient = useQueryClient();
  const { mostrarAviso } = useToast();
  const [nome, setNome] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [outraInstituicao, setOutraInstituicao] = useState("");
  const [limite, setLimite] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [fechamento, setFechamento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState<number | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null);
  const [cartaoFaturas, setCartaoFaturas] = useState<Cartao | null>(null);
  const [faturaSelecionada, setFaturaSelecionada] = useState<FaturaCartao | null>(null);
  const [alterandoFatura, setAlterandoFatura] = useState(false);
  const [confirmacao, setConfirmacao] = useState<{ tipo: "cartao"; cartao: Cartao } | { tipo: "fatura"; acao: "fechar" | "pagar" } | null>(null);
  const faturaDialogRef = useAccessibleDialog(Boolean(cartaoFaturas), () => setCartaoFaturas(null));
  const faturasQuery = useQuery({
    queryKey: ["faturas", cartaoFaturas?.id],
    queryFn: () => cartoesService.listarFaturas(cartaoFaturas!.id),
    enabled: Boolean(cartaoFaturas?.id),
  });
  const detalheQuery = useQuery({
    queryKey: ["fatura", cartaoFaturas?.id, faturaSelecionada?.ano, faturaSelecionada?.mes],
    queryFn: () => cartoesService.detalharFatura(cartaoFaturas!.id, faturaSelecionada!.ano, faturaSelecionada!.mes),
    enabled: Boolean(cartaoFaturas?.id && faturaSelecionada),
  });

  const instituicaoFinal = instituicao === "Outra instituição" ? outraInstituicao.trim() : instituicao;

  async function alterarStatusFatura(acao: "fechar" | "pagar") {
    if (!cartaoFaturas || !faturaSelecionada) return;
    setAlterandoFatura(true);
    try {
      if (acao === "fechar") await cartoesService.fecharFatura(cartaoFaturas.id, faturaSelecionada.ano, faturaSelecionada.mes);
      else await cartoesService.pagarFatura(cartaoFaturas.id, faturaSelecionada.ano, faturaSelecionada.mes);
      await queryClient.invalidateQueries({ queryKey: ["faturas", cartaoFaturas.id] });
      await queryClient.invalidateQueries({ queryKey: ["financas"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      const faturas = await cartoesService.listarFaturas(cartaoFaturas.id);
      queryClient.setQueryData(["faturas", cartaoFaturas.id], faturas);
      setFaturaSelecionada(faturas.find((item) => item.ano === faturaSelecionada.ano && item.mes === faturaSelecionada.mes) ?? null);
      mostrarAviso(acao === "fechar" ? "Fatura fechada com sucesso." : "Fatura paga pelo saldo.");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível atualizar a fatura.", "erro");
    } finally {
      setAlterandoFatura(false);
    }
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const valor = Number(limite.replace(/\s/g, "").replace(".", "").replace(",", "."));
    const dia = Number(vencimento);
    if (!nome.trim() || !instituicaoFinal || !Number.isFinite(valor) || valor < 0 || dia < 1 || dia > 31) return;

    setSalvando(true);
    try {
      const dados = { nome: nome.trim(), instituicao: instituicaoFinal, limite_disponivel: valor, dia_vencimento: dia, dia_fechamento: Number(fechamento || Math.max(1, dia - 7)) };
      if (cartaoEditando) await onEditar(cartaoEditando.id, dados);
      else await onAdicionar(dados);
      setNome(""); setInstituicao(""); setOutraInstituicao(""); setLimite(""); setVencimento(""); setFechamento("");
      setCartaoEditando(null);
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

  async function confirmarAcao() {
    if (!confirmacao) return;
    if (confirmacao.tipo === "cartao") await remover(confirmacao.cartao.id);
    else await alterarStatusFatura(confirmacao.acao);
    setConfirmacao(null);
  }

  function cancelarCadastro() {
    setNome(""); setInstituicao(""); setOutraInstituicao(""); setLimite(""); setVencimento(""); setFechamento("");
    setCartaoEditando(null);
    setFormularioAberto(false);
  }

  function abrirEdicao(cartao: Cartao) {
    const instituicaoConhecida = instituicoes.includes(cartao.instituicao);
    setCartaoEditando(cartao);
    setNome(cartao.nome);
    setInstituicao(instituicaoConhecida ? cartao.instituicao : "Outra instituição");
    setOutraInstituicao(instituicaoConhecida ? "" : cartao.instituicao);
    setLimite(String(cartao.limite_disponivel));
    setFechamento(String(cartao.dia_fechamento ?? Math.max(1, cartao.dia_vencimento - 7)));
    setVencimento(String(cartao.dia_vencimento));
    setFormularioAberto(true);
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

        {formularioAberto && (cartoes.length < 4 || Boolean(cartaoEditando)) && (
        <form onSubmit={salvar} className="mt-5 grid animate-in gap-3 border-t border-border pt-5 fade-in slide-in-from-top-2 duration-300 md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1fr_.75fr_auto]">
          {cartaoEditando && <p className="md:col-span-2 xl:col-span-5 text-sm font-semibold">Editando {cartaoEditando.nome}</p>}
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-nome">Nome do cartão</label>
            <input id="cartao-nome" className="control" maxLength={80} placeholder="Ex.: Cartão principal" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-banco">Instituição</label>
            <AppSelect id="cartao-banco" value={instituicao} onValueChange={setInstituicao} placeholder="Selecione o banco" options={instituicoes.map((item) => ({ value: item, label: item }))} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-limite">Limite disponível</label>
            <input id="cartao-limite" className="control" inputMode="decimal" placeholder="R$ 0,00" value={limite} onChange={(e) => setLimite(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-fechamento">Fechamento</label>
            <AppSelect id="cartao-fechamento" value={fechamento} onValueChange={setFechamento} placeholder="Selecione o dia" options={Array.from({ length: 31 }, (_, index) => ({ value: String(index + 1), label: `Dia ${index + 1}` }))} required />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="cartao-vencimento">Vencimento</label>
            <AppSelect id="cartao-vencimento" value={vencimento} onValueChange={setVencimento} placeholder="Selecione o dia" options={Array.from({ length: 31 }, (_, index) => ({ value: String(index + 1), label: `Dia ${index + 1}` }))} required />
          </div>
          {instituicao === "Outra instituição" && (
            <div className="field-group md:col-span-2 xl:col-span-5">
              <label className="field-label" htmlFor="cartao-outra-instituicao">Nome da instituição</label>
              <input id="cartao-outra-instituicao" className="control max-w-md" maxLength={80} placeholder="Digite o nome da instituição" value={outraInstituicao} onChange={(e) => setOutraInstituicao(e.target.value)} required />
            </div>
          )}
          <div className="expandable-form-actions md:col-span-2 xl:col-span-5">
            <button type="button" onClick={cancelarCadastro} disabled={salvando} className="button-secondary">Cancelar</button>
            <button className="button-primary" disabled={salvando || !nome || !instituicaoFinal || !limite || !vencimento}>
              {cartaoEditando ? <Pencil size={17} /> : <Plus size={17} />} {salvando ? "Salvando" : cartaoEditando ? "Salvar alterações" : "Adicionar cartão"}
            </button>
          </div>
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
        <div className="flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain p-5 pr-[18vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:w-full sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:p-6 sm:pr-6 xl:grid-cols-[repeat(4,minmax(0,1fr))] xl:px-7">
          {cartoes.map((cartao) => {
            const estilo = estilos[cartao.instituicao] ?? { ...padrao, sigla: cartao.instituicao };
            const faturaDoPeriodo = movimentacoes
              .filter((mov) => mov.tipo === "despesa" && mov.forma_pagamento === "credito" && Number(mov.cartao_id) === cartao.id)
              .reduce((total, mov) => total + Number(mov.valor), 0);
            const fatura = cartao.fatura_atual === undefined ? faturaDoPeriodo : Number(cartao.fatura_atual);
            const limite = Number(cartao.limite_disponivel);
            const utilizado = cartao.limite_utilizado === undefined ? fatura : Number(cartao.limite_utilizado);
            const disponivel = Math.max(limite - utilizado, 0);
            const uso = limite > 0 ? Math.min((utilizado / limite) * 100, 100) : 0;
            return (
              <article key={cartao.id} className={`relative aspect-[1.586/1] min-h-48 w-[82vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${estilo.fundo} p-5 text-white shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-h-0 sm:min-w-0 sm:w-auto sm:max-w-none`}>
                <div className="absolute -right-12 -top-16 size-44 rounded-full bg-white/10" />
                <div className="absolute -bottom-24 -left-12 size-52 rounded-full bg-black/10" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs text-white/70">{cartao.nome}</p><p className="mt-1 max-w-40 truncate text-lg font-bold">{estilo.sigla}</p></div>
                    <div className="flex gap-1"><button type="button" onClick={() => { setCartaoFaturas(cartao); setFaturaSelecionada(null); }} className="rounded-lg p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label={`Ver faturas de ${cartao.nome}`}><ReceiptText size={16} /></button><button type="button" onClick={() => abrirEdicao(cartao)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label={`Editar ${cartao.nome}`}><Pencil size={16} /></button><button type="button" onClick={() => setConfirmacao({ tipo: "cartao", cartao })} disabled={removendo === cartao.id} className="rounded-lg p-2 text-white/70 transition hover:bg-white/15 hover:text-white" aria-label={`Excluir ${cartao.nome}`}><Trash2 size={16} /></button></div>
                  </div>
                  <div className="flex items-center gap-3"><span className="h-8 w-10 rounded-md bg-gradient-to-br from-yellow-200 to-amber-400 shadow-inner" /><Wifi className="rotate-90 text-white/80" size={20} /></div>
                  <div>
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white/80 transition-[width]" style={{ width: `${uso}%` }} /></div>
                    <div className="flex items-end justify-between gap-3">
                      <div><p className="text-[10px] uppercase tracking-widest text-white/65">Fatura atual</p><p className="mt-0.5 text-lg font-semibold">{moeda.format(fatura)}</p><p className="text-[10px] text-white/70">{moeda.format(disponivel)} disponível</p></div>
                      <div className="text-right"><p className="text-[10px] uppercase tracking-widest text-white/65">Fecha / vence</p><p className="font-semibold">{cartao.dia_fechamento ?? Math.max(1, cartao.dia_vencimento - 7)} / {cartao.dia_vencimento}</p></div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {cartaoFaturas && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartaoFaturas(null); }}>
          <div ref={faturaDialogRef} className="modal-panel max-w-3xl" role="dialog" aria-modal="true" aria-labelledby="titulo-faturas-cartao" tabIndex={-1}>
            <header className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-medium text-primary">Histórico do cartão</p><h2 id="titulo-faturas-cartao" className="mt-1 text-xl font-semibold">Faturas de {cartaoFaturas.nome}</h2><p className="mt-1 text-sm text-muted-foreground">{cartaoFaturas.instituicao} · vence no dia {cartaoFaturas.dia_vencimento}</p></div>
              <button type="button" className="icon-button" onClick={() => setCartaoFaturas(null)} aria-label="Fechar histórico de faturas"><X size={18} /></button>
            </header>

            <div className="mt-6 grid gap-5 md:grid-cols-[minmax(13rem,.75fr)_minmax(0,1.25fr)]">
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {faturasQuery.isPending && <p className="p-4 text-sm text-muted-foreground">Carregando faturas...</p>}
                {faturasQuery.data?.map((fatura) => {
                  const ativa = faturaSelecionada?.ano === fatura.ano && faturaSelecionada?.mes === fatura.mes;
                  return <button type="button" key={`${fatura.ano}-${fatura.mes}`} onClick={() => setFaturaSelecionada(fatura)} className={`w-full rounded-xl border p-3 text-left transition ${ativa ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}><div className="flex items-center justify-between gap-2"><strong className="capitalize">{new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(fatura.ano, fatura.mes - 1, 1))}</strong><span className={`status-pill ${fatura.status === "paga" ? "active" : fatura.status === "fechada" ? "paused" : ""}`}>{fatura.status}</span></div><p className="mt-2 text-lg font-semibold tabular-nums">{moeda.format(Number(fatura.total))}</p><p className="mt-1 text-xs text-muted-foreground">{fatura.quantidade} {fatura.quantidade === 1 ? "compra" : "compras"}</p></button>;
                })}
              </div>

              <div className="min-h-64 rounded-2xl border border-border bg-muted/20 p-4">
                {!faturaSelecionada ? <div className="flex h-full min-h-56 items-center justify-center text-center text-sm text-muted-foreground">Selecione uma fatura para visualizar as compras.</div> : detalheQuery.isPending ? <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">Carregando compras...</div> : <><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Total da fatura</p><strong className="text-xl tabular-nums">{moeda.format(Number(faturaSelecionada.total))}</strong></div><span className="text-xs text-muted-foreground">{faturaSelecionada.quantidade} lançamentos</span></div><div className="max-h-64 divide-y divide-border overflow-y-auto">{detalheQuery.data?.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.descricao}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.categoria} · {new Date(`${item.data.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}</p></div><strong className="shrink-0 text-sm tabular-nums">{moeda.format(Number(item.valor))}</strong></div>)}{!detalheQuery.data?.length && <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma compra nesta fatura.</p>}</div>{faturaSelecionada.status !== "paga" && <div className="mt-4 flex justify-end border-t border-border pt-4"><button type="button" disabled={alterandoFatura || !faturaSelecionada.quantidade} onClick={() => setConfirmacao({ tipo: "fatura", acao: faturaSelecionada.status === "aberta" ? "fechar" : "pagar" })} className="button-primary">{alterandoFatura ? "Processando..." : faturaSelecionada.status === "aberta" ? "Fechar fatura" : "Pagar pelo saldo"}</button></div>}</>}
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmationDialog aberto={Boolean(confirmacao)} titulo={confirmacao?.tipo === "cartao" ? "Excluir este cartão?" : confirmacao?.acao === "fechar" ? "Fechar esta fatura?" : "Pagar esta fatura pelo saldo?"} descricao={confirmacao?.tipo === "cartao" ? <>O cartão <strong>{confirmacao.cartao.nome}</strong> e o histórico de suas faturas serão removidos. Compras existentes permanecerão nas movimentações.</> : confirmacao?.acao === "fechar" ? <>A fatura de <strong>{faturaSelecionada ? moeda.format(Number(faturaSelecionada.total)) : ""}</strong> será fechada e não aceitará novas compras.</> : <>O valor de <strong>{faturaSelecionada ? moeda.format(Number(faturaSelecionada.total)) : ""}</strong> será descontado do saldo e registrado como movimentação.</>} confirmar={confirmacao?.tipo === "cartao" ? "Sim, excluir cartão" : confirmacao?.acao === "fechar" ? "Sim, fechar fatura" : "Sim, pagar fatura"} processando={Boolean(removendo) || alterandoFatura} onConfirmar={confirmarAcao} onAlterar={(aberto) => { if (!aberto) setConfirmacao(null); }} />
    </section>
  );
}
