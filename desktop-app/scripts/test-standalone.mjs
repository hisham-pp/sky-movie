import { fork } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';

const appDir = path.resolve(import.meta.dirname, '..');
const serverScript = path.join(appDir, '.next/standalone/desktop-app/server.js');
console.log('Starting standalone server:', serverScript);

const child = fork(serverScript, [], {
  env: {
    ...process.env,
    PORT: '3099',
    HOSTNAME: '127.0.0.1',
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

async function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

setTimeout(async () => {
  try {
    const settings = await checkUrl('http://127.0.0.1:3099/api/settings');
    console.log('✓ API /api/settings returned status:', settings.status);
    if (settings.status >= 400) {
      console.log('API /api/settings error body:', settings.data);
    }

    const root = await checkUrl('http://127.0.0.1:3099/');
    console.log('✓ Root HTML page returned status:', root.status);

    console.log('Standalone server test SUCCESSFUL!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    child.kill();
    process.exit(0);
  }
}, 3000);
