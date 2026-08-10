import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { prepararApi, usuario } from "./fixtures";

async function esperarAnimacoes(page: Page) {
  await page.waitForTimeout(900);
}

async function esperarSemViolacoesCriticas(page: Page) {
  await esperarAnimacoes(page);
  const resultado = await new AxeBuilder({ page }).analyze();
  const graves = resultado.violations.filter((item) => item.impact === "critical" || item.impact === "serious");
  expect(graves, graves.map((item) => `${item.id}: ${item.help} (${item.nodes.length})`).join("\n")).toEqual([]);
}

test("login e página Sobre não possuem violações graves", async ({ page }) => {
  await page.goto("/");
  await esperarSemViolacoesCriticas(page);
  await page.goto("/sobre");
  await esperarSemViolacoesCriticas(page);
});

test("dashboard e gerenciamento de categorias preservam acessibilidade", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await esperarSemViolacoesCriticas(page);

  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Gerenciar categorias" }).click();
  await esperarSemViolacoesCriticas(page);
});

test("diálogo de confirmação recebe foco e fecha pelo teclado", async ({ page }) => {
  await prepararApi(page);
  await page.goto("/");
  await page.getByPlaceholder("E-mail").fill(usuario.email);
  await page.getByPlaceholder("Senha").fill("senha-segura-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Gerenciar categorias" }).click();
  await page.getByRole("button", { name: "Excluir Mercado" }).click();
  await expect(page.getByRole("heading", { name: "Excluir esta categoria?" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest("[data-slot='alert-dialog-content']")))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Excluir esta categoria?" })).not.toBeVisible();
});
