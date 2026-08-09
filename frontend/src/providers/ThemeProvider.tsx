"use client";

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

interface ThemeContextType {
    temaEscuro: boolean;
    alterarTema: (valor: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [temaEscuro, setTemaEscuro] = useState(false);

    useEffect(() => {
        const temaSalvo = localStorage.getItem("temaEscuro");

        if (temaSalvo !== null) {
            const frame = requestAnimationFrame(() => {
                setTemaEscuro(temaSalvo === "true");
            });

            return () => cancelAnimationFrame(frame);
        }
    }, []);

    useEffect(() => {
        if (temaEscuro) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [temaEscuro]);

    function alterarTema(valor: boolean) {
        setTemaEscuro(valor);
        localStorage.setItem("temaEscuro", String(valor));
    }

    return (
        <ThemeContext.Provider
            value={{
                temaEscuro,
                alterarTema,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme deve ser usado dentro do ThemeProvider."
        );
    }

    return context;
}
