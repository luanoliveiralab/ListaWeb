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
}