import { expect, test } from "@playwright/test";
import { prepararApi, responderJson, usuario } from "./fixtures";

test("exibe os acessos públicos da tela de login", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "ListaWeb" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute("href", "/esqueci-senha");
  await expect(page.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/cadastro");
  await expect(page.getByRole("link", { name: "Sobre o ListaWeb" })).toHaveAttribute("href", "/sobre?origem=login");
});

test("permite mostrar e ocultar senhas no login e no cadastro", async ({ page }) => {
  await page.goto("/");
  const senhaLogin = page.getByPlaceholder("Senha");
  await senhaLogin.fill("senha-visivel");
  await expect(senhaLogin).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(senhaLogin).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(senhaLogin).toHaveAttribute("type", "password");

  await page.goto("/cadastro");
  const senhaCadastro = page.getByPlaceholder("Senha", { exact: true });
  const confirmarSenha = page.getByPlaceholder("Confirmar senha");
  await page.getByRole("button", { name: "Mostrar senha" }).first().click();
  await expect(senhaCadastro).toHaveAttribute("type", "text");
  await expect(confirmarSenha).toHaveAttribute("type", "password");
});

test("exige a leitura e o aceite dos termos antes do cadastro", async ({ page }) => {
  await page.goto("/cadastro");
  const criarConta = page.getByRole("button", { name: "Criar Conta" });
  await expect(criarConta).toBeDisabled();

  await page.getByRole("button", { name: "Ler Termos de Uso e Privacidade" }).click();
  await expect(page.getByRole("heading", { name: "Termos de Uso e Privacidade" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Li e aceito" })).toBeDisabled();
  await page.getByTestId("registration-terms-content").evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await expect(page.getByRole("button", { name: "Li e aceito" })).toBeEnabled();
  await page.getByRole("button", { name: "Li e aceito" }).click();
  await expect(criarConta).toBeEnabled();

  await page.getByRole("button", { name: "Ler novamente" }).click();
  await page.getByRole("button", { name: "Não aceito" }).click();
  await expect(criarConta).toBeDisabled();
});

test("apresenta propósito, fases e gratuidade na página Sobre", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { name: /Mais clareza/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Etapas do projeto" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Foto de Luan Oliveira" })).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/in/luanoliveira-ld");
  await expect(page.getByRole("link", { name: "YouTube" })).toHaveAttribute("href", "https://www.youtube.com/@dev_lso");
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: "Mostrar mensagem 2" }).click();
  await page.waitForTimeout(4000);
  await expect(page.getByRole("heading", { name: /Cartões e faturas/ })).toBeVisible();
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

test("entra no dashboard imediatamente após criar a conta", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/cadastro");
  await page.getByPlaceholder("Nome").fill("Luan Oliveira");
  await page.getByPlaceholder("E-mail").fill("luan@example.com");
  await page.getByPlaceholder("Senha", { exact: true }).fill("senha-segura-123");
  await page.getByPlaceholder("Confirmar senha").fill("senha-segura-123");

  await page.getByRole("button", { name: "Ler Termos de Uso e Privacidade" }).click();
  await page.getByTestId("registration-terms-content").evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await page.getByRole("button", { name: "Li e aceito" }).click();
  await page.getByRole("button", { name: "Criar Conta" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("renova o token de segurança e repete a alteração uma única vez", async ({ page }) => {
  await prepararApi(page);
  let tentativas = 0;
  const tokens: string[] = [];
  await page.route("http://localhost:3001/csrf", (route) => responderJson(route, { csrfToken: "csrf-renovado" }));
  await page.route("http://localhost:3001/usuarios/42", (route) => {
    tentativas += 1;
    tokens.push(route.request().headers()["x-csrf-token"] ?? "");
    if (tentativas === 1) return responderJson(route, { mensagem: "Token de segurança inválido.", codigo: "CSRF_INVALIDO" }, 403);
    return responderJson(route, { ...usuario, nome: "Luan Atualizado" });
  });

  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/perfil");
  await page.getByLabel("Nome", { exact: true }).fill("Luan Atualizado");
  await page.getByRole("button", { name: "Salvar Alterações" }).click();

  await expect(page.getByText("Perfil atualizado com sucesso!")).toBeVisible();
  expect(tentativas).toBe(2);
  expect(tokens).toEqual(["csrf-teste", "csrf-renovado"]);
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
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: "Mostrar mensagem 2" }).click();
  await page.waitForTimeout(4000);
  await expect(page.getByText(/Acompanhe saldo, receitas, despesas/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Finanças/ })).toBeVisible();
});

test("gera o relatório financeiro sem páginas vazias", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "A geração de PDF usa o motor desktop de impressão.");
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/financas");
  await expect(page.getByRole("button", { name: "Salvar em PDF" })).toBeEnabled();

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-report")).toHaveCSS("display", "block");
  await expect(page.locator(".app-main > :not(.print-report)").first()).toHaveCSS("display", "none");
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const paginas = pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length ?? 0;
  expect(paginas).toBe(1);
  await testInfo.attach("relatorio-financeiro.pdf", { body: pdf, contentType: "application/pdf" });
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
  await page.getByLabel("Qual cartão?").click();
  await page.getByRole("option", { name: /Nubank/ }).click();
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

test("integra depósitos de metas ao saldo sem distorcer receitas e despesas", async ({ page }) => {
  await prepararApi(page);
  let metaMovimentada = false;
  const hoje = new Date();
  const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-10`;
  const base = [
    { id: 1, usuario_id: 42, tipo: "receita", descricao: "Salário", valor: 5000, categoria: "Salário", data, created_at: hoje.toISOString(), forma_pagamento: "saldo", impacta_resultado: true },
    { id: 2, usuario_id: 42, tipo: "despesa", descricao: "Mercado", valor: 250, categoria: "Mercado", data, created_at: hoje.toISOString(), forma_pagamento: "saldo", impacta_resultado: true },
  ];
  const transferencia = { id: 90, usuario_id: 42, tipo: "despesa", descricao: "Reserva para meta: Reserva", valor: 300, categoria: "Metas", data, created_at: hoje.toISOString(), forma_pagamento: "saldo", impacta_resultado: false, meta_movimentacao_id: 80 };

  await page.route("http://localhost:3001/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/metas/1/historico") return responderJson(route, []);
    if (pathname === "/metas/1/movimentar" && route.request().method() === "POST") {
      metaMovimentada = true;
      return responderJson(route, {
        meta: { id: 1, nome: "Reserva", valor_alvo: 10000, valor_atual: 1800, prazo: null, concluida: false },
        movimentacao: { id: 80, tipo: "deposito", valor: 300, observacao: null, created_at: hoje.toISOString() },
        movimentacao_financeira: transferencia,
      });
    }
    if (pathname === "/recorrencias/gerar") {
      return responderJson(route, {
        geradas: 0,
        movimentacoes: metaMovimentada ? [transferencia, ...base] : base,
      });
    }
    return route.fallback();
  });

  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/planejamento");
  await page.getByRole("button", { name: "Movimentar e ver histórico" }).click();
  const modal = page.locator(".modal-panel");
  await modal.locator('input[inputmode="decimal"]').fill("300");
  await modal.getByRole("button", { name: "Registrar movimentação" }).click();
  await expect(page.getByText("Valor da meta atualizado.")).toBeVisible();

  await page.goto("/financas");
  await expect(page.getByRole("heading", { name: "Reserva para meta: Reserva" })).toBeVisible();
  await expect(page.getByText("Transferência", { exact: true })).toBeVisible();
  await expect(page.locator("article").filter({ hasText: /^Saldo/ })).toContainText("R$ 4.450,00");
  await expect(page.locator("article").filter({ hasText: /^Receitas/ })).toContainText("R$ 5.000,00");
  await expect(page.locator("article").filter({ hasText: /^Despesas/ })).toContainText("R$ 250,00");
});

test("mantém o modal de categorias organizado no desktop e no mobile", async ({ page }, testInfo) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/configuracoes");
  await page.getByRole("link", { name: "Conhecer o projeto" }).click();
  await expect(page).toHaveURL(/\/sobre\?origem=configuracoes$/);
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page).toHaveURL(/\/configuracoes$/);
  await page.getByRole("button", { name: "Gerenciar categorias" }).click();

  const modal = page.getByTestId("categorias-modal");
  const lista = page.getByTestId("categorias-lista");
  await expect(modal).toHaveCSS("overflow-y", "hidden");
  await expect(lista).toHaveCSS("overflow-y", "auto");
  await page.getByRole("button", { name: "Excluir Mercado" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta categoria?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sim, excluir categoria" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta categoria?" })).not.toBeVisible();

  await page.getByRole("button", { name: "Editar Mercado" }).click();
  await expect(page.getByText("Editando categoria")).toBeVisible();
  await expect(page.getByLabel("Lista de Compras")).toBeChecked();
  await expect(page.getByLabel("Finanças")).toBeChecked();
  await expect(page.getByLabel("Planejamento")).toBeChecked();

  if (testInfo.project.name === "mobile") {
    await expect(lista).not.toBeVisible();
    await expect(page.getByRole("tab", { name: "Editar" })).toHaveAttribute("aria-selected", "true");
    const caixa = await modal.boundingBox();
    expect(caixa).not.toBeNull();
    expect(caixa!.x).toBeGreaterThanOrEqual(0);
    // Chromium pode arredondar dimensões fracionárias de forma diferente entre
    // Windows e Linux. Um pixel de tolerância ainda garante o modal na viewport.
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  } else {
    await expect(page.getByText("Despesas e compras")).toBeVisible();
    await expect(lista).toBeVisible();
  }

  await page.getByRole("button", { name: "Cancelar" }).click();
  if (testInfo.project.name === "mobile") {
    await expect(lista).toBeVisible();
    await page.getByRole("tab", { name: "Nova categoria" }).click();
    await expect(page.getByRole("heading", { name: "Nova categoria" })).toBeVisible();
    const campoNome = page.getByLabel("Nome");
    await campoNome.fill("Pets");
    await expect(campoNome).toHaveValue("Pets");
    await expect(campoNome).toBeFocused();
  }
});

test("exibe em cada página somente as categorias configuradas", async ({ page }) => {
  await prepararApi(page);
  await page.route("http://localhost:3001/categorias", (route) => responderJson(route, [
    { id: 1, nome: "Mercado", tipo: "despesa", aplica_lista: false, aplica_financas: true, aplica_planejamento: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, nome: "Pets", tipo: "despesa", aplica_lista: true, aplica_financas: false, aplica_planejamento: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]));
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/lista");
  await page.getByRole("button", { name: "Criar novo item" }).click();
  const categoriasLista = page.locator("form").getByRole("combobox").first();
  await expect(categoriasLista).toContainText("Selecionar categoria");
  await categoriasLista.click();
  await expect(page.getByRole("option", { name: "Pets" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Mercado" })).toHaveCount(0);
});

test("solicita confirmação visual nas exclusões financeiras e de planejamento", async ({ page }) => {
  await prepararApi(page);
  await page.route("http://localhost:3001/metas", (route) => responderJson(route, [
    { id: 1, nome: "Reserva", valor_alvo: 10000, valor_atual: 0, prazo: null, concluida: false },
  ]));
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

test("exige a senha atual antes de excluir definitivamente a conta", async ({ page }) => {
  await prepararApi(page);
  let exclusao: Record<string, unknown> | null = null;
  await page.route("http://localhost:3001/usuarios/42", (route) => {
    if (route.request().method() === "DELETE") {
      exclusao = route.request().postDataJSON();
      return responderJson(route, { mensagem: "Conta excluída com sucesso." });
    }
    return responderJson(route, usuario);
  });

  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Excluir minha conta" }).click();

  const confirmar = page.getByRole("button", { name: "Sim, excluir conta" });
  await expect(confirmar).toBeDisabled();
  await page.getByLabel("Confirme sua senha atual").fill("senha-segura-123");
  await expect(confirmar).toBeEnabled();
  await confirmar.click();

  await expect(page).toHaveURL(/\/$/);
  expect(exclusao).toEqual({ senhaAtual: "senha-segura-123" });
});
