import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const windows = process.platform === 'win32';
const executable = windows ? 'mvnw.cmd' : './mvnw';
const tasks = {
  dev: ['-DskipTests', 'spring-boot:run'],
  compile: ['-q', '-DskipTests', 'compile'],
};
const task = process.argv[2];

if (!Object.hasOwn(tasks, task)) {
  process.stderr.write('Usage: node scripts/maven.mjs <dev|compile>\n');
  process.exit(2);
}

const child = spawn(windows ? process.env.ComSpec ?? 'cmd.exe' : executable,
  windows ? ['/d', '/s', '/c', `${executable} ${tasks[task].join(' ')}`] : tasks[task], {
  cwd: resolve(root, 'backend'),
  env: process.env,
  stdio: 'inherit',
  shell: false,
});

child.on('error', (error) => {
  process.stderr.write(`Maven Wrapperを起動できません: ${error.message}\n`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
