import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import electronPath from 'electron';

const appDir = path.resolve(import.meta.dirname, '..');
const standaloneServer = path.join(appDir, '.next/standalone/desktop-app/server.js');

async function main() {
  if (!fs.existsSync(standaloneServer)) {
    console.log('\n⚠️  Production standalone build not found.');
    console.log('   Running build and package:prepare...\n');
    const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const build = spawn(pnpmCmd, ['build'], { cwd: appDir, stdio: 'inherit', shell: true });
    await new Promise((resolve, reject) => {
      build.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Build failed with code ${code}`)));
    });
    const prepare = spawn('node', ['scripts/prepare-standalone.mjs'], { cwd: appDir, stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      prepare.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Prepare failed with code ${code}`)));
    });
  }

  console.log('\n🚀 Starting Sky Movie Desktop (Production Mode)...\n');

  const electronProcess = spawn(electronPath, [path.join(appDir, 'electron/main.cjs')], {
    cwd: appDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  process.on('SIGINT', () => {
    try {
      electronProcess.kill('SIGINT');
    } catch {}
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    try {
      electronProcess.kill('SIGTERM');
    } catch {}
    process.exit(0);
  });

  electronProcess.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('Failed to start desktop app:', err.message);
  process.exit(1);
});
