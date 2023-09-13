# Npm Package Dev Tool(NPT)

A tool for developing npm package(s).

## Why

When developing npm packages locally, we usually use the `npm/yarn/pnpm link` feature to act as symlinked packages. However, this often brings some [constraints and problems](https://github.com/yarnpkg/yarn/issues/1761#issuecomment-259706202) like dependency resolution issues, symlink interoperability between file systems, etc. So you might try to copy the built packages to the place where you want to develop, which might be trouble-less but quite a hassle to do.

`NPT` helps you auto copy the built packages to the target place based on the `file watcher` and the `relations among npm packages and the target repo` you want to develop.

There is a global config file `~/shopee-npm-package-dev-tool/link.json` used to store the relations among packages and target repos.

## Installation

```bash
$ pnpm add -g @shopee/npm-devtool

# or clone the repo to your local to link
$ git clone gitlab@git.garena.com:shopee/seller-fe/tech/platform-tech/npm-package-devtool.git
#  build
$ pnpm build
# at repo root path
$ pnpm link

$ npt --version
```

## Quick Start

- `package repo`: repos of the packages you want to develop.
- `target repo`: repos to which you want to link the developed packages

1. **config at the package.json at root path.** `watch` is the files/directories that you want to watch, `start` contains the commands you want to execute when developing. Take below config as an example, `yarn build:esm --watch` will watch your source code to rebuild the code to the `dist`, then we will watch the updates of `dist` and copy the updated files to the target repos.

```json
{
  "npt": {
    "watch": ["./dist"],
    "start": ["yarn build:esm --watch"],
  }
}
```

> Note that for monorepo, we will use the config at root package.json if no config is specified at the package.json of the corresponding package. You can add different config at the package.json of the corresponding package to overwrite the root config.

2. **`npt dev` at the rootPath of package repo**. select the packages you want to dev.
3. **`npt add` at the target repo**. select the packages that you want to add.

Now once you change the source code of the package, it should auto copy the updated content to the target repo.

To remove the effects, `npt remove` at the target repo to remove the added packages, and reinstall the `node_modules`.

## Commands

### List

Checkout the relations at the global config file.

```bash
$ npt list
{
  '@seller/seller-notification': [],
  '@seller-portal/core': [ '/Users/xxx/xxx/xxx' ]
}
```

List all the target repo path of a package

```bash
$ npt list package1
/Users/xxx/xxx/xxx
```

List all the added packages of current target repo.

```bash
# at the target repo root path
$ npt list -c
@seller-portal/core
```

List all the linked packages

```bash
$ npt list -p
@seller/seller-notification
@seller-portal/core
```

### Dev

Before using this function, you might need to add some config at the `package.json` of the corresponding npm package or **at the root path package.json**.

> For monorepo, we will use the config at a package.json of a specific package if specified, otherwise using the config of root package.json.

```json
{
  "npt": {
    "watch": ["./esm", "./dist"],
    "start": ["tsc --watch"],
  }
}
```

- `watch`: files/folders that need to be watched by npt, when they are updated, npt will copy the updated content to the related repos. `package.json` will always be watched. npt watches all the files of the package by default.
- `start`: command that needs to execute when developing; commands at the array execute sequentially; commands among different packages execute parallelly. 

```bash
# at the package(s) repo root path
$ npt dev
```

You can also narrow down the scanning path.

```bash
# only collect package names at ./packages folder for you to dev
$ npt dev ./packages
```

Selected packages at `npt dev` will be auto stored(linked) to the global config

### Link

Store the package names at current repo to the global config.

```bash
# at the package(s) repo root path
$ npt link
```

It will scan the repo to collect all the package names for you to select.

You can also narrow down the scanning path.

```bash
# only collect package names at ./packages folder
$ npt link ./packages
```

### Unlink

Delete packages stored at the global config. Note that it will also delete all the relations with target repos of the packages.

```bash
$ npt unlink
```

You can also specify the packages, concatenate with ','.

```bash
$ npt unlink package1,package2
```

### Add

Create a relation among linked packages with a target repo path, so that when the packages are updated, built code can be copied to the target repo.

```bash
# at the target repo root path
$ npt add
```

You can also specify the packages, concatenate with ','.

```bash
$ npt add package1,package2
```

### remove

Delete the relations among a target repo with its added packages.

```bash
# at the target repo root path
$ npt remove
```

You can also specify the packages, concatenate with ','.

```bash
$ npt remove package1,package2
```

## Develop

```bash
$ pnpm dev
```

## Publish

```bash
$ pnpm release
```

For feature version, use the script to publish it at another branch.

```bash
$ pnpm version:feature
```
