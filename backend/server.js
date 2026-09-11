const express = require('express');
const { applySecurity } = require('./middlewares/security');
const { errorHandler } = require('./middlewares/error');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const transactionRoutes = require('./routes/transactions.routes');
const categoryRoutes = require('./routes/categories.routes');
const ocrRoutes = require('./routes/ocr.routes');
const healthRoutes = require('./routes/health.routes');
const { port } = require('./config/env');
const { initDatabase } = require('./database/connection');
const logger = require('./utils/logger');

const app = express();

initDatabase();
applySecurity(app);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'API Financeira operacional.' });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ocr', ocrRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Servidor iniciado em http://localhost:${port}`);
});

module.exports = app;
