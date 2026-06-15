import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const http = axios.create({
  baseURL: BASE,
})

// Injeta o Bearer token em todas as requisições
http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('hapvida_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Se o servidor retornar 401, limpa o token (sessão expirada)
http.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hapvida_token')
      localStorage.removeItem('hapvida_user')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

const api = {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  async register(name, email, password) {
    const { data } = await http.post('/auth/register', { name, email, password })
    return data
  },
  async login(email, password) {
    const { data } = await http.post('/auth/login', { email, password })
    return data
  },
  async changePassword(currentPassword, newPassword) {
    const { data } = await http.post('/auth/change-password', { currentPassword, newPassword })
    return data
  },
  async updateProfile(name) {
    const { data } = await http.put('/auth/profile', { name })
    return data
  },

  // ─── Portfolio ──────────────────────────────────────────────────────────────
  async uploadPortfolio(formData) {
    const { data } = await http.post('/portfolio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.rows // array de rows brutas
  },
  async getPortfolio() {
    const { data } = await http.get('/portfolio')
    return data // { rows, importedAt }
  },
  async savePortfolio(rows, importedAt) {
    const { data } = await http.put('/portfolio', { rows, importedAt })
    return data
  },
  async deletePortfolio() {
    const { data } = await http.delete('/portfolio')
    return data
  },

  // ─── Projects ───────────────────────────────────────────────────────────────
  async getProjects() {
    const { data } = await http.get('/projects')
    return data // array de projetos
  },
  async saveProjects(projects) {
    const { data } = await http.post('/projects', { projects })
    return data
  },
  async deleteProject(id) {
    const { data } = await http.delete(`/projects/${encodeURIComponent(id)}`)
    return data
  },

  // ─── Users (admin only) ──────────────────────────────────────────────────────
  async getUsers() {
    const { data } = await http.get('/users')
    return data // array de usuários
  },
  async createUser(name, email, isAdmin) {
    const { data } = await http.post('/users', { name, email, isAdmin })
    return data // { id, name, email, isAdmin, isActive, mustChangePassword, generatedPassword }
  },
  async updateUser(id, updates) {
    const { data } = await http.put(`/users/${encodeURIComponent(id)}`, updates)
    return data
  },
  async deleteUser(id) {
    const { data } = await http.delete(`/users/${encodeURIComponent(id)}`)
    return data
  },
  async resetUserPassword(id) {
    const { data } = await http.post(`/users/${encodeURIComponent(id)}/reset-password`)
    return data // { ok, newPassword }
  },
}

export default api
