import React, { useState, useEffect } from 'react'
import { UserPlus, Edit2, Trash2, RotateCcw, Check, X } from 'lucide-react'
import api from '../services/api'
import './UsersScreen.css'

export default function UsersScreen({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [generatedPassword, setGeneratedPassword] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      alert('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const form = e.target
    const name = form.name.value.trim()
    const email = form.email.value.trim()
    const isAdmin = form.isAdmin.checked

    if (!name || !email) {
      alert('Nome e e-mail são obrigatórios.')
      return
    }

    try {
      const newUser = await api.createUser(name, email, isAdmin)
      setUsers([newUser, ...users])
      setGeneratedPassword(newUser.generatedPassword)
      form.reset()
    } catch (err) {
      console.error('Erro ao criar usuário:', err)
      alert(err.response?.data?.error || 'Erro ao criar usuário.')
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await api.updateUser(user.id, { isActive: !user.isActive })
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      alert('Erro ao atualizar status do usuário.')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    const form = e.target
    const name = form.name.value.trim()
    const isAdmin = form.isAdmin.checked

    if (!name) {
      alert('Nome é obrigatório.')
      return
    }

    try {
      await api.updateUser(editingUser.id, { name, isAdmin })
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, isAdmin } : u))
      setEditingUser(null)
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      alert('Erro ao atualizar usuário.')
    }
  }

  const handleDeleteUser = async (user) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${user.name}?`)) return

    try {
      await api.deleteUser(user.id)
      setUsers(users.filter(u => u.id !== user.id))
    } catch (err) {
      console.error('Erro ao deletar usuário:', err)
      alert(err.response?.data?.error || 'Erro ao deletar usuário.')
    }
  }

  const handleResetPassword = async (user) => {
    if (!confirm(`Resetar senha do usuário ${user.name}?`)) return

    try {
      const result = await api.resetUserPassword(user.id)
      setGeneratedPassword(result.newPassword)
      alert(`Nova senha gerada: ${result.newPassword}`)
    } catch (err) {
      console.error('Erro ao resetar senha:', err)
      alert('Erro ao resetar senha.')
    }
  }

  return (
    <div className="users-screen-shell" style={{ fontFamily: "'Archivo', sans-serif", background: "#F1F5F9", minHeight: "100vh", color: "#0f172a", padding: "0" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap');`}</style>

      <div>
        {/* Header com botão de criar */}
        <div className="users-screen-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          gap: '12px',
          background: 'linear-gradient(128deg, #003B82 0%, #1D4E89 62%, #2F5597 100%)',
          borderRadius: '14px',
          padding: '16px 18px',
          boxShadow: '0 10px 30px rgba(0,59,130,.22)',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Gestão de Usuários</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,.82)' }}>Gerencie usuários e permissões do sistema</p>
          </div>
          <button 
            className="btn users-screen-create-btn" 
            onClick={() => setShowCreateModal(true)}
            style={{ background: '#F47B20', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', boxShadow: '0 2px 10px rgba(244,123,32,.3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E36C15')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F47B20')}
          >
            <UserPlus size={18} />
            Novo Usuário
          </button>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontSize: '15px' }}>
            Carregando usuários...
          </div>
        ) : (
          <div className="users-table-shell" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto', overflowY: 'hidden', marginTop: '10px' }}>
            <table className="users-table-responsive" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Troca Senha</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criado em</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{user.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>{user.email}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {user.isAdmin ? <Check size={18} color="#00796b" /> : <X size={18} color="#cbd5e1" />}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(user)}
                        style={{ 
                          padding: '4px 12px', 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          background: user.isActive ? '#d1fae5' : '#fee2e2',
                          color: user.isActive ? '#065f46' : '#991b1b'
                        }}
                      >
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: user.mustChangePassword ? '#f59e0b' : '#64748b' }}>
                      {user.mustChangePassword ? 'Obrigatória' : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="users-row-actions" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => setEditingUser(user)} 
                          title="Editar"
                          style={{ padding: '6px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        >
                          <Edit2 size={16} color="#475569" />
                        </button>
                        <button 
                          onClick={() => handleResetPassword(user)} 
                          title="Resetar Senha"
                          style={{ padding: '6px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        >
                          <RotateCcw size={16} color="#475569" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)} 
                          title="Deletar"
                          style={{ padding: '6px', background: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowCreateModal(false)}>
          <div className="users-modal-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Criar Novo Usuário</h2>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Nome</label>
                <input type="text" name="name" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s' }} onFocus={(e) => e.target.style.borderColor = '#00796b'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>E-mail</label>
                <input type="email" name="email" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s' }} onFocus={(e) => e.target.style.borderColor = '#00796b'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#475569' }}>
                  <input type="checkbox" name="isAdmin" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  Administrador
                </label>
              </div>
              <div className="users-modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', background: '#00796b', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setEditingUser(null)}>
          <div className="users-modal-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Editar Usuário</h2>
            <form onSubmit={handleUpdateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Nome</label>
                <input type="text" name="name" defaultValue={editingUser.name} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s' }} onFocus={(e) => e.target.style.borderColor = '#00796b'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>E-mail</label>
                <input type="email" value={editingUser.email} disabled style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: '#f8fafc', color: '#94a3b8' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#475569' }}>
                  <input type="checkbox" name="isAdmin" defaultChecked={editingUser.isAdmin} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  Administrador
                </label>
              </div>
              <div className="users-modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', background: '#00796b', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {generatedPassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setGeneratedPassword(null)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Senha Gerada</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b' }}>Anote esta senha e forneça ao usuário. Ela não será exibida novamente.</p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '2px dashed #cbd5e1' }}>
              <code style={{ fontSize: '20px', fontWeight: 700, color: '#00796b', letterSpacing: '0.1em' }}>{generatedPassword}</code>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => {
                navigator.clipboard.writeText(generatedPassword)
                alert('Senha copiada!')
              }} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                Copiar
              </button>
              <button onClick={() => setGeneratedPassword(null)} style={{ padding: '10px 20px', border: 'none', background: '#00796b', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
