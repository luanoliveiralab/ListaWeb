import type { Page, Route } from "@playwright/test";

export const usuario = { id: 42, nome: "Luan Oliveira", email: "luan@example.com", foto: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" };
export const responderJson = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

export async function prepararApi(page: Page) {
  await page.route("http://localhost:3001/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/login") return responderJson(route, { mensagem: "Login OK.", csrfToken: "csrf-teste", usuario });
    if (pathname === "/cadastro") return responderJson(route, { mensagem: "Usuário criado.", csrfToken: "csrf-teste", usuario });
    if (pathname === "/recorrencias" && route.request().method() === "GET") return responderJson(route, [{ id: 9, usuario_id: 42, tipo: "despesa", descricao: "Aluguel", valor: 1200, categoria: "Mercado", dia: 5, forma_pagamento: "credito", cartao_id: 1, ativa: true }]);
    if (pathname === "/recorrencias" && route.request().method() === "POST") return responderJson(route, { id: 9, usuario_id: 42, tipo: "despesa", descricao: "Aluguel", valor: 1200, categoria: "Mercado", dia: 5, forma_pagamento: "credito", cartao_id: 1, ativa: true }, 201);
    if (/^\/recorrencias\/\d+$/.test(pathname) && route.request().method() === "PUT") return responderJson(route, { id: 9, usuario_id: 42, tipo: "despesa", descricao: "Aluguel atualizado", valor: 1300, categoria: "Mercado", dia: 8, forma_pagamento: "credito", cartao_id: 1, ativa: true });
    if (pathname === "/dashboard") {
      const hoje = new Date(); const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-10`;
      return responderJson(route, { lista: [{ id: 1, nome: "Arroz", quantidade: 2, categoria: "Mercado", valor: 20, comprado: true, movimentacao_id: 1, created_at: hoje.toISOString() }], movimentacoes: [{ id: 1, usuario_id: 42, tipo: "receita", descricao: "Salário", valor: 5000, categoria: "Salário", data, created_at: hoje.toISOString(), forma_pagamento: "saldo" }, { id: 2, usuario_id: 42, tipo: "despesa", descricao: "Mercado", valor: 250, categoria: "Mercado", data, created_at: hoje.toISOString(), forma_pagamento: "saldo" }], cartoes: [{ id: 1, usuario_id: 42, nome: "Principal", instituicao: "Nubank", limite_disponivel: 2000, dia_vencimento: 10, created_at: hoje.toISOString() }] });
    }
    if (pathname === "/me") return responderJson(route, usuario);
    if (pathname === "/cartoes") return responderJson(route, [{ id: 1, usuario_id: 42, nome: "Principal", instituicao: "Nubank", limite_disponivel: 2000, dia_vencimento: 10, created_at: new Date().toISOString() }]);
    if (pathname === "/cartoes/1/faturas") return responderJson(route, [{ ano: 2026, mes: 9, status: "fechada", total: 180, quantidade: 1, vencimento: "2026-10-10" }, { ano: 2026, mes: 8, status: "aberta", total: 250, quantidade: 1, vencimento: "2026-09-10" }]);
    if (/^\/cartoes\/1\/faturas\/\d{4}\/\d{1,2}$/.test(pathname)) return responderJson(route, [{ id: 2, descricao: "Mercado", valor: 250, categoria: "Mercado", data: "2026-08-10", created_at: new Date().toISOString() }]);
    if (pathname === "/financas/programadas") return responderJson(route, []);
    if (pathname === "/financas/programar" && route.request().method() === "POST") return responderJson(route, { id: 99, usuario_id: 42, tipo: "despesa", descricao: "Consulta médica", valor: 45.9, categoria: "Mercado", data_programada: "2026-12-10", forma_pagamento: "credito", cartao_id: 1 }, 201);
    if (pathname === "/financas" && route.request().method() === "POST") return responderJson(route, { id: 99, usuario_id: 42, tipo: "despesa", descricao: "Consulta médica", valor: 45.9, categoria: "Mercado", data: "2026-12-10", forma_pagamento: "credito", cartao_id: 1 }, 201);
    if (pathname === "/financas") return responderJson(route, []);
    if (pathname === "/financas/42") { const hoje = new Date(); const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-10`; return responderJson(route, [{ id: 1, usuario_id: 42, tipo: "receita", descricao: "Salário", valor: 5000, categoria: "Salário", data, created_at: hoje.toISOString(), forma_pagamento: "saldo" }, { id: 2, usuario_id: 42, tipo: "despesa", descricao: "Mercado", valor: 250, categoria: "Mercado", data, created_at: hoje.toISOString(), forma_pagamento: "saldo" }]); }
    if (pathname === "/orcamentos/42") { const hoje = new Date(); return responderJson(route, [{ id: 1, categoria: "Mercado", valor: 400, mes: hoje.getMonth() + 1, ano: hoje.getFullYear() }]); }
    if (pathname === "/recorrencias/gerar") return responderJson(route, { geradas: 0, movimentacoes: [{ id: 2, usuario_id: 42, tipo: "despesa", descricao: "Mercado", valor: 250, categoria: "Mercado", data: "2026-08-10", created_at: new Date().toISOString(), forma_pagamento: "saldo" }] });
    if (pathname === "/recorrencias") return responderJson(route, [{ id: 1, tipo: "despesa", descricao: "Aluguel", valor: 1200, categoria: "Moradia", dia: 5, ativa: true }]);
    if (pathname === "/metas") return responderJson(route, [{ id: 1, nome: "Reserva", valor_alvo: 10000, valor_atual: 1500, prazo: null, concluida: false }]);
    if (pathname === "/lista/42") return responderJson(route, [{ id: 1, nome: "Arroz", quantidade: 2, categoria: "Mercado", valor: 20, comprado: false, movimentacao_id: null, created_at: new Date().toISOString() }]);
    if (pathname === "/categorias") return responderJson(route, [{ id: 1, nome: "Mercado", tipo: "despesa", aplica_lista: true, aplica_financas: true, aplica_planejamento: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { id: 2, nome: "Salário", tipo: "receita", aplica_lista: false, aplica_financas: true, aplica_planejamento: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
    if (pathname === "/csrf") return responderJson(route, { csrfToken: "csrf-teste" });
    return responderJson(route, { mensagem: "API de teste" });
  });
}
