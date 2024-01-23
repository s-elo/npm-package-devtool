import { resolve, dirname } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { log } from 'node:console';
import { ChoiceType, NptConfig } from './type';

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

let rootNptConfig: NptConfig | null = null;
/**
 * get the npt config at root package.json
 */
export const getRootNptConfig = (): NptConfig => {
  if (rootNptConfig) {
    return rootNptConfig;
  }

  const rootPckPath = resolve(cwd(), './package.json');
  if (!fs.existsSync(rootPckPath)) {
    rootNptConfig = {};
  } else {
    const rootPckJson = safeJsonParse(fs.readFileSync(rootPckPath, 'utf8')) as {
      npt?: NptConfig;
    };

    rootNptConfig = rootPckJson.npt ?? {};
  }

  return rootNptConfig;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readPackage = <T = any>(packagePath: string) => {
  return safeJsonParse(fs.readFileSync(packagePath, 'utf8')) as T;
};

export const resolveNptConfig = (packagePath: string) => {
  const packageRootPath = dirname(packagePath);

  const packageJson = safeJsonParse(fs.readFileSync(packagePath, 'utf8')) as {
    npt?: NptConfig;
    name: string;
  };
  const rootNptConfig = getRootNptConfig();
  const {
    watch = global.NPT_CURRENT_WATCH_PATH?.split(',') ??
      rootNptConfig.watch ?? [packagePath],
    start = global.NPT_CURRENT_START_PATH?.split('&&') ??
      rootNptConfig.start ??
      [],
  } = packageJson.npt ?? {};
  return {
    rootPath: packageRootPath,
    name: packageJson.name ?? 'root',
    config: {
      watch: watch.map((w: string) => resolve(packageRootPath, w)),
      start,
    },
  };
};

export const isGitRepo = () => {
  try {
    return !!execSync('git rev-parse --is-inside-work-tree 2>/dev/null', {
      encoding: 'utf8',
    });
  } catch {
    return false;
  }
};

export const getPackagesByGit = (searchPath = '') => {
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

        return resolveNptConfig(packagePath);
      });
  } catch (e) {
    log((e as Error).message);
  }
};

export const getPackagesByTraverse = (searchPath = '') => {
  const ignoredDirs = ['node_modules'];
  return fs
    .readdirSync(searchPath)
    .filter((d) => !ignoredDirs.includes(d))
    .reduce<ReturnType<typeof resolveNptConfig>[]>((packages, blob) => {
      const fullPath = resolve(searchPath, blob);

      if (blob === 'package.json') {
        packages.push(resolveNptConfig(fullPath));
      } else if (fs.statSync(fullPath).isDirectory()) {
        packages.push(...getPackagesByTraverse(fullPath));
      }

      return packages;
    }, []);
};

export const getPackages = (rootPath = '') => {
  const searchPath = resolve(cwd(), rootPath);
  return getPackagesByTraverse(searchPath);
};

export const selector = async ({
  choices,
  message,
  selected = [],
}: {
  choices: ChoiceType;
  message: string;
  selected?: string[];
}) => {
  const inquirer = (await import('inquirer')).default;

  const result = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'checkbox',
      message,
      choices,
      default: selected,
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
