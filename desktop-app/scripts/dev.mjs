import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import electronPath from 'electron';

const require = createRequire(import.meta.url);
const appDir = path.resolve(import.meta.dirname, '..');
const preferredPort = Number(process.env.PORT) || 3000;

function getAvailablePort(startPort) {
  return new Promise((resolve) => {
    const srv = http.createServer();
    srv.listen(startPort, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => {
      const srv2 = http.createServer();
      srv2.listen(0, '127.0.0.1', () => {
        const port = srv2.address().port;
        srv2.close(() => resolve(port));
      });
    });
  });
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const ok = await new Promise((resolve) => {
        const req = http.get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) resolve(true);
          else resolve(false);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Next.js dev server at ${url} failed to respond within ${timeoutMs}ms`);
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGINT');
    }
  } catch {}
}

async function main() {
  const port = await getAvailablePort(preferredPort);
  const devUrl = `http://127.0.0.1:${port}`;

  console.log(`\n🚀 Starting Sky Movie in Electron dev mode...`);
  console.log(`   Next.js URL: ${devUrl}\n`);

  const appDataDir = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
  const defaultUserData = process.platform === 'win32'
    ? path.join(appDataDir, '@sky-movie', 'desktop-app')
    : process.platform === 'darwin'
      ? path.join(process.env.HOME || '', 'Library', 'Application Support', '@sky-movie', 'desktop-app')
      : path.join(process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '', '.config'), '@sky-movie', 'desktop-app');

  const nextBin = require.resolve('next/dist/bin/next', { paths: [appDir] });
  const nextProcess = spawn(electronPath, [nextBin, 'dev', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: appDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      ELECTRON_RUN_AS_NODE: '1',
      SKY_MOVIE_DATA_DIR: defaultUserData
    }
  });

  let electronProcess = null;
  let isShuttingDown = false;

  function shutdown(code = 0) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n🛑 Shutting down development processes...');
    if (nextProcess && nextProcess.pid) {
      killProcessTree(nextProcess.pid);
    }
    if (electronProcess && !electronProcess.killed) {
      try {
        electronProcess.kill('SIGINT');
      } catch {}
    }
    process.exit(code);
  }

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  nextProcess.on('exit', (code) => {
    if (!isShuttingDown && code !== 0 && code !== null) {
      console.error(`Next.js process exited with code ${code}`);
      shutdown(code);
    }
  });

  try {
    await waitForServer(devUrl);
    console.log(`\n✓ Next.js dev server ready! Launching Electron desktop window...\n`);

    electronProcess = spawn(electronPath, [path.join(appDir, 'electron/main.cjs')], {
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        DEV_SERVER_URL: devUrl,
        NODE_ENV: 'development'
      }
    });

    electronProcess.on('exit', (code) => {
      shutdown(code ?? 0);
    });
  } catch (err) {
    console.error('Failed to start dev environment:', err.message);
    shutdown(1);
  }
}

main();
