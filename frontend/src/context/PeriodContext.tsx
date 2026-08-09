"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react";

interface PeriodContextType {
    mes: number;
    ano: number;
    setMes: (mes: number) => void;
    setAno: (ano: number) => void;
}

const PeriodContext = createContext<PeriodContextType | null>(null);

export function PeriodProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [mes, setMes] = useState(
        new Date().getMonth() + 1
    );

    const [ano, setAno] = useState(
        new Date().getFullYear()
    );

    return (
        <PeriodContext.Provider
            value={{
                mes,
                ano,
                setMes,
                setAno,
            }}
        >
            {children}
        </PeriodContext.Provider>
    );
}

export function usePeriod() {
    const context = useContext(PeriodContext);

    if (!context) {
        throw new Error(
            "usePeriod deve ser usado dentro de PeriodProvider"
        );
    }

    return context;
}