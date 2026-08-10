"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { categoriasService } from "@/services/categorias.service";
import { categoriasQueryKey, useCategorias } from "@/hooks/useCategorias";
import { useToast } from "@/providers/ToastProvider";
import type { Categoria } from "@/types/Categoria";

interface Props { aberto: boolean; onFechar: () => void; }

export default function CategoryManagerModal({ aberto, onFechar }: Props) {
  const { categorias, isPending } = useCategorias();
  const queryClient = useQueryClient();
  const { mostrarAviso } = useToast();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  function selecionar(categoria: Categoria) { setEditando(categoria); setNome(categoria.nome); setTipo(categoria.tipo); }
  function limpar() { setEditando(null); setNome(""); setTipo("despesa"); }
  function fechar() { limpar(); onFechar(); }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!nome.trim()) return mostrarAviso("Informe o nome da categoria.", "erro");
    setSalvando(true);
    try {
      if (editando) await categoriasService.editar(editando.id, { nome: nome.trim(), tipo });
      else await categoriasService.criar({ nome: nome.trim(), tipo });
      await queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
      mostrarAviso(editando ? "Categoria atualizada em todo o projeto." : "Categoria criada com sucesso.");
      limpar();
    } catch (error) { mostrarAviso(error instanceof Error ? error.message : "Não foi possível salvar a categoria.", "erro"); }
    finally { setSalvando(false); }
  }

  async function remover(categoria: Categoria) {
    if (!window.confirm(`Excluir “${categoria.nome}”? Os registros existentes continuarão no histórico.`)) return;
    try {
      const resposta = await categoriasService.remover(categoria.id);
      await queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
      if (editando?.id === categoria.id) limpar();
      mostrarAviso(resposta.mensagem);
    } catch (error) { mostrarAviso(error instanceof Error ? error.message : "Não foi possível excluir a categoria.", "erro"); }
  }

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="titulo-categorias">
    <div className="modal-panel max-w-3xl">
      <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div className="flex gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags size={21} /></span><div><h2 id="titulo-categorias" className="text-xl font-semibold">Categorias do projeto</h2><p className="mt-1 text-sm text-muted-foreground">Personalize as opções usadas em compras, finanças e planejamento.</p></div></div>
        <button type="button" onClick={fechar} className="icon-button" aria-label="Fechar"><X size={20} /></button>
      </header>
      {editando ? (
        <form onSubmit={salvar} className="mx-auto w-full max-w-lg p-5 sm:p-8">
          <div className="rounded-2xl border border-border p-5 sm:p-6">
            <p className="text-sm font-medium text-primary">Editando categoria</p>
            <h3 className="mt-1 text-xl font-semibold">{editando.nome}</h3>
            <div className="mt-6 space-y-4">
              <div><label className="field-label" htmlFor="categoria-nome">Nome</label><input autoFocus id="categoria-nome" className="control mt-2" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
              <div><label className="field-label" htmlFor="categoria-tipo">Usar como</label><select id="categoria-tipo" className="control mt-2" value={tipo} onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}><option value="despesa">Despesa e compra</option><option value="receita">Receita</option></select></div>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Ao renomear, os registros existentes também são atualizados.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={limpar} className="button-secondary">Voltar à lista</button><button disabled={salvando || !nome.trim()} className="button-primary">{salvando ? "Salvando..." : "Salvar alterações"}</button></div>
          </div>
        </form>
      ) : (
        <div className="grid max-h-[75vh] overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(17rem,.8fr)]">
          <div className="space-y-5 p-5 sm:p-6">
            {(["despesa", "receita"] as const).map((grupo) => <section key={grupo}><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{grupo === "despesa" ? "Despesas e compras" : "Receitas"}</h3><div className="space-y-2">{categorias.filter((item) => item.tipo === grupo).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.nome}</span><button type="button" onClick={() => selecionar(item)} className="icon-button" aria-label={`Editar ${item.nome}`}><Pencil size={16} /></button><button type="button" onClick={() => remover(item)} className="icon-button hover:text-destructive" aria-label={`Excluir ${item.nome}`}><Trash2 size={16} /></button></div>)}{!isPending && !categorias.some((item) => item.tipo === grupo) && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma categoria neste grupo.</p>}</div></section>)}
          </div>
          <form onSubmit={salvar} className="border-t border-border bg-muted/20 p-5 md:border-l md:border-t-0 sm:p-6"><h3 className="font-semibold">Nova categoria</h3><div className="mt-5 space-y-4"><div><label className="field-label" htmlFor="categoria-nome">Nome</label><input id="categoria-nome" className="control mt-2" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Pets" /></div><div><label className="field-label" htmlFor="categoria-tipo">Usar como</label><select id="categoria-tipo" className="control mt-2" value={tipo} onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}><option value="despesa">Despesa e compra</option><option value="receita">Receita</option></select></div></div><div className="mt-5 flex justify-end"><button disabled={salvando || !nome.trim()} className="button-primary"><Plus size={17} />{salvando ? "Salvando..." : "Criar categoria"}</button></div><p className="mt-5 text-xs leading-5 text-muted-foreground">Ao excluir uma categoria, o histórico existente é preservado.</p></form>
        </div>
      )}
    </div>
  </div>;
}
