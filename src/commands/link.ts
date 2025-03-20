import { log } from 'node:console';

import { loadConfig, saveConfig } from '../cache-config';
import { configService } from '../get-ctx';
import { ChoiceType } from '../type';
import { getPackages, selector, sortPackages } from '../utils';

/**
 * add the chosen packages to the npd context info store
 * @param rootPath path where to find the packages to link
 */
export async function link(rootPath = '', isDev = false) {
  const chalk = (await import('chalk')).default;

  const packages = getPackages(rootPath);
  if (!packages?.length) {
    log(chalk.yellow('No Packages Found.'));
    process.exit(1);
  }

  const pckInfo = configService.getConfig();
  const cacheConfig = loadConfig();
  let allPckNames = isDev
    ? packages.map((p) => ({
        value: p.name,
        name: p.name,
        checked: Boolean(cacheConfig.selectedPackages?.includes(p.name)),
        disabled: false,
      }))
    : packages?.map((p) => {
        const check: ChoiceType[0] = {
          value: p.name,
          name: p.name,
          checked: false,
          disabled: false,
        };
        if (pckInfo[p.name]) {
          check.checked = true;
          check.disabled = 'Already Linked';
        }
        return check;
      });
  // put linked packages at the front
  allPckNames = allPckNames.sort(sortPackages);
  const packageNames = await selector({
    choices: allPckNames,
    message: 'choose the packages you want to develop',
  });
  const selectedPackages = packages?.filter((p) =>
    packageNames.includes(p.name),
  );
  if (!selectedPackages?.length) return [];

  log(chalk.gray(`Linking packages: ${packageNames.join(',')}...`));
  selectedPackages.forEach((pkg) => {
    pckInfo[pkg.name] = pckInfo[pkg.name] || {
      rootPath: pkg.rootPath,
      config: pkg.config,
      usedBy: [],
    };
  });
  configService.setConfig(pckInfo);
  saveConfig({ selectedPackages: selectedPackages.map((p) => p.name) });
  log(chalk.green('Linking packages Done.'));

  return selectedPackages;
}
