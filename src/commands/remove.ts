import { configService } from '../get-ctx';
import { cwd, selector } from '../utils';
import { log } from 'node:console';

export async function remove(packageNamesStr: string) {
  const chalk = (await import('chalk')).default;

  const pckInfo = configService.getConfig();
  const relatedPackages = Object.keys(pckInfo).reduce<string[]>((ret, name) => {
    if (pckInfo[name].usedBy.includes(cwd())) {
      ret.push(name);
    }
    return ret;
  }, []);
  if (!relatedPackages.length) {
    return log('no packages are added.');
  }
  const packageNames =
    packageNamesStr?.split(',') ??
    (await selector({
      choices: relatedPackages,
      message: 'select the packages that you want to remove from this repo',
    }));

  packageNames.forEach((name) => {
    const idx = (pckInfo[name].usedBy ?? []).findIndex((p) => p === cwd());

    if (idx === -1) {
      log(chalk.red(`package ${name} not exists.`));
      return;
    }

    pckInfo[name].usedBy.splice(idx, 1);
    log(chalk.green(`package ${name} is removed.`));
  });

  configService.setConfig(pckInfo);

  log(chalk.yellow('you might need to reinstall the node_modules.'));
}
