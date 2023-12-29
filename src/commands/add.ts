import { configService } from '../get-ctx';
import { ChoiceType } from '../type';
import { cwd, selector } from '../utils';
import { log } from 'node:console';

/**
 * add the packages to current repo to form the package-repo relations
 * @param packageNamesStr package names split with ","
 */
export async function add(packageNamesStr?: string) {
  const currentCwd = cwd();
  const nptConfig = configService.getConfig();
  const allPackages = Object.keys(nptConfig);
  const choices = allPackages
    .map((name) => {
      const check: ChoiceType[0] = {
        value: name,
        name,
        checked: false,
        disabled: false,
      };
      if (nptConfig[name].includes(currentCwd)) {
        check.checked = true;
        // currently enable to remove from add process.
        // check.disabled = 'Already added';
      }
      return check;
    }, [])
    // put added packages at the front
    .sort((a, b) => (!a.checked && b.checked ? 1 : -1));
  const packageNames =
    packageNamesStr?.split(',') ??
    (await selector({
      choices: choices,
      message: 'select the packages that you want to add',
    }));

  return addByNames(packageNames);
}

async function addByNames(packageNames: string[]) {
  if (!packageNames.length) return;

  const chalk = (await import('chalk')).default;

  const curPath = cwd();
  const pckInfo = configService.getConfig();

  // remove the non-added packages
  Object.keys(pckInfo).forEach((name) => {
    if (packageNames.includes(name)) return;

    pckInfo[name] = pckInfo[name].filter((p) => p !== curPath);
  });

  packageNames.forEach((name) => {
    if (!pckInfo[name]) {
      log(
        chalk.red(`package ${name} not found, please link the package first.`),
      );
      return;
    }

    if (!pckInfo[name].includes(curPath)) {
      pckInfo[name].push(curPath);
    }

    log(chalk.green(`package ${name} is added.`));
  });

  configService.setConfig(pckInfo);
}
