"use client";

import { FormEvent, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";

import AppSelect from "@/components/shared/AppSelect";
import { useCategorias } from "@/hooks/useCategorias";
import { useToast } from "@/providers/ToastProvider";
import { financasService } from "@/services/financas.service";
import type { Cartao } from "@/types/Cartao";

interface Props {
  usuarioId: number;
  cartoes: Cartao[];
  onProgramada: () => void;
}

function criarFormularioInicial() {
  return {
    tipo: "despesa" as "receita" | "despesa",
    descricao: "",
    valor: "",
    categoria: "",
    data: new Date().toISOString().slice(0, 10),
    forma_pagamento: "saldo" as "saldo" | "credito",
    cartao_id: "",
  };
}

export default function ScheduledMovementsPanel({ usuarioId, cartoes, onProgramada }: Props) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formulario, setFormulario] = useState(criarFormularioInicial);
  const { categorias } = useCategorias(formulario.tipo, "financas");
  const { mostrarAviso } = useToast();
  const hoje = new Date().toISOString().slice(0, 10);

  function cancelar() {
    setFormulario(criarFormularioInicial());
    setAberto(false);
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    const valor = Number(formulario.valor.replace(",", "."));
    if (!formulario.descricao.trim() || !formulario.categoria || !formulario.data || !Number.isFinite(valor) || valor <= 0) {
      mostrarAviso("Preencha descrição, valor, categoria e data.", "erro");
      return;
    }
    if (formulario.tipo === "despesa" && formulario.forma_pagamento === "credito" && !formulario.cartao_id) {
      mostrarAviso("Selecione o cartão que será usado.", "erro");
      return;
    }

    setSalvando(true);
    try {
      await financasService.programar({
        usuario_id: usuarioId,
        tipo: formulario.tipo,
        descricao: formulario.descricao.trim(),
        valor,
        categoria: formulario.categoria,
        data: formulario.data,
        forma_pagamento: formulario.tipo === "despesa" ? formulario.forma_pagamento : "saldo",
        cartao_id: formulario.tipo === "despesa" && formulario.forma_pagamento === "credito" ? Number(formulario.cartao_id) : null,
        parcelas: 1,
      });
      onProgramada();
      cancelar();
      mostrarAviso("Movimentação programada.");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível programar a movimentação.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="surface mt-6 p-5 sm:p-6">
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${aberto ? "mb-6" : ""}`}>
        <div>
          <h2 className="section-title flex items-center gap-2"><CalendarClock size={21} /> Programar movimentação</h2>
          <p className="section-description">Defina uma receita ou despesa única para uma data futura.</p>
        </div>
        {!aberto && <button type="button" onClick={() => setAberto(true)} className="button-secondary shrink-0"><Plus size={17} /> Programar movimentação</button>}
      </div>

      {aberto && <form onSubmit={salvar} className="animate-in border-t border-border pt-5 fade-in slide-in-from-top-2 duration-300">
        <div className="form-grid">
          <div><label className="field-label" htmlFor="programacao-tipo">Tipo</label><AppSelect id="programacao-tipo" className="mt-2" value={formulario.tipo} onValueChange={(value) => { const tipo = value as "receita" | "despesa"; setFormulario((atual) => ({ ...atual, tipo, categoria: "", forma_pagamento: tipo === "receita" ? "saldo" : atual.forma_pagamento, cartao_id: tipo === "receita" ? "" : atual.cartao_id })); }} options={[{ value: "despesa", label: "Despesa" }, { value: "receita", label: "Receita" }]} /></div>
          <div><label className="field-label" htmlFor="programacao-descricao">Descrição</label><input id="programacao-descricao" className="control mt-2" placeholder="Ex.: Consulta médica" value={formulario.descricao} onChange={(event) => setFormulario({ ...formulario, descricao: event.target.value })} /></div>
          <div><label className="field-label" htmlFor="programacao-valor">Valor (R$)</label><input id="programacao-valor" className="control mt-2" inputMode="decimal" placeholder="R$ 0,00" value={formulario.valor} onChange={(event) => setFormulario({ ...formulario, valor: event.target.value })} /></div>
          <div><label className="field-label" htmlFor="programacao-categoria">Categoria</label><AppSelect id="programacao-categoria" className="mt-2" value={formulario.categoria} onValueChange={(categoria) => setFormulario({ ...formulario, categoria })} placeholder="Selecionar categoria" options={categorias.map((item) => ({ value: item.nome, label: item.nome }))} /></div>
          <div><label className="field-label" htmlFor="programacao-data">Data programada</label><input id="programacao-data" className="control mt-2 [color-scheme:light] dark:[color-scheme:dark]" type="date" min={hoje} value={formulario.data} onChange={(event) => setFormulario({ ...formulario, data: event.target.value })} /></div>
          {formulario.tipo === "despesa" && <div><label className="field-label" htmlFor="programacao-pagamento">Como será pago</label><AppSelect id="programacao-pagamento" className="mt-2" value={formulario.forma_pagamento} onValueChange={(value) => setFormulario({ ...formulario, forma_pagamento: value as "saldo" | "credito", cartao_id: value === "saldo" ? "" : formulario.cartao_id })} options={[{ value: "saldo", label: "Usar saldo" }, { value: "credito", label: "Cartão de crédito", disabled: cartoes.length === 0 }]} /></div>}
          {formulario.tipo === "despesa" && formulario.forma_pagamento === "credito" && <div><label className="field-label" htmlFor="programacao-cartao">Cartão</label><AppSelect id="programacao-cartao" className="mt-2" value={formulario.cartao_id} onValueChange={(cartao_id) => setFormulario({ ...formulario, cartao_id })} placeholder="Selecionar cartão" options={cartoes.map((cartao) => ({ value: String(cartao.id), label: `${cartao.nome} · ${cartao.instituicao}` }))} /></div>}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">A movimentação será lançada somente uma vez, no dia escolhido. No crédito, o limite será validado nessa data.</p>
        <div className="expandable-form-actions mt-6"><button type="button" onClick={cancelar} disabled={salvando} className="button-secondary">Cancelar</button><button disabled={salvando} className="button-primary"><CalendarClock size={17} /> {salvando ? "Programando..." : "Programar movimentação"}</button></div>
      </form>}
    </section>
  );
}
