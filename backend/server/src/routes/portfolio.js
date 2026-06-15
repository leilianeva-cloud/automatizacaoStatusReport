const router  = require('express').Router();
const XLSX    = require('xlsx');
const pool    = require('../db');
const auth    = require('../middleware/auth');
const upload  = require('../middleware/upload');

// POST /api/portfolio/upload — recebe .xlsx, parseia, retorna rows brutas (não salva)
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  try {
    const wb   = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws   = wb.Sheets['Portfólio'] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    // Serializar corretamente: datas viram ISO strings, números ficam números
    const normalized = rows.slice(2).map(row =>
      row.map(cell => {
        if (cell instanceof Date) return cell.toISOString();
        return cell;
      })
    );
    return res.json({ rows: normalized });
  } catch (err) {
    console.error('upload error:', err);
    return res.status(422).json({ error: 'Erro ao processar o arquivo: ' + err.message });
  }
});

// GET /api/portfolio — retorna portfólio salvo do usuário
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT rows_json, imported_at FROM user_portfolio WHERE user_id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.json({ rows: [], importedAt: '' });
    return res.json({
      rows:       JSON.parse(rows[0].rows_json),
      importedAt: rows[0].imported_at,
    });
  } catch (err) {
    console.error('portfolio get error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/portfolio — salva/atualiza portfólio do usuário
router.put('/', auth, async (req, res) => {
  const { rows, importedAt } = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows deve ser um array.' });
  try {
    await pool.query(
      `INSERT INTO user_portfolio (user_id, rows_json, imported_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rows_json = VALUES(rows_json), imported_at = VALUES(imported_at)`,
      [req.user.id, JSON.stringify(rows), importedAt || '']
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('portfolio put error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/portfolio — limpa portfólio do usuário
router.delete('/', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_portfolio WHERE user_id = ?', [req.user.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('portfolio delete error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
