"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import type { Movimentacao } from "@/types/Movimentacao";

interface Props {
    movimentacoes: Movimentacao[];
}

interface PontoGrafico {
    chave: string;
    periodo: string;
    receitas: number;
    despesas: number;
    saldo: number;
}

const nomesSeries: Record<string, string> = {
    receitas: "Receitas",
    despesas: "Despesas",
    saldo: "Saldo",
};

const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

function extrairData(data: string) {
    const [ano, mes, dia] = data.slice(0, 10).split("-").map(Number);
    return { ano, mes, dia };
}

export default function FinanceLineChart({ movimentacoes }: Props) {
    const periodos = new Set(
        movimentacoes.map((movimentacao) => {
            const { ano, mes } = extrairData(movimentacao.data);
            return `${ano}-${mes}`;
        })
    );
    const exibirPorDia = periodos.size === 1;
    const pontos = new Map<string, PontoGrafico>();

    movimentacoes.forEach((movimentacao) => {
        const { ano, mes, dia } = extrairData(movimentacao.data);
        const chave = exibirPorDia
            ? `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
            : `${ano}-${String(mes).padStart(2, "0")}`;
        const periodo = exibirPorDia
            ? `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`
            : new Intl.DateTimeFormat("pt-BR", {
                month: "short",
                year: "2-digit",
            }).format(new Date(ano, mes - 1, 1));
        const ponto = pontos.get(chave) ?? {
            chave,
            periodo,
            receitas: 0,
            despesas: 0,
            saldo: 0,
        };

        ponto[movimentacao.tipo === "receita" ? "receitas" : "despesas"] +=
            Number(movimentacao.valor);
        ponto.saldo = ponto.receitas - ponto.despesas;
        pontos.set(chave, ponto);
    });

    const dadosOrdenados = [...pontos.values()]
        .sort((a, b) => a.chave.localeCompare(b.chave))
        .slice(-12);
    const dados = dadosOrdenados.reduce<PontoGrafico[]>((acumulados, ponto) => {
        const saldoAnterior = acumulados.at(-1)?.saldo ?? 0;
        return [...acumulados, { ...ponto, saldo: saldoAnterior + ponto.receitas - ponto.despesas }];
    }, []);
    const totais = movimentacoes.reduce(
        (acc, movimentacao) => {
            acc[movimentacao.tipo === "receita" ? "receitas" : "despesas"] +=
                Number(movimentacao.valor);
            return acc;
        },
        { receitas: 0, despesas: 0 }
    );
    const saldo = totais.receitas - totais.despesas;

    return (
        <section className="surface overflow-hidden p-5 sm:p-6">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-primary">Fluxo do período</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">
                        Evolução financeira
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {exibirPorDia ? "Entradas, despesas e resultado acumulado no mês" : "Últimos 12 meses com atividade"}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-300">
                        Receitas {formatarMoeda(totais.receitas)}
                    </span>
                    <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-rose-700 dark:text-rose-300">
                        Despesas {formatarMoeda(totais.despesas)}
                    </span>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-blue-700 dark:text-blue-300">
                        Resultado {formatarMoeda(saldo)}
                    </span>
                </div>
            </header>

            {dados.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                    Nenhuma movimentação registrada neste período.
                </div>
            ) : (
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                            <defs>
                                <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.28} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.24} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                            <XAxis
                                dataKey="periodo"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                                tickFormatter={(value) =>
                                    Intl.NumberFormat("pt-BR", { notation: "compact" }).format(Number(value))
                                }
                            />
                            <Tooltip
                                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                                contentStyle={{
                                    borderRadius: 14,
                                    border: "1px solid var(--border)",
                                    background: "var(--popover)",
                                    color: "var(--popover-foreground)",
                                    boxShadow: "0 12px 30px rgb(0 0 0 / 0.12)",
                                }}
                                formatter={(value, name) => [
                                    formatarMoeda(Number(value ?? 0)),
                                    nomesSeries[String(name)] ?? String(name),
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="receitas"
                                stroke="#22c55e"
                                strokeWidth={2.5}
                                fill="url(#receitasGradient)"
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                animationDuration={700}
                            />
                            <Area
                                type="monotone"
                                dataKey="despesas"
                                stroke="#f43f5e"
                                strokeWidth={2.5}
                                fill="url(#despesasGradient)"
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                animationDuration={850}
                            />
                            <Line
                                type="monotone"
                                dataKey="saldo"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}
