import { useState, useEffect } from 'react';
import { receitasAPI, categoriasAPI, anexosAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import SegmentControl from '../components/SegmentControl';
import FileUpload from '../components/FileUpload';
import './IncomeScreen.css';

export default function IncomeScreen() {
    const [period, setPeriod] = useState('month');
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [customDates, setCustomDates] = useState({
        dataInicio: '',
        dataFim: ''
    });
    const [receitas, setReceitas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const periodOptions = [
        { value: 'today', label: 'Hoje' },
        { value: 'week', label: 'Semana' },
        { value: 'month', label: 'Mês' },
        { value: 'year', label: 'Ano' },
        { value: 'custom', label: 'Personalizado' }
    ];

    const [formData, setFormData] = useState({
        categoria_id: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        descricao: ''
    });

    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getSelectedMonthLabel = () => {
        const today = new Date();
        const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const label = target.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return label.charAt(0).toUpperCase() + label.slice(1);
    };

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
                dataInicio = dataFim = formatLocalDate(today);
                break;
            case 'week': {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                dataInicio = formatLocalDate(weekAgo);
                dataFim = formatLocalDate(today);
                break;
            }
            case 'month': {
                const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
                dataInicio = formatLocalDate(monthStart);
                dataFim = formatLocalDate(monthEnd);
                break;
            }
            case 'year': {
                const yearStart = new Date(today.getFullYear(), 0, 1);
                const yearEnd = new Date(today.getFullYear(), 11, 31);
                dataInicio = formatLocalDate(yearStart);
                dataFim = formatLocalDate(yearEnd);
                break;
            }
            default:
                dataInicio = dataFim = formatLocalDate(today);
        }

        return { dataInicio, dataFim };
    };

    useEffect(() => {
        if (period !== 'custom' || (customDates.dataInicio && customDates.dataFim)) {
            loadData();
        }
    }, [period, monthOffset, customDates]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { dataInicio, dataFim } = getDateRange();

            if (!dataInicio || !dataFim) {
                setLoading(false);
                return;
            }

            const [receitasRes, categoriasRes] = await Promise.all([
                receitasAPI.getAll({ dataInicio, dataFim }),
                categoriasAPI.getAll('receita')
            ]);

            setReceitas(receitasRes.data.receitas || []);
            setCategorias(categoriasRes.data.categorias || []);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar receitas:', error);
            setLoading(false);
        }
    };

    const [selectedFile, setSelectedFile] = useState(null);

    const handleEdit = (receita) => {
        setEditingId(receita.id);
        setFormData({
            categoria_id: receita.categoria_id,
            valor: receita.valor.toString(),
            data: String(receita.data).split('T')[0],
            descricao: receita.descricao || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                valor: parseFloat(formData.valor)
            };

            if (editingId) {
                // Modo edição
                await receitasAPI.update(editingId, data);
            } else {
                // Modo criação
                const response = await receitasAPI.create(data);

                if (selectedFile) {
                    const formDataFile = new FormData();
                    formDataFile.append('arquivo', selectedFile);
                    formDataFile.append('transacao_tipo', 'receita');
                    formDataFile.append('transacao_id', response.data.receitaId);

                    await anexosAPI.upload(formDataFile);
                }
            }

            setFormData({
                categoria_id: '',
                valor: '',
                data: new Date().toISOString().split('T')[0],
                descricao: ''
            });
            setSelectedFile(null);
            setEditingId(null);

            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Erro ao salvar receita:', error);
            alert('Erro ao salvar receita: ' + (error.response?.data?.error || 'Erro desconhecido'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta receita?')) return;

        try {
            await receitasAPI.delete(id);
            loadData();
        } catch (error) {
            console.error('Erro ao deletar receita:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Data inválida';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const filteredReceitas = selectedCategory === 'all'
        ? receitas
        : receitas.filter(r => String(r.categoria_id) === String(selectedCategory));

    const totalPeriodo = filteredReceitas.reduce((sum, r) => sum + Number(r.valor || 0), 0);

    return (
        <div className="page fade-in">
            <div className="screen-header">
                <div className="screen-header-top">
                    <h1>💰 Receitas</h1>
                    <Button
                        variant="primary"
                        size="medium"
                        onClick={() => setIsModalOpen(true)}
                        icon="+"
                    >
                        Adicionar
                    </Button>
                </div>

                <div className="period-filter">
                    <SegmentControl
                        options={periodOptions}
                        selected={period}
                        onChange={setPeriod}
                    />

                    {period === 'month' && (
                        <div className="month-navigator">
                            <button
                                type="button"
                                className="month-nav-btn"
                                onClick={() => setMonthOffset(prev => prev - 1)}
                                title="Mês anterior"
                            >
                                ◀
                            </button>
                            <div className="month-nav-center">
                                <span className="month-nav-label">{getSelectedMonthLabel()}</span>
                                {monthOffset !== 0 && (
                                    <button
                                        type="button"
                                        className="month-reset-btn"
                                        onClick={() => setMonthOffset(0)}
                                    >
                                        Mês atual
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                className="month-nav-btn"
                                onClick={() => setMonthOffset(prev => prev + 1)}
                                title="Próximo mês"
                            >
                                ▶
                            </button>
                        </div>
                    )}

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

                {categorias.length > 0 && (
                    <div className="category-chips">
                        <button
                            type="button"
                            className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            Todas
                        </button>
                        {categorias.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`category-chip ${String(selectedCategory) === String(cat.id) ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <span>{cat.icone}</span> {cat.nome}
                            </button>
                        ))}
                    </div>
                )}

                <Card glass padding="medium" className="period-summary-card">
                    <div>
                        <div className="period-summary-label">Total no período</div>
                        <div className="period-summary-count">
                            {filteredReceitas.length} {filteredReceitas.length === 1 ? 'lançamento' : 'lançamentos'}
                        </div>
                    </div>
                    <div className="period-summary-value income">
                        +R$ {totalPeriodo.toFixed(2)}
                    </div>
                </Card>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="ios-spinner"></div>
                </div>
            ) : filteredReceitas.length === 0 ? (
                <Card padding="large" className="empty-state">
                    <div className="empty-icon">💰</div>
                    <h3>Nenhuma receita encontrada</h3>
                    <p className="text-secondary">
                        Não há receitas registradas para os filtros selecionados
                    </p>
                </Card>
            ) : (
                <div className="income-list">
                    {filteredReceitas.map((receita) => (
                        <Card key={receita.id} padding="medium" className="income-item">
                            <div className="income-item-header">
                                <div className="income-category">
                                    <span className="income-icon">{receita.categoria_icone}</span>
                                    <div>
                                        <div className="income-category-name">{receita.categoria_nome}</div>
                                        <div className="income-date">{formatDate(receita.data)}</div>
                                    </div>
                                </div>
                                <div className="income-actions">
                                    <span className="income-value">+R$ {Number(receita.valor || 0).toFixed(2)}</span>
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleEdit(receita)}
                                        title="Editar receita"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(receita.id)}
                                        title="Excluir receita"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            {receita.descricao && (
                                <div className="income-description">{receita.descricao}</div>
                            )}
                            {receita.origem === 'whatsapp' && (
                                <span className="income-badge">📱 WhatsApp</span>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                        categoria_id: '',
                        valor: '',
                        data: new Date().toISOString().split('T')[0],
                        descricao: ''
                    });
                    setSelectedFile(null);
                }}
                title={editingId ? "Editar Receita" : "Nova Receita"}
            >
                <form onSubmit={handleSubmit} className="income-form">
                    <div className="form-group">
                        <label className="ios-input-label">Categoria *</label>
                        <select
                            className="ios-select"
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                            required
                        >
                            <option value="">Selecione uma categoria</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icone} {cat.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Valor"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        placeholder="0.00"
                        icon="💵"
                        required
                    />

                    <Input
                        label="Data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        required
                    />

                    <Input
                        label="Descrição"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="De onde veio este valor?"
                    />

                    <div className="form-group">
                        <FileUpload onFileSelect={setSelectedFile} />
                    </div>

                    <Button type="submit" variant="primary" size="large" fullWidth>
                        {editingId ? "Atualizar Receita" : "Adicionar Receita"}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
