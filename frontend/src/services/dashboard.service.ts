import { api } from "./api";
import type { ItemLista } from "@/types/ItemLista";
import type { Movimentacao } from "@/types/Movimentacao";
import type { Cartao } from "@/types/Cartao";

export interface DashboardData {
  lista: ItemLista[];
  movimentacoes: Movimentacao[];
  cartoes: Cartao[];
}

export const dashboardService = {
  buscar(mes: number, ano: number): Promise<DashboardData> {
    return api.get(`/dashboard?mes=${mes}&ano=${ano}`);
  },
};
