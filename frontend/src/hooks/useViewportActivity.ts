"use client";

import { useEffect, useState, type RefObject } from "react";

export function useViewportActivity(ref: RefObject<Element | null>) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setActive(document.visibilityState === "visible");
      return;
    }

    let intersecting = false;
    const update = () => setActive(intersecting && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    }, { threshold: 0.18 });

    observer.observe(element);
    document.addEventListener("visibilitychange", update);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);

  return active;
}
