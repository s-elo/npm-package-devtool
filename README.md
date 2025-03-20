# Npm Package Dev Tool

A tool for developing npm package(s).

## Why

When developing npm packages locally, we usually use the `npm/yarn/pnpm link` feature to act as symlinked packages. However, this often brings some [constraints and problems](https://github.com/yarnpkg/yarn/issues/1761#issuecomment-259706202) like dependency resolution issues, symlink interoperability between file systems, etc. So you might try to copy the built packages to the place where you want to develop, which might be trouble-less but quite a hassle to do.

`spt` helps you auto copy the built packages to the target place based on the `file watcher` and the `relations among npm packages and the target repo` you want to develop.

There is a global config file `~/npm-package-dev-tool/link.json` used to store the relations among packages and target repos.

## Installation

```bash
$ npm -g install pnpm

$ pnpm add -g npm-package-devtool

# or clone the repo to your local to link
$ git clone git@github.com:s-elo/npm-package-devtool.git
$ cd npm-package-devtool
# install
$ pnpm install
#  build
$ pnpm build
# at repo root path
$ pnpm link -g

$ spt --version

# to unlink
$ pnpm uninstall -g npm-package-devtool
```

## Upgrade

make sure you have installed `pnpm`.

```bash
$ spt upgrade
```

## Quick Start

- `package repo`: repos of the packages you want to develop.
- `target repo`: repos to which you want to link the developed packages

1. **`spt dev -w "./esm,./dist" -s "tsc --watch && xxx --watch"` at the rootPath of package repo** to specify `watch` and `start` and select the packages you want to dev.

`watch` is the files/directories that you want to watch, `start` contains the commands you want to execute when developing. Take below config as an example, `tsc --watch` will watch your source code to rebuild the code to the `dist`, then we will watch the updates of `dist` and copy the updated files to the target repos.

or you can **config at the package.json at root path.**

```json
{
  "spt": {
    "watch": ["./dist"],
    "start": ["tsc --watch"],
  }
}
```

> Note that for monorepo, we will use the config at root package.json if no config is specified at the package.json of the corresponding package. You can add different config at the package.json of the corresponding package to overwrite the root config.

1. **`spt add` at the target repo**. select the packages that you want to add.

Now once you change the source code of the package, it should auto copy the updated content to the target repo.

To remove the effects, `spt remove` at the target repo to remove the added packages, and reinstall the `node_modules`.

## Commands

### List

Checkout the relations at the global config file.

```bash
$ spt list
{
  'package1': [],
  'package2': [ '/Users/xxx/xxx/xxx' ]
}
```

List all the target repo path of a package

```bash
$ spt list package1
/Users/xxx/xxx/xxx
```

List all the added packages of current target repo.

```bash
# at the target repo root path
$ spt list -c
package1
```

List all the linked packages

```bash
$ spt list -p
package1
package2
```

### Dev

Before using this function, you might need to add some config at the `package.json` of the corresponding npm package or **at the root path package.json**.

> For monorepo, we will use the config at a package.json of a specific package if specified, otherwise using the config of root package.json.

```json
{
  "spt": {
    "watch": ["./esm", "./dist"],
    "start": ["tsc --watch"],
  }
}
```

- `watch`: files/folders that need to be watched by spt, when they are updated, spt will copy the updated content to the related repos. `package.json` will always be watched. spt watches all the files of the package by default.
- `start`: command that needs to execute when developing; commands at the array execute sequentially; commands among different packages execute parallelly. 

```bash
# at the package(s) repo root path
$ spt dev
```

You can also narrow down the scanning path.

```bash
# only collect package names at ./packages folder for you to dev
$ spt dev ./packages
```

Selected packages at `spt dev` will be auto stored(linked) to the global config

### Add

Create a relation among linked packages with a target repo path, so that when the packages are updated, built code can be copied to the target repo.

```bash
# at the target repo root path
$ spt add
```

You can also specify the packages, concatenate with ','.

```bash
$ spt add package1,package2
```

### remove

Delete the relations among a target repo with its added packages.

```bash
# at the target repo root path
$ spt remove
```

You can also specify the packages, concatenate with ','.

```bash
$ spt remove package1,package2
```

## Develop

```bash
# at repo root path
$ pnpm link -g

$ pnpm dev
```

To unlink, run `pnpm uninstall -g npm-package-devtool`.

## Publish

```bash
$ pnpm release
```

For feature version, use the script to publish it at another branch.

```bash
$ pnpm version:feature
```
