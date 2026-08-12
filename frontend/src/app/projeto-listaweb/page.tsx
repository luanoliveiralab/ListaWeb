import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Code2,
  CreditCard,
  Layers3,
  ListChecks,
  LockKeyhole,
  Rocket,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

export const metadata: Metadata = {
  title: "ListaWeb — Case do projeto",
  description: "Conheça o processo, as decisões e as tecnologias por trás do ListaWeb.",
};

const APP_URL = "https://listaweb.netlify.app/";
const PORTFOLIO_URL = "https://weblso.netlify.app/";

const recursos = [
  { Icone: ListChecks, titulo: "Lista de compras", texto: "Organização de itens, categorias e registro da forma de pagamento no momento da compra." },
  { Icone: WalletCards, titulo: "Controle financeiro", texto: "Receitas, despesas, saldo atual e projeções reunidos em uma visão simples do mês." },
  { Icone: CreditCard, titulo: "Cartões e faturas", texto: "Limites, fechamento, vencimento, parcelamentos e histórico de faturas por cartão." },
  { Icone: Target, titulo: "Planejamento", texto: "Metas, orçamentos por categoria e acompanhamento do progresso financeiro." },
  { Icone: CalendarClock, titulo: "Programações", texto: "Movimentações futuras e recorrências mensais lançadas automaticamente na data correta." },
  { Icone: BarChart3, titulo: "Decisões mais claras", texto: "Indicadores, gráficos, alertas e uma agenda para antecipar compromissos." },
];

const tecnologias = [
  "Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js", "Express",
  "PostgreSQL", "React Query", "Playwright", "GitHub Actions",
];

const evolucao = [
  { numero: "01", titulo: "Da necessidade ao produto", texto: "O projeto nasceu como uma lista de compras e evoluiu para conectar organização cotidiana, finanças e planejamento no mesmo fluxo." },
  { numero: "02", titulo: "Experiência guiada por uso real", texto: "Feedbacks de usuários orientaram melhorias de responsividade, modais, alertas, categorias e automações." },
  { numero: "03", titulo: "Qualidade como funcionalidade", texto: "Segurança, acessibilidade, testes automatizados e validações fazem parte do produto, não apenas da etapa final." },
];

function LinkApp({ secundario = false, className = "" }: { secundario?: boolean; className?: string }) {
  return <a href={secundario ? PORTFOLIO_URL : APP_URL} className={`${secundario ? "button-secondary" : "button-primary"} ${className}`}>
    {secundario ? <ArrowLeft size={17} /> : <Rocket size={17} />}
    {secundario ? "Voltar ao portfólio" : "Acessar o ListaWeb"}
    {!secundario && <ArrowRight size={16} />}
  </a>;
}

export default function ProjetoListaWebPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-70 dark:opacity-40">
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -right-36 top-[30rem] size-[30rem] rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex min-h-20 items-center justify-between gap-4 border-b border-border/70">
          <a href={APP_URL} className="flex items-center gap-2.5" aria-label="ListaWeb — acessar aplicativo">
            <Image src="/listaweb-logo.png" alt="" width={38} height={38} className="size-9 object-contain dark:hidden" priority />
            <Image src="/listaweb-logo-dark.png" alt="" width={38} height={38} className="hidden size-9 object-contain dark:block" priority />
            <span className="font-semibold tracking-tight">ListaWeb</span>
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LinkApp secundario className="hidden sm:inline-flex" />
          </div>
        </nav>

        <section className="grid min-h-[calc(100vh-5rem)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <Sparkles size={16} /> Case de produto full-stack
            </div>
            <h1 className="mt-7 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Organização financeira que começa no cotidiano.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              O ListaWeb conecta compras, movimentações, cartões, faturas e planejamento em uma experiência única. Um projeto independente criado para transformar registros dispersos em decisões mais claras.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LinkApp className="justify-center" />
              <LinkApp secundario className="justify-center sm:hidden" />
              <a href="https://github.com/luanoliveiralab/ListaWeb" target="_blank" rel="noopener noreferrer" className="button-secondary justify-center"><Code2 size={17} /> Ver código no GitHub</a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-foreground">
              {["100% gratuito", "Responsivo", "Tema claro e escuro", "Em evolução contínua"].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" />{item}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-400/20 to-sky-400/20 blur-2xl" />
            <div className="surface relative overflow-hidden rounded-[2rem] p-4 shadow-2xl sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">Visão do mês</p><p className="mt-1 font-semibold">Meu financeiro</p></div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><BarChart3 size={20} /></span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Saldo projetado</p><strong className="mt-2 block text-xl text-emerald-600">R$ 4.860</strong><span className="mt-2 block text-[11px] text-muted-foreground">Inclui próximos lançamentos</span></div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Crédito disponível</p><strong className="mt-2 block text-xl text-violet-600">R$ 2.430</strong><span className="mt-2 block text-[11px] text-muted-foreground">NU · fecha dia 18</span></div>
              </div>
              <div className="mt-3 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Distribuição das despesas</p><p className="mt-1 text-sm font-semibold">Agosto</p></div><span className="text-xs text-muted-foreground">R$ 1.740</span></div>
                <div className="mt-6 flex h-32 items-end gap-2" aria-hidden="true">
                  {[34, 52, 39, 74, 58, 92, 68, 82].map((altura, indice) => <span key={indice} className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400/60" style={{ height: `${altura}%` }} />)}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3"><p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Próximo compromisso</p><p className="mt-1 text-sm">Internet · dia 15</p></div>
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3"><p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Meta em andamento</p><p className="mt-1 text-sm">Reserva · 72%</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/70 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
            <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">O desafio</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Menos ferramentas soltas. Mais contexto.</h2></div>
            <div className="space-y-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"><p>Listas de compras, anotações financeiras, faturas e metas costumam viver em lugares diferentes. Isso aumenta o esforço e esconde a relação entre uma compra e seu impacto no mês.</p><p>O ListaWeb centraliza essa jornada sem exigir planilhas complexas. O usuário registra, acompanha e planeja dentro da mesma linguagem visual.</p></div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Produto</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Um fluxo conectado de ponta a ponta.</h2><p className="mt-4 leading-7 text-muted-foreground">Cada módulo resolve uma tarefa específica, mas compartilha dados com o restante do aplicativo.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recursos.map(({ Icone, titulo, texto }) => <article key={titulo} className="surface-interactive p-6"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icone size={21} /></span><h3 className="mt-5 text-lg font-semibold">{titulo}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{texto}</p></article>)}
          </div>
        </section>

        <section className="surface overflow-hidden rounded-[2rem] p-6 sm:p-10 lg:p-14">
          <div className="grid gap-12 lg:grid-cols-2">
            <div><span className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600"><Code2 size={23} /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-primary">Engenharia</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Construído como produto, não apenas como interface.</h2><p className="mt-5 leading-7 text-muted-foreground">A arquitetura separa experiência, regras financeiras, segurança e persistência. Testes de integração e jornadas completas protegem os fluxos mais importantes.</p></div>
            <div className="flex flex-col justify-between gap-8">
              <div className="flex flex-wrap gap-2">{tecnologias.map((tecnologia) => <span key={tecnologia} className="rounded-full border border-border bg-muted/40 px-3.5 py-2 text-sm font-medium">{tecnologia}</span>)}</div>
              <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border p-5"><LockKeyhole className="text-emerald-600" size={22} /><h3 className="mt-4 font-semibold">Segurança por padrão</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Sessões protegidas, CSRF, validação, isolamento por usuário e cuidado com dados sensíveis.</p></div><div className="rounded-2xl border border-border p-5"><Layers3 className="text-sky-600" size={22} /><h3 className="mt-4 font-semibold">Arquitetura evolutiva</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Componentes reutilizáveis e serviços organizados para permitir novos módulos e integrações.</p></div></div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Processo</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Evolução orientada por feedback.</h2></div><div className="space-y-4">{evolucao.map((item) => <article key={item.numero} className="grid gap-3 rounded-2xl border border-border p-5 sm:grid-cols-[3.5rem_1fr] sm:p-6"><span className="text-sm font-semibold text-primary">{item.numero}</span><div><h3 className="font-semibold">{item.titulo}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.texto}</p></div></article>)}</div></div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-foreground px-6 py-14 text-background sm:px-12 sm:py-20">
          <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center"><p className="text-sm font-semibold uppercase tracking-[.18em] text-emerald-400">Explore o projeto</p><h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">Veja o ListaWeb funcionando.</h2><p className="mx-auto mt-5 max-w-2xl leading-7 text-background/70">Crie sua conta gratuitamente e experimente a jornada completa, ou retorne ao portfólio para conhecer outros trabalhos.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><a href={APP_URL} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5"><Rocket size={17} /> Acessar o ListaWeb <ArrowRight size={16} /></a><a href={PORTFOLIO_URL} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-background/20 px-5 py-2.5 text-sm font-semibold text-background transition hover:bg-background/10"><ArrowLeft size={17} /> Voltar ao portfólio</a></div></div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 py-10 text-center text-sm text-muted-foreground sm:flex-row sm:text-left"><p>ListaWeb · Produto e desenvolvimento por Luan Oliveira.</p><a href={PORTFOLIO_URL} className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">weblso.netlify.app <ArrowRight size={14} /></a></footer>
      </div>
    </main>
  );
}
