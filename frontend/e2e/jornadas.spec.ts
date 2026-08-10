import { expect, test } from "@playwright/test";
import { prepararApi, responderJson, usuario } from "./fixtures";

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

test("mantém a caixa de notificações dentro da tela", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("button", { name: "Notificações" }).click();

  const painel = page.locator("[data-slot='notification-panel']");
  await expect(painel).toBeVisible();
  const posicao = await painel.evaluate((elemento) => {
    const caixa = elemento.getBoundingClientRect();
    return { esquerda: caixa.left, direita: caixa.right, larguraTela: window.innerWidth };
  });
  expect(posicao.esquerda).toBeGreaterThanOrEqual(0);
  expect(posicao.direita).toBeLessThanOrEqual(posicao.larguraTela);
});

test("centraliza, filtra e marca avisos como lidos", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("link", { name: "Avisos" }).click();
  await expect(page).toHaveURL(/\/avisos$/);

  await expect(page.getByRole("heading", { name: "Central de avisos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Avisos" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Orçamento em atenção")).toBeVisible();
  await page.getByRole("button", { name: "Marcar todos como lidos" }).click();
  await expect(page.getByText("Tudo lido por aqui")).toBeVisible();
  await page.getByRole("button", { name: "Não lidos" }).click();
  await expect(page.getByText("Nenhum aviso neste filtro")).toBeVisible();
  await page.getByRole("link", { name: "Finanças" }).click();
  await expect(page.locator("[data-slot='sidebar-notification-badge']")).toHaveCount(0);
  await page.getByRole("link", { name: /Planos|Planejamento/ }).click();
  await expect(page.locator("[data-slot='sidebar-notification-badge']")).toHaveCount(0);
});

test("pergunta a forma de pagamento antes de concluir um item", async ({ page }) => {
  await prepararApi(page);
  let pagamento: Record<string, unknown> | null = null;
  await page.route("http://localhost:3001/lista/1", async (route) => {
    if (route.request().method() === "PUT") {
      pagamento = route.request().postDataJSON();
      return responderJson(route, { id: 1, nome: "Arroz", quantidade: 2, categoria: "Mercado", valor: 20, comprado: true, movimentacao_id: 99, created_at: new Date().toISOString() });
    }
    return route.fallback();
  });
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/lista");

  await page.getByRole("button", { name: "Marcar Arroz como comprado" }).click();
  await expect(page.getByRole("heading", { name: "Como você pagou este item?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("button", { name: "Marcar Arroz como comprado" })).toBeVisible();
  expect(pagamento).toBeNull();

  await page.getByRole("button", { name: "Marcar Arroz como comprado" }).click();
  await page.getByRole("button", { name: /Cartão de crédito/ }).click();
  await page.getByLabel("Qual cartão?").selectOption("1");
  await page.getByRole("button", { name: "Confirmar compra" }).click();
  await expect(page.getByText("Compra adicionada à fatura do cartão.")).toBeVisible();
  expect(pagamento).toEqual({ comprado: true, forma_pagamento: "credito", cartao_id: 1 });
});

test("avisa uma única vez ao atingir um marco do orçamento", async ({ page }) => {
  await prepararApi(page);
  const hoje = new Date();
  const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-10`;
  await page.route("http://localhost:3001/orcamentos/42**", (route) => responderJson(route, [{ id: 91, categoria: "Mercado", valor: 800, mes: hoje.getMonth() + 1, ano: hoje.getFullYear() }]));
  await page.route("http://localhost:3001/recorrencias/gerar", (route) => responderJson(route, { geradas: 0, movimentacoes: [{ id: 92, usuario_id: 42, tipo: "despesa", descricao: "Compras", valor: 450, categoria: "Mercado", data, created_at: hoje.toISOString(), forma_pagamento: "saldo" }] }));

  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/planejamento");

  await expect(page.getByRole("alert").filter({ hasText: "Você já utilizou 50% do orçamento de Mercado." })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Você já utilizou 50% do orçamento de Mercado.")).not.toBeVisible();
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
  await page.getByRole("button", { name: "Excluir Mercado" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta movimentação?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sim, excluir movimentação" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
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
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto("/lista");
  await page.getByRole("button", { name: "Excluir Arroz" }).click();
  await expect(page.getByRole("heading", { name: "Excluir este item?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sim, excluir item" })).toBeVisible();
});

test("confirma remoção da foto e avisa quando os dados pessoais não mudam", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/perfil");

  await page.getByRole("button", { name: "Remover foto" }).click();
  await expect(page.getByRole("heading", { name: "Remover sua foto?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sim, remover foto" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.getByLabel("Nome", { exact: true }).fill(usuario.nome);
  await page.getByRole("button", { name: "Salvar Alterações" }).click();
  await expect(page.getByText("Este nome já existe no seu perfil.")).toBeVisible();
  await page.getByLabel("Nome", { exact: true }).fill("");
  await page.getByLabel("E-mail", { exact: true }).fill(usuario.email.toUpperCase());
  await page.getByRole("button", { name: "Salvar Alterações" }).click();
  await expect(page.getByText("Este e-mail já existe no seu perfil.")).toBeVisible();
});
