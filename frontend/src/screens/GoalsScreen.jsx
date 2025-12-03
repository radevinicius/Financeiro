import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import { metasAPI } from '../services/api';
import './GoalsScreen.css';

export default function GoalsScreen() {
    const [metas, setMetas] = useState([]);
    const [progresso, setProgresso] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newMeta, setNewMeta] = useState({
        tipo: 'economia',
        valor_meta: '',
        periodo: 'mensal'
    });
    const navigate = useNavigate();

    useEffect(() => {
        loadMetas();
        loadProgresso();
    }, []);

    const loadMetas = async () => {
        try {
            const response = await metasAPI.getAll();
            setMetas(response.data.metas || []);
        } catch (error) {
            console.error('Erro ao carregar metas:', error);
        }
    };

    const loadProgresso = async () => {
        try {
            setLoading(true);
            const response = await metasAPI.getProgresso();
            setProgresso(response.data.progresso || []);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
            setLoading(false);
        }
    };

    const handleCreateMeta = async () => {
        try {
            await metasAPI.create({
                ...newMeta,
                valor_meta: parseFloat(newMeta.valor_meta)
            });
            setShowModal(false);
            setNewMeta({ tipo: 'economia', valor_meta: '', periodo: 'mensal' });
            loadMetas();
            loadProgresso();
        } catch (error) {
            console.error('Erro ao criar meta:', error);
            alert('Erro ao criar meta');
        }
    };

    const handleDeleteMeta = async (id) => {
        if (window.confirm('Deseja realmente excluir esta meta?')) {
            try {
                await metasAPI.delete(id);
                loadMetas();
                loadProgresso();
            } catch (error) {
                console.error('Erro ao excluir meta:', error);
            }
        }
    };

    return (
        <div className="page fade-in">
            <div className="goals-header">
                <h1>Metas Financeiras</h1>
                <Button onClick={() => setShowModal(true)} icon="🎯">
                    Nova Meta
                </Button>
            </div>

            {loading ? (
                <div className="goals-loading">
                    <div className="ios-spinner"></div>
                </div>
            ) : (
                <>
                    {progresso.length > 0 ? (
                        <div className="goals-list">
                            {progresso.map((meta) => (
                                <Card key={meta.id} padding="large" className="goal-card">
                                    <div className="goal-header">
                                        <div>
                                            <h3 className="goal-title">
                                                {meta.tipo === 'economia' ? '💰 Meta de Economia' :
                                                    meta.tipo === 'limite_categoria' ? '📊 Limite por Categoria' :
                                                        '💸 Limite Total'}
                                            </h3>
                                            <p className="goal-period">
                                                {meta.periodo === 'mensal' ? '📅 Mensal' : '📆 Anual'}
                                            </p>
                                        </div>
                                        <button
                                            className="goal-delete"
                                            onClick={() => handleDeleteMeta(meta.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <div className="goal-values">
                                        <div className="goal-value-item">
                                            <span className="goal-value-label">Meta</span>
                                            <span className="goal-value-amount">
                                                R$ {meta.valor_meta.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="goal-value-item">
                                            <span className="goal-value-label">Atual</span>
                                            <span className="goal-value-amount">
                                                R$ {meta.valor_atual.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <ProgressBar
                                        progress={meta.percentual}
                                        label={`${meta.percentual.toFixed(0)}% alcançado`}
                                        showValue={false}
                                    />
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card padding="large" className="empty-state">
                            <div className="empty-icon">🎯</div>
                            <h3>Nenhuma meta definida</h3>
                            <p className="text-secondary">
                                Crie sua primeira meta financeira
                            </p>
                        </Card>
                    )}
                </>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nova Meta"
            >
                <div className="modal-form">
                    <div className="form-group">
                        <label>Tipo de Meta</label>
                        <select
                            value={newMeta.tipo}
                            onChange={(e) => setNewMeta({ ...newMeta, tipo: e.target.value })}
                            className="ios-select"
                        >
                            <option value="economia">Meta de Economia</option>
                            <option value="limite_total">Limite Total de Gastos</option>
                        </select>
                    </div>

                    <Input
                        label="Valor da Meta"
                        type="number"
                        value={newMeta.valor_meta}
                        onChange={(e) => setNewMeta({ ...newMeta, valor_meta: e.target.value })}
                        placeholder="0.00"
                    />

                    <div className="form-group">
                        <label>Período</label>
                        <select
                            value={newMeta.periodo}
                            onChange={(e) => setNewMeta({ ...newMeta, periodo: e.target.value })}
                            className="ios-select"
                        >
                            <option value="mensal">Mensal</option>
                            <option value="anual">Anual</option>
                        </select>
                    </div>

                    <Button
                        onClick={handleCreateMeta}
                        variant="primary"
                        fullWidth
                        disabled={!newMeta.valor_meta}
                    >
                        Criar Meta
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
