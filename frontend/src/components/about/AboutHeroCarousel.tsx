"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useViewportActivity } from "@/hooks/useViewportActivity";

const mensagens = [
  {
    titulo: "Mais clareza para suas compras, finanças e planos.",
    texto: "Reúna tarefas financeiras que normalmente ficam espalhadas e entenda melhor o próprio dinheiro sem complicação.",
  },
  {
    titulo: "Cartões e faturas sob controle, sem planilhas complexas.",
    texto: "Acompanhe limites, vencimentos, despesas e pagamentos em uma experiência visual, simples e conectada.",
  },
  {
    titulo: "Registre o presente e planeje os próximos passos.",
    texto: "Use orçamentos, metas, recorrências e avisos para transformar informações do dia a dia em decisões mais conscientes.",
  },
];

export default function AboutHeroCarousel() {
  const [indice, setIndice] = useState(0);
  const [ciclo, setCiclo] = useState(0);
  const carouselRef = useRef<HTMLElement>(null);
  const active = useViewportActivity(carouselRef);

  useEffect(() => {
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (movimentoReduzido || !active) return;
    const intervalo = window.setInterval(
      () => setIndice((atual) => (atual + 1) % mensagens.length),
      7000
    );
    return () => window.clearInterval(intervalo);
  }, [active, ciclo]);

  function selecionarMensagem(posicao: number) {
    setIndice(posicao);
    setCiclo((atual) => atual + 1);
  }

  return (
    <section ref={carouselRef} data-scroll-reveal data-viewport-animations className="relative mt-8 overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-12 shadow-sm sm:px-12 sm:py-16">
      <div className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          <Heart size={15} /> Organização com propósito
        </span>

        <div className="mt-6 overflow-hidden" aria-live="polite">
          <div
            className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${indice * 100}%)` }}
          >
            {mensagens.map((mensagem, posicao) => (
              <article
                key={mensagem.titulo}
                className="min-w-full"
                aria-hidden={posicao !== indice}
              >
                <h1 className="min-h-[7.5rem] text-4xl font-semibold tracking-tight sm:min-h-[9rem] sm:text-6xl">
                  {mensagem.titulo}
                </h1>
                <p className="mt-6 min-h-24 max-w-3xl text-lg leading-8 text-muted-foreground sm:min-h-16">
                  {mensagem.texto}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-7 flex gap-2" aria-label="Selecionar mensagem">
          {mensagens.map((mensagem, posicao) => (
            <button
              key={mensagem.titulo}
              type="button"
              aria-label={`Mostrar mensagem ${posicao + 1}`}
              aria-current={posicao === indice ? "true" : undefined}
              onClick={() => selecionarMensagem(posicao)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                posicao === indice ? "w-9 bg-primary" : "w-4 bg-primary/25 hover:bg-primary/45"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
