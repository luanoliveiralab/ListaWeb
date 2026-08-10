"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import Image from "next/image";
import { useViewportActivity } from "@/hooks/useViewportActivity";

interface WelcomeProps {
  nome: string;
  foto?: string | null;
}

const mensagens = [
  "Bem-vindo ao seu painel. Organize suas compras, acompanhe seu progresso e mantenha tudo sob controle em um só lugar.",
  "Acompanhe saldo, receitas, despesas, cartões e faturas para entender o mês com mais clareza.",
  "Use metas, orçamentos e recorrências para transformar seus registros em próximos passos possíveis.",
];

export default function Welcome({ nome, foto }: WelcomeProps) {
  const [indice, setIndice] = useState(0);
  const [ciclo, setCiclo] = useState(0);
  const carouselRef = useRef<HTMLElement>(null);
  const active = useViewportActivity(carouselRef);
  const hora = new Date().getHours();

  let saudacao = "Boa noite";

  if (hora < 12) {
    saudacao = "Bom dia";
  } else if (hora < 18) {
    saudacao = "Boa tarde";
  }

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
    <section ref={carouselRef} data-viewport-animations className="surface relative mb-6 overflow-hidden bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-primary">
            {saudacao}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {nome}
          </h1>

          <div className="mt-3 max-w-2xl overflow-hidden" aria-live="polite">
            <div
              className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${indice * 100}%)` }}
            >
              {mensagens.map((mensagem, posicao) => (
                <p
                  key={mensagem}
                  aria-hidden={posicao !== indice}
                  className="min-h-12 min-w-full text-muted-foreground"
                >
                  {mensagem}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2" aria-label="Selecionar mensagem do painel">
            {mensagens.map((mensagem, posicao) => (
              <button
                key={mensagem}
                type="button"
                aria-label={`Mostrar mensagem ${posicao + 1}`}
                aria-current={posicao === indice ? "true" : undefined}
                onClick={() => selecionarMensagem(posicao)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  posicao === indice ? "w-8 bg-primary" : "w-3 bg-primary/25 hover:bg-primary/45"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="hidden shrink-0 lg:block">
          {foto ? (
            <Image
              src={foto}
              alt={`Foto de ${nome}`}
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-2xl border-4 border-background object-cover shadow-lg"
            />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <UserRound className="h-9 w-9" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
