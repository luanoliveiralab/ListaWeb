import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Gift, Heart, Layers3, Rocket, ShieldCheck } from "lucide-react";

const fases = [
  { titulo: "Fundação", texto: "Lista de compras, autenticação e uma experiência simples para organizar o dia a dia." },
  { titulo: "Finanças", texto: "Movimentações, cartões, faturas, parcelamentos e um painel financeiro mais focado." },
  { titulo: "Planejamento", texto: "Orçamentos, metas e recorrências para transformar registros em decisões." },
  { titulo: "Qualidade", texto: "Segurança, testes automatizados, desempenho, responsividade e arquitetura modular." },
  { titulo: "Autonomia", texto: "Categorias personalizadas e evolução guiada pelas necessidades reais de quem usa." },
];

const contatos = [
  { nome: "GitHub", href: process.env.NEXT_PUBLIC_ABOUT_GITHUB ?? "https://github.com/luanoliveiralab/ListaWeb", icone: "fa-brands fa-github" },
  { nome: "LinkedIn", href: process.env.NEXT_PUBLIC_ABOUT_LINKEDIN ?? "https://www.linkedin.com/in/luanoliveira-ld", icone: "fa-brands fa-linkedin" },
  { nome: "Portfólio", href: process.env.NEXT_PUBLIC_ABOUT_PORTFOLIO, icone: "fa-solid fa-globe" },
  { nome: "Contato", href: process.env.NEXT_PUBLIC_ABOUT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_ABOUT_EMAIL}` : undefined, icone: "fa-solid fa-envelope" },
].filter((item): item is { nome: string; href: string; icone: string } => Boolean(item.href));

export default function SobrePage() {
  return <><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" integrity="sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw==" crossOrigin="anonymous" referrerPolicy="no-referrer" precedence="default" /><main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav className="flex items-center justify-between"><Link href="/" className="button-secondary"><ArrowLeft size={17} /> Voltar</Link><div className="flex items-center gap-2"><Image src="/listaweb-logo.png" alt="" width={32} height={32} className="size-8 object-contain dark:hidden" /><Image src="/listaweb-logo-dark.png" alt="" width={32} height={32} className="hidden size-8 object-contain dark:block" /><strong>ListaWeb</strong></div></nav>

      <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-12 shadow-sm sm:px-12 sm:py-16"><div className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" /><div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"><Heart size={15} /> Organização com propósito</span><h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">Mais clareza para suas compras, finanças e planos.</h1><p className="mt-6 text-lg leading-8 text-muted-foreground">O ListaWeb nasceu para reunir tarefas financeiras que normalmente ficam espalhadas. A proposta é oferecer uma ferramenta acessível, fluida e transparente, ajudando pessoas a entender o próprio dinheiro sem complicação.</p></div></section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3"><section className="surface p-6 lg:col-span-2 sm:p-8"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><Layers3 size={21} /></span><div><p className="text-sm font-medium text-primary">Construção contínua</p><h2 className="text-2xl font-semibold">Etapas do projeto</h2></div></div><div className="mt-7 space-y-5">{fases.map((fase, indice) => <article key={fase.titulo} className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{indice + 1}</span><div><h3 className="font-semibold">{fase.titulo}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{fase.texto}</p></div></article>)}</div></section>
      <aside className="space-y-6"><section className="surface p-6"><div className="flex items-center gap-4"><div className="size-24 shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-border"><Image src="/luan-oliveira.jpeg" alt="Foto de Luan Oliveira" width={112} height={112} className="size-28 max-w-none -translate-x-2 -translate-y-0.5 object-cover" /></div><div><p className="text-sm font-medium text-primary">Criador do ListaWeb</p><h2 className="mt-1 text-xl font-semibold">Luan Oliveira</h2><p className="mt-1 text-xs text-muted-foreground">Desenvolvedor full-stack</p></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">Desenvolvido por Luan Oliveira como um projeto independente, unindo produto, design e tecnologia para resolver problemas cotidianos de organização financeira.</p>{contatos.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{contatos.map(({ nome, href, icone }) => <a key={nome} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="button-secondary"><i className={`${icone} w-4 text-center`} aria-hidden="true" /> {nome}</a>)}</div>}</section>
      <section className="surface p-6"><span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Gift size={21} /></span><h2 className="mt-4 text-xl font-semibold">É 100% gratuito?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Sim. O ListaWeb é gratuito para quem utiliza o aplicativo e não vende acesso às funcionalidades.</p><div className="mt-4 rounded-xl bg-muted/50 p-4 text-xs leading-5 text-muted-foreground">Transparência: serviços externos de hospedagem, banco de dados ou e-mail podem gerar custos para o responsável por uma instalação própria.</div></section></aside></div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">{[{ icon: ShieldCheck, titulo: "Privacidade", texto: "Seus dados são separados por conta e protegidos por controles de acesso." }, { icon: CheckCircle2, titulo: "Simplicidade", texto: "Cada recurso deve reduzir esforço e tornar decisões mais claras." }, { icon: Rocket, titulo: "Evolução", texto: "O projeto cresce em fases, com testes e melhorias contínuas." }].map(({ icon: Icon, titulo, texto }) => <article key={titulo} className="surface p-5"><Icon className="text-primary" size={22} /><h3 className="mt-3 font-semibold">{titulo}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{texto}</p></article>)}</section>
      <footer className="py-10 text-center text-sm text-muted-foreground">ListaWeb · Feito para organizar hoje e planejar amanhã.</footer>
    </div>
  </main></>;
}
