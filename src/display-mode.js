const chalk = require('chalk');
const table = require('text-table');
const sortBy = require('lodash.sortby');
const logSymbols = require('log-symbols');
const helpers = require('./helpers');
const printError = helpers.printError;
const calcColoredStringLength = helpers.calcColoredStringLength;
const colorizeDiff = helpers.colorizeDiff;
const getSortKey = helpers.getSortKey;

const headers = [
  chalk.cyan.underline('package'),
  chalk.red.underline('current'),
  chalk.green.underline('latest'),
  ''
];

const displayMode = analysis => {
  const keys = Object.keys(analysis);

  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    const maybeNewLine = (i === 0 ? '' : '\n');
    const singleAnalysis = analysis[key];
    const depsExist = singleAnalysis && Object.keys(singleAnalysis).length > 0;

    if (!depsExist) {
      console.log(`${maybeNewLine}No ${key} found`); // eslint-disable-line no-console
      continue;
    }

    const packageNames = sortBy(Object.keys(singleAnalysis), packageName =>
      getSortKey(singleAnalysis[packageName])
    );
    const errors = packageNames.filter(packageName =>
      singleAnalysis[packageName].status === 'error'
    );
    const notLatest = packageNames.filter(packageName =>
      singleAnalysis[packageName].status === 'not-latest'
    );

    errors.forEach(packageName =>
      printError(singleAnalysis[packageName].error)
    );

    if (errors.length === 0 && notLatest.length === 0) {
      console.log(`${maybeNewLine}${key} ${logSymbols.success}`); // eslint-disable-line no-console
      continue;
    }

    if (notLatest.length === 0) {
      continue;
    }

    const rows = [headers].concat(notLatest.map(packageName => [
      packageName,
      singleAnalysis[packageName].current,
      singleAnalysis[packageName].latest,
      colorizeDiff(singleAnalysis[packageName].diff)
    ]));
    const tableStr = table(rows, { stringLength: calcColoredStringLength });

    console.log(`${maybeNewLine}${tableStr}`); // eslint-disable-line no-console
  }
};

module.exports = displayMode;
