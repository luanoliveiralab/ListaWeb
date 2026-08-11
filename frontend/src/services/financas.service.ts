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
    escopo_parcelamento?: "esta" | "proximas" | "todas";
}

export const financasService = {
    buscarPorUsuario(usuarioId: number) {
        return api.get(`/financas/${usuarioId}`);
    },

    buscarProgramadas() {
        return api.get("/financas/programadas");
    },

    adicionar(dados: MovimentacaoDTO): Promise<import("@/types/Movimentacao").Movimentacao | { movimentacoes: import("@/types/Movimentacao").Movimentacao[] }> {
        return api.post("/financas", dados);
    },

    programar(dados: MovimentacaoDTO) {
        return api.post("/financas/programar", dados);
    },

    importar(formato: "csv" | "ofx", conteudo: string): Promise<{ movimentacoes: import("@/types/Movimentacao").Movimentacao[]; importadas: number; ignoradas: number }> {
        return api.post("/financas/importar", { formato, conteudo });
    },

    cancelarProgramacao(id: number) {
        return api.delete(`/financas/programar/${id}`);
    },

    editarProgramacao(id: number, dados: AtualizarMovimentacaoDTO) {
        return api.put(`/financas/programar/${id}`, dados);
    },

    conciliar(id: number, conciliada: boolean) {
        return api.put(`/financas/${id}/conciliar`, { conciliada });
    },

    atualizar(
        id: number,
        dados: AtualizarMovimentacaoDTO
    ) {
        return api.put(`/financas/${id}`, dados);
    },

    remover(id: number, escopo: "esta" | "proximas" | "todas" = "esta") {
        return api.delete(`/financas/${id}?escopo=${escopo}`);
    },
};
