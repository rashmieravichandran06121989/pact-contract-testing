const app = require('./app');

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, () => {
  console.log(`User Service running on http://localhost:${PORT}`);
});

// Graceful shutdown — required for Kubernetes SIGTERM and CI teardown.
// The hard-kill timer guarantees the process exits even if a connection hangs.
const shutdown = (signal) => {
  console.log(`[server] received ${signal}, draining connections`);
  server.close((err) => {
    if (err) {
      console.error('[server] close error', err);
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[server] shutdown timed out after 10s, forcing exit');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
