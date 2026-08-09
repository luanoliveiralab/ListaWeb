CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    foto TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

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

CREATE TABLE IF NOT EXISTS meta_movimentacoes (
    id SERIAL PRIMARY KEY,
    meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('deposito', 'retirada')),
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    observacao VARCHAR(255),
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
CREATE INDEX IF NOT EXISTS idx_meta_movimentacoes_meta ON meta_movimentacoes(meta_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimentacoes_recorrencia_data
    ON movimentacoes(recorrencia_id, data) WHERE recorrencia_id IS NOT NULL;
