export interface Categoria {
  id: number;
  nome: string;
  tipo: "receita" | "despesa";
  aplica_lista: boolean;
  aplica_financas: boolean;
  aplica_planejamento: boolean;
  created_at: string;
  updated_at: string;
}
