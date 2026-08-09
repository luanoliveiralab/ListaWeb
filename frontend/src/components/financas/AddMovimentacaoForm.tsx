"use client";

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
