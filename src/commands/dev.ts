import watch from 'node-watch';
import debounce from 'debounce';
import concurrently from 'concurrently';
import copy from 'recursive-copy';
import { NptConfig } from '../type';
import { log } from 'node:console';
import { link } from './link';
import { configService } from '../get-ctx';
import fs from 'fs';

export async function dev(rootPath?: string) {
  const chalk = (await import('chalk')).default;

  const selectedPackages = await link(rootPath, true);
  if (!selectedPackages?.length) return;

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

        await Promise.all(
          depProjectPath.map((projPath) => {
            log(
              chalk.gray(
                `Copying ${pck.name} to ${projPath}/node_modules/${pck.name}...`,
              ),
            );
            copy(pck.rootPath, `${projPath}/node_modules/${pck.name}`, {
              overwrite: true,
              filter(path) {
                if (path === 'package.json') return true;
                return updatedPath.has(`${pck.rootPath}/${path}`);
              },
            });
          }),
        );
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
