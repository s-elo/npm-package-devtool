# Npm Package Dev Tool(NPD)

A tool for developing npm package(s).

## Why

When developing npm packages locally, we usually use the `npm/yarn/pnpm link` feature to act as symlinked packages. However, this often brings some [constraints and problems](https://github.com/yarnpkg/yarn/issues/1761#issuecomment-259706202) like dependency resolution issues, symlink interoperability between file systems, etc. So you might try to copy the built packages to the place where you want to develop, which might be trouble-less but quite a hassle to do.

`NPD` helps you auto copy the built packages to the target place based on the `file watcher` and the `relations among npm packages and the target repo` you want to develop.

## Installation

```bash
$ yarn/pnpm add -g @shopee/npm-devtool

# or clone the repo to your local to link
$ git clone gitlab@git.garena.com:shopee/seller-fe/tech/platform-tech/npm-package-devtool.git
#  build
$ pnpm build
# at repo root path
$ yarn/pnpm link

$ npd --version
```

## Usage

There is a global config file `~/shopee-npm-package-dev-tool/link.json` used to store the relations among packages and target repos.

### List

Checkout the relations at the global config file.

```bash
$ npd list
{
  '@seller/seller-notification': [],
  '@seller-portal/core': [ '/Users/xxx/xxx/xxx' ]
}
```

List all the target repo path of a package

```bash
$ npd list package1
/Users/xxx/xxx/xxx
```

List all the added packages of current target repo.

```bash
# at the target repo root path
$ npd list -c
@seller-portal/core
```

List all the linked packages

```bash
$ npd list -p
@seller/seller-notification
@seller-portal/core
```

### Dev

Before using this function, you might need to add some config at the `package.json` of the corresponding npm package.

```json
{
  "npd": {
    "watch": ["./esm", "./dist"],
    "start": ["tsc --watch"],
  }
}
```

- `watch`: files/folders that need to be watched by NPD, when they are updated, NPD will copy the package content to the related repos. NPD watches all the files of the package by default.
- `start`: command that needs to execute when developing; commands at the array execute sequentially; commands among different packages execute parallelly. 

```bash
# at the repo root path
$ npd dev
```

You can also narrow down the scanning path.

```bash
# only collect package names at ./packages folder for you to dev
$ npd dev ./packages
```

Selected packages at `npd dev` will be auto stored(linked) to the global config

### Link

Store the package names at current repo to the global config.

```bash
# at a repo root path
$ npd link
```

It will scan the repo to collect all the package names for you to select.

You can also narrow down the scanning path.

```bash
# only collect package names at ./packages folder
$ npd link ./packages
```

### Unlink

Delete packages stored at the global config. Note that it will also delete all the relations with target repos of the packages.

```bash
$ npd unlink
```

You can also specify the packages, concatenate with ','.

```bash
$ npd unlink package1,package2
```

### Add

Create a relation among linked packages with a target repo path, so that when the packages are updated, built code can be copied to the target repo.

```bash
# at the target repo root path
$ npd add
```

You can also specify the packages, concatenate with ','.

```bash
$ npd add package1,package2
```

### remove

Delete the relations among a target repo with its added packages.

```bash
# at the target repo root path
$ npd remove
```

You can also specify the packages, concatenate with ','.

```bash
$ npd remove package1,package2
```
