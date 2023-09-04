import watch from 'node-watch';
import debounce from 'debounce';
import concurrently from 'concurrently';
import copy from 'recursive-copy';
import { NpdConfig } from '../type';
import { log } from 'node:console';
import { link } from './link';
import { configService } from '../get-ctx';

export async function dev(rootPath?: string) {
  const chalk = (await import('chalk')).default;

  const selectedPackages = await link(rootPath);
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
  const debouncedWatcherHandler = debounce(
    async (pck: { rootPath: string; name: string; config: Required<NpdConfig> }) => {
      try {
        const pckInfo = configService.getConfig();
        const depProjectPath = pckInfo[pck.name];
        if (!depProjectPath?.length) return;

        log(chalk.gray(`Copying ${pck.name}...`));
        await Promise.all(
          depProjectPath.map((projPath) =>
            copy(pck.rootPath, `${projPath}/node_modules/${pck.name}`, {
              overwrite: true,
            }),
          ),
        );
        log(chalk.green(`Copying ${pck.name} Done.`));
      } catch (e) {
        log((e as Error).message);
      }
    },
    500,
  );
  const watchers = selectedPackages?.map((pck) => {
    return watch(pck.config.watch, { recursive: true }, (_, fileName) => {
      log(chalk.yellow(`${pck.name}: ${fileName} is updated`));
      debouncedWatcherHandler(pck);
    });
  });
  log(`${chalk.green(selectedPackages.map((p) => p.name).join(','))} are being watched...`);

  const configWatcher = configService.startWatch();

  process.on('SIGINT', () => {
    log('\nRemoving watchers...');
    watchers?.forEach((w) => w.close());
    configWatcher.close();
    log(chalk.green('Removing watchers Done.'));
  });
}
