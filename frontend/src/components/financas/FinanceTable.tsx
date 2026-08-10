"use client";

import { useMemo, useState } from "react";
import {
    ArrowDownRight,
    ArrowUpRight,
    Pencil,
    Printer,
    Search,
    Trash2,
} from "lucide-react";

import type { Movimentacao } from "@/types/Movimentacao";

interface Props {
    movimentacoes: Movimentacao[];
    loading: boolean;
    onEditar: (movimentacao: Movimentacao) => void;
    onExcluir: (id: number) => void;
    categoriaSelecionada?: string;
    onCategoriaChange?: (categoria: string) => void;
}

type Filtro = "todas" | "receita" | "despesa";

const formatarValor = (valor: number) =>
    valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

export default function FinanceTable({
    movimentacoes,
    loading,
    onEditar,
    onExcluir,
    categoriaSelecionada = "",
}: Props) {
    const [pesquisa, setPesquisa] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("todas");

    const movimentacoesVisiveis = useMemo(() => {
        const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

        return movimentacoes.filter((movimentacao) => {
            const correspondeAoTipo =
                filtro === "todas" || movimentacao.tipo === filtro;
            const correspondeAoTermo =
                !termo ||
                movimentacao.descricao.toLocaleLowerCase("pt-BR").includes(termo) ||
                movimentacao.categoria.toLocaleLowerCase("pt-BR").includes(termo);
            const correspondeACategoria =
                !categoriaSelecionada || movimentacao.categoria === categoriaSelecionada;
            return correspondeAoTipo && correspondeAoTermo && correspondeACategoria;
        });
    }, [categoriaSelecionada, filtro, movimentacoes, pesquisa]);

    const resumo = movimentacoesVisiveis.reduce(
        (acc, mov) => {
            acc[mov.tipo === "receita" ? "receitas" : "despesas"] += Number(mov.valor);
            return acc;
        },
        { receitas: 0, despesas: 0 }
    );
    const saldoRelatorio = resumo.receitas - resumo.despesas;
    const filtrosAtivos = [
        filtro !== "todas" ? `Tipo: ${filtro}` : "",
        categoriaSelecionada ? `Categoria: ${categoriaSelecionada}` : "",
        pesquisa ? `Busca: ${pesquisa}` : "",
    ].filter(Boolean);

    function imprimirRelatorio() {
        const tituloAnterior = document.title;
        document.title = `ListaWeb - Relatório Financeiro - ${new Date().toLocaleDateString("pt-BR")}`;
        window.print();
        window.setTimeout(() => {
            document.title = tituloAnterior;
        }, 500);
    }

    const quantidadeReceitas = movimentacoes.filter(
        (movimentacao) => movimentacao.tipo === "receita"
    ).length;
    const quantidadeDespesas = movimentacoes.length - quantidadeReceitas;

    if (loading) {
        return (
            <section className="surface mt-8 overflow-hidden p-5 sm:p-6">
                <div className="mb-6 h-7 w-52 animate-pulse rounded-lg bg-muted" />
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-16 animate-pulse rounded-xl bg-muted/70"
                        />
                    ))}
                </div>
            </section>
        );
    }

    return (
        <>
        <section className="surface mt-8 overflow-hidden">
            <div className="border-b border-border p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-primary">
                            Visão detalhada
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                            Movimentações
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {movimentacoes.length} registros neste período
                        </p>
                    </div>

                    <div className="relative w-full lg:max-w-sm">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="search"
                            value={pesquisa}
                            onChange={(event) => setPesquisa(event.target.value)}
                            placeholder="Buscar descrição ou categoria"
                            className="control pl-10"
                            aria-label="Buscar movimentações"
                        />
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar movimentações">
                    {([
                        ["todas", "Todas", movimentacoes.length],
                        ["receita", "Receitas", quantidadeReceitas],
                        ["despesa", "Despesas", quantidadeDespesas],
                    ] as const).map(([valor, rotulo, quantidade]) => (
                        <button
                            key={valor}
                            type="button"
                            onClick={() => setFiltro(valor)}
                            aria-pressed={filtro === valor}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                filtro === valor
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {rotulo}
                            <span className="ml-2 opacity-70">{quantidade}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                    <button type="button" onClick={imprimirRelatorio} disabled={movimentacoesVisiveis.length === 0} className="button-secondary">
                        <Printer size={17} /> Salvar em PDF
                    </button>
                </div>
            </div>

            {movimentacoesVisiveis.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                    <Search className="mb-3 text-muted-foreground" size={30} />
                    <p className="font-medium">Nenhuma movimentação encontrada</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ajuste a busca ou selecione outro filtro.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {movimentacoesVisiveis.map((movimentacao, index) => {
                        const receita = movimentacao.tipo === "receita";

                        return (
                            <article
                                key={movimentacao.id}
                                className="transaction-row group"
                                style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                            >
                                <div
                                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                                        receita
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-rose-500/10 text-rose-600"
                                    }`}
                                >
                                    {receita ? (
                                        <ArrowUpRight size={21} />
                                    ) : (
                                        <ArrowDownRight size={21} />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <h3 className="truncate font-medium">
                                                {movimentacao.descricao}
                                            </h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/80">
                                                    {movimentacao.categoria}
                                                </span>
                                                {movimentacao.tipo === "despesa" && (
                                                    <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/80">
                                                        {movimentacao.forma_pagamento === "credito"
                                                            ? `Crédito · ${movimentacao.cartao_nome || "Cartão"}`
                                                            : "Saldo"}
                                                    </span>
                                                )}
                                                <time dateTime={movimentacao.data}>
                                                    {new Date(`${movimentacao.data.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}
                                                </time>
                                            </div>
                                        </div>

                                        <strong
                                            className={`text-base tabular-nums sm:text-right ${
                                                receita ? "text-emerald-600" : "text-rose-600"
                                            }`}
                                        >
                                            {receita ? "+" : "−"} {formatarValor(Number(movimentacao.valor))}
                                        </strong>
                                    </div>
                                </div>

                                <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                    <button
                                        type="button"
                                        onClick={() => onEditar(movimentacao)}
                                        className="icon-button"
                                        aria-label={`Editar ${movimentacao.descricao}`}
                                    >
                                        <Pencil size={17} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onExcluir(movimentacao.id)}
                                        className="icon-button hover:text-destructive"
                                        aria-label={`Excluir ${movimentacao.descricao}`}
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>

        <article className="print-report" aria-hidden="true">
            <header className="report-header">
                <div>
                    <p className="report-brand">ListaWeb</p>
                    <h1>Relatório financeiro</h1>
                    <p>Visão detalhada das movimentações selecionadas</p>
                </div>
                <div className="report-generated">
                    <strong>Data de emissão</strong>
                    <span>{new Date().toLocaleDateString("pt-BR")}</span>
                    <span>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
            </header>

            <section className="report-filters">
                <strong>Filtros aplicados</strong>
                <p>{filtrosAtivos.join(" • ") || "Todos os registros do período selecionado"}</p>
            </section>

            <section className="report-summary">
                <div><span>Receitas</span><strong className="report-positive">{formatarValor(resumo.receitas)}</strong></div>
                <div><span>Despesas</span><strong className="report-negative">{formatarValor(resumo.despesas)}</strong></div>
                <div><span>Saldo</span><strong>{formatarValor(saldoRelatorio)}</strong></div>
                <div><span>Movimentações</span><strong>{movimentacoesVisiveis.length}</strong></div>
            </section>

            <section className="report-details">
                <div className="report-section-heading">
                    <h2>Detalhamento das movimentações</h2>
                    <span>{movimentacoesVisiveis.length} registros</span>
                </div>
                <table>
                    <thead>
                        <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Origem</th><th className="report-number">Valor</th></tr>
                    </thead>
                    <tbody>
                        {movimentacoesVisiveis.map((mov) => (
                            <tr key={mov.id}>
                                <td>{new Date(`${mov.data.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                                <td>{mov.descricao}{mov.quantidade != null ? ` (${mov.quantidade} un.)` : ""}</td>
                                <td>{mov.categoria}</td>
                                <td>{mov.tipo === "receita" ? "Receita" : mov.forma_pagamento === "credito" ? `Crédito - ${mov.cartao_nome || "Cartão"}` : "Saldo"}</td>
                                <td className={`report-number ${mov.tipo === "receita" ? "report-positive" : "report-negative"}`}>
                                    {mov.tipo === "receita" ? "+" : "-"} {formatarValor(Number(mov.valor))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <footer className="report-footer">
                <span>ListaWeb - Controle de compras e finanças</span>
                <span>Documento gerado automaticamente</span>
            </footer>
        </article>
        </>
    );
}
