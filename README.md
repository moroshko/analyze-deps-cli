[![Build Status](https://img.shields.io/codeship/57c45940-71a4-0134-fc58-4aa32a10a3f8/master.svg?style=flat-square)](https://codeship.com/projects/178400)
[![Coverage Status](https://img.shields.io/codecov/c/github/moroshko/analyze-deps-cli/master.svg?style=flat-square)](https://codecov.io/gh/moroshko/analyze-deps-cli)
[![bitHound Overall Score](https://www.bithound.io/github/moroshko/analyze-deps-cli/badges/score.svg)](https://www.bithound.io/github/moroshko/analyze-deps-cli)
[![npm Version](https://img.shields.io/npm/v/analyze-deps-cli.svg?style=flat-square)](https://npmjs.org/package/analyze-deps-cli)

# Analyze Deps CLI

Compare dependencies in package.json to the latest available versions.

## Installation

```shell
npm install -g analyze-deps-cli
```

## Usage

```shell
deps
```

![deps output](deps-output.png)

## Description

`deps` simply outputs the packages which version range specified in `package.json` can be updated to include the latest version only.

By default, `deps` will analyze `package.json` found in `./`, the directory where `deps` is run. If not found, it will try `../`, then `../../` and so on.

You can also specify the `package.json` location like this:

```shell
deps -p some/other/location
```

## Related

* [analyze-deps](https://github.com/moroshko/analyze-deps) - API for this module

## License

[MIT](http://moroshko.mit-license.org)
