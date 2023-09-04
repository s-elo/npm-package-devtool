import { configService } from '../get-ctx';
import { getPackages, selector } from '../utils';
import { log } from 'node:console';

/**
 * add the chosen packages to the npd context info store
 * @param rootPath path where to find the packages to link
 */
export async function link(rootPath = '') {
  const chalk = (await import('chalk')).default;

  const packages = getPackages(rootPath);
  if (!packages?.length) {
    log(chalk.yellow('No Packages Found.'));
    process.exit(1);
  }

  const packageNames = await selector({
    choices: packages?.map((p) => p.name),
    message: 'choose the packages you want to develop',
  });
  const selectedPackages = packages?.filter((p) => packageNames.includes(p.name));
  if (!selectedPackages?.length) return [];

  log(chalk.gray(`Linking packages: ${packageNames.join(',')}...`));
  const pckInfo = configService.getConfig();
  selectedPackages.forEach((pck) => {
    pckInfo[pck.name] = pckInfo[pck.name] || [];
  });
  configService.setConfig(pckInfo);
  log(chalk.green('Linking packages Done.'));

  return selectedPackages;
}
