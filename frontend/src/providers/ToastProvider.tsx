"use client";

import {
    createContext,
    useCallback,
    useContext,
    useState,
} from "react";

import { CheckCircle2, CircleAlert, X } from "lucide-react";

type TipoAviso = "sucesso" | "erro";

interface Aviso {
    mensagem: string;
    tipo: TipoAviso;
}

interface ToastContextData {
    mostrarAviso: (mensagem: string, tipo?: TipoAviso) => void;
}

const ToastContext = createContext<ToastContextData | null>(null);

export function ToastProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [aviso, setAviso] = useState<Aviso | null>(null);

    const mostrarAviso = useCallback(
        (mensagem: string, tipo: TipoAviso = "sucesso") => {
            setAviso({ mensagem, tipo });

            window.setTimeout(() => {
                setAviso(null);
            }, 4000);
        },
        []
    );

    const sucesso = aviso?.tipo === "sucesso";

    return (
        <ToastContext.Provider value={{ mostrarAviso }}>
            {children}

            {aviso && (
                <div className="fixed right-6 top-6 z-[100] w-full max-w-sm animate-in fade-in slide-in-from-top-4">
                    <div
                        className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${sucesso
                                ? "border-emerald-500/30 bg-emerald-500 text-white"
                                : "border-red-500/30 bg-red-500 text-white"
                            }`}
                    >
                        {sucesso ? (
                            <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
                        ) : (
                            <CircleAlert className="mt-0.5 shrink-0" size={22} />
                        )}

                        <p className="flex-1 text-sm font-medium">
                            {aviso.mensagem}
                        </p>

                        <button
                            onClick={() => setAviso(null)}
                            className="rounded-lg p-1 transition hover:bg-white/20"
                            aria-label="Fechar aviso"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast deve ser usado dentro de ToastProvider.");
    }

    return context;
}