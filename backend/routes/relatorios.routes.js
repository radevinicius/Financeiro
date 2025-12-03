import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query } from '../database/database.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = express.Router();

/**
 * GET /api/relatorios/evolucao
 * Dados para gráfico de evolução temporal
 */
router.get('/evolucao', authenticateToken, async (req, res) => {
    try {
        const { meses = 6 } = req.query;

        const dados = [];
        const hoje = new Date();

        for (let i = parseInt(meses) - 1; i >= 0; i--) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mes = data.getMonth() + 1;
            const ano = data.getFullYear();

            const [receitas, despesas] = await Promise.all([
                query(
                    `SELECT COALESCE(SUM(valor), 0) as total FROM receitas 
                     WHERE usuario_id = $1 
                     AND EXTRACT(MONTH FROM data) = $2 
                     AND EXTRACT(YEAR FROM data) = $3`,
                    [req.user.id, mes, ano]
                ),
                query(
                    `SELECT COALESCE(SUM(valor), 0) as total FROM despesas 
                     WHERE usuario_id = $1 
                     AND EXTRACT(MONTH FROM data) = $2 
                     AND EXTRACT(YEAR FROM data) = $3`,
                    [req.user.id, mes, ano]
                )
            ]);

            dados.push({
                mes: `${mes.toString().padStart(2, '0')}/${ano.toString().substr(2)}`,
                receitas: receitas[0].total,
                despesas: despesas[0].total,
                saldo: receitas[0].total - despesas[0].total
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
            doc.fontSize(10).text(`${r.data} - ${r.categoria}: R$ ${r.valor.toFixed(2)}`);
        });

        doc.moveDown();
        doc.fontSize(16).text('Despesas');
        despesas.forEach(d => {
            doc.fontSize(10).text(`${d.data} - ${d.categoria}: R$ ${d.valor.toFixed(2)}`);
        });

        const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
        const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);

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
 *  Gerar relatório em Excel
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
