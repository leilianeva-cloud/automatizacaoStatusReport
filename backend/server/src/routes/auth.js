const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool   = require('../db');
const auth   = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, mustChangePassword: user.mustChangePassword },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email e password são obrigatórios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) return res.status(409).json({ error: 'E-mail já cadastrado.' });

    // Verifica se é o primeiro usuário ou se é o email especial do admin
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM users');
    const isFirstUser = countRows[0].total === 0;
    const isSpecialAdmin = email === 'j.alexandre.castro@gmail.com';
    const isAdmin = isFirstUser || isSpecialAdmin;

    const id   = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, is_admin, is_active, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, hash, isAdmin ? 1 : 0, 1, 0]
    );
    const user = { id, name, email, isAdmin, mustChangePassword: false };
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email e password são obrigatórios.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, is_admin, is_active, must_change_password FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const dbUser = rows[0];
    
    // Verifica se o usuário está ativo
    if (!dbUser.is_active) {
      return res.status(403).json({ error: 'Usuário desativado. Contate o administrador.' });
    }

    const match  = await bcrypt.compare(password, dbUser.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const user = { 
      id: dbUser.id, 
      name: dbUser.name, 
      email: dbUser.email,
      isAdmin: !!dbUser.is_admin,
      mustChangePassword: !!dbUser.must_change_password
    };
    return res.json({ token: signToken(user), user });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword e newPassword são obrigatórios.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Senha atual incorreta.' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
      [hash, req.user.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('change-password error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, is_admin, must_change_password FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    await pool.query(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, req.user.id]
    );

    const current = rows[0];
    const user = {
      id: current.id,
      name,
      email: current.email,
      isAdmin: !!current.is_admin,
      mustChangePassword: !!current.must_change_password,
    };

    return res.json({ ok: true, token: signToken(user), user });
  } catch (err) {
    console.error('update profile error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
