"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = ".surface, .surface-interactive, [data-scroll-reveal]";

export function ScrollRevealProvider() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

    const prepared = new WeakSet<Element>();
    const cleanupTimers = new Set<number>();

    function finishReveal(element: HTMLElement) {
      element.classList.remove("scroll-reveal-pending", "scroll-reveal-visible");
      element.style.removeProperty("--scroll-reveal-delay");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          observer.unobserve(element);

          requestAnimationFrame(() => {
            element.classList.add("scroll-reveal-visible");

            const complete = () => finishReveal(element);
            element.addEventListener("transitionend", complete, { once: true });

            const timer = window.setTimeout(() => {
              cleanupTimers.delete(timer);
              element.removeEventListener("transitionend", complete);
              finishReveal(element);
            }, 900);
            cleanupTimers.add(timer);
          });
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );

    function prepare(root: ParentNode = document) {
      const elements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

      elements.forEach((element, index) => {
        if (prepared.has(element) || element.closest('[role="dialog"]')) return;

        prepared.add(element);
        element.classList.add("scroll-reveal-pending");
        element.style.setProperty("--scroll-reveal-delay", `${(index % 4) * 55}ms`);
        observer.observe(element);
      });
    }

    prepare();

    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches(REVEAL_SELECTOR)) prepare(node.parentElement ?? document);
          else prepare(node);
        });
      });
    });

    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      cleanupTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return null;
}
