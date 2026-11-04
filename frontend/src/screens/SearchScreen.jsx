import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import { despesasAPI, receitasAPI } from '../services/api';
import './SearchScreen.css';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('all'); // all, despesa, receita

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length > 2) {
                handleSearch();
            } else if (query.length === 0) {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, type]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const [despesasRes, receitasRes] = await Promise.all([
                despesasAPI.getAll(),
                receitasAPI.getAll()
            ]);

            const despesas = (despesasRes.data.despesas || []).map(d => ({ ...d, type: 'despesa' }));
            const receitas = (receitasRes.data.receitas || []).map(r => ({ ...r, type: 'receita' }));

            let all = [...despesas, ...receitas];

            // Filter by query
            const lowerQuery = query.toLowerCase();
            all = all.filter(item =>
                (item.descricao && String(item.descricao).toLowerCase().includes(lowerQuery)) ||
                (item.categoria_nome && String(item.categoria_nome).toLowerCase().includes(lowerQuery)) ||
                String(item.valor).includes(lowerQuery)
            );

            // Filter by type
            if (type !== 'all') {
                all = all.filter(item => item.type === type);
            }

            // Sort by date desc
            all.sort((a, b) => new Date(b.data) - new Date(a.data));

            setResults(all);
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page fade-in">
            <div className="search-header">
                <h1>Buscar</h1>
                <div className="search-filters">
                    <button
                        className={`filter-chip ${type === 'all' ? 'active' : ''}`}
                        onClick={() => setType('all')}
                    >
                        Todos
                    </button>
                    <button
                        className={`filter-chip ${type === 'receita' ? 'active' : ''}`}
                        onClick={() => setType('receita')}
                    >
                        Receitas
                    </button>
                    <button
                        className={`filter-chip ${type === 'despesa' ? 'active' : ''}`}
                        onClick={() => setType('despesa')}
                    >
                        Despesas
                    </button>
                </div>
            </div>

            <div className="search-input-container">
                <Input
                    placeholder="Buscar por descrição, categoria ou valor..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    icon="🔍"
                />
            </div>

            <div className="search-results">
                {loading ? (
                    <div className="search-loading">
                        <div className="ios-spinner"></div>
                    </div>
                ) : results.length > 0 ? (
                    results.map((item) => (
                        <Card key={`${item.type}-${item.id}`} padding="medium" className="search-item-card">
                            <div className="search-item">
                                <div className="search-item-icon">
                                    {item.categoria_icone || (item.type === 'receita' ? '💰' : '💸')}
                                </div>
                                <div className="search-item-info">
                                    <div className="search-item-header">
                                        <span className="search-item-category">{item.categoria_nome || 'Sem categoria'}</span>
                                        <span className={`search-item-amount ${item.type === 'receita' ? 'green' : 'red'}`}>
                                            {item.type === 'receita' ? '+' : '-'} R$ {Number(item.valor || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="search-item-desc">{item.descricao || 'Sem descrição'}</div>
                                    <div className="search-item-date">
                                        {new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : query.length > 2 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>Nenhum resultado</h3>
                        <p className="text-secondary">Tente outros termos</p>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">⌨️</div>
                        <h3>Digite para buscar</h3>
                        <p className="text-secondary">Busque suas transações</p>
                    </div>
                )}
            </div>
        </div>
    );
}
