import { api } from "./api";
import type { ItemLista } from "@/types/ItemLista";
import type { Movimentacao } from "@/types/Movimentacao";

export interface DashboardData {
  lista: ItemLista[];
  movimentacoes: Movimentacao[];
}

export const dashboardService = {
  buscar(): Promise<DashboardData> {
    return api.get("/dashboard");
  },
};
