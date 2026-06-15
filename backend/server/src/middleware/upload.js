const multer = require('multer');

// Aceitar apenas xlsx/xls, tamanho máximo 20MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = file.originalname.match(/\.(xlsx|xls)$/i);
    if (!ok) return cb(new Error('Apenas arquivos .xlsx ou .xls são aceitos.'));
    cb(null, true);
  },
});

module.exports = upload;
