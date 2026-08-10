"use client";

import AppSelect from "@/components/shared/AppSelect";

import { useState } from "react";

import type { ItemLista } from "@/types/ItemLista";
import { useToast } from "@/providers/ToastProvider";
import { useCategorias } from "@/hooks/useCategorias";

interface Props {
    aberto: boolean;
    item: ItemLista | null;
    onSalvar: (dados: ItemLista) => void;
    onFechar: () => void;
}

export default function EditItemModal({
    aberto,
    item,
    onSalvar,
    onFechar,
}: Props) {
    const [nome, setNome] = useState(item?.nome ?? "");
    const [quantidade, setQuantidade] = useState(
        item ? String(item.quantidade) : ""
    );
    const [valor, setValor] = useState(
        item ? String(item.valor) : ""
    );
    const [categoria, setCategoria] = useState(
        item?.categoria ?? ""
    );

    const { mostrarAviso } = useToast();
    const { categorias } = useCategorias("despesa", "lista");

    if (!aberto || !item) return null;

    function salvar() {
        if (!item) return;

        // =========================
        // VALIDAÇÕES
        // =========================

        if (!nome.trim()) {
            mostrarAviso(
                "Informe o nome do item.",
                "erro"
            );
            return;
        }

        if (
            !quantidade ||
            Number(quantidade) <= 0 ||
            !Number.isInteger(Number(quantidade))
        ) {
            mostrarAviso(
                "Informe uma quantidade válida.",
                "erro"
            );
            return;
        }

        if (
            !valor ||
            Number(valor) < 0 ||
            !Number.isFinite(Number(valor))
        ) {
            mostrarAviso(
                "Informe um valor válido.",
                "erro"
            );
            return;
        }

        if (!categoria) {
            mostrarAviso(
                "Selecione uma categoria.",
                "erro"
            );
            return;
        }

        const dados: ItemLista = {
            id: item.id,
            nome: nome.trim(),
            quantidade: Number(quantidade),
            valor: Number(valor),
            categoria,
            comprado: item.comprado,
            movimentacao_id: item.movimentacao_id,
            created_at: item.created_at,
        };

        onSalvar(dados);
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-panel">

                <h2 className="mb-6 text-2xl font-bold">
                    Editar item
                </h2>

                <div className="space-y-4">

                    {/* NOME */}

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Nome
                        </label>

                        <input
                            type="text"
                            className="control"
                            placeholder="Inserir"
                            value={nome}
                            onChange={(e) =>
                                setNome(e.target.value)
                            }
                        />
                    </div>

                    {/* QUANTIDADE */}

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Quantidade
                        </label>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            className="control"
                            placeholder="Inserir"
                            value={quantidade}
                            onChange={(e) =>
                                setQuantidade(e.target.value)
                            }
                        />
                    </div>

                    {/* VALOR */}

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Valor (R$)
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="control"
                            placeholder="R$ 0,00"
                            value={valor}
                            onChange={(e) =>
                                setValor(e.target.value)
                            }
                        />
                    </div>

                    {/* CATEGORIA */}

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Categoria
                        </label>

                        <AppSelect
                            value={categoria}
                            onValueChange={setCategoria}
                            placeholder="Selecionar categoria"
                            options={[
                                ...(!categorias.some((item) => item.nome === categoria) && categoria ? [{ value: categoria, label: categoria }] : []),
                                ...categorias.map((item) => ({ value: item.nome, label: item.nome })),
                            ]}
                        />
                    </div>

                </div>

                {/* BOTÕES */}

                <div className="modal-actions">

                    <button
                        onClick={onFechar}
                        className="button-secondary"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={salvar}
                        className="button-primary"
                    >
                        Salvar
                    </button>

                </div>

            </div>
        </div>
    );
}
