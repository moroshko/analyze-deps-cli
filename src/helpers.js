const stripAnsi = require('strip-ansi');
const chalk = require('chalk');
const logSymbols = require('log-symbols');

const printError = message => {
  console.log(chalk.bgRed(`ERROR: ${message}`)); // eslint-disable-line no-console
};

const successChar = stripAnsi(logSymbols.success);

const calcColoredStringLength = str => {
  const rawStr = stripAnsi(str);

  // These messages should not influence the layout of the table:
  //   devDependencies ✔
  //   No devDependencies found
  return rawStr.endsWith(successChar) || rawStr.endsWith(' found') ? 0 : stripAnsi(str).length;
};

const diffColorMap = {
  patch: 'green',
  minor: 'yellow',
  major: 'red'
};

const colorizeDiff = diff =>
  diffColorMap[diff] ? chalk[diffColorMap[diff]](diff) : (diff || '');

const getSortKey = analysis => {
  switch (analysis.diff) {
    case 'patch': return 1;
    case 'prepatch': return 2;
    case 'minor': return 3;
    case 'preminor': return 4;
    case 'major': return 5;
    case 'premajor': return 6;
    case 'prerelease': return 7;
    default: return 8;
  }
};

const headerMap = {
  dependencies: 'dependency',
  devDependencies: 'devDependency'
};

module.exports = {
  printError: printError,
  calcColoredStringLength: calcColoredStringLength,
  colorizeDiff: colorizeDiff,
  getSortKey: getSortKey,
  headerMap: headerMap
};
