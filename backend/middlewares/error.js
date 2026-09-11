const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path });
  res.status(err.statusCode || 500).json({
    message: err.message || 'Erro interno do servidor.'
  });
}

module.exports = { errorHandler };
