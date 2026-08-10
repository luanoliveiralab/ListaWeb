"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export default function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visivel, setVisivel] = useState(false);
  const acao = visivel ? "Ocultar senha" : "Mostrar senha";

  return (
    <div className={cn("relative", className)}>
      <input
        {...props}
        type={visivel ? "text" : "password"}
        className="control pr-12"
      />
      <button
        type="button"
        aria-label={acao}
        title={acao}
        aria-pressed={visivel}
        onClick={() => setVisivel((atual) => !atual)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
      >
        {visivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
