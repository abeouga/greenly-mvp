import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const backend = resolve(root, 'backend');
const tasks = {
  dev: ['run', '--locked', '--project', backend, 'python', '-m', 'greenly_api', 'serve'],
  migrate: ['run', '--locked', '--project', backend, 'python', '-m', 'greenly_api', 'migrate'],
  compile: ['run', '--locked', '--project', backend, 'python', '-m', 'compileall', '-q', 'greenly_api', 'alembic', 'verification'],
  lint: ['run', '--locked', '--project', backend, 'ruff', 'check', 'greenly_api', 'alembic', 'verification'],
  verify: ['run', '--locked', '--project', backend, 'python', '-m', 'verification.verify_backend'],
};
const task = process.argv[2];
if (!Object.hasOwn(tasks, task)) {
  process.stderr.write('Usage: node scripts/api.mjs <dev|migrate|compile|lint|verify>\n');
  process.exit(2);
}
const child = spawn('uv', tasks[task], { cwd: backend, env: process.env, stdio: 'inherit' });
child.on('error', (error) => {
  process.stderr.write(`Python APIランナーを起動できません: ${error.message}\n`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
