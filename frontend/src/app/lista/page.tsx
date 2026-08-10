"use client";

import { useEffect, useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import AddItemForm from "@/components/lista/AddItemForm";
import ShoppingList from "@/components/lista/ShoppingList";

import { useUsuario } from "@/hooks/useUsuario";
import { listaService } from "@/services/lista.service";
import { useToast } from "@/providers/ToastProvider";

import type { ItemLista } from "@/types/ItemLista";

import EditItemModal from "@/components/lista/EditItemModal";
import { Search } from "lucide-react";

export default function ListaPage() {
  const { usuario } = useUsuario();
  const { mostrarAviso } = useToast();

  const [lista, setLista] = useState<ItemLista[]>([]);
  const [loading, setLoading] = useState(true);

  const [itemNome, setItemNome] = useState("");
  const [itemQtd, setItemQtd] = useState("");

  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");

  const [pesquisa, setPesquisa] = useState("");

  const [itemEditando, setItemEditando] =
    useState<ItemLista | null>(null);

  const [modalAberto, setModalAberto] = useState(false);

  // =========================
  // CARREGAR LISTA
  // =========================

  useEffect(() => {
    if (!usuario?.id) return;

    async function load() {
      const cacheKey = `lista:${usuario!.id}`;
      const cache = sessionStorage.getItem(cacheKey);
      if (cache) {
        try {
          setLista(JSON.parse(cache));
          setLoading(false);
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        if (!cache) setLoading(true);

        const usuarioId = usuario?.id;

        if (!usuarioId) return;

        const data = await listaService.buscarPorUsuario(usuarioId);

        setLista(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error("Erro ao carregar lista:", err);

        mostrarAviso(
          "Erro ao carregar a lista de compras.",
          "erro"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [usuario, mostrarAviso]);

  useEffect(() => {
    if (usuario?.id && !loading) {
      sessionStorage.setItem(`lista:${usuario.id}`, JSON.stringify(lista));
    }
  }, [lista, loading, usuario?.id]);

  // =========================
  // ADICIONAR ITEM
  // =========================

  async function adicionarItem() {
    if (!usuario) return false;

    if (!itemNome.trim()) {
      mostrarAviso("Informe o nome do item.", "erro");
      return false;
    }

    if (
      !valor ||
      Number(valor) <= 0 ||
      !Number.isFinite(Number(valor))
    ) {
      mostrarAviso(
        "Informe um valor válido para o item.",
        "erro"
      );
      return false;
    }

    if (!categoria) {
      mostrarAviso(
        "Selecione uma categoria.",
        "erro"
      );
      return false;
    }

    try {
      const novo = await listaService.adicionar({
        usuario_id: usuario.id,
        nome: itemNome.trim(),
        quantidade: Number(itemQtd),
        categoria,
        valor: Number(valor),
      });

      setLista((prev) => [novo, ...prev]);

      setItemNome("");
      setItemQtd("");
      setCategoria("");
      setValor("");

      mostrarAviso(
        "Item adicionado com sucesso!",
        "sucesso"
      );
      return true;
    } catch (err) {
      console.error("Erro ao adicionar item:", err);

      mostrarAviso(
        "Erro ao adicionar item.",
        "erro"
      );
      return false;
    }
  }

  const [itemExcluir, setItemExcluir] =
    useState<ItemLista | null>(null);

  const [modalExcluir, setModalExcluir] = useState(false);

  function abrirModalExcluir(item: ItemLista) {
    setItemExcluir(item);
    setModalExcluir(true);
  }

  // =========================
  // DELETAR ITEM
  // =========================

  async function deletarItem(id: number) {
    try {
      await listaService.remover(id);

      setLista((prev) =>
        prev.filter((item) => item.id !== id)
      );

      mostrarAviso(
        "Item excluído com sucesso!",
        "sucesso"
      );
    } catch (err) {
      console.error("Erro ao deletar item:", err);

      mostrarAviso(
        "Erro ao excluir item.",
        "erro"
      );
    }
  }

  // =========================
  // TOGGLE COMPRADO
  // =========================

  async function toggleComprado(item: ItemLista) {
    if (item.comprado) return;

    try {
      const atualizado = await listaService.atualizar(
        item.id,
        {
          comprado: true,
        }
      );

      setLista((prev) =>
        prev.map((i) =>
          i.id === atualizado.id
            ? atualizado
            : i
        )
      );
    } catch (err) {
      console.error(
        "Erro ao marcar item como comprado:",
        err
      );

      mostrarAviso(
        "Erro ao marcar item como comprado.",
        "erro"
      );
    }
  }

  // =========================
  // EDITAR ITEM
  // =========================

  function editarItem(item: ItemLista) {
    setItemEditando(item);
    setModalAberto(true);
  }

  // =========================
  // SALVAR EDIÇÃO
  // =========================

  async function salvarEdicao(item: ItemLista) {
    try {
      const atualizado = await listaService.atualizar(
        item.id,
        {
          nome: item.nome,
          quantidade: item.quantidade,
          categoria: item.categoria,
          valor: item.valor,
        }
      );

      setLista((prev) =>
        prev.map((i) =>
          i.id === atualizado.id
            ? atualizado
            : i
        )
      );

      setModalAberto(false);
      setItemEditando(null);

      mostrarAviso(
        "Item atualizado com sucesso!",
        "sucesso"
      );
    } catch (err) {
      console.error(
        "Erro ao atualizar item:",
        err
      );

      mostrarAviso(
        "Erro ao atualizar item.",
        "erro"
      );
    }
  }

  if (!usuario) {
    return (
      <AppLayout
        titulo="Lista de Compras"
        subtitulo="Organize suas compras."
        nome="Usuário"
      >
        <div className="flex items-center justify-center py-10">
          Carregando...
        </div>
      </AppLayout>
    );
  }

  const listaFiltradaPesquisa = lista.filter((item) =>
    item.nome
      .toLowerCase()
      .includes(pesquisa.toLowerCase())
  );

  const itensPendentes =
    listaFiltradaPesquisa.filter(
      (item) => !item.comprado
    );

  const itensComprados =
    listaFiltradaPesquisa.filter(
      (item) => item.comprado
    );

  return (
    <AppLayout
      titulo="Lista de Compras"
      subtitulo="Organize seus itens de forma simples."
      nome={usuario.nome}
    >
      <AddItemForm
        itemNome={itemNome}
        itemQtd={itemQtd}
        itemValor={valor}
        categoria={categoria}
        setItemNome={setItemNome}
        setItemQtd={setItemQtd}
        setItemValor={setValor}
        setCategoria={setCategoria}
        adicionarItem={adicionarItem}
      />

      <div className="surface relative mt-6 p-3">
        <Search className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="🔍 Pesquisar item..."
          value={pesquisa}
          onChange={(e) =>
            setPesquisa(e.target.value)
          }
          className="control border-transparent bg-transparent pl-11 focus:bg-background"
        />
      </div>

      <ShoppingList
        pendentes={itensPendentes}
        comprados={itensComprados}
        loading={loading}
        onToggle={toggleComprado}
        onDelete={abrirModalExcluir}
        onEdit={editarItem}
      />

      {modalExcluir && itemExcluir && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-md">
            <h2 className="text-xl font-bold">
              Excluir item?
            </h2>

            <p className="mt-2 text-muted-foreground">
              Tem certeza que deseja excluir “{itemExcluir.nome}”?
            </p>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setModalExcluir(false);
                  setItemExcluir(null);
                }}
                className="button-secondary"
              >
                Cancelar
              </button>

              <button
                onClick={async () => {
                  await deletarItem(
                    itemExcluir.id
                  );

                  setModalExcluir(false);
                  setItemExcluir(null);
                }}
                className="button-danger"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <EditItemModal
        key={itemEditando?.id ?? "fechado"}
        aberto={modalAberto}
        item={itemEditando}
        onSalvar={salvarEdicao}
        onFechar={() => {
          setModalAberto(false);
          setItemEditando(null);
        }}
      />
    </AppLayout>
  );
}
