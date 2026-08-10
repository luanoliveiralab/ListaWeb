"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { Movimentacao } from "@/types/Movimentacao";

interface Props {
    movimentacoes: Movimentacao[];
    categoriaSelecionada?: string;
    onCategoriaSelect?: (categoria: string) => void;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#64748b"];
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinancePieChart({
    movimentacoes,
    categoriaSelecionada = "",
    onCategoriaSelect,
}: Props) {
    const categorias = movimentacoes
        .filter((mov) => mov.tipo === "despesa")
        .reduce((acc, mov) => {
            acc.set(mov.categoria, (acc.get(mov.categoria) ?? 0) + Number(mov.valor));
            return acc;
        }, new Map<string, number>());
    const ordenadas = [...categorias.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    const principais = ordenadas.slice(0, 5);
    const restante = ordenadas.slice(5).reduce((soma, item) => soma + item.value, 0);
    const data = restante > 0 ? [...principais, { name: "Outros", value: restante }] : principais;
    const total = data.reduce((soma, item) => soma + item.value, 0);

    return (
        <section className="surface overflow-hidden p-5 sm:p-6">
            <header>
                <p className="text-sm font-medium text-primary">Distribuição das despesas</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">Onde você mais gastou</h2>
                <p className="mt-1 text-sm text-muted-foreground">Categorias com maior impacto no período</p>
            </header>

            {!data.length ? (
                <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                    Nenhuma despesa registrada neste período.
                </div>
            ) : (
                <div className="mt-5 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)]">
                    <div className="relative h-64 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={66}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    cursor={onCategoriaSelect ? "pointer" : "default"}
                                    onClick={(_, index) => onCategoriaSelect?.(
                                        categoriaSelecionada === data[index].name ? "" : data[index].name
                                    )}
                                >
                                    {data.map((item, index) => (
                                        <Cell
                                            key={item.name}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={categoriaSelecionada && categoriaSelecionada !== item.name ? 0.28 : 1}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => moeda(Number(value ?? 0))}
                                    contentStyle={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground">Total gasto</span>
                            <strong className="mt-1 text-lg tabular-nums">{moeda(total)}</strong>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <button
                                type="button"
                                key={item.name}
                                className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-muted disabled:pointer-events-none"
                                onClick={() => onCategoriaSelect?.(categoriaSelecionada === item.name ? "" : item.name)}
                                disabled={!onCategoriaSelect}
                            >
                                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                                <span className="text-right text-xs tabular-nums text-muted-foreground">
                                    {Math.round((item.value / total) * 100)}%
                                    <span className="ml-2 hidden sm:inline">{moeda(item.value)}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
