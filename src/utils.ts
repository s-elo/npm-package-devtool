import { log, warn } from 'node:console';
import { resolve, dirname, join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { globSync } from 'glob';
import checkboxSearch from 'inquirer-checkbox-search';
import { ChoiceItem, ChoiceType, NptConfig } from './type';

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
    watch = (global.NPT_CURRENT_WATCH_PATH as string)?.split(',') ??
      rootNptConfig.watch ?? [packagePath],
    start = (global.NPT_CURRENT_START_PATH as string)?.split('&&') ??
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

export const getPackages = (rootPath = '') => {
  const fileName = 'package.json';
  const rootPkgPath = resolve(cwd(), rootPath, fileName);
  const pkg = readPackage(rootPkgPath);
  let allPkgs: string[] = [];
  if (pkg.workspaces) {
    const packages = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : pkg.workspaces?.packages;
    if (!Array.isArray(packages)) {
      log(
        chalk.red(
          `Dest project(${rootPath}) is a monorepo, but packages is invalid`,
        ),
      );
      log(packages);
      return [];
    }
    const allPattern = packages.map((subPkg) =>
      resolve(rootPath, subPkg, fileName),
    );
    allPkgs = globSync(allPattern);
  } else {
    allPkgs = [rootPkgPath];
  }
  return allPkgs.map((pkgPath) => resolveNptConfig(pkgPath));
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
  inquirer.registerPrompt('checkbox-search', checkboxSearch);

  const result = await inquirer.prompt([
    {
      type: 'checkbox-search',
      name: 'checkbox',
      message,
      source: async (_, input: string) => {
        if (!input) {
          return choices;
        }
        return choices.filter((c) => {
          if (typeof c === 'string') {
            return c.includes(input);
          }
          return c.name.includes(input);
        });
      },
      default: selected,
      pageSize: 20,
      required: true,
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

const revealRealpath = (paths: string[]) =>
  paths
    .filter((p) => fs.existsSync(p))
    .map((p) => {
      const stat = fs.lstatSync(p);
      if (stat.isSymbolicLink()) {
        return fs.realpathSync(p);
      }
      return p;
    });

export const findAllPackageDestPaths = (
  rootPath: string,
  packageName: string,
) => {
  const pkgPath = join(rootPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    warn(chalk.yellow('dest package not found', pkgPath));
    return [];
  }
  const pkg = readPackage(pkgPath);
  const defaultPath = join(rootPath, 'node_modules', packageName);
  const pnpmDefaultPath = join(
    rootPath,
    'node_modules/.pnpm/node_modules',
    packageName,
  );
  if (!pkg.workspaces) {
    return revealRealpath([defaultPath, pnpmDefaultPath]);
  }
  const packages = Array.isArray(pkg.workspaces)
    ? pkg.workspaces
    : pkg.workspaces?.packages;
  if (!Array.isArray(packages)) {
    log(
      chalk.red(
        `Dest project(${rootPath}) is a monorepo, but packages is invalid`,
      ),
    );
    log(packages);
    return [];
  }
  const all = [
    ...packages.map((p) => join(rootPath, p, 'node_modules', packageName)),
    defaultPath,
  ];

  const globRet = globSync(all);
  // for non-published newly added package
  return revealRealpath(globRet.length ? globRet : [defaultPath]);
};

/**
 * sort choice item: order by selected first, then by name asc
 */
export const sortPackages = (a: ChoiceItem, b: ChoiceItem) => {
  // put added packages at the front
  if (a.checked && b.checked) {
    return a.name < b.name ? -1 : 1;
  }
  if (a.checked) {
    return -1;
  }
  if (b.checked) {
    return 1;
  }
  if (a.name < b.name) {
    return -1;
  }
  return 1;
};
