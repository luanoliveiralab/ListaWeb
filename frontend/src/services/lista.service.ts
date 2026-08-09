import { api } from "./api";
import type { ItemLista } from "@/types/ItemLista";

type NovoItem = Pick<ItemLista, "nome" | "quantidade" | "categoria" | "valor"> & { usuario_id: number };
type AtualizacaoItem = Partial<Pick<ItemLista, "comprado" | "nome" | "quantidade" | "categoria" | "valor">>;

export const listaService = {
    buscarPorUsuario(id: number) {
        return api.get(`/lista/${id}`);
    },

    adicionar(dados: NovoItem) {
        return api.post("/lista", dados);
    },

    atualizar(id: number, dados: AtualizacaoItem) {
        return api.put(`/lista/${id}`, dados);
    },

    remover(id: number) {
        return api.delete(`/lista/${id}`);
    },
};
