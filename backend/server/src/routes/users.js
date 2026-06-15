const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../db');
const adminAuth = require('../middleware/adminAuth');

// Todas as rotas exigem admin
router.use(adminAuth);

// Função para gerar senha aleatória de 8 caracteres
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// GET /api/users — lista todos os usuários
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, is_admin, is_active, must_change_password, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    const users = rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      isAdmin: !!r.is_admin,
      isActive: !!r.is_active,
      mustChangePassword: !!r.must_change_password,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return res.json(users);
  } catch (err) {
    console.error('users get error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/users — cria novo usuário (com senha aleatória)
router.post('/', async (req, res) => {
  const { name, email, isAdmin } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name e email são obrigatórios.' });
  }
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) return res.status(409).json({ error: 'E-mail já cadastrado.' });

    const id = uuidv4();
    const generatedPassword = generatePassword();
    const hash = await bcrypt.hash(generatedPassword, 10);

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, is_admin, is_active, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, hash, isAdmin ? 1 : 0, 1, 1]
    );

    const user = {
      id,
      name,
      email,
      isAdmin: !!isAdmin,
      isActive: true,
      mustChangePassword: true,
      generatedPassword, // retorna a senha para o admin copiar
    };
    return res.status(201).json(user);
  } catch (err) {
    console.error('users post error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/users/:id — atualiza usuário (nome, isAdmin, isActive)
router.put('/:id', async (req, res) => {
  const { name, isAdmin, isActive } = req.body;
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (isAdmin !== undefined) {
      updates.push('is_admin = ?');
      values.push(isAdmin ? 1 : 0);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(req.params.id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('users put error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/users/:id — deleta usuário
router.delete('/:id', async (req, res) => {
  try {
    // Não permite deletar o próprio usuário admin
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta.' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('users delete error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/users/:id/reset-password — reseta senha do usuário (gera nova aleatória)
router.post('/:id/reset-password', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const newPassword = generatePassword();
    const hash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?',
      [hash, req.params.id]
    );

    return res.json({ ok: true, newPassword });
  } catch (err) {
    console.error('users reset-password error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
