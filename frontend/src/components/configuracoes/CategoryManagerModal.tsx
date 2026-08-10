"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { categoriasService } from "@/services/categorias.service";
import { categoriasQueryKey, useCategorias } from "@/hooks/useCategorias";
import { useToast } from "@/providers/ToastProvider";
import type { Categoria } from "@/types/Categoria";
import AppSelect from "@/components/shared/AppSelect";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props { aberto: boolean; onFechar: () => void; }

export default function CategoryManagerModal({ aberto, onFechar }: Props) {
  const { categorias, isPending } = useCategorias();
  const queryClient = useQueryClient();
  const { mostrarAviso } = useToast();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [aplicacoes, setAplicacoes] = useState({ aplica_lista: true, aplica_financas: true, aplica_planejamento: true });
  const [salvando, setSalvando] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  if (!aberto) return null;

  function selecionar(categoria: Categoria) { setEditando(categoria); setNome(categoria.nome); setTipo(categoria.tipo); setAplicacoes({ aplica_lista: categoria.aplica_lista, aplica_financas: categoria.aplica_financas, aplica_planejamento: categoria.aplica_planejamento }); }
  function limpar() { setEditando(null); setNome(""); setTipo("despesa"); setAplicacoes({ aplica_lista: true, aplica_financas: true, aplica_planejamento: true }); }
  function fechar() { limpar(); setCategoriaParaExcluir(null); onFechar(); }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!nome.trim()) return mostrarAviso("Informe o nome da categoria.", "erro");
    if (!Object.values(aplicacoes).some(Boolean)) return mostrarAviso("Escolha ao menos uma página.", "erro");
    setSalvando(true);
    try {
      if (editando) await categoriasService.editar(editando.id, { nome: nome.trim(), tipo, ...aplicacoes });
      else await categoriasService.criar({ nome: nome.trim(), tipo, ...aplicacoes });
      await queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
      mostrarAviso(editando ? "Categoria atualizada em todo o projeto." : "Categoria criada com sucesso.");
      limpar();
    } catch (error) { mostrarAviso(error instanceof Error ? error.message : "Não foi possível salvar a categoria.", "erro"); }
    finally { setSalvando(false); }
  }

  async function remover() {
    if (!categoriaParaExcluir) return;
    setExcluindo(true);
    try {
      const resposta = await categoriasService.remover(categoriaParaExcluir.id);
      await queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
      if (editando?.id === categoriaParaExcluir.id) limpar();
      setCategoriaParaExcluir(null);
      mostrarAviso(resposta.mensagem);
    } catch (error) { mostrarAviso(error instanceof Error ? error.message : "Não foi possível excluir a categoria.", "erro"); }
    finally { setExcluindo(false); }
  }

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="titulo-categorias">
    <div data-testid="categorias-modal" className="modal-panel flex h-[min(90vh,48rem)] max-w-4xl flex-col" style={{ overflow: "hidden", padding: 0 }}>
      <header className="shrink-0 flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div className="flex gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags size={21} /></span><div><h2 id="titulo-categorias" className="text-xl font-semibold">Categorias do projeto</h2><p className="mt-1 text-sm text-muted-foreground">Personalize as opções usadas em compras, finanças e planejamento.</p></div></div>
        <button type="button" onClick={fechar} className="icon-button" aria-label="Fechar"><X size={20} /></button>
      </header>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(10rem,1fr)_auto] md:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)] md:grid-rows-1">
          <div data-testid="categorias-lista" className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
            {(["despesa", "receita"] as const).map((grupo) => <section key={grupo}><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{grupo === "despesa" ? "Despesas e compras" : "Receitas"}</h3><div className="space-y-2">{categorias.filter((item) => item.tipo === grupo).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><div className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.nome}</span><span className="mt-1 block text-[11px] text-muted-foreground">{[item.aplica_lista && "Lista", item.aplica_financas && "Finanças", item.aplica_planejamento && "Planejamento"].filter(Boolean).join(" · ")}</span></div><button type="button" onClick={() => selecionar(item)} className="icon-button" aria-label={`Editar ${item.nome}`}><Pencil size={16} /></button><button type="button" onClick={() => setCategoriaParaExcluir(item)} className="icon-button hover:text-destructive" aria-label={`Excluir ${item.nome}`}><Trash2 size={16} /></button></div>)}{!isPending && !categorias.some((item) => item.tipo === grupo) && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma categoria neste grupo.</p>}</div></section>)}
          </div>
          <form onSubmit={salvar} className="shrink-0 border-t border-border bg-muted/20 p-5 md:border-l md:border-t-0 sm:p-6"><p className="text-sm font-medium text-primary">{editando ? "Editando categoria" : "Personalização"}</p><h3 className="mt-1 font-semibold">{editando ? editando.nome : "Nova categoria"}</h3><div className="mt-5 space-y-4"><div><label className="field-label" htmlFor="categoria-nome">Nome</label><input id="categoria-nome" className="control mt-2" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Pets" /></div><div><label className="field-label" htmlFor="categoria-tipo">Usar como</label><AppSelect id="categoria-tipo" className="mt-2" value={tipo} onValueChange={(value) => setTipo(value as "receita" | "despesa")} options={[{ value: "despesa", label: "Despesa e compra" }, { value: "receita", label: "Receita" }]} /></div><fieldset><legend className="field-label">Disponível em</legend><div className="mt-2 space-y-2">{([["aplica_lista", "Lista de Compras"], ["aplica_financas", "Finanças"], ["aplica_planejamento", "Planejamento"]] as const).map(([campo, rotulo]) => <label key={campo} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm"><input type="checkbox" checked={aplicacoes[campo]} onChange={(e) => setAplicacoes((atuais) => ({ ...atuais, [campo]: e.target.checked }))} className="size-4 accent-primary" />{rotulo}</label>)}</div></fieldset></div><div className="mt-5 flex flex-wrap justify-end gap-2">{editando && <button type="button" onClick={limpar} className="button-secondary">Cancelar</button>}<button disabled={salvando || !nome.trim() || !Object.values(aplicacoes).some(Boolean)} className="button-primary"><Plus size={17} />{salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar categoria"}</button></div><p className="mt-5 text-xs leading-5 text-muted-foreground">{editando ? "Ao renomear, os registros existentes também são atualizados." : "Ao excluir uma categoria, o histórico existente é preservado."}</p></form>
      </div>
      <AlertDialog open={Boolean(categoriaParaExcluir)} onOpenChange={(aberto) => { if (!aberto && !excluindo) setCategoriaParaExcluir(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              A categoria <strong>{categoriaParaExcluir?.nome}</strong> deixará de aparecer nos formulários. Os registros existentes continuarão preservados no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={excluindo} onClick={(event) => { event.preventDefault(); remover(); }}>
              {excluindo ? "Excluindo..." : "Sim, excluir categoria"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>;
}
