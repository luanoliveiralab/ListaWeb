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

CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_data
    ON movimentacoes(usuario_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_listas_usuario
    ON listas(usuario_id);
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
CREATE INDEX IF NOT EXISTS idx_movimentacoes_programadas_pendentes
    ON movimentacoes_programadas(usuario_id, data_programada)
    WHERE lancada_em IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimentacoes_recorrencia_data
    ON movimentacoes(recorrencia_id, data) WHERE recorrencia_id IS NOT NULL;
