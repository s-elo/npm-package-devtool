#!/usr/bin/env node
// @ts-check
import { program } from 'commander';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
);

program.version(packageJson.version);

program
  .command('dev')
  .description('develop npm package(s) of current repo.')
  .argument('[rootPath]', 'root path where to find packages')
  .action(async (rootPath) => {
    (await import('../dist/entries/index.js')).dev(rootPath);
  });

program
  .command('link')
  .description('link npm package(s) of current repo.')
  .argument('[rootPath]', 'root path where to find packages')
  .action(async (rootPath) => {
    (await import('../dist/entries/index.js')).link(rootPath);
  });

program
  .command('add')
  .description('add linked npm package(s) to current project.')
  .argument('[pckNames]', 'specify package names to add, split with ","')
  .action(async (pckNames) => {
    (await import('../dist/entries/index.js')).add(pckNames);
  });

program
  .command('list')
  .description('list linked packages or added path.')
  .argument('[pckName]', 'list all the added path of a linked package')
  .option(
    '-c, --current',
    'list all the packages that are added to current repo',
  )
  .option('-p, --packages', 'list all the packages that are linked')
  .action(async (pckName, { packages, current }) => {
    (await import('../dist/entries/index.js')).list(pckName, current, packages);
  });

program
  .command('remove')
  .description('remove the linked packages of current repo.')
  .argument('[pckNames]', 'specify package names to be removed, split with ","')
  .action(async (pckNames) => {
    (await import('../dist/entries/index.js')).remove(pckNames);
  });

program
  .command('unlink')
  .description('unlink packages.')
  .argument(
    '[pckNames]',
    'specify package names to be unlinked, split with ","',
  )
  .action(async (pckNames) => {
    (await import('../dist/entries/index.js')).unlink(pckNames);
  });

program.parse(process.argv).opts();
if (!program.args.length) {
  program.help();
}
