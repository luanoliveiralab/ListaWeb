"use client";

import { useState } from "react";
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
  adicionarItem: () => Promise<boolean>;
}

export default function AddItemForm({
  itemNome, itemQtd, itemValor, categoria,
  setItemNome, setItemQtd, setItemValor, setCategoria, adicionarItem,
}: AddItemFormProps) {
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setItemNome(""); setItemQtd(""); setItemValor(""); setCategoria("");
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    setSalvando(true);
    try {
      if (await adicionarItem()) setFormularioAberto(false);
    } finally {
      setSalvando(false);
    }
  }

  function cancelar() {
    limpar();
    setFormularioAberto(false);
  }

  return (
    <section className="surface p-5 sm:p-6">
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${formularioAberto ? "mb-6" : ""}`}>
        <div><h2 className="section-title">Adicionar item</h2><p className="section-description">Cadastre rapidamente um novo item na sua lista.</p></div>
        {!formularioAberto && <button type="button" onClick={() => setFormularioAberto(true)} className="button-primary shrink-0"><Plus size={17} /> Criar novo item</button>}
      </div>

      {formularioAberto && (
        <form onSubmit={salvar} className="animate-in border-t border-border pt-5 fade-in slide-in-from-top-2 duration-300">
          <div className="form-grid">
            <div className="md:col-span-2"><label className="field-label">Descrição</label><input value={itemNome} onChange={(event) => setItemNome(event.target.value)} placeholder="Ex.: Arroz" className="control mt-2" /></div>
            <div><label className="field-label">Quantidade</label><input type="number" min={1} value={itemQtd} onChange={(event) => setItemQtd(event.target.value)} placeholder="1" className="control mt-2" /></div>
            <div><label className="field-label">Categoria</label><select value={categoria} onChange={(event) => setCategoria(event.target.value)} className="control mt-2"><option value="" disabled>Selecionar categoria</option><option value="Mercado">Mercado</option><option value="Padaria">Padaria</option><option value="Carnes">Carnes</option><option value="Bebidas">Bebidas</option><option value="Farmácia">Farmácia</option><option value="Limpeza">Limpeza</option><option value="Higiene">Higiene</option><option value="Outros">Outros</option></select></div>
            <div><label className="field-label">Valor (R$)</label><input type="number" min={0} step="0.01" value={itemValor} onChange={(event) => setItemValor(event.target.value)} placeholder="R$ 0,00" className="control mt-2" /></div>
          </div>
          <div className="expandable-form-actions mt-6">
            <button type="button" onClick={cancelar} disabled={salvando} className="button-secondary">Cancelar</button>
            <button type="submit" disabled={salvando} className="button-primary"><Plus size={18} /> {salvando ? "Adicionando..." : "Adicionar item"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
