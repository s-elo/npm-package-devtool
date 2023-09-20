import { configService } from '../get-ctx';
import { confirm, selector } from '../utils';
import { log } from 'node:console';

export async function unlink(packageNamesStr: string) {
  const chalk = (await import('chalk')).default;

  const pckInfo = configService.getConfig();
  const packageNames =
    packageNamesStr?.split(',') ??
    (await selector({
      choices: Object.keys(pckInfo),
      message: 'select the packages that you want to unlink',
    }));

  if (!packageNames.length) return;

  const isConfirm = await confirm(
    'Are you sure to unlink the packages? This will remove all the relations with the packages. you might want to "npd list <packageName>" to checkout the replated repo path and go to the corresponding path to "npd remove <packageName>"',
  );
  if (!isConfirm) return;

  packageNames.forEach((name) => {
    delete pckInfo[name];
    log(chalk.green(`package ${name} is unlinked.`));
  });

  configService.setConfig(pckInfo);
}
