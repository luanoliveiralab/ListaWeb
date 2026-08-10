"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AboutBackButton() {
  const router = useRouter();

  function goBack() {
    const origin = new URLSearchParams(window.location.search).get("origem");
    router.push(origin === "configuracoes" ? "/configuracoes" : "/");
  }

  return <button type="button" onClick={goBack} className="button-secondary"><ArrowLeft size={17} /> Voltar</button>;
}
