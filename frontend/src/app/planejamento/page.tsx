"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useCategorias } from "@/hooks/useCategorias";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numeroMoeda = (valor: string) => Number(valor.includes(",") ? valor.replace(/\./g, "").replace(",", ".") : valor);

export default function PlanejamentoPage() {
  const { usuario } = useUsuario();
  const { mostrarAviso } = useToast();
  const { mes, ano, setMes, setAno } = usePeriod();
  const queryClient = useQueryClient();
  const [rec, setRec] = useState({ tipo: "despesa", descricao: "", valor: "", categoria: "", dia: "5" });
  const { categorias } = useCategorias(rec.tipo as "receita" | "despesa");
  const [meta, setMeta] = useState({ nome: "", valor_alvo: "", valor_atual: "", prazo: "" });
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [historico, setHistorico] = useState<MetaMovimentacao[]>([]);
  const [movimento, setMovimento] = useState({ tipo: "deposito", valor: "", observacao: "" });
  const [recorrenciaAberta, setRecorrenciaAberta] = useState(false);
  const [metaAberta, setMetaAberta] = useState(false);
  const [exclusao, setExclusao] = useState<{ tipo: "recorrencia"; item: Recorrencia } | { tipo: "meta"; item: Meta } | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const recorrenciasKey = ["recorrencias", usuario?.id] as const;
  const metasKey = ["metas", usuario?.id] as const;
  const orcamentosKey = ["orcamentos", usuario?.id, ano, mes] as const;
  const movimentacoesKey = ["financas", usuario?.id, ano, mes] as const;
  const recorrenciasQuery = useQuery<Recorrencia[]>({ queryKey: recorrenciasKey, queryFn: planejamentoService.buscarRecorrencias, enabled: Boolean(usuario?.id) });
  const metasQuery = useQuery<Meta[]>({ queryKey: metasKey, queryFn: planejamentoService.buscarMetas, enabled: Boolean(usuario?.id) });
  const orcamentosQuery = useQuery<Orcamento[]>({ queryKey: orcamentosKey, queryFn: () => orcamentosService.buscar(usuario!.id, mes, ano), enabled: Boolean(usuario?.id) });
  const movimentacoesQuery = useQuery<Movimentacao[]>({ queryKey: movimentacoesKey, queryFn: async () => (await planejamentoService.gerarRecorrencias(mes, ano)).movimentacoes, enabled: Boolean(usuario?.id) });
  const recorrencias = recorrenciasQuery.data ?? [];
  const metas = metasQuery.data ?? [];
  const orcamentos = orcamentosQuery.data ?? [];
  const movimentacoes = movimentacoesQuery.data ?? [];
  const erroCarregamento = recorrenciasQuery.error || metasQuery.error || orcamentosQuery.error || movimentacoesQuery.error;

  useEffect(() => {
    if (erroCarregamento) mostrarAviso("Não foi possível carregar o planejamento.", "erro");
  }, [erroCarregamento, mostrarAviso]);

  function atualizarRecorrencias(atualizar: (atuais: Recorrencia[]) => Recorrencia[]) {
    queryClient.setQueryData<Recorrencia[]>(recorrenciasKey, (atuais = []) => atualizar(atuais));
  }
  function atualizarMetas(atualizar: (atuais: Meta[]) => Meta[]) {
    queryClient.setQueryData<Meta[]>(metasKey, (atuais = []) => atualizar(atuais));
  }
  function atualizarOrcamentos(atualizar: (atuais: Orcamento[]) => Orcamento[]) {
    queryClient.setQueryData<Orcamento[]>(orcamentosKey, (atuais = []) => atualizar(atuais));
  }
  function sincronizarFinancas() {
    queryClient.invalidateQueries({ queryKey: ["financas", usuario?.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", usuario?.id] });
  }

  async function salvarOrcamento(categoriaOrcamento: string, valorOrcamento: number) {
    const salvo = await orcamentosService.salvar({ categoria: categoriaOrcamento, valor: valorOrcamento, mes, ano });
    atualizarOrcamentos((atuais) => {
      const existe = atuais.some((item) => item.id === salvo.id);
      return existe
        ? atuais.map((item) => item.id === salvo.id ? salvo : item)
        : [...atuais, salvo].sort((a, b) => a.categoria.localeCompare(b.categoria));
    });
    mostrarAviso("Orçamento salvo com sucesso!");
  }

  async function removerOrcamento(id: number) {
    await orcamentosService.remover(id);
    atualizarOrcamentos((atuais) => atuais.filter((item) => item.id !== id));
    mostrarAviso("Orçamento removido.");
  }

  async function confirmarExclusao() {
    if (!exclusao) return;
    setExcluindo(true);
    try {
      if (exclusao.tipo === "recorrencia") {
        await planejamentoService.removerRecorrencia(exclusao.item.id);
        atualizarRecorrencias((lista) => lista.filter((item) => item.id !== exclusao.item.id));
        sincronizarFinancas();
        mostrarAviso("Recorrência excluída.");
      } else {
        await planejamentoService.removerMeta(exclusao.item.id);
        atualizarMetas((lista) => lista.filter((item) => item.id !== exclusao.item.id));
        if (metaSelecionada?.id === exclusao.item.id) setMetaSelecionada(null);
        mostrarAviso("Meta excluída.");
      }
      setExclusao(null);
    } catch (error) { mostrarAviso(error instanceof Error ? error.message : "Não foi possível concluir a exclusão.", "erro"); }
    finally { setExcluindo(false); }
  }

  async function criarRecorrencia(event: FormEvent) {
    event.preventDefault();
    try {
      const nova = await planejamentoService.criarRecorrencia({ ...rec, valor: Number(rec.valor.replace(",", ".")), dia: Number(rec.dia) });
      atualizarRecorrencias((itens) => [nova, ...itens]);
      sincronizarFinancas();
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
      atualizarMetas((itens) => [nova, ...itens]);
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
      atualizarMetas((lista) => lista.map((item) => item.id === resposta.meta.id ? resposta.meta : item));
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
            <div className="field-group"><label className="field-label" htmlFor="categoria-recorrencia">Categoria</label><select id="categoria-recorrencia" className="control" value={rec.categoria} onChange={(e) => setRec({ ...rec, categoria: e.target.value })} required><option value="" disabled>Selecionar categoria</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.nome}>{categoria.nome}</option>)}</select></div>
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
                <div className="flex gap-1"><button type="button" className="icon-button" aria-label={item.ativa ? "Pausar recorrência" : "Ativar recorrência"} onClick={async () => { const atualizado = await planejamentoService.alternarRecorrencia(item.id, !item.ativa); atualizarRecorrencias((lista) => lista.map((r) => r.id === item.id ? atualizado : r)); sincronizarFinancas(); }}>{item.ativa ? <Pause size={17} /> : <Play size={17} />}</button><button type="button" className="icon-button text-destructive" aria-label={`Excluir recorrência ${item.descricao}`} onClick={() => setExclusao({ tipo: "recorrencia", item })}><Trash2 size={17} /></button></div>
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
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-base">{item.nome}</strong>{item.concluida && <span className="status-pill active">Concluída</span>}</div><p className="planning-detail mt-1">{item.prazo ? `Prazo: ${new Date(`${item.prazo.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}` : "Sem prazo definido"}</p></div><button type="button" className="icon-button text-destructive" aria-label={`Excluir meta ${item.nome}`} onClick={() => setExclusao({ tipo: "meta", item })}><Trash2 size={17} /></button></div>
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
      <ConfirmationDialog aberto={Boolean(exclusao)} titulo={exclusao?.tipo === "meta" ? "Excluir esta meta?" : "Excluir esta recorrência?"} descricao={exclusao?.tipo === "meta" ? <>A meta <strong>{exclusao.item.nome}</strong> e todo o histórico de valores associados serão removidos permanentemente.</> : <>A recorrência <strong>{exclusao?.item.descricao}</strong> deixará de gerar novas movimentações. Lançamentos já criados serão preservados.</>} confirmar={exclusao?.tipo === "meta" ? "Sim, excluir meta" : "Sim, excluir recorrência"} processando={excluindo} textoProcessando="Excluindo..." onConfirmar={confirmarExclusao} onAlterar={(aberto) => { if (!aberto) setExclusao(null); }} />
    </AppLayout>
  );
}
