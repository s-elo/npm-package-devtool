#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { program } = require('commander');
const { resolve } = require('node:path');
const fs = require('fs');
const { execSync } = require('node:child_process');

const packageJson = JSON.parse(
  fs.readFileSync(resolve(__dirname, '../package.json'), 'utf8'),
);

program.version(packageJson.version);

program
  .command('dev')
  .description('develop npm package(s) of current repo.')
  .argument('[rootPath]', 'root path where to find packages')
  .option(
    '-w, --watch <string>',
    'specify watch files/dir, use "," to separate',
  )
  .option('-s, --start <string>', 'specify dev commands')
  .action(async (rootPath, { watch, start }) => {
    global.NPT_CURRENT_WATCH_PATH = watch;
    global.NPT_CURRENT_START_PATH = start;
    require('../dist/index.js').dev(rootPath);
  });

// program
//   .command('link')
//   .description('link npm package(s) of current repo.')
//   .argument('[rootPath]', 'root path where to find packages')
//   .action(async (rootPath) => {
//     require('../dist/index.js').link(rootPath);
//   });

program
  .command('add')
  .description('add linked npm package(s) to current project.')
  .argument('[pckNames]', 'specify package names to add, split with ","')
  .action(async (pckNames) => {
    require('../dist/index.js').add(pckNames);
  });

program
  .command('list')
  .description('list linked packages or added path.')
  .argument('[pckName]', 'list all the added path of a linked package')
  .option('-a, --all', 'list all the relations')
  .option('-p, --packages', 'list all the packages that are linked')
  .action(async (pckName, { packages, all }) => {
    require('../dist/index.js').list(pckName, all, packages);
  });

program
  .command('remove')
  .description('remove the linked packages of current repo.')
  .argument('[pckNames]', 'specify package names to be removed, split with ","')
  .action(async (pckNames) => {
    require('../dist/index.js').remove(pckNames);
  });

// program
//   .command('unlink')
//   .description('unlink packages.')
//   .argument(
//     '[pckNames]',
//     'specify package names to be unlinked, split with ","',
//   )
//   .action(async (pckNames) => {
//     require('../dist/index.js').unlink(pckNames);
//   });

program
  .command('upgrade')
  .description('upgrade to latest version.')
  .action(() => {
    execSync(
      'pnpm --registry https://npm.shopee.io/ install -g && pnpm --registry https://npm.shopee.io/ install -g @shopee/npm-devtool@latest && pnpm install -g',
      { stdio: 'inherit' },
    );
  });

program.parse(process.argv).opts();
if (!program.args.length) {
  program.help();
}
