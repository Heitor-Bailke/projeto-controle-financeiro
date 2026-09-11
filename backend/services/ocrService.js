const { createWorker } = require('tesseract.js');
const {
  ocrProvider,
  openAiApiKey,
  azureVisionEndpoint,
  azureVisionKey
} = require('../config/env');

function normalizeOcrResult(payload = {}) {
  return {
    amount: formatAmount(payload.amount),
    date: payload.date || new Date().toISOString().slice(0, 10),
    time: payload.time || '00:00',
    merchant: payload.merchant || payload.establishment || 'Estabelecimento',
    category: payload.category || suggestCategory(payload.rawText || ''),
    rawText: payload.rawText || ''
  };
}

function formatAmount(value) {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9,.-]/g, '').replace(/^\./, '');
    if (!cleaned) {
      return '0.00';
    }

    if (cleaned.includes(',') && cleaned.includes('.')) {
      return cleaned.replace('.', '').replace(',', '.');
    }

    if (cleaned.includes(',')) {
      return cleaned.replace(',', '.');
    }

    return cleaned;
  }

  return '0.00';
}

function extractAmount(text) {
  const match = text.match(/R\$?\s*([0-9.,]+)/i) || text.match(/([0-9.,]{1,10})/);
  return match ? formatAmount(match[1]) : '0.00';
}

function extractDate(text) {
  const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
  return dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
}

function extractTime(text) {
  const timeMatch = text.match(/(\d{1,2}:\d{2})/);
  return timeMatch ? timeMatch[1] : '00:00';
}

function extractMerchant(text) {
  const lines = text.split(/\n|\r/).filter(Boolean);
  return lines[0] || 'Estabelecimento';
}

function suggestCategory(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes('mercado') || normalized.includes('super')) return 'Mercado';
  if (normalized.includes('rest') || normalized.includes('food') || normalized.includes('lanche')) return 'Restaurante';
  if (normalized.includes('combust') || normalized.includes('gas')) return 'Combustível';
  if (normalized.includes('farm')) return 'Farmácia';
  return 'Outros';
}

function parseLlmText(text) {
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    return normalizeOcrResult(parsed);
  } catch (error) {
    const lines = text.split(/\n|\r/).filter(Boolean);
    return normalizeOcrResult({
      rawText: text,
      amount: extractAmount(lines.join(' ')),
      date: extractDate(lines.join(' ')),
      time: extractTime(lines.join(' ')),
      merchant: extractMerchant(lines.join(' ')),
      category: suggestCategory(lines.join(' '))
    });
  }
}

async function callOpenAiVision(imageBuffer, mimeType) {
  if (!openAiApiKey) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'Extraia os dados financeiros de uma imagem de comprovante. Responda somente em JSON com os campos amount, date, time, merchant, category e rawText.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Leia esta imagem e extraia os dados financeiros do comprovante.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBuffer.toString('base64')}` } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return parseLlmText(content);
}

async function callAzureVision(imageBuffer, mimeType) {
  if (!azureVisionEndpoint || !azureVisionKey) {
    return null;
  }

  const response = await fetch(`${azureVisionEndpoint.replace(/\/$/, '')}/vision/v3.2/ocr?language=pt&detectOrientation=true`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': azureVisionKey,
      'Content-Type': mimeType || 'application/octet-stream'
    },
    body: imageBuffer
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const text = (data.regions || [])
    .flatMap((region) => region.lines || [])
    .flatMap((line) => line.words || [])
    .map((word) => word.text)
    .join(' ');

  return normalizeOcrResult({
    amount: extractAmount(text),
    date: extractDate(text),
    time: extractTime(text),
    merchant: extractMerchant(text),
    category: suggestCategory(text),
    rawText: text.slice(0, 500)
  });
}

async function parseReceipt(imageBuffer, mimeType = 'image/png') {
  try {
    const provider = (ocrProvider || 'tesseract').toLowerCase();

    if (provider === 'openai') {
      const aiResult = await callOpenAiVision(imageBuffer, mimeType);
      if (aiResult) {
        return aiResult;
      }
    }

    if (provider === 'azure') {
      const aiResult = await callAzureVision(imageBuffer, mimeType);
      if (aiResult) {
        return aiResult;
      }
    }

    const worker = await createWorker('eng');
    const result = await worker.recognize(imageBuffer);
    await worker.terminate();
    const text = result.data.text || '';
    return normalizeOcrResult({
      amount: extractAmount(text),
      date: extractDate(text),
      time: extractTime(text),
      merchant: extractMerchant(text),
      category: suggestCategory(text),
      rawText: text.slice(0, 500)
    });
  } catch (error) {
    return normalizeOcrResult({
      amount: '0.00',
      date: new Date().toISOString().slice(0, 10),
      time: '00:00',
      merchant: 'Estabelecimento',
      category: 'Outros',
      rawText: 'OCR indisponível no momento.'
    });
  }
}

module.exports = { parseReceipt, normalizeOcrResult };
