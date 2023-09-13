import fs from 'fs';
import os from 'os';
import path from 'path';
import { safeJsonParse } from './utils';
import watch, { Watcher } from 'node-watch';

export const NPD_CONTEXT_DIR = path.resolve(
  os.homedir(),
  '.shopee-npm-package-dev-tool',
);

export const NPD_CONTEXT_PATH = `${NPD_CONTEXT_DIR}/link.json`;

class ConfigService {
  protected _config: Record<string, string[]> | null = null;

  protected _watchCloser: Watcher | null = null;

  public getConfig(force = false): Record<string, string[]> {
    if (!force && this._config) return this._config;

    if (!fs.existsSync(NPD_CONTEXT_DIR)) {
      fs.mkdirSync(NPD_CONTEXT_DIR);
      fs.writeFileSync(NPD_CONTEXT_PATH, JSON.stringify({}));
      this._config = {};
    } else {
      this._config = safeJsonParse(
        fs.readFileSync(NPD_CONTEXT_PATH, 'utf8'),
        {},
      ) as Record<string, string[]>;
    }

    return this._config;
  }

  public setConfig(config: Record<string, string[]>) {
    if (!fs.existsSync(NPD_CONTEXT_DIR)) {
      fs.mkdirSync(NPD_CONTEXT_DIR);
      fs.writeFileSync(NPD_CONTEXT_PATH, JSON.stringify({}));
      this._config = {};
    } else {
      fs.writeFileSync(NPD_CONTEXT_PATH, JSON.stringify(config), 'utf8');
      this._config = config;
    }
  }

  public startWatch(cb?: () => void) {
    this._watchCloser = watch(NPD_CONTEXT_DIR, { recursive: true }, () => {
      console.log('config file changed.');
      this.getConfig(true);
      cb && cb();
    });

    return this._watchCloser;
  }
}

export const configService = new ConfigService();
