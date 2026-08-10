"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

import { CheckCircle2, CircleAlert, TriangleAlert, X } from "lucide-react";

type TipoAviso = "sucesso" | "erro" | "alerta";

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
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    }, []);

    const mostrarAviso = useCallback(
        (mensagem: string, tipo: TipoAviso = "sucesso") => {
            setAviso({ mensagem, tipo });

            if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => {
                setAviso(null);
                timeoutRef.current = null;
            }, 4000);
        },
        []
    );

    const sucesso = aviso?.tipo === "sucesso";
    const alerta = aviso?.tipo === "alerta";

    return (
        <ToastContext.Provider value={{ mostrarAviso }}>
            {children}

            {aviso && (
                <div className="fixed inset-x-4 top-4 z-[100] animate-in fade-in slide-in-from-top-4 sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm">
                    <div
                        role={alerta || !sucesso ? "alert" : "status"}
                        className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${sucesso
                                ? "border-emerald-500/30 bg-emerald-500 text-white"
                                : alerta
                                    ? "border-amber-500/30 bg-amber-500 text-slate-950"
                                    : "border-red-500/30 bg-red-500 text-white"
                            }`}
                    >
                        {sucesso ? (
                            <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
                        ) : alerta ? (
                            <TriangleAlert className="mt-0.5 shrink-0" size={22} />
                        ) : (
                            <CircleAlert className="mt-0.5 shrink-0" size={22} />
                        )}

                        <p className="flex-1 text-sm font-medium">
                            {aviso.mensagem}
                        </p>

                        <button
                            onClick={() => {
                                if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
                                timeoutRef.current = null;
                                setAviso(null);
                            }}
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
