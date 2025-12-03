-- ================================================
-- 💰 iOS-Style Financial App - PostgreSQL Schema
-- ================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    senha_hash TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('admin', 'normal')) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
    usuario_id INTEGER NOT NULL,
    icone TEXT DEFAULT '📊',
    cor TEXT DEFAULT '#007AFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Despesas
CREATE TABLE IF NOT EXISTS despesas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL,
    descricao TEXT,
    origem TEXT NOT NULL CHECK(origem IN ('whatsapp', 'manual')) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS receitas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL,
    descricao TEXT,
    origem TEXT NOT NULL CHECK(origem IN ('whatsapp', 'manual')) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- Tabela de Preferências do Usuário
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE,
    tema TEXT DEFAULT 'light' CHECK(tema IN ('light', 'dark')),
    alertas_email BOOLEAN DEFAULT TRUE,
    alertas_push BOOLEAN DEFAULT TRUE,
    idioma TEXT DEFAULT 'pt-BR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Metas Financeiras
CREATE TABLE IF NOT EXISTS metas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('economia', 'limite_categoria', 'limite_total')),
    categoria_id INTEGER,
    valor_meta DECIMAL(10,2) NOT NULL,
    periodo TEXT NOT NULL CHECK(periodo IN ('mensal', 'anual')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- Tabela de Anexos
CREATE TABLE IF NOT EXISTS anexos (
    id SERIAL PRIMARY KEY,
    transacao_tipo TEXT NOT NULL CHECK(transacao_tipo IN ('despesa', 'receita')),
    transacao_id INTEGER NOT NULL,
    nome_arquivo TEXT NOT NULL,
    caminho_arquivo TEXT NOT NULL,
    tamanho INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Despesas Fixas
CREATE TABLE IF NOT EXISTS despesas_fixas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    dia_vencimento INTEGER CHECK(dia_vencimento >= 1 AND dia_vencimento <= 31),
    categoria_id INTEGER,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_despesas_usuario ON despesas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data);
CREATE INDEX IF NOT EXISTS idx_receitas_usuario ON receitas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_receitas_data ON receitas(data);
CREATE INDEX IF NOT EXISTS idx_categorias_usuario ON categorias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_metas_usuario ON metas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_anexos_transacao ON anexos(transacao_tipo, transacao_id);
CREATE INDEX IF NOT EXISTS idx_despesas_fixas_usuario ON despesas_fixas(usuario_id);

-- Categorias padrão para novos usuários (serão inseridas via código)
-- Despesas: Alimentação, Transporte, Moradia, Saúde, Lazer, Outros
-- Receitas: Salário, Freelance, Investimentos, Outros
