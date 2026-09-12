import { createServer } from '../frontend/node_modules/vite/dist/node/index.js';

async function start() {
  const server = await createServer({
    configFile: './frontend/vite.config.ts',
    root: './frontend',
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  });

  await server.listen();
  server.printUrls();
}

start().catch(err => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
