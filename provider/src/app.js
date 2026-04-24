/**
 * Express app for the User Service.
 *
 * Exported separately from server.js so tests can mount the app on an
 * ephemeral port without binding the well-known 3001.
 */
const express = require('express');
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ status: 'UP' }));

app.use('/users', usersRouter);

// 404 for unknown routes — express default is an HTML page, we want JSON.
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error middleware — last resort. Never leak stack traces to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[app] unhandled_error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
