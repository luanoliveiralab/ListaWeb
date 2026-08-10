"use client";

import { useState } from "react";

import type { Movimentacao } from "@/types/Movimentacao";
import type { Cartao } from "@/types/Cartao";
import { useToast } from "@/providers/ToastProvider";
import { useCategorias } from "@/hooks/useCategorias";

interface Props {
    aberto: boolean;
    movimentacao: Movimentacao | null;
    cartoes: Cartao[];
    onSalvar: (dados: Movimentacao) => void;
    onFechar: () => void;
}

export default function EditMovimentacaoModal({
    aberto,
    movimentacao,
    cartoes,
    onSalvar,
    onFechar,
}: Props) {
    const [tipo, setTipo] =
        useState<"receita" | "despesa">(
            movimentacao?.tipo ?? "receita"
        );

    const [descricao, setDescricao] = useState(
        movimentacao?.descricao ?? ""
    );
    const [valor, setValor] = useState(
        movimentacao ? String(movimentacao.valor) : ""
    );
    const [categoria, setCategoria] = useState(
        movimentacao?.categoria ?? ""
    );
    const [quantidade, setQuantidade] = useState(
        movimentacao?.quantidade != null
            ? String(movimentacao.quantidade)
            : ""
    );
    const [formaPagamento, setFormaPagamento] = useState<"saldo" | "credito">(movimentacao?.forma_pagamento ?? "saldo");
    const [cartaoId, setCartaoId] = useState(movimentacao?.cartao_id ? String(movimentacao.cartao_id) : "");
    const { categorias } = useCategorias(tipo, "financas");

    const { mostrarAviso } = useToast();

    if (!aberto || !movimentacao) return null;

    // Se quantidade existe, significa que a movimentação
    // veio de um item da lista de compras.
    const ehItemDaLista =
        movimentacao.quantidade !== null &&
        movimentacao.quantidade !== undefined;

    function salvar() {
        if (!movimentacao) return;

        if (!descricao.trim()) {
            mostrarAviso(
                "Informe uma descrição para a movimentação.",
                "erro"
            );
            return;
        }

        if (
            !valor ||
            Number(valor) <= 0 ||
            !Number.isFinite(Number(valor))
        ) {
            mostrarAviso(
                "Informe um valor válido para a movimentação.",
                "erro"
            );
            return;
        }

        if (!categoria) {
            mostrarAviso(
                "Selecione uma categoria para a movimentação.",
                "erro"
            );
            return;
        }

        if (ehItemDaLista) {
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
        }

        if (tipo === "despesa" && formaPagamento === "credito" && !cartaoId) {
            mostrarAviso("Selecione o cartão utilizado.", "erro");
            return;
        }

        const dados: Movimentacao = {
            id: movimentacao.id,
            usuario_id: movimentacao.usuario_id,

            tipo,

            descricao: descricao.trim(),

            valor: Number(valor),

            categoria,

            data: movimentacao.data,

            created_at: movimentacao.created_at,

            quantidade: ehItemDaLista
                ? Number(quantidade)
                : null,
            forma_pagamento: tipo === "despesa" ? formaPagamento : "saldo",
            cartao_id: tipo === "despesa" && formaPagamento === "credito" ? Number(cartaoId) : null,
        };

        onSalvar(dados);
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-panel">
                <h2 className="mb-6 text-2xl font-bold">
                    Editar movimentação
                </h2>

                <div className="space-y-4">

                    {/* TIPO */}

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Tipo
                        </label>

                        <select
                            value={tipo}
                            onChange={(e) => {
                                setTipo(
                                    e.target.value as
                                        | "receita"
                                        | "despesa"
                                );

                                setCategoria("");
                                if (e.target.value === "receita") {
                                    setFormaPagamento("saldo");
                                    setCartaoId("");
                                }
                            }}
                            className="control"
                        >
                            <option value="receita">
                                Receita
                            </option>

                            <option value="despesa">
                                Despesa
                            </option>
                        </select>
                    </div>

                    {tipo === "despesa" && (
                        <div>
                            <label className="mb-2 block text-sm font-medium">Forma de pagamento</label>
                            <select value={formaPagamento} onChange={(e) => { const forma = e.target.value as "saldo" | "credito"; setFormaPagamento(forma); if (forma === "saldo") setCartaoId(""); }} className="control">
                                <option value="saldo">Usar saldo</option>
                                <option value="credito" disabled={cartoes.length === 0}>Cartão de crédito</option>
                            </select>
                        </div>
                    )}

                    {tipo === "despesa" && formaPagamento === "credito" && (
                        <div>
                            <label className="mb-2 block text-sm font-medium">Cartão</label>
                            <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} className="control">
                                <option value="">Selecionar cartão</option>
                                {cartoes.map((cartao) => <option key={cartao.id} value={cartao.id}>{cartao.nome} · {cartao.instituicao}</option>)}
                            </select>
                        </div>
                    )}

                    {/* DESCRIÇÃO */}

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Descrição
                        </label>

                        <input
                            type="text"
                            className="control"
                            placeholder="Inserir"
                            value={descricao}
                            onChange={(e) =>
                                setDescricao(e.target.value)
                            }
                        />
                    </div>

                    {/* QUANTIDADE
                        SOMENTE PARA ITENS DA LISTA */}

                    {ehItemDaLista && (
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

                            <p className="mt-1 text-xs text-muted-foreground">
                                Quantidade do item na lista de compras.
                            </p>
                        </div>
                    )}

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
                            placeholder="Inserir"
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

                        <select
                            value={categoria}
                            onChange={(e) =>
                                setCategoria(e.target.value)
                            }
                            className="control"
                        >
                            <option value="" disabled>
                                Selecionar categoria
                            </option>

                            {!categorias.some((item) => item.nome === categoria) && categoria && <option value={categoria}>{categoria}</option>}
                            {categorias.map(
                                (categoriaItem) => (
                                    <option
                                        key={categoriaItem.id}
                                        value={categoriaItem.nome}
                                    >
                                        {categoriaItem.nome}
                                    </option>
                                )
                            )}
                        </select>
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
