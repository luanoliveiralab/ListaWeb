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
    fatura_pagamento_id?: number | null;
    impacta_resultado?: boolean;
    meta_movimentacao_id?: number | null;
    grupo_parcelamento?: string | null;
    parcela_atual?: number | null;
    parcelas_total?: number | null;
    pendente?: boolean;
    programada_id?: number;
    recorrencia_id?: number | null;
}
