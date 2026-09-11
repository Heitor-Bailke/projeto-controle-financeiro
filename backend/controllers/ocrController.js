const { maxUploadBytes } = require('../config/env');
const { parseReceipt } = require('../services/ocrService');

async function processImage(req, res) {
  try {
    const { imageBase64, mimeType } = req.body;
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (typeof imageBase64 !== 'string' || !imageBase64 || !allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ message: 'Envie uma imagem PNG, JPEG ou WebP válida.' });
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
      return res.status(400).json({ message: 'A imagem é inválida.' });
    }
    const buffer = Buffer.from(imageBase64, 'base64');
    if (!buffer.length || buffer.length > maxUploadBytes) {
      return res.status(400).json({ message: 'A imagem excede o limite permitido.' });
    }
    return res.json({ parsed: await parseReceipt(buffer, mimeType) });
  } catch (error) {
    return res.status(500).json({ message: 'Não foi possível processar a imagem.' });
  }
}

module.exports = { processImage };
