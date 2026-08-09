export interface ItemLista {
    id: number;
    nome: string;
    quantidade: number;
    categoria: string;
    valor: number;
    comprado: boolean;
    movimentacao_id: number | null;

    created_at: string;
}