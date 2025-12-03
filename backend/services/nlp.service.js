/**
 * 🎙️ Serviço de NLP para Português Brasileiro
 * Extrai informações de texto natural para criar despesas/receitas
 */

/**
 * Extrai valor numérico do texto
 */
function extractValue(text) {
    // Padrões de valores
    const patterns = [
        /r?\$?\s*(\d+(?:[.,]\d{1,2})?)/i,
        /(\d+)\s*reais?/i,
        /(\d+)\s*real/i,
        /(\d+)\s*conto/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return parseFloat(match[1].replace(',', '.'));
        }
    }

    // Valores por extenso
    const valoresPorExtenso = {
        'cem': 100, 'duzentos': 200, 'trezentos': 300, 'quatrocentos': 400,
        'quinhentos': 500, 'seiscentos': 600, 'setecentos': 700, 'oitocentos': 800,
        'novecentos': 900, 'mil': 1000, 'dois mil': 2000
    };

    for (const [palavra, valor] of Object.entries(valoresPorExtenso)) {
        if (text.toLowerCase().includes(palavra)) {
            return valor;
        }
    }

    return null;
}

/**
 * Determina se é despesa ou receita
 */
function extractType(text) {
    const textLower = text.toLowerCase();

    // Palavras-chave de despesa
    const despesaKeywords = [
        'gastei', 'paguei', 'comprei', 'despesa', 'saiu', 'gasto',
        'conta', 'boleto', 'fatura', 'parcelado', 'débito'
    ];

    // Palavras-chave de receita
    const receitaKeywords = [
        'recebi', 'ganhei', 'entrou', 'receita', 'salário',
        'pagamento', 'renda', 'lucro', 'vendi'
    ];

    for (const keyword of despesaKeywords) {
        if (textLower.includes(keyword)) {
            return 'despesa';
        }
    }

    for (const keyword of receitaKeywords) {
        if (textLower.includes(keyword)) {
            return 'receita';
        }
    }

    return null;
}

/**
 * Extrai data do texto
 */
function extractDate(text) {
    const textLower = text.toLowerCase();
    const today = new Date();

    // Hoje
    if (textLower.includes('hoje')) {
        return today.toISOString().split('T')[0];
    }

    // Ontem
    if (textLower.includes('ontem')) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    // Anteontem
    if (textLower.includes('anteontem')) {
        const dayBefore = new Date(today);
        dayBefore.setDate(dayBefore.getDate() - 2);
        return dayBefore.toISOString().split('T')[0];
    }

    // Padrão de data DD/MM ou DD/MM/YYYY
    const datePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
    const dateMatch = text.match(datePattern);

    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1; // Mês é 0-indexed
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();

        const date = new Date(year, month, day);
        return date.toISOString().split('T')[0];
    }

    // Default: hoje
    return today.toISOString().split('T')[0];
}

/**
 * Sugere categoria baseada no texto
 */
function suggestCategory(text, type) {
    const textLower = text.toLowerCase();

    if (type === 'despesa') {
        const categoryMap = {
            // Alimentação
            'alimentação': ['comida', 'restaurante', 'lanche', 'almoço', 'jantar', 'café', 'mercado', 'supermercado', 'padaria'],

            // Transporte
            'transporte': ['gasolina', 'uber', 'táxi', 'ônibus', 'metrô', 'combustível', 'estacionamento', 'transporte'],

            // Moradia
            'moradia': ['aluguel', 'condomínio', 'água', 'luz', 'internet', 'gás', 'iptu', 'casa'],

            // Saúde
            'saúde': ['farmácia', 'remédio', 'médico', 'consulta', 'exame', 'plano de saúde', 'dentista'],

            // Lazer
            'lazer': ['cinema', 'show', 'festa', 'viagem', 'diversão', 'streaming', 'netflix', 'spotify', 'jogo'],

            // Educação
            'educação': ['curso', 'livro', 'escola', 'faculdade', 'aula', 'material escolar']
        };

        for (const [category, keywords] of Object.entries(categoryMap)) {
            for (const keyword of keywords) {
                if (textLower.includes(keyword)) {
                    return category;
                }
            }
        }
    } else if (type === 'receita') {
        const categoryMap = {
            'salário': ['salário', 'pagamento', 'trabalho'],
            'freelance': ['freela', 'freelance', 'bico', 'extra'],
            'investimentos': ['dividendo', 'investimento', 'ação', 'renda']
        };

        for (const [category, keywords] of Object.entries(categoryMap)) {
            for (const keyword of keywords) {
                if (textLower.includes(keyword)) {
                    return category;
                }
            }
        }
    }

    return 'outros';
}

/**
 * Processa texto completo e retorna objeto estruturado
 */
export function parseFinancialText(text) {
    const valor = extractValue(text);
    const tipo = extractType(text);
    const data = extractDate(text);
    const categoriaSugerida = suggestCategory(text, tipo);

    return {
        valor,
        tipo,
        data,
        categoriaSugerida,
        descricao: text.trim(),
        sucesso: valor !== null && tipo !== null
    };
}

/**
 * Exemplos:
 * "gastei 50 reais com gasolina hoje" 
 *   -> { valor: 50, tipo: 'despesa', data: '2025-12-02', categoriaSugerida: 'transporte' }
 * 
 * "paguei o aluguel de 800"
 *   -> { valor: 800, tipo: 'despesa', data: '2025-12-02', categoriaSugerida: 'moradia' }
 * 
 * "recebi 400 de freela ontem"
 *   -> { valor: 400, tipo: 'receita', data: '2025-12-01', categoriaSugerida: 'freelance' }
 */
