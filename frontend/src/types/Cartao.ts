export interface Cartao {
  id: number;
  usuario_id: number;
  nome: string;
  instituicao: string;
  limite_disponivel: number | string;
  limite_utilizado?: number | string;
  dia_vencimento: number;
  created_at: string;
}

export interface FaturaCartao {
  ano: number;
  mes: number;
  status: "aberta" | "fechada" | "paga";
  total: number | string;
  quantidade: number;
  vencimento: string;
  fechada_em?: string | null;
  paga_em?: string | null;
}

export interface ItemFaturaCartao {
  id: number;
  descricao: string;
  valor: number | string;
  categoria: string;
  data: string;
  created_at: string;
}
