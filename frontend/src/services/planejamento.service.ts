import { api } from "./api";

export const planejamentoService = {
  buscarRecorrencias: () => api.get("/recorrencias"),
  criarRecorrencia: (dados: unknown) => api.post("/recorrencias", dados),
  editarRecorrencia: (id: number, dados: unknown) => api.put(`/recorrencias/${id}`, dados),
  alternarRecorrencia: (id: number, ativa: boolean) => api.put(`/recorrencias/${id}`, { ativa }),
  removerRecorrencia: (id: number) => api.delete(`/recorrencias/${id}`),
  gerarRecorrencias: (mes: number, ano: number) => api.post("/recorrencias/gerar", { mes, ano }),
  buscarMetas: () => api.get("/metas"),
  criarMeta: (dados: unknown) => api.post("/metas", dados),
  removerMeta: (id: number) => api.delete(`/metas/${id}`),
  buscarHistoricoMeta: (id: number) => api.get(`/metas/${id}/historico`),
  movimentarMeta: (id: number, dados: unknown) => api.post(`/metas/${id}/movimentar`, dados),
};
