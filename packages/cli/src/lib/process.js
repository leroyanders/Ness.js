import spawn from 'cross-spawn';

export function runNpm(root, args) {
  return runCommand('npm', args, { cwd: root });
}

export function runCommand(command, args, { cwd = process.cwd(), env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`),
        );
    });
  });
}

export function optionArgs(options, schema) {
  const args = [];
  for (const [name, flag] of Object.entries(schema)) {
    const value = options[name];
    if (value === undefined || value === false) continue;
    args.push(flag);
    if (value !== true) args.push(String(value));
  }
  return args;
}
