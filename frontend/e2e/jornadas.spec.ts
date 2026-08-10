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
