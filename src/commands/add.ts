import { configService } from '../get-ctx';
import { cwd, selector } from '../utils';
import { log } from 'node:console';

/**
 * add the packages to current repo to form the package-repo relations
 * @param packageNamesStr package names split with ","
 */
export async function add(packageNamesStr?: string) {
  const packageNames =
    packageNamesStr?.split(',') ??
    (await selector({
      choices: Object.keys(configService.getConfig()),
      message: 'select the packages that you want to add',
    }));

  return addByNames(packageNames);
}

async function addByNames(packageNames: string[]) {
  if (!packageNames.length) return;

  const chalk = (await import('chalk')).default;

  const pckInfo = configService.getConfig();
  packageNames.forEach((name) => {
    if (!pckInfo[name]) {
      log(
        chalk.red(`package ${name} not found, please link the package first.`),
      );
      return;
    }

    if (!pckInfo[name].includes(cwd())) {
      pckInfo[name].push(cwd());
    }

    log(chalk.green(`package ${name} is added.`));
  });

  configService.setConfig(pckInfo);
}
