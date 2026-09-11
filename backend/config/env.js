require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || '';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';

if (jwtSecret.length < 32 || jwtRefreshSecret.length < 32 || jwtSecret === jwtRefreshSecret) {
  throw new Error('Configure JWT_SECRET e JWT_REFRESH_SECRET distintos, com pelo menos 32 caracteres, no .env.');
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv,
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  databaseUrl: process.env.DATABASE_URL || '',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  logLevel: process.env.LOG_LEVEL || 'info',
  ocrProvider: process.env.OCR_PROVIDER || 'tesseract',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  azureVisionEndpoint: process.env.AZURE_VISION_ENDPOINT || '',
  azureVisionKey: process.env.AZURE_VISION_KEY || ''
};
