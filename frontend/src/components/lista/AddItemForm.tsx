"use client";

import { Plus } from "lucide-react";


interface AddItemFormProps {
    itemNome: string;
    itemQtd: string;
    itemValor: string;
    categoria: string;

    setItemNome: (value: string) => void;
    setItemQtd: (value: string) => void;
    setItemValor: (value: string) => void;
    setCategoria: (value: string) => void;

    adicionarItem: () => void;
}

export default function AddItemForm({
    itemNome,
    itemQtd,
    itemValor,
    categoria,

    setItemNome,
    setItemQtd,
    setItemValor,
    setCategoria,

    adicionarItem,
}: AddItemFormProps) {
    return (
        <section className="surface p-5 sm:p-6">

            <div className="section-header">
                <h2 className="section-title">
                    Adicionar Item
                </h2>

                <p className="section-description">
                    Cadastre rapidamente um novo item na sua lista.
                </p>
            </div>

            <div className="form-grid">

                <div className="md:col-span-2">
                    <label className="field-label">
                        Descrição
                    </label>

                    <input
                        value={itemNome}
                        onChange={(e) => setItemNome(e.target.value)}
                        placeholder="Inserir"
                        className="control mt-2"
                    />
                </div>

                <div>
                    <label className="field-label">
                        Quantidade
                    </label>

                    <input
                        type="number"
                        min={1}
                        value={itemQtd}
                        onChange={(e) => setItemQtd(e.target.value)}
                        placeholder="Inserir"
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

                        <option value="Mercado">Mercado</option>
                        <option value="Padaria">Padaria</option>
                        <option value="Carnes">Carnes</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Farmácia">Farmácia</option>
                        <option value="Limpeza">Limpeza</option>
                        <option value="Higiene">Higiene</option>
                        <option value="Outros">Outros</option>
                    </select>

                </div>

                <div>
                    <label className="field-label">
                        Valor (R$)
                    </label>

                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={itemValor}
                        onChange={(e) => setItemValor(e.target.value)}
                        placeholder="R$ 0,00"
                        className="control mt-2"
                    />
                </div>

                <div className="flex items-end justify-end gap-3">

                    <button
                        onClick={adicionarItem}
                        className="button-primary h-11 px-6"
                    >
                        <Plus size={18} />
                        Adicionar Item
                    </button>

                </div>

            </div>
        </section>
    );
}
