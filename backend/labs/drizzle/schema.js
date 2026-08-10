const { pgTable, serial, integer, smallint, varchar, numeric, timestamp, unique } = require("drizzle-orm/pg-core");

const usuarios = pgTable("usuarios", {
    id: serial("id").primaryKey(),
});

const cartoes = pgTable("cartoes", {
    id: serial("id").primaryKey(),
    usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 80 }).notNull(),
    instituicao: varchar("instituicao", { length: 80 }).notNull(),
    limiteDisponivel: numeric("limite_disponivel", { precision: 12, scale: 2 }).notNull(),
    diaVencimento: smallint("dia_vencimento").notNull(),
    criadoEm: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const faturasCartao = pgTable("faturas_cartao", {
    id: serial("id").primaryKey(),
    cartaoId: integer("cartao_id").notNull().references(() => cartoes.id, { onDelete: "cascade" }),
    usuarioId: integer("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
    mes: smallint("mes").notNull(),
    ano: integer("ano").notNull(),
    status: varchar("status", { length: 10 }).notNull().default("aberta"),
    fechadaEm: timestamp("fechada_em", { withTimezone: true }),
    pagaEm: timestamp("paga_em", { withTimezone: true }),
    criadoEm: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (tabela) => [unique("faturas_cartao_cartao_id_ano_mes_key").on(tabela.cartaoId, tabela.ano, tabela.mes)]);

module.exports = { usuarios, cartoes, faturasCartao };
