"use client";

import { useQuery } from "@tanstack/react-query";
import { categoriasService } from "@/services/categorias.service";

export const categoriasQueryKey = ["categorias"] as const;

export function useCategorias(tipo?: "receita" | "despesa") {
  const query = useQuery({ queryKey: categoriasQueryKey, queryFn: categoriasService.listar, staleTime: 5 * 60 * 1000 });
  return {
    ...query,
    categorias: (query.data ?? []).filter((categoria) => !tipo || categoria.tipo === tipo),
  };
}
