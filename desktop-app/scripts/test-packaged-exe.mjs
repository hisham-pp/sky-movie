import { fork } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';

const exePath = path.resolve('desktop-app/dist/win-unpacked/sky-movie.exe');
const serverScript = path.resolve('desktop-app/dist/win-unpacked/resources/standalone/desktop-app/server.js');

console.log('Testing packaged executable:', exePath);
console.log('Server script:', serverScript);

const child = fork(serverScript, [], {
  execPath: exePath,
  env: {
    ...process.env,
    PORT: '3098',
    HOSTNAME: '127.0.0.1',
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1'
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
    const settings = await checkUrl('http://127.0.0.1:3098/api/settings');
    console.log('✓ Packaged App API /api/settings status:', settings.status);

    const root = await checkUrl('http://127.0.0.1:3098/');
    console.log('✓ Packaged App Root page status:', root.status);

    if (settings.status === 200 && root.status === 200) {
      console.log('✓ PACKAGED EXECUTABLE RUNS FLAWLESSLY!');
    }
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    child.kill();
    process.exit(0);
  }
}, 3000);
