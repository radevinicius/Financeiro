import { useState, useEffect } from 'react';
import { despesasAPI, categoriasAPI, anexosAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import SegmentControl from '../components/SegmentControl';
import FileUpload from '../components/FileUpload';
import './ExpenseScreen.css';

export default function ExpenseScreen() {
    const [period, setPeriod] = useState('month');
    const [customDates, setCustomDates] = useState({
        dataInicio: '',
        dataFim: ''
    });
    const [despesas, setDespesas] = useState([]);
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
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
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
    }, [period, customDates]);

    const loadData = async () => {
        try {
            setLoading(true);
            const { dataInicio, dataFim } = getDateRange();

            if (!dataInicio || !dataFim) {
                setLoading(false);
                return;
            }

            const [despesasRes, categoriasRes] = await Promise.all([
                despesasAPI.getAll({ dataInicio, dataFim }),
                categoriasAPI.getAll('despesa')
            ]);

            setDespesas(despesasRes.data.despesas || []);
            setCategorias(categoriasRes.data.categorias || []);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar despesas:', error);
            setLoading(false);
        }
    };

    const [selectedFile, setSelectedFile] = useState(null);

    const handleEdit = (despesa) => {
        setEditingId(despesa.id);
        setFormData({
            categoria_id: despesa.categoria_id,
            valor: despesa.valor.toString(),
            data: new Date(despesa.data).toISOString().split('T')[0],
            descricao: despesa.descricao || ''
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
                await despesasAPI.update(editingId, data);
            } else {
                // Modo criação
                const response = await despesasAPI.create(data);

                if (selectedFile) {
                    const formDataFile = new FormData();
                    formDataFile.append('arquivo', selectedFile);
                    formDataFile.append('transacao_tipo', 'despesa');
                    formDataFile.append('transacao_id', response.data.despesaId);

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
            console.error('Erro ao salvar despesa:', error);
            alert('Erro ao salvar despesa: ' + (error.response?.data?.error || 'Erro desconhecido'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;

        try {
            await despesasAPI.delete(id);
            loadData();
        } catch (error) {
            console.error('Erro ao deletar despesa:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Data inválida';
        // PostgreSQL retorna TIMESTAMP, então precisamos parsear corretamente
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="page fade-in">
            <div className="screen-header">
                <div className="screen-header-top">
                    <h1>💸 Despesas</h1>
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
                <div className="loading-container">
                    <div className="ios-spinner"></div>
                </div>
            ) : despesas.length === 0 ? (
                <Card padding="large" className="empty-state">
                    <div className="empty-icon">💸</div>
                    <h3>Nenhuma despesa registrada</h3>
                    <p className="text-secondary">
                        Adicione sua primeira despesa clicando no botão acima
                    </p>
                </Card>
            ) : (
                <div className="expense-list">
                    {despesas.map((despesa) => (
                        <Card key={despesa.id} padding="medium" className="expense-item">
                            <div className="expense-item-header">
                                <div className="expense-category">
                                    <span className="expense-icon">{despesa.categoria_icone}</span>
                                    <div>
                                        <div className="expense-category-name">{despesa.categoria_nome}</div>
                                        <div className="expense-date">{formatDate(despesa.data)}</div>
                                    </div>
                                </div>
                                <div className="expense-actions">
                                    <span className="expense-value">-R$ {Number(despesa.valor || 0).toFixed(2)}</span>
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleEdit(despesa)}
                                        title="Editar despesa"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(despesa.id)}
                                        title="Excluir despesa"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            {despesa.descricao && (
                                <div className="expense-description">{despesa.descricao}</div>
                            )}
                            {despesa.origem === 'whatsapp' && (
                                <span className="expense-badge">📱 WhatsApp</span>
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
                title={editingId ? "Editar Despesa" : "Nova Despesa"}
            >
                <form onSubmit={handleSubmit} className="expense-form">
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
                        placeholder="Onde gastou?"
                    />

                    <div className="form-group">
                        <FileUpload onFileSelect={setSelectedFile} />
                    </div>

                    <Button type="submit" variant="primary" size="large" fullWidth>
                        {editingId ? "Atualizar Despesa" : "Adicionar Despesa"}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
