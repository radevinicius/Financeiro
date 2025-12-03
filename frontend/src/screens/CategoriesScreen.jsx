import { useState, useEffect } from 'react';
import { categoriasAPI } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Card from '../components/Card';
import SegmentControl from '../components/SegmentControl';
import './CategoriesScreen.css';

export default function CategoriesScreen() {
    const [categorias, setCategorias] = useState([]);
    const [tipoFiltro, setTipoFiltro] = useState('despesa');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'despesa',
        icone: '📊',
        cor: '#007AFF'
    });

    const tipoOptions = [
        { value: 'despesa', label: 'Despesas' },
        { value: 'receita', label: 'Receitas' }
    ];

    const iconesSugeridos = {
        despesa: ['🍔', '🚗', '🏠', '🏥', '🎮', '📚', '👕', '✈️', '💡', '📱'],
        receita: ['💼', '💻', '📈', '🏆', '💰', '🎁', '💵', '📊']
    };

    const coresSugeridas = [
        '#007AFF', '#34C759', '#FF9500', '#FF2D55',
        '#5856D6', '#AF52DE', '#FF3B30', '#5AC8FA'
    ];

    useEffect(() => {
        loadCategorias();
    }, [tipoFiltro]);

    const loadCategorias = async () => {
        try {
            setLoading(true);
            const response = await categoriasAPI.getAll(tipoFiltro);
            setCategorias(response.data.categorias || []);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await categoriasAPI.create(formData);

            setFormData({
                nome: '',
                tipo: tipoFiltro,
                icone: '📊',
                cor: '#007AFF'
            });

            setIsModalOpen(false);
            loadCategorias();
        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            alert('Erro ao criar categoria: ' + (error.response?.data?.error || 'Erro desconhecido'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza? Isso não excluirá as transações desta categoria.')) return;

        try {
            await categoriasAPI.delete(id);
            loadCategorias();
        } catch (error) {
            console.error('Erro ao deletar categoria:', error);
            alert('Não foi possível excluir. Esta categoria pode estar em uso.');
        }
    };

    const openModal = () => {
        setFormData({ ...formData, tipo: tipoFiltro });
        setIsModalOpen(true);
    };

    return (
        <div className="page fade-in">
            <div className="screen-header">
                <h1>📑 Categorias</h1>
            </div>

            <div className="categories-controls">
                <SegmentControl
                    options={tipoOptions}
                    selected={tipoFiltro}
                    onChange={setTipoFiltro}
                />
                <Button
                    variant="primary"
                    size="medium"
                    onClick={openModal}
                    icon="+"
                >
                    Nova
                </Button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="ios-spinner"></div>
                </div>
            ) : categorias.length === 0 ? (
                <Card padding="large" className="empty-state">
                    <div className="empty-icon">📑</div>
                    <h3>Nenhuma categoria encontrada</h3>
                    <p className="text-secondary">
                        Crie sua primeira categoria de {tipoFiltro}
                    </p>
                </Card>
            ) : (
                <div className="categories-list">
                    {categorias.map((categoria) => (
                        <div key={categoria.id} className="ios-list-item category-item">
                            <div className="category-info">
                                <div
                                    className="category-color-badge"
                                    style={{ backgroundColor: categoria.cor }}
                                >
                                    {categoria.icone}
                                </div>
                                <span className="category-name">{categoria.nome}</span>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(categoria.id)}
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Categoria"
            >
                <form onSubmit={handleSubmit} className="category-form">
                    <Input
                        label="Nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Alimentação"
                        required
                    />

                    <div className="form-group">
                        <label className="ios-input-label">Ícone</label>
                        <div className="icon-picker">
                            {iconesSugeridos[formData.tipo].map((icone) => (
                                <button
                                    key={icone}
                                    type="button"
                                    className={`icon-option ${formData.icone === icone ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, icone })}
                                >
                                    {icone}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="ios-input-label">Cor</label>
                        <div className="color-picker">
                            {coresSugeridas.map((cor) => (
                                <button
                                    key={cor}
                                    type="button"
                                    className={`color-option ${formData.cor === cor ? 'selected' : ''}`}
                                    style={{ backgroundColor: cor }}
                                    onClick={() => setFormData({ ...formData, cor })}
                                />
                            ))}
                        </div>
                    </div>

                    <Button type="submit" variant="primary" size="large" fullWidth>
                        Criar Categoria
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
