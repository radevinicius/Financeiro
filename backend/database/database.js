import pg from 'pg';
const { Pool } = pg;

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
  console.error('❌ Erro inesperado no PostgreSQL:', err);
  process.exit(-1);
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

/**
 * Helper para converter valores numéricos do PostgreSQL
 * PostgreSQL retorna DECIMAL/NUMERIC como strings, precisamos converter para números
 */
function convertNumericValues(rows) {
  if (!rows || rows.length === 0) return rows;

  return rows.map(row => {
    const converted = { ...row };
    for (const key in converted) {
      const value = converted[key];
      // Converter strings numéricas para números
      if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
        // Verificar se é um número válido
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
    // Converter valores numéricos automáticamente
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
      // Converter valores numéricos
      return convertNumericValues([row])[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar registro:', error);
    throw error;
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
