import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        if (!form.name.trim()) throw new Error('Nome é obrigatório.')
        await register(form.name, form.email, form.password)
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F1F5F9',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Archivo', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700&display=swap');
        .l-inp { width:100%; padding:10px 12px; border:1px solid #CBD5E1; border-radius:9px; font-size:14px; font-family:'Archivo',sans-serif; outline:none; background:#fff; }
        .l-inp:focus { border-color:#2F5597; box-shadow:0 0 0 3px rgba(47,85,151,.12); }
        .l-btn { width:100%; padding:11px; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Archivo',sans-serif; transition:opacity .15s; }
        .l-btn:disabled { opacity:.6; cursor:not-allowed; }
      `}</style>

      {/* Logotipo / título */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: '#003B82',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" fill="#F47B20"/>
            <rect x="7" y="7" width="10" height="2" rx="1" fill="#fff"/>
            <rect x="7" y="11" width="7" height="2" rx="1" fill="#fff"/>
            <rect x="7" y="15" width="5" height="2" rx="1" fill="#fff"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: '#003B82' }}>
          Status Semanal
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Marcos e Cronogramas</div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '32px 36px',
        boxShadow: '0 4px 24px rgba(0,0,0,.10)', width: '100%', maxWidth: 400,
      }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 24 }}>
          {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 5 }}>
                Nome completo
              </label>
              <input className="l-inp" placeholder="Seu nome" value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 5 }}>
              E-mail
            </label>
            <input className="l-inp" type="email" placeholder="voce@empresa.com" value={form.email} onChange={set('email')} autoComplete="email" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 5 }}>
              Senha
            </label>
            <input className="l-inp" type="password" placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'} value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button className="l-btn" type="submit" disabled={loading}
            style={{ background: '#003B82', color: '#fff', marginTop: 4 }}>
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>       
      </div>
    </div>
  )
}
