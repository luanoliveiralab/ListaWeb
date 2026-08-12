"use client";

import { ArrowLeft } from "lucide-react";
import { useSyncExternalStore } from "react";

const PORTFOLIO_URL = "https://weblso.netlify.app/";

type ProjectReturnLinkProps = {
  className?: string;
  contrast?: boolean;
};

const semAssinatura = () => () => undefined;
const verificarOrigem = () => new URLSearchParams(window.location.search).get("origem") === "login";
const origemDoServidor = () => false;

export default function ProjectReturnLink({ className = "", contrast = false }: ProjectReturnLinkProps) {
  const veioDoLogin = useSyncExternalStore(semAssinatura, verificarOrigem, origemDoServidor);

  const destino = veioDoLogin ? "/" : PORTFOLIO_URL;
  const texto = veioDoLogin ? "Voltar" : "Voltar ao portfólio";
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
