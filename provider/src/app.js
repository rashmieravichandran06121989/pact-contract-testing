/**
 * Express app for the User Service.
 * Exported separately from server.js so tests can import it
 * without binding to a port.
 */
const express = require('express');
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());

// Health check — useful for readiness probes and the pact verifier
app.get('/health', (_req, res) => {
  res.json({ status: 'UP' });
});

app.use('/users', usersRouter);

module.exports = app;
