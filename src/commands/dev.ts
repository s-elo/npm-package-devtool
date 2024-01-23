import { log } from 'node:console';
import fs from 'node:fs';
import { join } from 'node:path';
import watch from 'node-watch';
import debounce from 'debounce';
import concurrently from 'concurrently';
import copy from 'recursive-copy';
import { globSync } from 'glob';
import chalk from 'chalk';

import { NptConfig } from '../type';
import { link } from './link';
import { configService } from '../get-ctx';
import { readPackage } from '../utils';

const findAllPackageDestPaths = (rootPath: string, packageName: string) => {
  const pkg = readPackage(join(rootPath, 'package.json'));
  const defaultPath = join(rootPath, 'node_modules', packageName);
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
    const all = [
      ...packages.map((p) => join(rootPath, p, 'node_modules', packageName)),
      defaultPath,
    ];
    return globSync(all);
  }
  return [defaultPath];
};

export async function dev(rootPath?: string) {
  const selectedPackages = await link(rootPath, true);
  if (!selectedPackages?.length) {
    log(chalk.yellow('No packages selected'));
    return;
  }

  // execute the dev commands
  const commands = selectedPackages
    ?.filter((p) => p.config.start.length)
    .map((p) => ({
      command: p.config.start.join(' && '),
      name: p.name,
      cwd: p.rootPath,
      prefixColor: 'green',
    }));
  if (commands.length) {
    concurrently(commands);
  } else {
    log(chalk.red('Please specify how to start dev, there are 2 ways:'));
    log(chalk.gray('1. in environment variable'));
    log(chalk.gray('eg:  npt dev -s "yarn build:watch" -w "./esm"'));
    log(chalk.gray('2. in package.json'));
    log(
      chalk.gray(
        'eg: "npt": { "start": "yarn build:watch", "watch": "./esm" }',
      ),
    );
    log(chalk.gray(''));
    return;
  }

  // watch the file changed
  const debounceCachedPath = new Set<string>();
  const debouncedWatcherHandler = debounce(
    async (pck: {
      rootPath: string;
      name: string;
      config: Required<NptConfig>;
    }) => {
      try {
        const pckInfo = configService.getConfig();
        const depProjectPath = pckInfo[pck.name];
        if (!depProjectPath?.length) return;

        // avoid being overwritten by next debounce run
        const updatedPath = new Set([...debounceCachedPath]);
        debounceCachedPath.clear();

        for (const projPath of depProjectPath) {
          const packagePaths = findAllPackageDestPaths(projPath, pck.name);
          for (const packagePath of packagePaths) {
            log(chalk.gray(`Copying ${pck.name} to ${packagePath}...`));
            copy(pck.rootPath, packagePath, {
              overwrite: true,
              filter(path) {
                if (path === 'package.json') return true;
                return updatedPath.has(`${pck.rootPath}/${path}`);
              },
            });
          }
        }
        log(chalk.green(`Copying ${pck.name} Done.`));
      } catch (e) {
        log((e as Error).message);
      }
    },
    500,
  );
  const watchers = selectedPackages?.map((pck) => {
    for (const watchPath of pck.config.watch) {
      if (!fs.existsSync(watchPath)) {
        log(
          chalk.red(
            `${watchPath} can not be watched for ${pck.name} because it does not exist.`,
          ),
        );
        process.exit(1);
      }
    }
    return watch(pck.config.watch, { recursive: true }, (_, fileName) => {
      log(chalk.yellow(`${pck.name}: ${fileName} is updated`));
      debounceCachedPath.add(fileName);
      debouncedWatcherHandler(pck);
    });
  });
  log(
    `${chalk.green(
      selectedPackages.map((p) => p.name).join(','),
    )} are being watched...`,
  );

  const configWatcher = configService.startWatch(() =>
    selectedPackages.forEach((pck) => debouncedWatcherHandler(pck)),
  );

  process.on('SIGINT', () => {
    log('\nRemoving watchers...');
    watchers?.forEach((w) => w.close());
    configWatcher.close();
    log(chalk.green('Removing watchers Done.'));
  });
}
