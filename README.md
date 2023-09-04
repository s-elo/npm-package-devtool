# Npm Package Dev Tool(NPD)

A tool for developing npm package(s).

## Why

When developing npm packages locally, we usually use the `npm/yarn/pnpm link` feature to act as symlinked packages. However, this often brings some [constraints and problems](https://github.com/yarnpkg/yarn/issues/1761#issuecomment-259706202) like dependency resolution issues, symlink interoperability between file systems, etc. So you might try to copy the built packages to the place where you want to develop, which might be trouble-less but quite a hassle to do.

`NPD` helps you auto copy the built packages to the target place based on the `file watcher` and the `relations among npm packages and the target repo` you want to develop.

## Installation

## Usage

### Link

Store the package names to the global config.

