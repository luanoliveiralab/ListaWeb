export interface Cartao {
  id: number;
  usuario_id: number;
  nome: string;
  instituicao: string;
  limite_disponivel: number | string;
  dia_vencimento: number;
  created_at: string;
}
