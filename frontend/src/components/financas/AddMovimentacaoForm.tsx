"use client";

import type { Cartao } from "@/types/Cartao";

interface Props {
    tipo: "receita" | "despesa";
    setTipo: (tipo: "receita" | "despesa") => void;

    descricao: string;
    setDescricao: (valor: string) => void;

    valor: string;
    setValor: (valor: string) => void;

    categoria: string;
    setCategoria: (valor: string) => void;

    data: string;
    setData: (valor: string) => void;

    formaPagamento: "saldo" | "credito";
    setFormaPagamento: (valor: "saldo" | "credito") => void;
    cartaoId: string;
    setCartaoId: (valor: string) => void;
    cartoes: Cartao[];

    adicionarMovimentacao: () => void;
}

export default function AddMovimentacaoForm({
    tipo,
    setTipo,
    descricao,
    setDescricao,
    valor,
    setValor,
    categoria,
    setCategoria,
    data,
    setData,
    formaPagamento,
    setFormaPagamento,
    cartaoId,
    setCartaoId,
    cartoes,
    adicionarMovimentacao,
}: Props) {
    return (
        <section className="surface mt-6 p-5 sm:p-6">
            <div className="section-header">
                <h2 className="section-title">
                    Nova Movimentação
                </h2>

                <p className="section-description">
                    Registre uma receita ou despesa para acompanhar seu saldo.
                </p>
            </div>

            <div className="form-grid">
                <div>
                    <label className="field-label">
                        Tipo
                    </label>

                    <select
                        value={tipo}
                        onChange={(e) => {
                            const novoTipo = e.target.value as "receita" | "despesa";

                            setTipo(novoTipo);
                            setCategoria("");
                            if (novoTipo === "receita") {
                                setFormaPagamento("saldo");
                                setCartaoId("");
                            }
                        }}
                        className="control mt-2"
                    >
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                    </select>
                </div>

                <div>
                    <label className="field-label">
                        Descrição
                    </label>

                    <input
                        type="text"
                        placeholder="Ex.: Salário"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="control mt-2"
                    />
                </div>

                {tipo === "despesa" && (
                    <div>
                        <label className="field-label">Forma de pagamento</label>
                        <select value={formaPagamento} onChange={(e) => { const forma = e.target.value as "saldo" | "credito"; setFormaPagamento(forma); if (forma === "saldo") setCartaoId(""); }} className="control mt-2">
                            <option value="saldo">Usar saldo</option>
                            <option value="credito" disabled={cartoes.length === 0}>Cartão de crédito</option>
                        </select>
                        {cartoes.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Cadastre um cartão para utilizar crédito.</p>}
                    </div>
                )}

                {tipo === "despesa" && formaPagamento === "credito" && (
                    <div>
                        <label className="field-label">Cartão</label>
                        <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} className="control mt-2" required>
                            <option value="">Selecionar cartão</option>
                            {cartoes.map((cartao) => <option key={cartao.id} value={cartao.id}>{cartao.nome} · {cartao.instituicao}</option>)}
                        </select>
                    </div>
                )}

                <div>
                    <label className="field-label">
                        Valor (R$)
                    </label>

                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="R$ 0,00"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="control mt-2"
                    />
                </div>

                <div>
                    <label className="field-label">
                        Categoria
                    </label>

                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="control mt-2"
                    >
                        <option value="" disabled>
                            Selecionar categoria
                        </option>

                        {tipo === "receita" ? (
                            <>
                                <option value="Salário">Salário</option>
                                <option value="Freelance">Freelance</option>
                                <option value="Investimentos">Investimentos</option>
                                <option value="Vendas">Vendas</option>
                                <option value="Outros">Outros</option>
                            </>
                        ) : (
                            <>
                                <option value="Mercado">Mercado</option>
                                <option value="Padaria">Padaria</option>
                                <option value="Carnes">Carnes</option>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Farmácia">Farmácia</option>
                                <option value="Limpeza">Limpeza</option>
                                <option value="Higiene">Higiene</option>
                                <option value="Outros">Outros</option>
                            </>
                        )}
                    </select>
                </div>

                <div>
                    <label className="field-label">
                        Data
                    </label>

                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="control mt-2 [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
            </div>

            <button
                onClick={adicionarMovimentacao}
                className="button-primary mt-6 h-11 px-6"
            >
                Adicionar Movimentação
            </button>
        </section>
    );
}
