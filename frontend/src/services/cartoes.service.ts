import { api } from "./api";
import type { Cartao } from "@/types/Cartao";

export const cartoesService = {
  listar: (): Promise<Cartao[]> => api.get("/cartoes"),
  adicionar: (dados: Pick<Cartao, "nome" | "instituicao" | "limite_disponivel" | "dia_vencimento">): Promise<Cartao> =>
    api.post("/cartoes", dados),
  remover: (id: number) => api.delete(`/cartoes/${id}`),
};
