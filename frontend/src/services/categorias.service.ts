import { api } from "./api";
import type { Categoria } from "@/types/Categoria";

export const categoriasService = {
  listar: () => api.get("/categorias") as Promise<Categoria[]>,
  criar: (dados: Pick<Categoria, "nome" | "tipo">) => api.post("/categorias", dados) as Promise<Categoria>,
  editar: (id: number, dados: Pick<Categoria, "nome" | "tipo">) => api.put(`/categorias/${id}`, dados) as Promise<Categoria>,
  remover: (id: number) => api.delete(`/categorias/${id}`) as Promise<{ mensagem: string }>,
};
