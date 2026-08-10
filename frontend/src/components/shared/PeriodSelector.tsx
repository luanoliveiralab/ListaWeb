"use client";

import AppSelect from "@/components/shared/AppSelect";

interface Props {
    mes: number;
    ano: number;
    onMesChange: (mes: number) => void;
    onAnoChange: (ano: number) => void;
}

const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

export default function PeriodSelector({
    mes,
    ano,
    onMesChange,
    onAnoChange,
}: Props) {
    const anoAtual = new Date().getFullYear();

    const anos = [];

    for (let i = anoAtual - 5; i <= anoAtual + 5; i++) {
        anos.push(i);
    }

    return (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
                <label className="font-medium" htmlFor="periodo-mes">
                    Mês
                </label>

                <AppSelect
                    id="periodo-mes"
                    value={String(mes)}
                    onValueChange={(value) => onMesChange(Number(value))}
                    className="w-40"
                    ariaLabel="Selecionar mês"
                    options={meses.map((nome, index) => ({ value: String(index + 1), label: nome }))}
                />
            </div>

            <div className="flex items-center gap-2">
                <label className="font-medium" htmlFor="periodo-ano">
                    Ano
                </label>

                <AppSelect
                    id="periodo-ano"
                    value={String(ano)}
                    onValueChange={(value) => onAnoChange(Number(value))}
                    className="w-32"
                    ariaLabel="Selecionar ano"
                    options={anos.map((item) => ({ value: String(item), label: String(item) }))}
                />
            </div>
        </div>
    );
}
