import { useState, useEffect } from 'react';
import { receitasAPI, categoriasAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import FileUpload from '../components/FileUpload';
import axios from 'axios';
import './IncomeScreen.css';

export default function IncomeScreen() {
    const [receitas, setReceitas] = useState([]);
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
            const [receitasRes, categoriasRes] = await Promise.all([
                receitasAPI.getAll(),
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await receitasAPI.create({
                ...formData,
                valor: parseFloat(formData.valor)
            });

            if (selectedFile) {
                const formData = new FormData();
                formData.append('arquivo', selectedFile);
                formData.append('transacao_tipo', 'receita');
                formData.append('transacao_id', response.data.receitaId);

                await axios.post('/api/anexos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
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
            console.error('Erro ao criar receita:', error);
            alert('Erro ao criar receita: ' + (error.response?.data?.error || 'Erro desconhecido'));
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
        // PostgreSQL retorna TIMESTAMP, então precisamos parsear corretamente
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="page fade-in">
            <div className="screen-header">
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

            {loading ? (
                <div className="loading-container">
                    <div className="ios-spinner"></div>
                </div>
            ) : receitas.length === 0 ? (
                <Card padding="large" className="empty-state">
                    <div className="empty-icon">💰</div>
                    <h3>Nenhuma receita registrada</h3>
                    <p className="text-secondary">
                        Adicione sua primeira receita clicando no botão acima
                    </p>
                </Card>
            ) : (
                <div className="income-list">
                    {receitas.map((receita) => (
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
                                    <span className="income-value">+R$ {receita.valor.toFixed(2)}</span>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(receita.id)}
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
                onClose={() => setIsModalOpen(false)}
                title="Nova Receita"
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
                        Adicionar Receita
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
