"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { financasService } from "@/services/financas.service";
import { useToast } from "@/providers/ToastProvider";

interface Props { onImportada: () => void | Promise<void>; }

export default function ImportTransactionsButton({ onImportada }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [conteudo, setConteudo] = useState("");
  const [importando, setImportando] = useState(false);
  const { mostrarAviso } = useToast();

  async function selecionar(file?: File) {
    if (!file) return;
    const extensao = file.name.split(".").pop()?.toLowerCase();
    if (extensao !== "csv" && extensao !== "ofx") {
      mostrarAviso("Escolha um arquivo CSV ou OFX.", "erro");
      return;
    }
    if (file.size > 1024 * 1024) {
      mostrarAviso("O arquivo deve ter no máximo 1 MB.", "erro");
      return;
    }
    setConteudo(await file.text());
    setArquivo(file);
  }

  async function importar() {
    if (!arquivo) return;
    setImportando(true);
    try {
      const formato = arquivo.name.toLowerCase().endsWith(".ofx") ? "ofx" : "csv";
      const resultado = await financasService.importar(formato, conteudo);
      await onImportada();
      setArquivo(null);
      setConteudo("");
      if (inputRef.current) inputRef.current.value = "";
      mostrarAviso(`${resultado.importadas} movimentação${resultado.importadas === 1 ? "" : "ões"} importada${resultado.importadas === 1 ? "" : "s"}.${resultado.ignoradas ? ` ${resultado.ignoradas} duplicada${resultado.ignoradas === 1 ? "" : "s"} ignorada${resultado.ignoradas === 1 ? "" : "s"}.` : ""}`);
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível importar o extrato.", "erro");
    } finally {
      setImportando(false);
    }
  }

  return <>
    <input ref={inputRef} className="sr-only" type="file" accept=".csv,.ofx,text/csv,application/x-ofx" onChange={(event) => selecionar(event.target.files?.[0])} />
    <button type="button" className="button-secondary" onClick={() => inputRef.current?.click()}><Upload size={17} /> Importar extrato</button>
    <ConfirmationDialog aberto={Boolean(arquivo)} titulo="Importar movimentações?" descricao={<>Os registros de <strong>{arquivo?.name}</strong> serão incluídos como movimentações de saldo e marcados como conferidos. Duplicidades serão ignoradas.</>} confirmar="Sim, importar extrato" processando={importando} textoProcessando="Importando..." onConfirmar={importar} onAlterar={(aberto) => { if (!aberto) { setArquivo(null); setConteudo(""); if (inputRef.current) inputRef.current.value = ""; } }} />
  </>;
}
