CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    foto TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS termos_versao VARCHAR(20);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    categoria VARCHAR(80) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    categoria VARCHAR(80) NOT NULL DEFAULT 'Lista de Compras',
    valor NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
    comprado BOOLEAN NOT NULL DEFAULT FALSE,
    movimentacao_id INTEGER REFERENCES movimentacoes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orcamentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria VARCHAR(80) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL CHECK (ano BETWEEN 2000 AND 2200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, categoria, mes, ano)
);

CREATE TABLE IF NOT EXISTS recorrencias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    categoria VARCHAR(80) NOT NULL,
    dia SMALLINT NOT NULL CHECK (dia BETWEEN 1 AND 28),
    forma_pagamento VARCHAR(10) NOT NULL DEFAULT 'saldo' CHECK (forma_pagamento IN ('saldo', 'credito')),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS recorrencia_id
    INTEGER REFERENCES recorrencias(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS metas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(160) NOT NULL,
    valor_alvo NUMERIC(12, 2) NOT NULL CHECK (valor_alvo > 0),
    valor_atual NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (valor_atual >= 0),
    prazo DATE,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recuperacoes_senha (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    usado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verificacoes_email (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    usado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meta_movimentacoes (
    id SERIAL PRIMARY KEY,
    meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('deposito', 'retirada')),
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    observacao VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS impacta_resultado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS meta_movimentacao_id
    INTEGER UNIQUE REFERENCES meta_movimentacoes(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'movimentacoes_meta_movimentacao_id_fkey'
          AND conrelid = 'movimentacoes'::regclass
          AND confdeltype <> 'n'
    ) THEN
        ALTER TABLE movimentacoes DROP CONSTRAINT movimentacoes_meta_movimentacao_id_fkey;
    END IF;
    ALTER TABLE movimentacoes
        ADD CONSTRAINT movimentacoes_meta_movimentacao_id_fkey
        FOREIGN KEY (meta_movimentacao_id) REFERENCES meta_movimentacoes(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS cartoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(80) NOT NULL,
    instituicao VARCHAR(80) NOT NULL,
    limite_disponivel NUMERIC(12, 2) NOT NULL CHECK (limite_disponivel >= 0),
    dia_vencimento SMALLINT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- O fechamento define em qual fatura uma compra entra; cartões antigos recebem um padrão seguro.
ALTER TABLE cartoes ADD COLUMN IF NOT EXISTS dia_fechamento SMALLINT CHECK (dia_fechamento BETWEEN 1 AND 31);
UPDATE cartoes SET dia_fechamento = GREATEST(1, dia_vencimento - 7) WHERE dia_fechamento IS NULL;
ALTER TABLE cartoes ALTER COLUMN dia_fechamento SET NOT NULL;

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(80) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_usuario_nome_tipo
    ON categorias(usuario_id, LOWER(nome), tipo);
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS aplica_lista BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS aplica_financas BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS aplica_planejamento BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS faturas_cartao (
    id SERIAL PRIMARY KEY,
    cartao_id INTEGER NOT NULL REFERENCES cartoes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mes SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL CHECK (ano BETWEEN 2000 AND 2200),
    status VARCHAR(10) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'paga')),
    fechada_em TIMESTAMPTZ,
    paga_em TIMESTAMPTZ,
    pagamento_movimentacao_id INTEGER REFERENCES movimentacoes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cartao_id, ano, mes)
);

ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS fatura_pagamento_id
    INTEGER REFERENCES faturas_cartao(id) ON DELETE SET NULL;
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS grupo_parcelamento UUID;
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS parcela_atual SMALLINT CHECK (parcela_atual IS NULL OR parcela_atual > 0);
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS parcelas_total SMALLINT CHECK (parcelas_total IS NULL OR parcelas_total BETWEEN 2 AND 48);

ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS forma_pagamento
    VARCHAR(10) NOT NULL DEFAULT 'saldo' CHECK (forma_pagamento IN ('saldo', 'credito'));
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS cartao_id
    INTEGER REFERENCES cartoes(id) ON DELETE SET NULL;

ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS fatura_ano INTEGER CHECK (fatura_ano IS NULL OR fatura_ano BETWEEN 2000 AND 2200);
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS fatura_mes SMALLINT CHECK (fatura_mes IS NULL OR fatura_mes BETWEEN 1 AND 12);
UPDATE movimentacoes m
SET fatura_ano = EXTRACT(YEAR FROM (date_trunc('month', m.data)::date
        + CASE WHEN EXTRACT(DAY FROM m.data)::integer > c.dia_fechamento THEN INTERVAL '1 month' ELSE INTERVAL '0 month' END))::integer,
    fatura_mes = EXTRACT(MONTH FROM (date_trunc('month', m.data)::date
        + CASE WHEN EXTRACT(DAY FROM m.data)::integer > c.dia_fechamento THEN INTERVAL '1 month' ELSE INTERVAL '0 month' END))::integer
FROM cartoes c
WHERE m.cartao_id = c.id AND m.forma_pagamento = 'credito'
  AND (m.fatura_ano IS NULL OR m.fatura_mes IS NULL);
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS conciliada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS conciliada_em TIMESTAMPTZ;
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS origem_importacao VARCHAR(12);
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS referencia_externa VARCHAR(160);
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimentacoes_importacao_unica
    ON movimentacoes(usuario_id, origem_importacao, referencia_externa)
    WHERE origem_importacao IS NOT NULL AND referencia_externa IS NOT NULL;

CREATE OR REPLACE FUNCTION definir_periodo_fatura_movimentacao() RETURNS trigger AS $$
DECLARE fechamento INTEGER; periodo DATE;
BEGIN
    IF NEW.forma_pagamento = 'credito' AND NEW.cartao_id IS NOT NULL THEN
        SELECT dia_fechamento INTO fechamento FROM cartoes WHERE id = NEW.cartao_id;
        periodo := date_trunc('month', NEW.data)::date;
        IF EXTRACT(DAY FROM NEW.data)::integer > fechamento THEN periodo := (periodo + INTERVAL '1 month')::date; END IF;
        NEW.fatura_ano := EXTRACT(YEAR FROM periodo)::integer;
        NEW.fatura_mes := EXTRACT(MONTH FROM periodo)::integer;
    ELSE NEW.fatura_ano := NULL; NEW.fatura_mes := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_definir_periodo_fatura ON movimentacoes;
CREATE TRIGGER trg_definir_periodo_fatura BEFORE INSERT OR UPDATE OF data, forma_pagamento, cartao_id ON movimentacoes
    FOR EACH ROW EXECUTE FUNCTION definir_periodo_fatura_movimentacao();

ALTER TABLE recorrencias ADD COLUMN IF NOT EXISTS forma_pagamento
    VARCHAR(10) NOT NULL DEFAULT 'saldo' CHECK (forma_pagamento IN ('saldo', 'credito'));
ALTER TABLE recorrencias ADD COLUMN IF NOT EXISTS cartao_id
    INTEGER REFERENCES cartoes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS movimentacoes_programadas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    categoria VARCHAR(80) NOT NULL,
    data_programada DATE NOT NULL,
    forma_pagamento VARCHAR(10) NOT NULL DEFAULT 'saldo' CHECK (forma_pagamento IN ('saldo', 'credito')),
    cartao_id INTEGER REFERENCES cartoes(id) ON DELETE SET NULL,
    movimentacao_id INTEGER UNIQUE REFERENCES movimentacoes(id) ON DELETE SET NULL,
    lancada_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE movimentacoes_programadas ADD COLUMN IF NOT EXISTS status VARCHAR(12) NOT NULL DEFAULT 'pendente';
ALTER TABLE movimentacoes_programadas ADD COLUMN IF NOT EXISTS erro TEXT;
ALTER TABLE movimentacoes_programadas ADD COLUMN IF NOT EXISTS ultima_tentativa_em TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS recorrencia_execucoes (
    id SERIAL PRIMARY KEY,
    recorrencia_id INTEGER NOT NULL REFERENCES recorrencias(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_programada DATE NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'pendente',
    erro TEXT,
    movimentacao_id INTEGER UNIQUE REFERENCES movimentacoes(id) ON DELETE SET NULL,
    ultima_tentativa_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (recorrencia_id, data_programada)
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_data
    ON movimentacoes(usuario_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_listas_usuario
    ON listas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_listas_usuario_created_at
    ON listas(usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orcamentos_usuario_periodo
    ON orcamentos(usuario_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_recorrencias_usuario ON recorrencias(usuario_id, ativa);
CREATE INDEX IF NOT EXISTS idx_metas_usuario ON metas(usuario_id, concluida);
CREATE INDEX IF NOT EXISTS idx_recuperacoes_senha_usuario ON recuperacoes_senha(usuario_id, expira_em DESC);
CREATE INDEX IF NOT EXISTS idx_verificacoes_email_usuario ON verificacoes_email(usuario_id, expira_em DESC);
CREATE INDEX IF NOT EXISTS idx_meta_movimentacoes_meta ON meta_movimentacoes(meta_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_meta ON movimentacoes(meta_movimentacao_id)
    WHERE meta_movimentacao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cartoes_usuario ON cartoes(usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faturas_cartao_periodo ON faturas_cartao(cartao_id, ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_fatura_pagamento ON movimentacoes(fatura_pagamento_id)
    WHERE fatura_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimentacoes_grupo_parcelamento ON movimentacoes(grupo_parcelamento)
    WHERE grupo_parcelamento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimentacoes_cartao_data ON movimentacoes(cartao_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_cartao_data
    ON movimentacoes(usuario_id, cartao_id, data DESC)
    WHERE forma_pagamento = 'credito';
CREATE INDEX IF NOT EXISTS idx_movimentacoes_programadas_pendentes
    ON movimentacoes_programadas(usuario_id, data_programada)
    WHERE lancada_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_recorrencia_execucoes_usuario_data
    ON recorrencia_execucoes(usuario_id, data_programada DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimentacoes_recorrencia_data
    ON movimentacoes(recorrencia_id, data) WHERE recorrencia_id IS NOT NULL;
