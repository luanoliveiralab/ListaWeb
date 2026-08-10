import { api } from "./api";
import type { Cartao, FaturaCartao, ItemFaturaCartao } from "@/types/Cartao";

export const cartoesService = {
  listar: (): Promise<Cartao[]> => api.get("/cartoes"),
  adicionar: (dados: Pick<Cartao, "nome" | "instituicao" | "limite_disponivel" | "dia_vencimento">): Promise<Cartao> =>
    api.post("/cartoes", dados),
  remover: (id: number) => api.delete(`/cartoes/${id}`),
  listarFaturas: (id: number): Promise<FaturaCartao[]> => api.get(`/cartoes/${id}/faturas`),
  detalharFatura: (id: number, ano: number, mes: number): Promise<ItemFaturaCartao[]> =>
    api.get(`/cartoes/${id}/faturas/${ano}/${mes}`),
};
