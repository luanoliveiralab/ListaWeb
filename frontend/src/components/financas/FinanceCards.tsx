import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface Props {
  saldo: number;
  receitas: number;
  despesas: number;
  anterior: {
    saldo: number;
    receitas: number;
    despesas: number;
  };
}

const formatar = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function variacao(atual: number, anterior: number) {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

export default function FinanceCards({ saldo, receitas, despesas, anterior }: Props) {
  const cards = [
    { titulo: "Saldo", valor: saldo, anterior: anterior.saldo, Icone: Wallet, cor: saldo >= 0 ? "text-blue-600" : "text-rose-600", fundo: saldo >= 0 ? "bg-blue-500/10" : "bg-rose-500/10", positivoQuandoSobe: true },
    { titulo: "Receitas", valor: receitas, anterior: anterior.receitas, Icone: ArrowUpRight, cor: "text-emerald-600", fundo: "bg-emerald-500/10", positivoQuandoSobe: true },
    { titulo: "Despesas", valor: despesas, anterior: anterior.despesas, Icone: ArrowDownRight, cor: "text-rose-600", fundo: "bg-rose-500/10", positivoQuandoSobe: false },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const percentual = variacao(card.valor, card.anterior);
        const subiu = percentual !== null && percentual > 0;
        const favoravel = percentual === 0 || (subiu === card.positivoQuandoSobe);
        const Tendencia = percentual === 0 ? Minus : subiu ? TrendingUp : TrendingDown;

        return (
          <article key={card.titulo} className="surface-interactive metric-enter p-5 sm:p-6" style={{ animationDelay: `${index * 45}ms` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.titulo}</p>
                <p className={`mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums ${card.cor}`}>
                  {formatar(card.valor)}
                </p>
              </div>
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.fundo} ${card.cor}`}>
                <card.Icone size={21} />
              </span>
            </div>
            <div className={`mt-4 flex items-center gap-1.5 text-xs font-medium ${favoravel ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              <Tendencia size={15} />
              {percentual === null ? "Novo neste mês" : `${Math.abs(percentual).toFixed(1)}% em relação ao mês anterior`}
            </div>
          </article>
        );
      })}
    </section>
  );
}
