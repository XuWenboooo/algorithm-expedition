import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.dirname(fileURLToPath(import.meta.url));
const cpp = path.join(root, 'cpp');
fs.mkdirSync(path.join(cpp, 'bin'), { recursive: true });
const sources = fs.readdirSync(cpp).filter((file) => file.endsWith('_ref.cpp')).sort();
if (process.platform === 'win32' && !process.env.CXX) {
  const result = spawnSync('cmd.exe', ['/d', '/c', 'build.bat'], { cwd: cpp, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
} else {
  const compiler = process.env.CXX || 'g++';
  for (const file of sources) {
    const output = path.join(cpp, 'bin', file.replace('.cpp', process.platform === 'win32' ? '.exe' : ''));
    const result = spawnSync(compiler, ['-std=c++17', '-O2', '-I', cpp, path.join(cpp, file), '-o', output], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
for (const file of sources) {
  const binary = path.join(cpp, 'bin', file.replace('.cpp', process.platform === 'win32' ? '.exe' : ''));
  if (!fs.existsSync(binary)) throw new Error(`Missing compiled reference: ${file}`);
}
console.log(`BUILD_OK: ${sources.length} C++17 reference programs rebuilt from source`);
