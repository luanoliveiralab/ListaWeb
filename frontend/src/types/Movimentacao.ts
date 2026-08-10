export interface Movimentacao {
    id: number;
    usuario_id: number;

    tipo: "receita" | "despesa";

    descricao: string;

    valor: number;

    categoria: string;

    data: string;

    created_at: string;

    quantidade?: number | null;
    forma_pagamento?: "saldo" | "credito";
    cartao_id?: number | null;
    cartao_nome?: string | null;
}
