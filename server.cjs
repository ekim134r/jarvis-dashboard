// Custom Next.js server: hard-disable WebSocket upgrades.
// Rationale: avoids upgrade-handler crashes in this environment.

const http = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOSTNAME || '0.0.0.0';

const app = next({
  dev: false,
  hostname: host,
  port,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res));

    // Drop upgrade requests (websockets). This dashboard does not need them.
    server.on('upgrade', (_req, socket) => {
      try {
        socket.destroy();
      } catch {
        // ignore
      }
    });

    server.listen(port, host, () => {
      // eslint-disable-next-line no-console
      console.log(`Jarvis Dashboard running on http://${host}:${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
