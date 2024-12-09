import { log, warn } from 'node:console';
import chalk from 'chalk';
import copy from 'recursive-copy';

import { configService, PackageInfo } from '../get-ctx';
import { ChoiceType } from '../type';
import { cwd, findAllPackageDestPaths, selector, sortPackages } from '../utils';

/**
 * add the packages to current repo to form the package-repo relations
 * @param packageNamesStr package names split with ","
 */
export async function add(
  packageNamesStr?: string,
  { filter }: { filter?: string } = {},
) {
  const currentCwd = cwd();
  const nptConfig = configService.getConfig();
  let allPackages = Object.keys(nptConfig);
  if (filter) {
    const filterRe = new RegExp(filter);
    allPackages = allPackages.filter((pkgName) => filterRe.test(pkgName));
  }
  const choices = allPackages
    .map((name) => {
      const check: ChoiceType[0] = {
        value: name,
        name,
        checked: false,
        disabled: false,
      };
      if (nptConfig[name].usedBy.includes(currentCwd)) {
        check.checked = true;
        // currently enable to remove from add process.
        // check.disabled = 'Already added';
      }
      return check;
    }, [])
    .sort(sortPackages);
  const packageNames =
    packageNamesStr?.split(',') ??
    (await selector({
      choices: choices,
      message: 'select the packages that you want to add',
    }));

  addByNames(packageNames);
}

const copyPackage = (
  pkgName: string,
  { rootPath, config }: PackageInfo,
  destPath: string,
) => {
  if (!config.watch?.length) {
    warn(`Can not found watch dir of ${pkgName}`);
    return;
  }
  const destPaths = findAllPackageDestPaths(destPath, pkgName);

  for (const dest of destPaths) {
    log(chalk.gray(`Copying ${pkgName} to ${dest}...`));
    copy(rootPath, dest, {
      overwrite: true,
      filter(path) {
        const fullPath = `${rootPath}/${path}`;
        if (path === 'package.json') {
          console.log('cp', fullPath);
          return true;
        }

        const matched = (config.watch || []).some((watchDir) =>
          fullPath.startsWith(watchDir),
        );
        if (matched) {
          console.log('cp', fullPath);
        }
        return matched;
      },
    });
  }
};

function addByNames(packageNames: string[]) {
  if (!packageNames.length) return;

  const curPath = cwd();
  const pkgInfos = configService.getConfig();

  // remove the non-added packages
  Object.keys(pkgInfos).forEach((name) => {
    if (packageNames.includes(name)) return;

    pkgInfos[name].usedBy = pkgInfos[name].usedBy.filter((p) => p !== curPath);
  });

  packageNames.forEach((name) => {
    const pkgInfo = pkgInfos[name];
    if (!pkgInfo) {
      log(
        chalk.red(`package ${name} not found, please add the package first.`),
      );
      return;
    }
    copyPackage(name, pkgInfo, cwd());
    if (!pkgInfos[name].usedBy.includes(curPath)) {
      pkgInfos[name].usedBy.push(curPath);
    }

    log(chalk.green(`package ${name} is added.`));
  });

  configService.setConfig(pkgInfos);
}
