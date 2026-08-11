"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import type { Movimentacao } from "@/types/Movimentacao";
import type { Cartao } from "@/types/Cartao";
import { useToast } from "@/providers/ToastProvider";
import { useCategorias } from "@/hooks/useCategorias";
import AppSelect from "@/components/shared/AppSelect";
import { hojeEmSaoPaulo } from "@/lib/date";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

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
    const [data, setData] = useState(movimentacao?.data?.slice(0, 10) ?? hojeEmSaoPaulo());
    const [escopoParcelamento, setEscopoParcelamento] = useState<"esta" | "proximas" | "todas">("esta");
    const [quantidade, setQuantidade] = useState(
        movimentacao?.quantidade != null
            ? String(movimentacao.quantidade)
            : ""
    );
    const [formaPagamento, setFormaPagamento] = useState<"saldo" | "credito">(movimentacao?.forma_pagamento ?? "saldo");
    const [cartaoId, setCartaoId] = useState(movimentacao?.cartao_id ? String(movimentacao.cartao_id) : "");
    const { categorias } = useCategorias(tipo, "financas");

    const { mostrarAviso } = useToast();
    const panelRef = useAccessibleDialog(aberto, onFechar);

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
            ...movimentacao,
            id: movimentacao.id,
            usuario_id: movimentacao.usuario_id,

            tipo,

            descricao: descricao.trim(),

            valor: Number(valor),

            categoria,

            data,

            created_at: movimentacao.created_at,

            quantidade: ehItemDaLista
                ? Number(quantidade)
                : null,
            forma_pagamento: tipo === "despesa" ? formaPagamento : "saldo",
            cartao_id: tipo === "despesa" && formaPagamento === "credito" ? Number(cartaoId) : null,
            escopo_parcelamento: movimentacao.grupo_parcelamento ? escopoParcelamento : "esta",
        };

        onSalvar(dados);
    }

    return createPortal(
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onFechar(); }}>
            <div ref={panelRef} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="titulo-editar-movimentacao" tabIndex={-1}>
                <h2 id="titulo-editar-movimentacao" className="mb-6 text-2xl font-bold">
                    Editar movimentação
                </h2>

                <div className="space-y-4">

                    {/* TIPO */}

                    <div>
                        <label htmlFor="editar-movimentacao-tipo" className="mb-2 block text-sm font-medium">
                            Tipo
                        </label>

                        <AppSelect
                            id="editar-movimentacao-tipo"
                            value={tipo}
                            onValueChange={(value) => {
                                setTipo(value as "receita" | "despesa");
                                setCategoria("");
                                if (value === "receita") {
                                    setFormaPagamento("saldo");
                                    setCartaoId("");
                                }
                            }}
                            options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]}
                        />
                    </div>

                    {tipo === "despesa" && (
                        <div>
                            <label htmlFor="editar-movimentacao-forma" className="mb-2 block text-sm font-medium">Forma de pagamento</label>
                            <AppSelect id="editar-movimentacao-forma" value={formaPagamento} onValueChange={(value) => { const forma = value as "saldo" | "credito"; setFormaPagamento(forma); if (forma === "saldo") setCartaoId(""); }} options={[{ value: "saldo", label: "Usar saldo" }, { value: "credito", label: "Cartão de crédito", disabled: cartoes.length === 0 }]} />
                        </div>
                    )}

                    {tipo === "despesa" && formaPagamento === "credito" && (
                        <div>
                            <label htmlFor="editar-movimentacao-cartao" className="mb-2 block text-sm font-medium">Cartão</label>
                            <AppSelect id="editar-movimentacao-cartao" value={cartaoId} onValueChange={setCartaoId} placeholder="Selecionar cartão" options={cartoes.map((cartao) => ({ value: String(cartao.id), label: `${cartao.nome} · ${cartao.instituicao}` }))} />
                        </div>
                    )}

                    {/* DESCRIÇÃO */}

                    <div>
                        <label htmlFor="editar-movimentacao-data" className="mb-2 block text-sm font-medium">Data</label>
                        <input id="editar-movimentacao-data" type="date" min={movimentacao.pendente ? hojeEmSaoPaulo() : undefined} max={movimentacao.pendente ? undefined : hojeEmSaoPaulo()} value={data} onChange={(event) => setData(event.target.value)} className="control" />
                    </div>

                    <div>
                        <label htmlFor="editar-movimentacao-descricao" className="mb-2 block text-sm font-medium">
                            Descrição
                        </label>

                        <input
                            id="editar-movimentacao-descricao"
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
                            <label htmlFor="editar-movimentacao-quantidade" className="mb-2 block text-sm font-medium">
                                Quantidade
                            </label>

                            <input
                                id="editar-movimentacao-quantidade"
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

                    {movimentacao.grupo_parcelamento && (
                        <div>
                            <label htmlFor="editar-escopo-parcelamento" className="mb-2 block text-sm font-medium">Aplicar alteração</label>
                            <AppSelect id="editar-escopo-parcelamento" value={escopoParcelamento} onValueChange={(value) => setEscopoParcelamento(value as "esta" | "proximas" | "todas")} options={[{ value: "esta", label: "Somente esta parcela" }, { value: "proximas", label: "Esta e as próximas" }, { value: "todas", label: "Todas as parcelas" }]} />
                        </div>
                    )}

                    {/* VALOR */}

                    <div>
                        <label htmlFor="editar-movimentacao-valor" className="mb-2 block text-sm font-medium">
                            Valor (R$)
                        </label>

                        <input
                            id="editar-movimentacao-valor"
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
                        <label htmlFor="editar-movimentacao-categoria" className="mb-2 block text-sm font-medium">
                            Categoria
                        </label>

                        <AppSelect
                            id="editar-movimentacao-categoria"
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
                        type="button"
                        onClick={onFechar}
                        className="button-secondary"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={salvar}
                        className="button-primary"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    , document.body);
}
