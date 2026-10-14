#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(here, '..');
const targetArg = process.argv[2];
const keepDemo = process.argv.includes('--keep-demo');
const skipInstall = process.argv.includes('--skip-install');
if (!targetArg) { console.error('usage: node new_project.mjs <target-dir> [--keep-demo] [--skip-install]'); process.exit(1); }
const target = resolve(targetArg);
const runtimeDirs = [];
for (const start of [target, process.cwd(), skillDir]) {
  let dir = resolve(start);
  for (;;) {
    const candidate = resolve(dir, 'video-tools', 'runtime');
    if (existsSync(candidate) && !runtimeDirs.includes(candidate)) runtimeDirs.push(candidate);
    const parent = dirname(dir); if (parent === dir) break; dir = parent;
  }
}
const portableNpm = runtimeDirs.flatMap(dir => readdirSync(dir, {withFileTypes:true})
  .filter(e => e.isDirectory() && e.name.startsWith('node-'))
  .map(e => resolve(dir, e.name, process.platform === 'win32' ? 'npm.cmd' : 'bin/npm'))).find(existsSync);
const portableFfmpeg = runtimeDirs.map(dir => resolve(dir, 'ffmpeg', 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')).find(existsSync);
if (existsSync(target) && readdirSync(target).length) { console.error(`error: ${target} is not empty; not overwriting`); process.exit(1); }
mkdirSync(target, { recursive: true });
cpSync(resolve(skillDir, 'template'), target, {
  recursive: true,
  force: false,
  errorOnExist: false,
  filter: src => !new Set(['node_modules', 'out']).has(basename(src)),
});
mkdirSync(resolve(target, 'assets'), { recursive: true });
mkdirSync(resolve(target, 'out', 'check'), { recursive: true });
if (!keepDemo) {
  const studio = resolve(target, 'studio.html'), src = readFileSync(studio, 'utf8');
  writeFileSync(studio, src.replace('<script src="src/scenes/demo.js"></script>', '<!-- <script src="src/scenes/demo.js"></script> (example only) -->'));
}
if (!skipInstall) {
  const npm = process.env.NPM_PATH || (portableNpm && existsSync(portableNpm) ? portableNpm : null) || (process.platform === 'win32' ? 'npm.cmd' : 'npm');
  const npmCli = npm.toLowerCase().endsWith('npm.cmd') ? resolve(dirname(npm), 'node_modules', 'npm', 'bin', 'npm-cli.js') : null;
  const npmNode = npmCli ? resolve(dirname(npm), 'node.exe') : null;
  const useNpmCli = Boolean(npmCli && npmNode && existsSync(npmCli) && existsSync(npmNode));
  console.log('== installing p5, p5.brush, puppeteer-core');
  const install = spawnSync(useNpmCli ? npmNode : npm, useNpmCli ? [npmCli, 'install', '--silent'] : ['install', '--silent'], {
    cwd: target,
    stdio: 'inherit',
    shell: process.platform === 'win32' && npm.toLowerCase().endsWith('.cmd') && !useNpmCli,
  });
  if (install.error || install.status !== 0) { console.error('npm install failed. Install Node.js with npm, then rerun this command.'); process.exit(install.status || 1); }
} else {
  console.log('== dependency installation skipped');
}
const ffmpeg = process.env.FFMPEG_PATH || portableFfmpeg || 'ffmpeg';
const ff = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8' });
console.log(ff.status === 0 ? 'ffmpeg ok' : 'MISSING: ffmpeg (install it and add it to PATH)');
const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chrome = candidates.find(existsSync);
console.log(chrome ? `chrome ${chrome}` : 'MISSING: Chrome (install it, set CHROME_PATH, or pass --chrome=<path>)');
console.log(`== ready: ${target}`);
