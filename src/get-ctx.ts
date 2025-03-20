import fs from 'fs';
import os from 'os';
import path from 'path';

import { NptConfig } from './type';
import { safeJsonParse } from './utils';

export interface PackageInfo {
  rootPath: string;
  config: NptConfig;
  usedBy: string[];
}

export type Config = Record<string, PackageInfo>;

export const NPD_CONTEXT_DIR = path.resolve(
  os.homedir(),
  '.npm-package-dev-tool',
);

export const NPD_CONTEXT_PATH = `${NPD_CONTEXT_DIR}/link.json`;

const uniqMerge = (a: string[] = [], b: string[] = []) => [
  ...new Set([...a, ...b]),
];

class ConfigService {
  protected _config: Config | null = null;

  private initConfig() {
    fs.mkdirSync(NPD_CONTEXT_DIR);
    fs.writeFileSync(NPD_CONTEXT_PATH, JSON.stringify({}));
    this._config = {};
  }

  private compatibleForOldFormat(
    config: Record<string, PackageInfo | string[]>,
  ) {
    if (!Array.isArray(config[Object.keys(config)[0]])) {
      return config as Config;
    }

    return Object.keys(config).reduce((newConfig, pkgName) => {
      newConfig[pkgName] = {
        rootPath: '',
        config: {},
        usedBy: [...(config[pkgName] as string[])],
      };
      return newConfig;
    }, {} as Config);
  }

  public getConfig(force = false): Config {
    if (!force && this._config) return this._config;

    if (!fs.existsSync(NPD_CONTEXT_DIR)) {
      this.initConfig();
    } else {
      const config = safeJsonParse(
        fs.readFileSync(NPD_CONTEXT_PATH, 'utf8'),
        {},
      ) as Config;
      this._config = this.compatibleForOldFormat(config);
    }

    return this._config as Config;
  }

  public setConfig(config: Config) {
    if (!fs.existsSync(NPD_CONTEXT_DIR)) {
      this.initConfig();
    } else {
      fs.writeFileSync(
        NPD_CONTEXT_PATH,
        JSON.stringify(config, null, 2),
        'utf8',
      );
      this._config = config;
    }
  }

  public updateConfig(partialConfig: Config) {
    const config = { ...this.getConfig() };
    for (const pkgName of Object.keys(partialConfig)) {
      const configItem = partialConfig[pkgName];
      if (!config[pkgName]) {
        config[pkgName] = configItem;
        continue;
      }
      config[pkgName] = {
        rootPath: configItem.rootPath,
        config: configItem.config,
        usedBy: uniqMerge(config[pkgName].usedBy, configItem.usedBy),
      };
    }
    this.setConfig(config);
  }
}

export const configService = new ConfigService();
