import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { despesasAPI, receitasAPI, metasAPI, relatoriosAPI } from '../services/api';
import axios from 'axios';
import Card from '../components/Card';
import SegmentControl from '../components/SegmentControl';
import Input from '../components/Input';
import './DashboardScreen.css';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function DashboardScreen() {
    const [period, setPeriod] = useState('month');
    const [customDates, setCustomDates] = useState({
        dataInicio: '',
        dataFim: ''
    });
    const [stats, setStats] = useState({
        totalReceitas: 0,
        totalDespesas: 0,
        saldo: 0
    });
    const [despesasPorCategoria, setDespesasPorCategoria] = useState([]);
    const [receitasPorCategoria, setReceitasPorCategoria] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [evolutionData, setEvolutionData] = useState([]);
    const [loading, setLoading] = useState(true);

    const periodOptions = [
        { value: 'today', label: 'Hoje' },
        { value: 'week', label: 'Semana' },
        { value: 'month', label: 'Mês' },
        { value: 'year', label: 'Ano' },
        { value: 'custom', label: 'Personalizado' }
    ];

    useEffect(() => {
        if (period !== 'custom' || (customDates.dataInicio && customDates.dataFim)) {
            loadDashboard();
            loadEvolution();
        }
    }, [period, customDates]);

    const getDateRange = () => {
        if (period === 'custom') {
            return {
                dataInicio: customDates.dataInicio,
                dataFim: customDates.dataFim
            };
        }

        const today = new Date();
        let dataInicio, dataFim;

        switch (period) {
            case 'today':
                dataInicio = dataFim = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                dataInicio = weekAgo.toISOString().split('T')[0];
                dataFim = today.toISOString().split('T')[0];
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                dataInicio = monthStart.toISOString().split('T')[0];
                dataFim = today.toISOString().split('T')[0];
                break;
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                dataInicio = yearStart.toISOString().split('T')[0];
                dataFim = today.toISOString().split('T')[0];
                break;
            default:
                dataInicio = dataFim = today.toISOString().split('T')[0];
        }

        return { dataInicio, dataFim };
    };

    const [alerts, setAlerts] = useState([]);

    const checkAlerts = async () => {
        try {
            const response = await metasAPI.getProgresso();
            const metas = response.data.metas || [];
            const newAlerts = [];

            metas.forEach(meta => {
                if (meta.porcentagem >= 100) {
                    newAlerts.push({
                        id: meta.id,
                        type: 'danger',
                        message: `🚨 Meta "${meta.nome}" atingiu 100% do limite!`
                    });
                } else if (meta.porcentagem >= 90) {
                    newAlerts.push({
                        id: meta.id,
                        type: 'warning',
                        message: `⚠️ Meta "${meta.nome}" está em ${meta.porcentagem.toFixed(0)}% do limite.`
                    });
                }
            });

            setAlerts(newAlerts);
        } catch (error) {
            console.error('Erro ao verificar alertas:', error);
        }
    };

    const handleExport = async (type) => {
        try {
            const { dataInicio, dataFim } = getDateRange();
            let response;

            if (type === 'pdf') {
                response = await relatoriosAPI.downloadPDF(dataInicio, dataFim);
            } else {
                response = await relatoriosAPI.downloadExcel(dataInicio, dataFim);
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio-${type}-${dataInicio}-${dataFim}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar relatório');
        }
    };

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const { dataInicio, dataFim } = getDateRange();

            if (!dataInicio || !dataFim) {
                setLoading(false);
                return;
            }

            const [despesasRes, receitasRes] = await Promise.all([
                despesasAPI.getAll({ dataInicio, dataFim }),
                receitasAPI.getAll({ dataInicio, dataFim })
            ]);

            const totalDespesas = despesas.reduce(
    (sum, d) => sum + Number(d.valor || 0),
    0
);

const totalReceitas = receitas.reduce(
    (sum, r) => sum + Number(r.valor || 0),
    0
);

setStats({
    totalReceitas: Number(totalReceitas) || 0,
    totalDespesas: Number(totalDespesas) || 0,
    saldo: Number(totalReceitas - totalDespesas) || 0
});

            // Agrupar despesas por categoria
            const categoriasDespesas = {};
            despesas.forEach(d => {
                const cat = d.categoria_nome || 'Outros';
                if (!categoriasDespesas[cat]) {
                    categoriasDespesas[cat] = { total: 0, cor: d.categoria_cor || '#FF3B30', icone: d.categoria_icone || '📊' };
                }
                categoriasDespesas[cat].total += d.valor;
            });

            setDespesasPorCategoria(Object.entries(categoriasDespesas).map(([nome, data]) => ({
                nome,
                ...data
            })));

            // Agrupar receitas por categoria
            const categoriasReceitas = {};
            receitas.forEach(r => {
                const cat = r.categoria_nome || 'Outros';
                if (!categoriasReceitas[cat]) {
                    categoriasReceitas[cat] = { total: 0, cor: r.categoria_cor || '#34C759', icone: r.categoria_icone || '💰' };
                }
                categoriasReceitas[cat].total += r.valor;
            });

            setReceitasPorCategoria(Object.entries(categoriasReceitas).map(([nome, data]) => ({
                nome,
                ...data
            })));

            // Combinar e ordenar últimas movimentações
            const allTransactions = [
                ...despesas.map(d => ({
                    ...d,
                    tipo: 'despesa',
                    tipoLabel: 'Despesa',
                    cor: d.categoria_cor || '#FF3B30'
                })),
                ...receitas.map(r => ({
                    ...r,
                    tipo: 'receita',
                    tipoLabel: 'Receita',
                    cor: r.categoria_cor || '#34C759'
                }))
            ];

            // Ordenar por data decrescente (mais recentes primeiro)
            allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Pegar apenas as 5 mais recentes
            setRecentTransactions(allTransactions.slice(0, 5));

            setLoading(false);
            checkAlerts();
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            setLoading(false);
        }
    };

    const loadEvolution = async () => {
        try {
            const response = await axios.get('/api/relatorios/evolucao?meses=6');
            setEvolutionData(response.data.dados || []);
        } catch (error) {
            console.error('Erro ao carregar evolução:', error);
        }
    };

    const despesasChartData = {
        labels: despesasPorCategoria.map(c => c.nome),
        datasets: [{
            data: despesasPorCategoria.map(c => c.total),
            backgroundColor: despesasPorCategoria.map(c => c.cor),
            borderWidth: 0
        }]
    };

    const receitasChartData = {
        labels: receitasPorCategoria.map(c => c.nome),
        datasets: [{
            data: receitasPorCategoria.map(c => c.total),
            backgroundColor: receitasPorCategoria.map(c => c.cor),
            borderWidth: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: { size: 12, family: 'Inter' },
                    usePointStyle: true
                }
            }
        }
    };

    const evolutionChartData = {
        labels: evolutionData.map(d => d.mes),
        datasets: [
            {
                label: 'Receitas',
                data: evolutionData.map(d => d.receitas),
                borderColor: 'var(--ios-green)',
                backgroundColor: 'rgba(52, 199, 89, 0.1)',
                tension: 0.4
            },
            {
                label: 'Despesas',
                data: evolutionData.map(d => d.despesas),
                borderColor: 'var(--ios-red)',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                tension: 0.4
            },
            {
                label: 'Saldo',
                data: evolutionData.map(d => d.saldo),
                borderColor: 'var(--ios-blue)',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                tension: 0.4
            }
        ]
    };

    return (
        <div className="page fade-in">
            <div className="dashboard-header">
                <div className="header-top">
                    <h1>Dashboard</h1>
                    <div className="header-actions">
                        <button onClick={() => handleExport('pdf')} className="icon-btn" title="Exportar PDF">
                            📄
                        </button>
                        <button onClick={() => handleExport('excel')} className="icon-btn" title="Exportar Excel">
                            📊
                        </button>
                        <Link to="/busca" className="icon-btn" title="Buscar">
                            🔍
                        </Link>
                    </div>
                </div>

                <div className="period-filter">
                    <SegmentControl
                        options={periodOptions}
                        selected={period}
                        onChange={setPeriod}
                    />

                    {period === 'custom' && (
                        <div className="custom-date-range">
                            <Input
                                type="date"
                                label="Data Início"
                                value={customDates.dataInicio}
                                onChange={(e) => setCustomDates({ ...customDates, dataInicio: e.target.value })}
                            />
                            <Input
                                type="date"
                                label="Data Fim"
                                value={customDates.dataFim}
                                onChange={(e) => setCustomDates({ ...customDates, dataFim: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="dashboard-loading">
                    <div className="ios-spinner"></div>
                </div>
            ) : (
                <>
                    {alerts.length > 0 && (
                        <div className="alerts-container">
                            {alerts.map(alert => (
                                <div key={alert.id} className={`alert-banner ${alert.type}`}>
                                    {alert.message}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="dashboard-stats">
                        <Card glass padding="medium" className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-label">Receitas</div>
                            <div className="stat-value green">
                                R$ {stats.totalReceitas.toFixed(2)}
                            </div>
                        </Card>

                        <Card glass padding="medium" className="stat-card">
                            <div className="stat-icon">💸</div>
                            <div className="stat-label">Despesas</div>
                            <div className="stat-value red">
                                R$ {stats.totalDespesas.toFixed(2)}
                            </div>
                        </Card>

                        <Card glass padding="medium" className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-label">Saldo</div>
                            <div className={`stat-value ${stats.saldo >= 0 ? 'green' : 'red'}`}>
                                R$ {stats.saldo.toFixed(2)}
                            </div>
                        </Card>
                    </div>

                    {evolutionData.length > 0 && (
                        <Card className="chart-card" padding="large">
                            <h3 className="chart-title">📈 Evolução Financeira (6 meses)</h3>
                            <div className="chart-container">
                                <Line data={evolutionChartData} options={chartOptions} />
                            </div>
                        </Card>
                    )}

                    <div className="charts-grid">
                        {despesasPorCategoria.length > 0 && (
                            <Card className="chart-card" padding="large">
                                <h3 className="chart-title">💸 Despesas por Categoria</h3>
                                <div className="chart-container">
                                    <Pie data={despesasChartData} options={chartOptions} />
                                </div>
                            </Card>
                        )}

                        {receitasPorCategoria.length > 0 && (
                            <Card className="chart-card" padding="large">
                                <h3 className="chart-title">💰 Receitas por Categoria</h3>
                                <div className="chart-container">
                                    <Pie data={receitasChartData} options={chartOptions} />
                                </div>
                            </Card>
                        )}
                    </div>

                    {recentTransactions.length > 0 && (
                        <Card className="recent-transactions-card" padding="large">
                            <h3 className="chart-title">🕐 Últimas Movimentações</h3>
                            <div className="transactions-list">
                                {recentTransactions.map((transaction, index) => (
                                    <div key={`${transaction.tipo}-${transaction.id}`} className="transaction-item">
                                        <div className="transaction-icon" style={{ backgroundColor: `${transaction.cor}20`, color: transaction.cor }}>
                                            {transaction.categoria_icone || (transaction.tipo === 'despesa' ? '💸' : '💰')}
                                        </div>
                                        <div className="transaction-info">
                                            <div className="transaction-category">{transaction.categoria_nome || 'Outros'}</div>
                                            <div className="transaction-description">{transaction.descricao || transaction.tipoLabel}</div>
                                        </div>
                                        <div className="transaction-right">
                                            <div className={`transaction-value ${transaction.tipo === 'receita' ? 'green' : 'red'}`}>
                                                {transaction.tipo === 'receita' ? '+' : '-'} R$ {transaction.valor.toFixed(2)}
                                            </div>
                                            <div className="transaction-date">
                                                {new Date(transaction.data).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {despesasPorCategoria.length === 0 && receitasPorCategoria.length === 0 && (
                        <Card padding="large" className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>Nenhuma transação encontrada</h3>
                            <p className="text-secondary">
                                Comece adicionando suas primeiras transações
                            </p>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
