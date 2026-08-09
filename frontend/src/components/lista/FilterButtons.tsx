"use client";

import { Button } from "@/components/ui/button";

interface FilterButtonsProps {
    filtro: "todos" | "pendentes" | "comprados";
    onChange: (
        filtro: "todos" | "pendentes" | "comprados"
    ) => void;
}

export default function FilterButtons({
    filtro,
    onChange,
}: FilterButtonsProps) {
    return (
        <div className="mt-4 flex flex-wrap gap-3">
            <Button
                variant={filtro === "todos" ? "default" : "outline"}
                onClick={() => onChange("todos")}
            >
                Todos
            </Button>

            <Button
                variant={filtro === "pendentes" ? "default" : "outline"}
                onClick={() => onChange("pendentes")}
            >
                Pendentes
            </Button>

            <Button
                variant={filtro === "comprados" ? "default" : "outline"}
                onClick={() => onChange("comprados")}
            >
                Comprados
            </Button>
        </div>
    );
}