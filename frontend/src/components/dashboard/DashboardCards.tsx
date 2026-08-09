import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface DashboardCardsProps {
  total: number;
  comprados: number;
  pendentes: number;
  saldo: number;
  receitas: number;
  despesas: number;
  movimentacoes: number;
  ticketMedio: number;
}

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function DashboardCards({
  total,
  comprados,
  pendentes,
  saldo,
  receitas,
  despesas,
  movimentacoes,
  ticketMedio,
}: DashboardCardsProps) {
  const progresso = total === 0 ? 0 : Math.round((comprados / total) * 100);

  const cards = [
    { titulo: "Total de itens", valor: String(total), Icone: ShoppingCart, cor: "text-blue-600", fundo: "bg-blue-500/10" },
    { titulo: "Comprados", valor: String(comprados), Icone: CheckCircle2, cor: "text-emerald-600", fundo: "bg-emerald-500/10" },
    { titulo: "Pendentes", valor: String(pendentes), Icone: Clock3, cor: "text-amber-600", fundo: "bg-amber-500/10" },
    { titulo: "Saldo", valor: moeda(saldo), Icone: Wallet, cor: saldo >= 0 ? "text-emerald-600" : "text-rose-600", fundo: saldo >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10" },
    { titulo: "Receitas", valor: moeda(receitas), Icone: ArrowUpRight, cor: "text-emerald-600", fundo: "bg-emerald-500/10" },
    { titulo: "Despesas", valor: moeda(despesas), Icone: ArrowDownRight, cor: "text-rose-600", fundo: "bg-rose-500/10" },
    { titulo: "Movimentações", valor: String(movimentacoes), Icone: Receipt, cor: "text-sky-600", fundo: "bg-sky-500/10" },
    { titulo: "Ticket médio", valor: moeda(ticketMedio), Icone: BarChart3, cor: "text-violet-600", fundo: "bg-violet-500/10" },
  ];

  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ titulo, valor, Icone, cor, fundo }, index) => (
        <article
          key={titulo}
          className="surface-interactive metric-enter p-5"
          style={{ animationDelay: `${index * 35}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{titulo}</p>
              <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums">
                {valor}
              </p>
            </div>
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${fundo} ${cor}`}>
              <Icone size={21} />
            </span>
          </div>
        </article>
      ))}

      <article className="surface-interactive metric-enter p-5 sm:col-span-2 xl:col-span-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Progresso da lista</p>
            <p className="mt-1 text-lg font-semibold">{progresso}% concluído</p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp size={21} />
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </article>
    </section>
  );
}
