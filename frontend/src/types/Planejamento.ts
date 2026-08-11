export interface Recorrencia {
  id: number;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  categoria: string;
  dia: number;
  ativa: boolean;
  forma_pagamento: "saldo" | "credito";
  cartao_id: number | null;
}

export interface Meta {
  id: number;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  prazo: string | null;
  concluida: boolean;
}

export interface MetaMovimentacao {
  id: number;
  tipo: "deposito" | "retirada";
  valor: number;
  observacao: string | null;
  created_at: string;
}
