import { log } from 'node:console';
import { inspect } from 'node:util';

import { configService } from '../get-ctx';
import { cwd } from '../utils';

export function list(pckName?: string, isAll?: boolean, packages?: boolean) {
  const pckInfo = configService.getConfig();
  if (pckName) {
    const result = (pckInfo[pckName]?.usedBy ?? []).sort().join('\n');
    return log(result || `package ${pckName} not found`);
  }

  if (isAll) {
    return log(inspect(pckInfo, false, null, true));
  }

  if (packages) {
    return log(Object.keys(pckInfo).sort().join('\n'));
  }

  const addedPackages: string[] = [];
  const curPath = cwd();

  Object.keys(pckInfo).forEach((pckName) => {
    if (pckInfo[pckName].usedBy.includes(curPath)) {
      addedPackages.push(pckName);
    }
  });

  return log(
    addedPackages.length
      ? addedPackages.sort().join('\n')
      : 'No added packages for this repo',
  );
}
