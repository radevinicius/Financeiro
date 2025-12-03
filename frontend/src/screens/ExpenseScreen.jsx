import { useState, useEffect } from 'react';
import { despesasAPI, categoriasAPI, anexosAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import FileUpload from '../components/FileUpload';
import axios from 'axios';
import './ExpenseScreen.css';

export default function ExpenseScreen() {
    const [despesas, setDespesas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        categoria_id: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        descricao: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [despesasRes, categoriasRes] = await Promise.all([
                despesasAPI.getAll(),
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await despesasAPI.create({
                ...formData,
                valor: parseFloat(formData.valor)
            });

            if (selectedFile) {
                const formData = new FormData();
                formData.append('arquivo', selectedFile);
                formData.append('transacao_tipo', 'despesa');
                formData.append('transacao_id', response.data.despesaId);

                await anexosAPI.upload(formData);
            }

            setFormData({
                categoria_id: '',
                valor: '',
                data: new Date().toISOString().split('T')[0],
                descricao: ''
            });
            setSelectedFile(null);

            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Erro ao criar despesa:', error);
            alert('Erro ao criar despesa: ' + (error.response?.data?.error || 'Erro desconhecido'));
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
                                    <span className="expense-value">-R$ {despesa.valor.toFixed(2)}</span>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(despesa.id)}
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
                onClose={() => setIsModalOpen(false)}
                title="Nova Despesa"
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
                        Adicionar Despesa
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
