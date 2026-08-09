"use client";

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
                <label className="font-medium">
                    Mês
                </label>

                <select
                    value={mes}
                    onChange={(e) => onMesChange(Number(e.target.value))}
                    className="rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                >
                    {meses.map((nome, index) => (
                        <option
                            key={index}
                            value={index + 1}
                        >
                            {nome}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <label className="font-medium">
                    Ano
                </label>

                <select
                    value={ano}
                    onChange={(e) => onAnoChange(Number(e.target.value))}
                    className="rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                >
                    {anos.map((ano) => (
                        <option
                            key={ano}
                            value={ano}
                        >
                            {ano}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}