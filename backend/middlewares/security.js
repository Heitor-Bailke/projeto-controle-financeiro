const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { sanitizeInput } = require('../utils/sanitize');
const { corsOrigin, nodeEnv } = require('../config/env');

function isOriginAllowed(origin, environment = nodeEnv) {
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

  return environment !== 'production' && /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
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
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers.origin && !isOriginAllowed(req.headers.origin)) {
      return res.status(403).json({ message: 'Origem não permitida.' });
    }
    return next();
  });
  app.use(sanitizeInput);
}

module.exports = { applySecurity, isOriginAllowed };
