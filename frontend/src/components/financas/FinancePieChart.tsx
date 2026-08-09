"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";

import type { Movimentacao } from "@/types/Movimentacao";

interface Props {
    movimentacoes: Movimentacao[];
    categoriaSelecionada?: string;
    onCategoriaSelect?: (categoria: string) => void;
}

const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#06b6d4",
    "#6366f1",
    "#f43f5e",
];

export default function FinancePieChart({
    movimentacoes,
    categoriaSelecionada = "",
    onCategoriaSelect,
}: Props) {
    const data = movimentacoes
        .filter((m) => m.tipo === "despesa")
        .reduce((acc, mov) => {
            const categoria = acc.find(
                (item) => item.name === mov.categoria
            );

            if (categoria) {
                categoria.value += Number(mov.valor);
            } else {
                acc.push({
                    name: mov.categoria,
                    value: Number(mov.valor),
                });
            }

            return acc;
        }, [] as { name: string; value: number }[]);
    if (data.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">
                    Gastos por Categoria
                </h2>

                <div className="flex h-80 items-center justify-center text-muted-foreground">
                    Nenhuma despesa registrada neste período.
                </div>
            </div>
        );
    }
    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">
                Gastos por Categoria
            </h2>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            outerRadius={110}
                            label
                            cursor="pointer"
                            onClick={(_, index) =>
                                onCategoriaSelect?.(
                                    categoriaSelecionada === data[index].name
                                        ? ""
                                        : data[index].name
                                )
                            }
                        >
                            {data.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={COLORS[index % COLORS.length]}
                                    opacity={
                                        categoriaSelecionada &&
                                        categoriaSelecionada !== data[index].name
                                            ? 0.28
                                            : 1
                                    }
                                />
                            ))}
                        </Pie>

                        <Tooltip
                            formatter={(value) =>
                                Number(value ?? 0).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                })
                            }
                        />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
