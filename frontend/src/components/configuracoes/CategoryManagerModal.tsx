"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import AppSelect from "@/components/shared/AppSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { categoriasQueryKey, useCategorias } from "@/hooks/useCategorias";
import { useToast } from "@/providers/ToastProvider";
import { categoriasService } from "@/services/categorias.service";
import type { Categoria } from "@/types/Categoria";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

type VisaoMobile = "lista" | "formulario";

const aplicacoesIniciais = {
  aplica_lista: true,
  aplica_financas: true,
  aplica_planejamento: true,
};

export default function CategoryManagerModal({ aberto, onFechar }: Props) {
  const { categorias, isPending } = useCategorias();
  const queryClient = useQueryClient();
  const { mostrarAviso } = useToast();
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [aplicacoes, setAplicacoes] = useState(aplicacoesIniciais);
  const [salvando, setSalvando] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Categoria | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [visaoMobile, setVisaoMobile] = useState<VisaoMobile>("lista");
  const panelRef = useAccessibleDialog(aberto, fechar);

  if (!aberto) return null;

  function limpar() {
    setEditando(null);
    setNome("");
    setTipo("despesa");
    setAplicacoes(aplicacoesIniciais);
  }

  function mostrarLista() {
    setVisaoMobile("lista");
  }

  function abrirNovo() {
    limpar();
    setVisaoMobile("formulario");
  }

  function selecionar(categoria: Categoria) {
    setEditando(categoria);
    setNome(categoria.nome);
    setTipo(categoria.tipo);
    setAplicacoes({
      aplica_lista: categoria.aplica_lista,
      aplica_financas: categoria.aplica_financas,
      aplica_planejamento: categoria.aplica_planejamento,
    });
    setVisaoMobile("formulario");
  }

  function cancelarEdicao() {
    limpar();
    mostrarLista();
  }

  function fechar() {
    limpar();
    setVisaoMobile("lista");
    setCategoriaParaExcluir(null);
    onFechar();
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!nome.trim()) return mostrarAviso("Informe o nome da categoria.", "erro");
    if (!Object.values(aplicacoes).some(Boolean)) return mostrarAviso("Escolha ao menos uma página.", "erro");

    setSalvando(true);
    try {
      if (editando) {
        await categoriasService.editar(editando.id, { nome: nome.trim(), tipo, ...aplicacoes });
      } else {
        await categoriasService.criar({ nome: nome.trim(), tipo, ...aplicacoes });
      }
      await queryClient.invalidateQueries({ queryKey: categoriasQueryKey });
      mostrarAviso(editando ? "Categoria atualizada em todo o projeto." : "Categoria criada com sucesso.");
      limpar();
      mostrarLista();
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível salvar a categoria.", "erro");
    } finally {
      setSalvando(false);
    }
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
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível excluir a categoria.", "erro");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) fechar();
      }}
    >
      <div
        ref={panelRef}
        data-testid="categorias-modal"
        className="modal-panel flex h-[calc(100dvh-2rem)] max-h-[48rem] max-w-4xl flex-col rounded-xl sm:h-[min(90vh,48rem)] sm:rounded-2xl"
        style={{ overflow: "hidden", padding: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-categorias"
        tabIndex={-1}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border p-4 sm:gap-4 sm:p-6">
          <div className="flex min-w-0 gap-3">
            <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <Tags size={21} />
            </span>
            <div className="min-w-0">
              <h2 id="titulo-categorias" className="text-lg font-semibold sm:text-xl">Categorias do projeto</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                Personalize compras, finanças e planejamento.
              </p>
            </div>
          </div>
          <button type="button" onClick={fechar} className="icon-button size-10 shrink-0" aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <div className="grid shrink-0 grid-cols-2 gap-1 border-b border-border bg-muted/30 p-2 md:hidden" role="tablist" aria-label="Gerenciamento de categorias">
          <button
            id="aba-lista-categorias"
            type="button"
            role="tab"
            aria-selected={visaoMobile === "lista"}
            aria-controls="painel-lista-categorias"
            onClick={mostrarLista}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition ${visaoMobile === "lista" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Tags size={17} />
            Categorias
          </button>
          <button
            id="aba-formulario-categoria"
            type="button"
            role="tab"
            aria-selected={visaoMobile === "formulario"}
            aria-controls="painel-formulario-categoria"
            onClick={editando ? () => setVisaoMobile("formulario") : abrirNovo}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition ${visaoMobile === "formulario" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {editando ? <Pencil size={17} /> : <Plus size={17} />}
            {editando ? "Editar" : "Nova categoria"}
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-1 md:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)]">
          <div
            id="painel-lista-categorias"
            data-testid="categorias-lista"
            role="tabpanel"
            aria-labelledby="aba-lista-categorias"
            className={`${visaoMobile === "lista" ? "flex" : "hidden"} min-h-0 flex-col gap-5 overflow-y-auto p-4 md:flex sm:p-6`}
          >
            {(["despesa", "receita"] as const).map((grupo) => (
              <section key={grupo}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {grupo === "despesa" ? "Despesas e compras" : "Receitas"}
                </h3>
                <div className="space-y-2">
                  {categorias.filter((item) => item.tipo === grupo).map((item) => {
                    const paginas = [
                      item.aplica_lista && "Lista",
                      item.aplica_financas && "Finanças",
                      item.aplica_planejamento && "Planejamento",
                    ].filter(Boolean) as string[];

                    return (
                      <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-border bg-background/60 p-3 sm:gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{item.nome}</span>
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {paginas.map((pagina) => (
                              <span key={pagina} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {pagina}
                              </span>
                            ))}
                          </span>
                        </div>
                        <button type="button" onClick={() => selecionar(item)} className="icon-button size-10 shrink-0" aria-label={`Editar ${item.nome}`}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => setCategoriaParaExcluir(item)} className="icon-button size-10 shrink-0 hover:text-destructive" aria-label={`Excluir ${item.nome}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {!isPending && !categorias.some((item) => item.tipo === grupo) && (
                    <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Nenhuma categoria neste grupo.
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <form
            id="painel-formulario-categoria"
            role="tabpanel"
            aria-labelledby="aba-formulario-categoria"
            onSubmit={salvar}
            className={`${visaoMobile === "formulario" ? "flex" : "hidden"} min-h-0 flex-col overflow-y-auto bg-muted/20 p-4 md:flex md:border-l md:border-border sm:p-6`}
          >
            <div>
              <p className="text-sm font-medium text-primary">{editando ? "Editando categoria" : "Personalização"}</p>
              <h3 className="mt-1 text-lg font-semibold">{editando ? editando.nome : "Nova categoria"}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {editando ? "A alteração será aplicada nas páginas selecionadas." : "Crie uma opção adaptada à sua organização."}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="field-label" htmlFor="categoria-nome">Nome</label>
                <input id="categoria-nome" className="control mt-2" maxLength={80} value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Pets" />
              </div>
              <div>
                <label className="field-label" htmlFor="categoria-tipo">Usar como</label>
                <AppSelect
                  id="categoria-tipo"
                  className="mt-2"
                  value={tipo}
                  onValueChange={(value) => setTipo(value as "receita" | "despesa")}
                  options={[
                    { value: "despesa", label: "Despesa e compra" },
                    { value: "receita", label: "Receita" },
                  ]}
                />
              </div>
              <fieldset>
                <legend className="field-label">Disponível em</legend>
                <div className="mt-2 space-y-2">
                  {([
                    ["aplica_lista", "Lista de Compras"],
                    ["aplica_financas", "Finanças"],
                    ["aplica_planejamento", "Planejamento"],
                  ] as const).map(([campo, rotulo]) => (
                    <label key={campo} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={aplicacoes[campo]}
                        onChange={(event) => setAplicacoes((atuais) => ({ ...atuais, [campo]: event.target.checked }))}
                        className="size-4 accent-primary"
                      />
                      {rotulo}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              {editando ? "Ao renomear, os registros existentes também são atualizados." : "Ao excluir uma categoria, o histórico existente é preservado."}
            </p>

            <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col-reverse gap-2 border-t border-border bg-card/95 px-4 pb-1 pt-4 backdrop-blur md:static md:mx-0 md:mt-5 md:flex-row md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              {editando && (
                <button type="button" onClick={cancelarEdicao} className="button-secondary w-full md:w-auto">
                  Cancelar
                </button>
              )}
              <button disabled={salvando || !nome.trim() || !Object.values(aplicacoes).some(Boolean)} className="button-primary w-full md:w-auto">
                <Plus size={17} />
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar categoria"}
              </button>
            </div>
          </form>
        </div>

        <AlertDialog open={Boolean(categoriaParaExcluir)} onOpenChange={(estado) => { if (!estado && !excluindo) setCategoriaParaExcluir(null); }}>
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
    </div>
  );
}
