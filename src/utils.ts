import { resolve, dirname } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { log } from 'node:console';
import { NpdConfig } from './type';

/**
 * get the path based on the path where to execute the command
 */
export const cwd = (...paths: string[]) => resolve(process.cwd(), ...paths);

export const safeJsonParse = (value: string, fallback?: unknown) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const resolveNpdConfig = (
  packageJson: { npd?: NpdConfig },
  packagePath: string,
): Required<NpdConfig> => {
  const { watch, start } = packageJson.npd ?? {};

  return {
    watch: watch ? watch.map((w) => resolve(packagePath, w)) : [packagePath],
    start: start ?? [],
  };
};

export const getPackages = (rootPath = '') => {
  const searchPath = resolve(cwd(), rootPath);

  try {
    const stdout = execSync(
      `git grep -E "\\"name\\"\\:\\s*\\".+\\"" -- "${searchPath}/*package.json"`,
    ).toString();

    return stdout
      .split('\n')
      .slice(0, -1)
      .map((line) => {
        const [filePath] = line.split(':');
        const packagePath = resolve(cwd(), filePath);
        const packageRootPath = dirname(packagePath);

        const packageJson = safeJsonParse(fs.readFileSync(packagePath, 'utf8'));

        return {
          rootPath: packageRootPath,
          name: packageJson.name ?? 'root',
          config: resolveNpdConfig(packageJson, packageRootPath),
        };
      });
  } catch (e) {
    log((e as Error).message);
  }
};

export const selector = async ({ choices, message }: { choices: string[]; message: string }) => {
  const inquirer = (await import('inquirer')).default;

  const result = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'checkbox',
      message,
      choices,
    },
  ]);

  return result.checkbox;
};

export const confirm = async (question: string) => {
  const inquirer = (await import('inquirer')).default;

  const result = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: question,
    },
  ]);

  return result.confirm;
};
