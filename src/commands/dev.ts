import { log, error } from 'node:console';
import fs from 'node:fs';
import watch from 'node-watch';
import debounce from 'debounce';
import concurrently from 'concurrently';
import copy from 'recursive-copy';
import chalk from 'chalk';

import { link } from './link';
import { Config, configService } from '../get-ctx';
import { findAllPackageDestPaths } from '../utils';

const watchHandler = async (
  pck: { rootPath: string; name: string },
  debounceCachedPath: Set<string>,
) => {
  try {
    const pckInfo = configService.getConfig();
    const depProjectInfo = pckInfo[pck.name];
    if (!depProjectInfo?.usedBy?.length) return;

    // avoid being overwritten by next debounce run
    const updatedPath = new Set([...debounceCachedPath]);
    debounceCachedPath.clear();

    for (const projPath of depProjectInfo.usedBy) {
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
    error('watchHandler error', e);
  }
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
    log(chalk.gray('eg: npt dev -s "yarn build:watch" -w "./esm"'));
    log(chalk.gray('2. in package.json'));
    log(
      chalk.gray(
        `eg:
  "npt": {
    "start": [ "yarn build:watch" ],
    "watch": ["./esm"]
  }`,
      ),
    );
    log(chalk.gray(''));
    return;
  }

  const watchers = selectedPackages?.map((pck) => {
    // watch the file changed
    const debounceCachedPath = new Set<string>();
    const debouncedWatcherHandler = debounce(watchHandler, 500);
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
      debouncedWatcherHandler(pck, debounceCachedPath);
    });
  });

  log(
    `${chalk.green(
      selectedPackages.map((p) => p.name).join(','),
    )} are being watched...`,
  );

  const config = selectedPackages.reduce((conf, pkg) => {
    conf[pkg.name] = {
      rootPath: pkg.rootPath,
      config: pkg.config,
      usedBy: [],
    };
    return conf;
  }, {} as Config);
  configService.updateConfig(config);

  process.on('SIGINT', () => {
    log('\nRemoving watchers...');
    watchers?.forEach((w) => w.close());
    log(chalk.green('Removing watchers Done.'));
  });
}
