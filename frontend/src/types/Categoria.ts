export interface Categoria {
  id: number;
  nome: string;
  tipo: "receita" | "despesa";
  created_at: string;
  updated_at: string;
}
