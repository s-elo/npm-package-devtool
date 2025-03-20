import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface CacheConfig {
  selectedPackages?: string[];
}

const cachePath = join(process.cwd(), 'node_modules', '.cache', 'npt');
const cacheFile = 'config.json';

export const saveConfig = (config: CacheConfig) => {
  const exists = existsSync(cachePath);
  if (!exists) {
    mkdirSync(cachePath, { recursive: true });
  }
  const existsConfig = loadConfig();
  const newConfig = Object.assign(existsConfig, config);
  writeFileSync(join(cachePath, cacheFile), JSON.stringify(newConfig), {
    encoding: 'utf-8',
  });
};

export const loadConfig = (): CacheConfig => {
  const p = join(cachePath, cacheFile);
  try {
    const content = readFileSync(p, { encoding: 'utf-8' });
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
};
