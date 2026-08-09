import { api } from "./api";
import type { Orcamento } from "@/types/Orcamento";

export const orcamentosService = {
  buscar(usuarioId: number, mes: number, ano: number) {
    return api.get(`/orcamentos/${usuarioId}?mes=${mes}&ano=${ano}`) as Promise<Orcamento[]>;
  },

  salvar(dados: Omit<Orcamento, "id">) {
    return api.put("/orcamentos", dados) as Promise<Orcamento>;
  },

  remover(id: number) {
    return api.delete(`/orcamentos/${id}`);
  },
};
