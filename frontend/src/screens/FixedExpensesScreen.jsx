import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { despesasFixasAPI, categoriasAPI } from '../services/api';
import './FixedExpensesScreen.css';

export default function FixedExpensesScreen() {
    const [despesasFixas, setDespesasFixas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        valor: '',
        dia_vencimento: '',
        categoria_id: '',
        descricao: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [despesasRes, categoriasRes, totalRes] = await Promise.all([
                despesasFixasAPI.getAll(),
                categoriasAPI.getAll('despesa'),
                despesasFixasAPI.getTotal()
            ]);

            setDespesasFixas(despesasRes.data.despesasFixas || []);
            setCategorias(categoriasRes.data.categorias || []);
            setTotal(totalRes.data.total || 0);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                valor: parseFloat(formData.valor),
                dia_vencimento: formData.dia_vencimento ? parseInt(formData.dia_vencimento) : null,
                categoria_id: formData.categoria_id || null
            };

            if (editingId) {
                await despesasFixasAPI.update(editingId, data);
            } else {
                await despesasFixasAPI.create(data);
            }

            resetForm();
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Erro ao salvar despesa fixa:', error);
            alert('Erro ao salvar despesa fixa');
        }
    };

    const handleEdit = (despesa) => {
        setEditingId(despesa.id);
        setFormData({
            nome: despesa.nome,
            valor: despesa.valor.toString(),
            dia_vencimento: despesa.dia_vencimento?.toString() || '',
            categoria_id: despesa.categoria_id || '',
            descricao: despesa.descricao || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja realmente excluir esta despesa fixa?')) {
            try {
                await despesasFixasAPI.delete(id);
                loadData();
            } catch (error) {
                console.error('Erro ao excluir despesa fixa:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            nome: '',
            valor: '',
            dia_vencimento: '',
            categoria_id: '',
            descricao: ''
        });
    };

    const handleCloseModal = () => {
        resetForm();
        setShowModal(false);
    };

    return (
        <div className="page fade-in">
            <div className="fixed-expenses-header">
                <h1>💳 Despesas Fixas</h1>
                <Button onClick={() => setShowModal(true)} icon="➕">
                    Adicionar
                </Button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="ios-spinner"></div>
                </div>
            ) : (
                <>
                    <Card glass padding="large" className="total-card">
                        <div className="total-label">Total Mensal</div>
                        <div className="total-value">R$ {total.toFixed(2)}</div>
                    </Card>

                    {despesasFixas.length === 0 ? (
                        <Card padding="large" className="empty-state">
                            <div className="empty-icon">💳</div>
                            <h3>Nenhuma despesa fixa cadastrada</h3>
                            <p className="text-secondary">
                                Adicione suas despesas mensais recorrentes
                            </p>
                        </Card>
                    ) : (
                        <div className="fixed-expenses-list">
                            {despesasFixas.map((despesa) => (
                                <Card key={despesa.id} padding="medium" className="fixed-expense-item">
                                    <div className="expense-main">
                                        <div className="expense-icon-wrapper">
                                            <div
                                                className="expense-icon"
                                                style={{
                                                    backgroundColor: despesa.categoria_cor
                                                        ? `${despesa.categoria_cor}20`
                                                        : 'var(--ios-gray5)',
                                                    color: despesa.categoria_cor || 'var(--ios-text-secondary)'
                                                }}
                                            >
                                                {despesa.categoria_icone || '💸'}
                                            </div>
                                        </div>
                                        <div className="expense-info">
                                            <div className="expense-name">{despesa.nome}</div>
                                            {despesa.descricao && (
                                                <div className="expense-description">{despesa.descricao}</div>
                                            )}
                                            {despesa.dia_vencimento && (
                                                <div className="expense-due">
                                                    📅 Vence dia {despesa.dia_vencimento}
                                                </div>
                                            )}
                                        </div>
                                        <div className="expense-actions">
                                            <div className="expense-value">
                                                R$ {despesa.valor.toFixed(2)}
                                            </div>
                                            <div className="action-buttons">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => handleEdit(despesa)}
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(despesa.id)}
                                                    title="Excluir"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingId ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
            >
                <form onSubmit={handleSubmit} className="fixed-expense-form">
                    <Input
                        label="Nome *"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Aluguel, Internet, Luz..."
                        required
                    />

                    <Input
                        label="Valor *"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        placeholder="0.00"
                        icon="💵"
                        required
                    />

                    <Input
                        label="Dia de Vencimento"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dia_vencimento}
                        onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })}
                        placeholder="1-31"
                    />

                    <div className="form-group">
                        <label className="ios-input-label">Categoria</label>
                        <select
                            className="ios-select"
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                        >
                            <option value="">Sem categoria</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icone} {cat.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Descrição"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Detalhes adicionais..."
                    />

                    <Button type="submit" variant="primary" size="large" fullWidth>
                        {editingId ? 'Salvar Alterações' : 'Adicionar Despesa'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
