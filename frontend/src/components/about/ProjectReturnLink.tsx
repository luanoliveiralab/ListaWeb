"use client";

import { ArrowLeft } from "lucide-react";
import { useSyncExternalStore } from "react";

const PORTFOLIO_URL = "https://weblso.netlify.app/";

type ProjectReturnLinkProps = {
  className?: string;
  contrast?: boolean;
};

const semAssinatura = () => () => undefined;
const verificarOrigem = () => {
  const origem = new URLSearchParams(window.location.search).get("origem");
  return origem === "login" || origem === "configuracoes" ? origem : null;
};
const origemDoServidor = () => null;

export default function ProjectReturnLink({ className = "", contrast = false }: ProjectReturnLinkProps) {
  const origem = useSyncExternalStore(semAssinatura, verificarOrigem, origemDoServidor);

  const destino = origem === "configuracoes" ? "/configuracoes" : origem === "login" ? "/" : PORTFOLIO_URL;
  const texto = origem ? "Voltar" : "Voltar ao portfólio";
  const estilo = contrast
    ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-background/20 px-5 py-2.5 text-sm font-semibold text-background transition hover:bg-background/10"
    : "button-secondary";

  return (
    <a href={destino} className={`${estilo} ${className}`}>
      <ArrowLeft size={17} />
      {texto}
    </a>
  );
}
