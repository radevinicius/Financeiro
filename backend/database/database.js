import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Converter NUMERIC/DECIMAL (OID 1700) automaticamente para float
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente ocioso do PostgreSQL:', err);
});

/**
 * Inicializa o banco de dados executando o schema
 */
export async function initDatabase() {
  console.log('🗄️  Inicializando banco de dados PostgreSQL...');

  try {
    const client = await pool.connect();

    try {
      // Ler e executar schema
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const { dirname, join } = path;

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Executar schema (PostgreSQL aceita múltiplos statements)
      await client.query(schema);

      console.log('✅ Banco de dados inicializado com sucesso!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

/**
 * Helper para criar categorias padrão para um usuário
 */
export async function createDefaultCategories(userId) {
  const defaultCategories = [
    // Despesas
    { nome: 'Alimentação', tipo: 'despesa', icone: '🍔', cor: '#FF9500' },
    { nome: 'Transporte', tipo: 'despesa', icone: '🚗', cor: '#5856D6' },
    { nome: 'Moradia', tipo: 'despesa', icone: '🏠', cor: '#FF2D55' },
    { nome: 'Saúde', tipo: 'despesa', icone: '🏥', cor: '#34C759' },
    { nome: 'Lazer', tipo: 'despesa', icone: '🎮', cor: '#AF52DE' },
    { nome: 'Educação', tipo: 'despesa', icone: '📚', cor: '#007AFF' },
    { nome: 'Outros', tipo: 'despesa', icone: '📊', cor: '#8E8E93' },

    // Receitas
    { nome: 'Salário', tipo: 'receita', icone: '💼', cor: '#34C759' },
    { nome: 'Freelance', tipo: 'receita', icone: '💻', cor: '#007AFF' },
    { nome: 'Investimentos', tipo: 'receita', icone: '📈', cor: '#FF9500' },
    { nome: 'Outros', tipo: 'receita', icone: '💰', cor: '#8E8E93' }
  ];

  for (const cat of defaultCategories) {
    await pool.query(
      `INSERT INTO categorias (nome, tipo, usuario_id, icone, cor)
       VALUES ($1, $2, $3, $4, $5)`,
      [cat.nome, cat.tipo, userId, cat.icone, cat.cor]
    );
  }

  console.log(`✅ Categorias padrão criadas para usuário ${userId}`);
}

const NUMERIC_COLUMNS = new Set([
  'valor',
  'valor_meta',
  'total',
  'tamanho',
  'despesas_count',
  'receitas_count'
]);

/**
 * Helper para converter apenas colunas numéricas conhecidas do PostgreSQL
 * Evita converter descrições, telefones ou textos que contenham apenas dígitos
 */
function convertNumericValues(rows) {
  if (!rows || rows.length === 0) return rows;

  return rows.map(row => {
    const converted = { ...row };
    for (const key in converted) {
      if (!NUMERIC_COLUMNS.has(key)) continue;
      const value = converted[key];
      if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          converted[key] = num;
        }
      }
    }
    return converted;
  });
}

/**
 * Helper para executar query SELECT (retorna array de objetos)
 */
export async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return convertNumericValues(result.rows);
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

/**
 * Helper para executar INSERT/UPDATE/DELETE
 * Retorna { rows, rowCount, command }
 */
export async function run(sql, params = []) {
  try {
    const result = await pool.query(sql, params);

    // Para INSERT com RETURNING, rows[0] terá o registro inserido
    return {
      changes: result.rowCount,
      lastInsertRowid: result.rows[0]?.id || null,
      rows: result.rows
    };
  } catch (error) {
    console.error('Erro ao executar comando:', error);
    throw error;
  }
}

/**
 * Helper para buscar um único registro
 */
export async function getOne(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    const row = result.rows[0] || null;
    if (row) {
      return convertNumericValues([row])[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar registro:', error);
    throw error;
  }
}

/**
 * Sincroniza automaticamente as Despesas Fixas ativas do usuário para os meses do período consultado
 */
export async function syncFixedExpensesForRange(userId, dataInicio, dataFim) {
  if (!userId) return;

  try {
    const fixas = await query(
      'SELECT * FROM despesas_fixas WHERE usuario_id = $1 AND ativo = true',
      [userId]
    );

    if (!fixas || fixas.length === 0) return;

    // Determinar meses a sincronizar (padrão: mês atual se não informado)
    const today = new Date();
    const start = dataInicio ? new Date(`${String(dataInicio).split('T')[0]}T12:00:00Z`) : new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1, 12));
    const end = dataFim ? new Date(`${String(dataFim).split('T')[0]}T12:00:00Z`) : new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1, 12));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const months = [];
    let curYear = start.getUTCFullYear();
    let curMonth = start.getUTCMonth() + 1;
    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth() + 1;

    while ((curYear < endYear || (curYear === endYear && curMonth <= endMonth)) && months.length < 13) {
      months.push({ year: curYear, month: curMonth });
      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    // Buscar categoria padrão ("Outros" ou primeira categoria de despesa do usuário) caso alguma despesa fixa esteja sem categoria
    let fallbackCategoryId = null;
    const needsFallback = fixas.some(f => !f.categoria_id);
    if (needsFallback) {
      const catOutros = await getOne(
        `SELECT id FROM categorias WHERE usuario_id = $1 AND tipo = 'despesa' ORDER BY CASE WHEN LOWER(nome) = 'outros' THEN 0 ELSE 1 END, id ASC LIMIT 1`,
        [userId]
      );
      fallbackCategoryId = catOutros?.id || null;
    }

    for (const { year, month } of months) {
      const competencia = `${year}-${String(month).padStart(2, '0')}`;
      const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

      for (const fixa of fixas) {
        // Não lançar retroativamente em meses anteriores à criação da despesa fixa
        if (fixa.created_at) {
          const createdDate = new Date(fixa.created_at);
          const createdYear = createdDate.getUTCFullYear();
          const createdMonth = createdDate.getUTCMonth() + 1;
          if (year < createdYear || (year === createdYear && month < createdMonth)) {
            continue;
          }
        }

        const catId = fixa.categoria_id || fallbackCategoryId;
        if (!catId) continue;

        const day = Math.min(Math.max(1, parseInt(fixa.dia_vencimento) || 1), lastDayOfMonth);
        const dataLancamento = `${competencia}-${String(day).padStart(2, '0')}`;
        const descricaoLancamento = fixa.descricao ? `${fixa.nome} - ${fixa.descricao}` : fixa.nome;

        await pool.query(
          `INSERT INTO despesas (usuario_id, categoria_id, valor, data, descricao, origem, despesa_fixa_id, competencia)
           VALUES ($1, $2, $3, $4, $5, 'manual', $6, $7)
           ON CONFLICT (usuario_id, despesa_fixa_id, competencia)
           WHERE despesa_fixa_id IS NOT NULL AND competencia IS NOT NULL
           DO NOTHING`,
          [userId, catId, fixa.valor, dataLancamento, descricaoLancamento, fixa.id, competencia]
        );
      }
    }
  } catch (error) {
    console.error('Aviso ao sincronizar despesas fixas:', error.message);
  }
}

/**
 * Encerra o pool de conexões (útil para testes e shutdown graceful)
 */
export async function closePool() {
  await pool.end();
  console.log('🔌 Pool de conexões PostgreSQL encerrado');
}

export { pool };
export default pool;
