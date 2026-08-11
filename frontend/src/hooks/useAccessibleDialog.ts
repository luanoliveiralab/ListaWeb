"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useAccessibleDialog(aberto: boolean, onFechar: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onFecharRef = useRef(onFechar);

  useEffect(() => {
    onFecharRef.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    if (!aberto) return;
    const painel = panelRef.current;
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflowAnterior = document.body.style.overflow;
    const aplicativo = document.querySelector<HTMLElement>(".app-shell");
    const ocultarAplicativo = Boolean(aplicativo && painel && !aplicativo.contains(painel));
    const ariaHiddenAnterior = aplicativo?.getAttribute("aria-hidden");
    const inertAnterior = aplicativo?.hasAttribute("inert");
    document.body.style.overflow = "hidden";
    if (ocultarAplicativo && aplicativo) {
      aplicativo.setAttribute("aria-hidden", "true");
      aplicativo.setAttribute("inert", "");
    }

    const focar = window.requestAnimationFrame(() => {
      const primeiro = painel?.querySelector<HTMLElement>(FOCUSABLE);
      (primeiro ?? painel)?.focus();
    });

    function aoTeclar(event: KeyboardEvent) {
      if (!painel) return;
      const alertaAberto = document.querySelector('[data-slot="alert-dialog-content"]');
      if (alertaAberto && !painel.contains(alertaAberto)) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onFecharRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const elementos = [...painel.querySelectorAll<HTMLElement>(FOCUSABLE)]
        .filter((elemento) => elemento.offsetParent !== null);
      if (!elementos.length) {
        event.preventDefault();
        painel.focus();
        return;
      }
      const primeiro = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      window.cancelAnimationFrame(focar);
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      if (ocultarAplicativo && aplicativo) {
        if (ariaHiddenAnterior == null) aplicativo.removeAttribute("aria-hidden");
        else aplicativo.setAttribute("aria-hidden", ariaHiddenAnterior);
        if (inertAnterior) aplicativo.setAttribute("inert", "");
        else aplicativo.removeAttribute("inert");
      }
      focoAnterior?.focus();
    };
  }, [aberto]);

  return panelRef;
}
