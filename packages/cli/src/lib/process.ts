import spawn from 'cross-spawn';

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export function runNpm(root: string, args: string[]): Promise<void> {
  return runCommand('npm', args, { cwd: root });
}

export function runCommand(
  command: string,
  args: string[],
  { cwd = process.cwd(), env }: RunOptions = {},
): Promise<void> {
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

/** Turns parsed commander options back into argv for a delegated command. */
export function optionArgs(
  options: Record<string, unknown>,
  schema: Record<string, string>,
): string[] {
  const args: string[] = [];
  for (const [name, flag] of Object.entries(schema)) {
    const value = options[name];
    if (value === undefined || value === false) continue;
    args.push(flag);
    if (value !== true) args.push(String(value));
  }
  return args;
}
