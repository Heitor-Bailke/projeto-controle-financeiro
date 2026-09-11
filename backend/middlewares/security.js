const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { sanitizeInput } = require('../utils/sanitize');
const { corsOrigin } = require('../config/env');

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  const configuredOrigins = (corsOrigin || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function applySecurity(app) {
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origem não permitida pelo CORS.'));
    },
    credentials: true
  }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  app.use(sanitizeInput);
}

module.exports = { applySecurity, isOriginAllowed };
