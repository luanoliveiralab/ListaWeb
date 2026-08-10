"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Pause, Play, Plus, Target, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useUsuario } from "@/hooks/useUsuario";
import { useToast } from "@/providers/ToastProvider";
import { planejamentoService } from "@/services/planejamento.service";
import type { Meta, MetaMovimentacao, Recorrencia } from "@/types/Planejamento";
import type { Orcamento } from "@/types/Orcamento";
import type { Movimentacao } from "@/types/Movimentacao";
import BudgetPanel from "@/components/financas/BudgetPanel";
import PeriodSelector from "@/components/shared/PeriodSelector";
import { orcamentosService } from "@/services/orcamentos.service";
import { usePeriod } from "@/context/PeriodContext";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numeroMoeda = (valor: string) => Number(valor.includes(",") ? valor.replace(/\./g, "").replace(",", ".") : valor);
const categorias = ["Mercado", "Moradia", "Transporte", "Saúde", "Educação", "Lazer", "Salário", "Freelance", "Investimentos", "Outros"];

export default function PlanejamentoPage() {
  const { usuario } = useUsuario();
  const { mostrarAviso } = useToast();
  const { mes, ano, setMes, setAno } = usePeriod();
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [rec, setRec] = useState({ tipo: "despesa", descricao: "", valor: "", categoria: "", dia: "5" });
  const [meta, setMeta] = useState({ nome: "", valor_alvo: "", valor_atual: "", prazo: "" });
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [historico, setHistorico] = useState<MetaMovimentacao[]>([]);
  const [movimento, setMovimento] = useState({ tipo: "deposito", valor: "", observacao: "" });
  const [recorrenciaAberta, setRecorrenciaAberta] = useState(false);
  const [metaAberta, setMetaAberta] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    Promise.all([planejamentoService.buscarRecorrencias(), planejamentoService.buscarMetas()])
      .then(([listaRecorrencias, listaMetas]) => {
        setRecorrencias(listaRecorrencias);
        setMetas(listaMetas);
      })
      .catch(() => mostrarAviso("Não foi possível carregar o planejamento.", "erro"));
  }, [mostrarAviso, usuario]);

  useEffect(() => {
    if (!usuario?.id) return;

    Promise.all([
      orcamentosService.buscar(usuario.id, mes, ano),
      planejamentoService.gerarRecorrencias(mes, ano),
    ])
      .then(([listaOrcamentos, resposta]) => {
        setOrcamentos(listaOrcamentos);
        setMovimentacoes(resposta.movimentacoes);
      })
      .catch(() => mostrarAviso("Não foi possível carregar os orçamentos.", "erro"));
  }, [ano, mes, mostrarAviso, usuario?.id]);

  async function salvarOrcamento(categoriaOrcamento: string, valorOrcamento: number) {
    const salvo = await orcamentosService.salvar({ categoria: categoriaOrcamento, valor: valorOrcamento, mes, ano });
    setOrcamentos((atuais) => {
      const existe = atuais.some((item) => item.id === salvo.id);
      return existe
        ? atuais.map((item) => item.id === salvo.id ? salvo : item)
        : [...atuais, salvo].sort((a, b) => a.categoria.localeCompare(b.categoria));
    });
    mostrarAviso("Orçamento salvo com sucesso!");
  }

  async function removerOrcamento(id: number) {
    await orcamentosService.remover(id);
    setOrcamentos((atuais) => atuais.filter((item) => item.id !== id));
    mostrarAviso("Orçamento removido.");
  }

  async function criarRecorrencia(event: FormEvent) {
    event.preventDefault();
    try {
      const nova = await planejamentoService.criarRecorrencia({ ...rec, valor: Number(rec.valor.replace(",", ".")), dia: Number(rec.dia) });
      setRecorrencias((itens) => [nova, ...itens]);
      setRec({ tipo: "despesa", descricao: "", valor: "", categoria: "", dia: "5" });
      setRecorrenciaAberta(false);
      mostrarAviso("Recorrência criada.");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Dados inválidos.", "erro");
    }
  }

  async function criarMeta(event: FormEvent) {
    event.preventDefault();
    try {
      const nova = await planejamentoService.criarMeta({ nome: meta.nome.trim(), valor_alvo: numeroMoeda(meta.valor_alvo), valor_atual: meta.valor_atual ? numeroMoeda(meta.valor_atual) : 0, prazo: meta.prazo || null });
      setMetas((itens) => [nova, ...itens]);
      setMeta({ nome: "", valor_alvo: "", valor_atual: "", prazo: "" });
      setMetaAberta(false);
      mostrarAviso("Meta criada.");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Dados inválidos.", "erro");
    }
  }

  async function abrirMeta(item: Meta) {
    setMetaSelecionada(item);
    setMovimento({ tipo: "deposito", valor: "", observacao: "" });
    try { setHistorico(await planejamentoService.buscarHistoricoMeta(item.id)); }
    catch { setHistorico([]); }
  }

  async function movimentarMeta(event: FormEvent) {
    event.preventDefault();
    if (!metaSelecionada) return;
    try {
      const resposta = await planejamentoService.movimentarMeta(metaSelecionada.id, { ...movimento, valor: Number(movimento.valor.replace(",", ".")) });
      setMetas((lista) => lista.map((item) => item.id === resposta.meta.id ? resposta.meta : item));
      setMetaSelecionada(resposta.meta);
      setHistorico((lista) => [resposta.movimentacao, ...lista]);
      setMovimento({ tipo: "deposito", valor: "", observacao: "" });
      mostrarAviso("Valor da meta atualizado.");
    } catch (error) { mostrarAviso(error instanceof Error ? error.message : "Não foi possível atualizar a meta.", "erro"); }
  }

  if (!usuario) return <div className="page-loader"><div className="page-loader-indicator" /></div>;

  const metasConcluidas = metas.filter((item) => item.concluida).length;
  const recorrenciasAtivas = recorrencias.filter((item) => item.ativa).length;

  return (
    <AppLayout titulo="Planejamento" subtitulo="Automatize lançamentos e acompanhe seus objetivos." nome={usuario.nome}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="surface-interactive flex items-center gap-4 p-5">
          <span className="planning-summary-icon"><CalendarClock size={21} /></span>
          <div><p className="text-sm text-muted-foreground">Recorrências ativas</p><strong className="text-2xl">{recorrenciasAtivas}</strong></div>
        </div>
        <div className="surface-interactive flex items-center gap-4 p-5">
          <span className="planning-summary-icon"><CheckCircle2 size={21} /></span>
          <div><p className="text-sm text-muted-foreground">Metas concluídas</p><strong className="text-2xl">{metasConcluidas} <small className="text-sm font-normal text-muted-foreground">de {metas.length}</small></strong></div>
        </div>
      </div>

      <PeriodSelector mes={mes} ano={ano} onMesChange={setMes} onAnoChange={setAno} />

      <BudgetPanel
        orcamentos={orcamentos}
        movimentacoes={movimentacoes}
        onSalvar={salvarOrcamento}
        onRemover={removerOrcamento}
      />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${recorrenciaAberta ? "mb-6" : ""}`}>
            <div><h2 className="section-title flex items-center gap-2"><CalendarClock size={21} /> Recorrências mensais</h2><p className="section-description">Cadastre contas e recebimentos que se repetem todos os meses.</p></div>
            {!recorrenciaAberta && <button type="button" onClick={() => setRecorrenciaAberta(true)} className="button-primary shrink-0"><Plus size={17} /> Criar recorrência</button>}
          </div>
          {recorrenciaAberta && <form onSubmit={criarRecorrencia} className="form-grid animate-in border-t border-border pt-5 fade-in slide-in-from-top-2 duration-300">
            <div className="field-group"><label className="field-label" htmlFor="tipo-recorrencia">Tipo</label><select id="tipo-recorrencia" className="control" value={rec.tipo} onChange={(e) => setRec({ ...rec, tipo: e.target.value })}><option value="despesa">Despesa</option><option value="receita">Receita</option></select></div>
            <div className="field-group"><label className="field-label" htmlFor="descricao-recorrencia">Descrição</label><input id="descricao-recorrencia" className="control" placeholder="Ex.: Aluguel" value={rec.descricao} onChange={(e) => setRec({ ...rec, descricao: e.target.value })} required /></div>
            <div className="field-group"><label className="field-label" htmlFor="valor-recorrencia">Valor (R$)</label><input id="valor-recorrencia" className="control" placeholder="R$ 0,00" inputMode="decimal" value={rec.valor} onChange={(e) => setRec({ ...rec, valor: e.target.value })} required /></div>
            <div className="field-group"><label className="field-label" htmlFor="categoria-recorrencia">Categoria</label><select id="categoria-recorrencia" className="control" value={rec.categoria} onChange={(e) => setRec({ ...rec, categoria: e.target.value })} required><option value="" disabled>Selecionar categoria</option>{categorias.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}</select></div>
            <div className="field-group"><label className="field-label" htmlFor="dia-recorrencia">Dia do lançamento</label><input id="dia-recorrencia" className="control" type="number" min="1" max="28" value={rec.dia} onChange={(e) => setRec({ ...rec, dia: e.target.value })} /></div>
            <div className="expandable-form-actions md:col-span-2"><button type="button" onClick={() => { setRec({ tipo: "despesa", descricao: "", valor: "", categoria: "", dia: "5" }); setRecorrenciaAberta(false); }} className="button-secondary">Cancelar</button><button className="button-primary"><Plus size={17} /> Adicionar recorrência</button></div>
          </form>}

          <div className="planning-list">
            {recorrencias.map((item) => {
              const TipoIcon = item.tipo === "receita" ? TrendingUp : TrendingDown;
              return <article key={item.id} className={`planning-row ${!item.ativa ? "planning-row-muted" : ""}`}>
                <span className={`planning-kind ${item.tipo}`}><TipoIcon size={18} /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="truncate">{item.descricao}</strong><span className={`status-pill ${item.ativa ? "active" : "paused"}`}>{item.ativa ? "Ativa" : "Pausada"}</span></div><p className="planning-detail">{item.categoria} <span>•</span> todo dia {item.dia}</p></div>
                <strong className={item.tipo === "receita" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{item.tipo === "receita" ? "+" : "−"}{moeda.format(Number(item.valor))}</strong>
                <div className="flex gap-1"><button type="button" className="icon-button" aria-label={item.ativa ? "Pausar recorrência" : "Ativar recorrência"} onClick={async () => { const atualizado = await planejamentoService.alternarRecorrencia(item.id, !item.ativa); setRecorrencias((lista) => lista.map((r) => r.id === item.id ? atualizado : r)); }}>{item.ativa ? <Pause size={17} /> : <Play size={17} />}</button><button type="button" className="icon-button text-destructive" aria-label="Excluir recorrência" onClick={async () => { await planejamentoService.removerRecorrencia(item.id); setRecorrencias((lista) => lista.filter((r) => r.id !== item.id)); }}><Trash2 size={17} /></button></div>
              </article>;
            })}
            {!recorrencias.length && <p className="empty-state">Nenhuma recorrência cadastrada.</p>}
          </div>
        </section>

        <section className="surface p-5 sm:p-6">
          <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${metaAberta ? "mb-6" : ""}`}>
            <div><h2 className="section-title flex items-center gap-2"><Target size={21} /> Metas financeiras</h2><p className="section-description">Transforme seus objetivos em valores claros e acompanhe cada avanço.</p></div>
            {!metaAberta && <button type="button" onClick={() => setMetaAberta(true)} className="button-primary shrink-0"><Plus size={17} /> Criar meta</button>}
          </div>
          {metaAberta && <form onSubmit={criarMeta} className="form-grid animate-in border-t border-border pt-5 fade-in slide-in-from-top-2 duration-300">
            <div className="field-group"><label className="field-label" htmlFor="nome-meta">Nome da meta</label><input id="nome-meta" className="control" placeholder="Ex.: Reserva de emergência" value={meta.nome} onChange={(e) => setMeta({ ...meta, nome: e.target.value })} required /></div>
            <div className="field-group"><label className="field-label" htmlFor="alvo-meta">Valor alvo (R$)</label><input id="alvo-meta" className="control" placeholder="R$ 0,00" inputMode="decimal" value={meta.valor_alvo} onChange={(e) => setMeta({ ...meta, valor_alvo: e.target.value })} required /></div>
            <div className="field-group"><label className="field-label" htmlFor="atual-meta">Valor já guardado (R$)</label><input id="atual-meta" className="control" placeholder="R$ 0,00" inputMode="decimal" value={meta.valor_atual} onChange={(e) => setMeta({ ...meta, valor_atual: e.target.value })} /></div>
            <div className="field-group"><label className="field-label" htmlFor="prazo-meta">Prazo opcional</label><input id="prazo-meta" className="control [color-scheme:light] dark:[color-scheme:dark]" type="date" value={meta.prazo} onChange={(e) => setMeta({ ...meta, prazo: e.target.value })} /></div>
            <div className="expandable-form-actions md:col-span-2"><button type="button" onClick={() => { setMeta({ nome: "", valor_alvo: "", valor_atual: "", prazo: "" }); setMetaAberta(false); }} className="button-secondary">Cancelar</button><button className="button-primary"><Plus size={17} /> Salvar meta</button></div>
          </form>}

          <div className="planning-list">
            {metas.map((item) => {
              const progresso = Math.min(100, Math.round(Number(item.valor_atual) / Number(item.valor_alvo) * 100));
              return <article key={item.id} className="planning-goal">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-base">{item.nome}</strong>{item.concluida && <span className="status-pill active">Concluída</span>}</div><p className="planning-detail mt-1">{item.prazo ? `Prazo: ${new Date(`${item.prazo.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}` : "Sem prazo definido"}</p></div><button type="button" className="icon-button text-destructive" aria-label="Excluir meta" onClick={async () => { await planejamentoService.removerMeta(item.id); setMetas((lista) => lista.filter((m) => m.id !== item.id)); }}><Trash2 size={17} /></button></div>
                <div className="mt-4 flex items-end justify-between gap-3"><div><span className="text-xs text-muted-foreground">Valor acumulado</span><p className="font-semibold">{moeda.format(Number(item.valor_atual))} <span className="text-sm font-normal text-muted-foreground">de {moeda.format(Number(item.valor_alvo))}</span></p></div><strong className="text-primary">{progresso}%</strong></div>
                <div className="progress-track" aria-label={`${progresso}% concluído`}><span style={{ width: `${progresso}%` }} /></div>
                <button type="button" className="button-secondary mt-3 w-full" onClick={() => abrirMeta(item)}>Movimentar e ver histórico</button>
              </article>;
            })}
            {!metas.length && <p className="empty-state">Crie sua primeira meta financeira.</p>}
          </div>
        </section>
      </div>

      {metaSelecionada && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setMetaSelecionada(null); }}><div className="modal-panel max-w-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Meta financeira</p><h2 className="text-xl font-semibold">{metaSelecionada.nome}</h2><p className="mt-1 text-sm text-muted-foreground">Acumulado: {moeda.format(Number(metaSelecionada.valor_atual))}</p></div><button className="icon-button" onClick={() => setMetaSelecionada(null)} aria-label="Fechar">×</button></div><form onSubmit={movimentarMeta} className="mt-6 grid gap-4 sm:grid-cols-2"><div className="field-group"><label className="field-label">Operação</label><select className="control" value={movimento.tipo} onChange={(e) => setMovimento({ ...movimento, tipo: e.target.value })}><option value="deposito">Adicionar valor</option><option value="retirada">Retirar valor</option></select></div><div className="field-group"><label className="field-label">Valor (R$)</label><input className="control" inputMode="decimal" placeholder="R$ 0,00" value={movimento.valor} onChange={(e) => setMovimento({ ...movimento, valor: e.target.value })} required /></div><div className="field-group sm:col-span-2"><label className="field-label">Observação opcional</label><input className="control" maxLength={255} placeholder="Ex.: economia do mês" value={movimento.observacao} onChange={(e) => setMovimento({ ...movimento, observacao: e.target.value })} /></div><button className="button-primary sm:col-span-2">Registrar movimentação</button></form><div className="mt-6 border-t border-border pt-5"><h3 className="font-semibold">Histórico</h3><div className="mt-3 max-h-56 space-y-2 overflow-y-auto">{historico.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-sm"><div><p className="font-medium">{item.observacao || (item.tipo === "deposito" ? "Valor adicionado" : "Valor retirado")}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("pt-BR")}</p></div><strong className={item.tipo === "deposito" ? "text-emerald-600" : "text-rose-600"}>{item.tipo === "deposito" ? "+" : "−"}{moeda.format(Number(item.valor))}</strong></div>)}{!historico.length && <p className="py-5 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>}</div></div></div></div>}
    </AppLayout>
  );
}
