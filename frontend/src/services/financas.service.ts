import { api } from "./api";

export interface MovimentacaoDTO {
    usuario_id: number;
    tipo: "receita" | "despesa";
    descricao: string;
    valor: number;
    categoria: string;
    data?: string;
    forma_pagamento?: "saldo" | "credito";
    cartao_id?: number | null;
    parcelas?: number;
}

export interface AtualizarMovimentacaoDTO {
    tipo: "receita" | "despesa";
    descricao: string;
    valor: number;
    categoria: string;
    data: string;
    forma_pagamento?: "saldo" | "credito";
    cartao_id?: number | null;
}

export const financasService = {
    buscarPorUsuario(usuarioId: number) {
        return api.get(`/financas/${usuarioId}`);
    },

    adicionar(dados: MovimentacaoDTO): Promise<import("@/types/Movimentacao").Movimentacao | { movimentacoes: import("@/types/Movimentacao").Movimentacao[] }> {
        return api.post("/financas", dados);
    },

    atualizar(
        id: number,
        dados: AtualizarMovimentacaoDTO
    ) {
        return api.put(`/financas/${id}`, dados);
    },

    remover(id: number) {
        return api.delete(`/financas/${id}`);
    },
};
