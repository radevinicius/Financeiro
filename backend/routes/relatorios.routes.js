import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query } from '../database/database.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = express.Router();

/**
 * GET /api/relatorios/evolucao
 * Dados para gráfico de evolução temporal (otimizado com GROUP BY)
 */
router.get('/evolucao', authenticateToken, async (req, res) => {
    try {
        const numMeses = Math.max(1, Math.min(24, parseInt(req.query.meses) || 6));
        const hoje = new Date();
        const dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - (numMeses - 1), 1);
        const dataInicialStr = `${dataInicial.getFullYear()}-${String(dataInicial.getMonth() + 1).padStart(2, '0')}-01`;

        const [receitasAgrupadas, despesasAgrupadas] = await Promise.all([
            query(
                `SELECT EXTRACT(YEAR FROM data)::int AS ano,
                        EXTRACT(MONTH FROM data)::int AS mes,
                        COALESCE(SUM(valor), 0) AS total
                 FROM receitas
                 WHERE usuario_id = $1 AND data >= $2
                 GROUP BY ano, mes`,
                [req.user.id, dataInicialStr]
            ),
            query(
                `SELECT EXTRACT(YEAR FROM data)::int AS ano,
                        EXTRACT(MONTH FROM data)::int AS mes,
                        COALESCE(SUM(valor), 0) AS total
                 FROM despesas
                 WHERE usuario_id = $1 AND data >= $2
                 GROUP BY ano, mes`,
                [req.user.id, dataInicialStr]
            )
        ]);

        const mapaReceitas = new Map(receitasAgrupadas.map(r => [`${r.ano}-${r.mes}`, Number(r.total) || 0]));
        const mapaDespesas = new Map(despesasAgrupadas.map(d => [`${d.ano}-${d.mes}`, Number(d.total) || 0]));

        const dados = [];
        for (let i = numMeses - 1; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mes = d.getMonth() + 1;
            const ano = d.getFullYear();
            const chave = `${ano}-${mes}`;

            const rec = mapaReceitas.get(chave) || 0;
            const desp = mapaDespesas.get(chave) || 0;

            dados.push({
                mes: `${mes.toString().padStart(2, '0')}/${ano.toString().slice(2)}`,
                receitas: rec,
                despesas: desp,
                saldo: rec - desp
            });
        }

        res.json({ dados });
    } catch (error) {
        console.error('Erro ao gerar dados de evolução:', error);
        res.status(500).json({ error: 'Erro ao gerar dados de evolução' });
    }
});

/**
 * GET /api/relatorios/pdf
 * Gerar relatório em PDF
 */
router.get('/pdf', authenticateToken, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;

        const [despesas, receitas] = await Promise.all([
            query(
                `SELECT d.*, c.nome as categoria 
                 FROM despesas d LEFT JOIN categorias c ON d.categoria_id = c.id 
                 WHERE d.usuario_id = $1 AND d.data BETWEEN $2 AND $3
                 ORDER BY d.data DESC`,
                [req.user.id, dataInicio, dataFim]
            ),
            query(
                `SELECT r.*, c.nome as categoria 
                 FROM receitas r LEFT JOIN categorias c ON r.categoria_id = c.id 
                 WHERE r.usuario_id = $1 AND r.data BETWEEN $2 AND $3
                 ORDER BY r.data DESC`,
                [req.user.id, dataInicio, dataFim]
            )
        ]);

        const formatPdfDate = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-${dataInicio}-${dataFim}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Relatório Financeiro', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${dataInicio} até ${dataFim}`);
        doc.moveDown();

        doc.fontSize(16).text('Receitas');
        receitas.forEach(r => {
            doc.fontSize(10).text(`${formatPdfDate(r.data)} - ${r.categoria}: R$ ${Number(r.valor || 0).toFixed(2)}`);
        });

        doc.moveDown();
        doc.fontSize(16).text('Despesas');
        despesas.forEach(d => {
            doc.fontSize(10).text(`${formatPdfDate(d.data)} - ${d.categoria}: R$ ${Number(d.valor || 0).toFixed(2)}`);
        });

        const totalReceitas = receitas.reduce((sum, r) => sum + Number(r.valor || 0), 0);
        const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valor || 0), 0);

        doc.moveDown();
        doc.fontSize(14).text(`Total Receitas: R$ ${totalReceitas.toFixed(2)}`);
        doc.text(`Total Despesas: R$ ${totalDespesas.toFixed(2)}`);
        doc.text(`Saldo: R$ ${(totalReceitas - totalDespesas).toFixed(2)}`);

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        res.status(500).json({ error: 'Erro ao gerar PDF' });
    }
});

/**
 * GET /api/relatorios/excel
 * Gerar relatório em Excel
 */
router.get('/excel', authenticateToken, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;

        const [despesas, receitas] = await Promise.all([
            query(
                `SELECT d.*, c.nome as categoria 
                 FROM despesas d LEFT JOIN categorias c ON d.categoria_id = c.id 
                 WHERE d.usuario_id = $1 AND d.data BETWEEN $2 AND $3
                 ORDER BY d.data DESC`,
                [req.user.id, dataInicio, dataFim]
            ),
            query(
                `SELECT r.*, c.nome as categoria 
                 FROM receitas r LEFT JOIN categorias c ON r.categoria_id = c.id 
                 WHERE r.usuario_id = $1 AND r.data BETWEEN $2 AND $3
                 ORDER BY r.data DESC`,
                [req.user.id, dataInicio, dataFim]
            )
        ]);

        const workbook = new ExcelJS.Workbook();

        const receitasSheet = workbook.addWorksheet('Receitas');
        receitasSheet.columns = [
            { header: 'Data', key: 'data', width: 12 },
            { header: 'Categoria', key: 'categoria', width: 20 },
            { header: 'Valor', key: 'valor', width: 12 },
            { header: 'Descrição', key: 'descricao', width: 30 }
        ];
        receitasSheet.addRows(receitas);

        const despesasSheet = workbook.addWorksheet('Despesas');
        despesasSheet.columns = [
            { header: 'Data', key: 'data', width: 12 },
            { header: 'Categoria', key: 'categoria', width: 20 },
            { header: 'Valor', key: 'valor', width: 12 },
            { header: 'Descrição', key: 'descricao', width: 30 }
        ];
        despesasSheet.addRows(despesas);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-${dataInicio}-${dataFim}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        res.status(500).json({ error: 'Erro ao gerar Excel' });
    }
});

export default router;
