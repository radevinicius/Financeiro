import axios from 'axios';

// Criar instância do axios
const api = axios.create({
    baseURL: 'https://financeiro-k3z7.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    }
});


// Interceptor para adicionar token JWT
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratar erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado ou inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ========== AUTH ==========
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data)
};

// ========== USUARIOS ==========
export const usuariosAPI = {
    getAll: () => api.get('/usuarios'),
    getById: (id) => api.get(`/usuarios/${id}`),
    update: (id, data) => api.put(`/usuarios/${id}`, data),
    delete: (id) => api.delete(`/usuarios/${id}`)
};

// ========== CATEGORIAS ==========
export const categoriasAPI = {
    getAll: (tipo) => api.get('/categorias', { params: { tipo } }),
    create: (data) => api.post('/categorias', data),
    update: (id, data) => api.put(`/categorias/${id}`, data),
    delete: (id) => api.delete(`/categorias/${id}`)
};

// ========== DESPESAS ==========
export const despesasAPI = {
    getAll: (params) => api.get('/despesas', { params }),
    getById: (id) => api.get(`/despesas/${id}`),
    create: (data) => api.post('/despesas', data),
    update: (id, data) => api.put(`/despesas/${id}`, data),
    delete: (id) => api.delete(`/despesas/${id}`)
};

// ========== RECEITAS ==========
export const receitasAPI = {
    getAll: (params) => api.get('/receitas', { params }),
    getById: (id) => api.get(`/receitas/${id}`),
    create: (data) => api.post('/receitas', data),
    update: (id, data) => api.put(`/receitas/${id}`, data),
    delete: (id) => api.delete(`/receitas/${id}`)
};

// ========== PREFERENCIAS ==========
export const preferenciasAPI = {
    get: () => api.get('/preferencias'),
    update: (data) => api.put('/preferencias', data)
};

// ========== METAS ==========
export const metasAPI = {
    getAll: () => api.get('/metas'),
    create: (data) => api.post('/metas', data),
    getProgresso: () => api.get('/metas/progresso'),
    delete: (id) => api.delete(`/metas/${id}`)
};

// ========== RELATORIOS ==========
export const relatoriosAPI = {
    getEvolucao: (meses) => api.get(`/relatorios/evolucao?meses=${meses}`),
    downloadPDF: (dataInicio, dataFim) => api.get(`/relatorios/pdf?dataInicio=${dataInicio}&dataFim=${dataFim}`, { responseType: 'blob' }),
    downloadExcel: (dataInicio, dataFim) => api.get(`/relatorios/excel?dataInicio=${dataInicio}&dataFim=${dataFim}`, { responseType: 'blob' })
};

// ========== ADMIN ==========
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsuarios: () => api.get('/admin/usuarios')
};

// ========== BACKUP ==========
export const backupAPI = {
    exportar: () => api.get('/backup/exportar', { responseType: 'blob' }),
    importar: (data) => api.post('/backup/importar', data)
};

// ========== ANEXOS ==========
export const anexosAPI = {
    upload: (formData) => api.post('/anexos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getByTransacao: (tipo, id) => api.get(`/anexos/${tipo}/${id}`),
    delete: (id) => api.delete(`/anexos/${id}`)
};

// ========== DESPESAS FIXAS ==========
export const despesasFixasAPI = {
    getAll: () => api.get('/despesas-fixas'),
    getTotal: () => api.get('/despesas-fixas/total'),
    create: (data) => api.post('/despesas-fixas', data),
    update: (id, data) => api.put(`/despesas-fixas/${id}`, data),
    delete: (id) => api.delete(`/despesas-fixas/${id}`)
};

export default api;
