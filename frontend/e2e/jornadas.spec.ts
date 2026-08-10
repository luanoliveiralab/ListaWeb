import { expect, test, type Page, type Route } from "@playwright/test";

const usuario = { id: 42, nome: "Luan Oliveira", email: "luan@example.com", foto: null };
const responderJson = (route: Route, body: unknown, status = 200) => route.fulfill({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

async function prepararApi(page: Page) {
  await page.route("http://localhost:3001/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/login") {
      return responderJson(route, { mensagem: "Login OK.", csrfToken: "csrf-teste", usuario });
    }
    if (pathname === "/dashboard") {
      const hoje = new Date();
      const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-10`;
      return responderJson(route, {
        lista: [{ id: 1, nome: "Arroz", quantidade: 2, categoria: "Mercado", valor: 20, comprado: true, movimentacao_id: 1, created_at: hoje.toISOString() }],
        movimentacoes: [
          { id: 1, usuario_id: 42, tipo: "receita", descricao: "Salário", valor: 5000, categoria: "Salário", data, created_at: hoje.toISOString(), forma_pagamento: "saldo" },
          { id: 2, usuario_id: 42, tipo: "despesa", descricao: "Mercado", valor: 250, categoria: "Mercado", data, created_at: hoje.toISOString(), forma_pagamento: "saldo" },
        ],
        cartoes: [{ id: 1, usuario_id: 42, nome: "Principal", instituicao: "Nubank", limite_disponivel: 2000, dia_vencimento: 10, created_at: hoje.toISOString() }],
      });
    }
    if (pathname === "/me") return responderJson(route, usuario);
    if (pathname === "/cartoes") return responderJson(route, [{ id: 1, usuario_id: 42, nome: "Principal", instituicao: "Nubank", limite_disponivel: 2000, dia_vencimento: 10, created_at: new Date().toISOString() }]);
    if (pathname === "/cartoes/1/faturas") return responderJson(route, [{ ano: 2026, mes: 9, status: "fechada", total: 180, quantidade: 1, vencimento: "2026-10-10" }, { ano: 2026, mes: 8, status: "aberta", total: 250, quantidade: 1, vencimento: "2026-09-10" }]);
    if (/^\/cartoes\/1\/faturas\/\d{4}\/\d{1,2}$/.test(pathname)) return responderJson(route, [{ id: 2, descricao: "Mercado", valor: 250, categoria: "Mercado", data: "2026-08-10", created_at: new Date().toISOString() }]);
    if (pathname === "/financas") return responderJson(route, []);
    if (pathname === "/orcamentos/42") return responderJson(route, [{ id: 1, categoria: "Mercado", valor: 800, mes: 8, ano: 2026 }]);
    if (pathname === "/recorrencias/gerar") return responderJson(route, { geradas: 0, movimentacoes: [] });
    if (pathname === "/recorrencias") return responderJson(route, [{ id: 1, tipo: "despesa", descricao: "Aluguel", valor: 1200, categoria: "Moradia", dia: 5, ativa: true }]);
    if (pathname === "/metas") return responderJson(route, [{ id: 1, nome: "Reserva", valor_alvo: 10000, valor_atual: 1500, prazo: null, concluida: false }]);
    if (pathname === "/categorias") return responderJson(route, [
      { id: 1, nome: "Mercado", tipo: "despesa", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, nome: "Salário", tipo: "receita", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]);
    if (pathname === "/csrf") return responderJson(route, { csrfToken: "csrf-teste" });
    return responderJson(route, { mensagem: "API de teste" });
  });
}

test("exibe os acessos públicos da tela de login", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "ListaWeb" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute("href", "/esqueci-senha");
  await expect(page.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/cadastro");
  await expect(page.getByRole("link", { name: "Sobre o ListaWeb" })).toHaveAttribute("href", "/sobre");
});

test("apresenta propósito, fases e gratuidade na página Sobre", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { name: /Mais clareza/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Etapas do projeto" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "É 100% gratuito?" })).toBeVisible();
});

test("mostra o aviso retornado quando o login falha", async ({ page }) => {
  await page.route("http://localhost:3001/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/login") return responderJson(route, { mensagem: "E-mail ou senha incorretos." }, 401);
    return responderJson(route, { mensagem: "API de teste" });
  });
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill("invalido@example.com");
  await page.getByPlaceholder("Senha").fill("senha-incorreta");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("entra e apresenta o resumo financeiro no dashboard", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Saldo em conta")).toBeVisible();
  await expect(page.getByText("R$ 4.750,00", { exact: true })).toBeVisible();
  await expect(page.getByText("Crédito disponível")).toBeVisible();
  await expect(page.getByRole("link", { name: /Finanças/ })).toBeVisible();
});

test("mantém header e formulário fixos enquanto apenas categorias rolam", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Gerenciar categorias" }).click();

  const modal = page.getByTestId("categorias-modal");
  const lista = page.getByTestId("categorias-lista");
  await expect(modal).toHaveCSS("overflow-y", "hidden");
  await expect(lista).toHaveCSS("overflow-y", "auto");
  await page.getByRole("button", { name: "Editar Mercado" }).click();
  await expect(page.getByText("Despesas e compras")).toBeVisible();
  await expect(page.getByText("Editando categoria")).toBeVisible();
  await page.getByRole("button", { name: "Excluir Mercado" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta categoria?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sim, excluir categoria" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta categoria?" })).not.toBeVisible();
});

test("solicita confirmação visual nas exclusões financeiras e de planejamento", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.goto("/financas");
  await page.getByRole("button", { name: "Excluir Principal" }).click();
  await expect(page.getByRole("heading", { name: "Excluir este cartão?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Ver faturas de Principal" }).click();
  await page.getByRole("button", { name: /agosto de 2026/i }).click();
  await page.getByRole("button", { name: "Fechar fatura" }).click();
  await expect(page.getByRole("heading", { name: "Fechar esta fatura?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: /setembro de 2026/i }).click();
  await page.getByRole("button", { name: "Pagar pelo saldo" }).click();
  await expect(page.getByRole("heading", { name: "Pagar esta fatura pelo saldo?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Fechar histórico de faturas" }).click();

  await page.goto("/planejamento");
  await page.getByRole("button", { name: "Remover orçamento de Mercado" }).click();
  await expect(page.getByRole("heading", { name: "Excluir este orçamento?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Excluir recorrência Aluguel" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta recorrência?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Excluir meta Reserva" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta meta?" })).toBeVisible();
});
