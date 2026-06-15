const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/projects — lista todos os projetos do usuário
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, n_futuros, n_passados, usa_pacotes,
              projeto_json, raias_json, pacotes_json
       FROM report_projects
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [req.user.id]
    );
    const projects = rows.map(r => ({
      id:         r.id,
      nFuturos:   r.n_futuros,
      nPassados:  r.n_passados,
      usaPacotes: !!r.usa_pacotes,
      projeto:    JSON.parse(r.projeto_json),
      raias:      JSON.parse(r.raias_json),
      pacotes:    JSON.parse(r.pacotes_json),
    }));
    return res.json(projects);
  } catch (err) {
    console.error('projects get error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/projects — salva (upsert) array completo de projetos do usuário
// Estratégia: delete projetos que não estão mais na lista + upsert os existentes
router.post('/', auth, async (req, res) => {
  const { projects } = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: 'projects deve ser um array.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // IDs que o cliente quer manter
    const ids = projects.map(p => p.id).filter(Boolean);

    if (ids.length > 0) {
      // Remover projetos do usuário que não estão mais na lista
      const placeholders = ids.map(() => '?').join(',');
      await conn.query(
        `DELETE FROM report_projects WHERE user_id = ? AND id NOT IN (${placeholders})`,
        [req.user.id, ...ids]
      );
    } else {
      // Lista vazia → remove tudo
      await conn.query('DELETE FROM report_projects WHERE user_id = ?', [req.user.id]);
    }

    // Upsert cada projeto
    for (const p of projects) {
      if (!p.id) continue;
      await conn.query(
        `INSERT INTO report_projects
           (id, user_id, n_futuros, n_passados, usa_pacotes, projeto_json, raias_json, pacotes_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           n_futuros    = VALUES(n_futuros),
           n_passados   = VALUES(n_passados),
           usa_pacotes  = VALUES(usa_pacotes),
           projeto_json = VALUES(projeto_json),
           raias_json   = VALUES(raias_json),
           pacotes_json = VALUES(pacotes_json),
           updated_at   = CURRENT_TIMESTAMP`,
        [
          p.id,
          req.user.id,
          p.nFuturos  ?? 1,
          p.nPassados ?? 0,
          p.usaPacotes ? 1 : 0,
          JSON.stringify(p.projeto  || {}),
          JSON.stringify(p.raias    || []),
          JSON.stringify(p.pacotes  || []),
        ]
      );
    }

    await conn.commit();
    return res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error('projects post error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  } finally {
    conn.release();
  }
});

// DELETE /api/projects/:id — remove um projeto específico
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM report_projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('projects delete error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
