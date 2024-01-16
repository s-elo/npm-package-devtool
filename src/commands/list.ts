import { configService } from '../get-ctx';
import { cwd } from '../utils';
import { log } from 'node:console';

export function list(pckName?: string, isAll?: boolean, packages?: boolean) {
  const pckInfo = configService.getConfig();
  if (pckName) {
    return log((pckInfo[pckName] ?? []).join('\n'));
  }

  if (isAll) {
    return log(pckInfo);
  }

  if (packages) {
    return log(Object.keys(pckInfo).join('\n'));
  }

  const addedPackages: string[] = [];
  const curPath = cwd();

  Object.keys(pckInfo).forEach((pckName) => {
    if (pckInfo[pckName].includes(curPath)) {
      addedPackages.push(pckName);
    }
  });

  return log(
    addedPackages.length
      ? addedPackages.join('\n')
      : 'No added packages for this repo',
  );
}
