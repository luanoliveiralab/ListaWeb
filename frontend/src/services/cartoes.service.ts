import { api } from "./api";
import type { Cartao, FaturaCartao, ItemFaturaCartao } from "@/types/Cartao";

export const cartoesService = {
  listar: (): Promise<Cartao[]> => api.get("/cartoes"),
  adicionar: (dados: Pick<Cartao, "nome" | "instituicao" | "limite_disponivel" | "dia_vencimento" | "dia_fechamento">): Promise<Cartao> =>
    api.post("/cartoes", dados),
  editar: (id: number, dados: Pick<Cartao, "nome" | "instituicao" | "limite_disponivel" | "dia_vencimento" | "dia_fechamento">): Promise<Cartao> =>
    api.put(`/cartoes/${id}`, dados),
  remover: (id: number) => api.delete(`/cartoes/${id}`),
  listarFaturas: (id: number): Promise<FaturaCartao[]> => api.get(`/cartoes/${id}/faturas`),
  detalharFatura: (id: number, ano: number, mes: number): Promise<ItemFaturaCartao[]> =>
    api.get(`/cartoes/${id}/faturas/${ano}/${mes}`),
  fecharFatura: (id: number, ano: number, mes: number) => api.post(`/cartoes/${id}/faturas/${ano}/${mes}/fechar`, {}),
  pagarFatura: (id: number, ano: number, mes: number) => api.post(`/cartoes/${id}/faturas/${ano}/${mes}/pagar`, {}),
};
