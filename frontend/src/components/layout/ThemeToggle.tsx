"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeToggle() {
    const { temaEscuro, alterarTema } = useTheme();

    return (
        <button
            type="button"
            onClick={() => alterarTema(!temaEscuro)}
            aria-label={temaEscuro ? "Ativar tema claro" : "Ativar tema escuro"}
            className="rounded-lg border border-border bg-card p-2 shadow-sm transition-all hover:scale-105 hover:bg-accent"
        >
            {temaEscuro ? (
                <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
                <Moon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            )}
        </button>
    );
}
