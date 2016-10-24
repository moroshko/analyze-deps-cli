const chalk = require('chalk');
const table = require('text-table');
const sortBy = require('lodash.sortby');
const logSymbols = require('log-symbols');
const helpers = require('./helpers');
const printError = helpers.printError;
const calcColoredStringLength = helpers.calcColoredStringLength;
const colorizeDiff = helpers.colorizeDiff;
const getSortKey = helpers.getSortKey;
const headerMap = helpers.headerMap;

const displayMode = analysis => {
  const keys = Object.keys(analysis);
  let rows = [];

  const addEmptyLine = () => {
    rows = rows.concat([['']]);
  };

  const addMessage = message => {
    if (rows.length > 0) {
      addEmptyLine();
    }

    rows = rows.concat([[message]]);
  };

  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    const singleAnalysis = analysis[key];
    const depsExist = singleAnalysis && Object.keys(singleAnalysis).length > 0;

    if (!depsExist) {
      addMessage(`No ${key} found`);
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
      addMessage(`${key} ${logSymbols.success}`);
      continue;
    }

    if (notLatest.length === 0) {
      continue;
    }

    const head = [
      chalk.cyan.underline(headerMap[key]),
      chalk.red.underline('current'),
      chalk.green.underline('latest'),
      ''
    ];
    const body = notLatest.map(packageName => [
      packageName,
      singleAnalysis[packageName].current,
      singleAnalysis[packageName].latest,
      colorizeDiff(singleAnalysis[packageName].diff)
    ]);

    if (i > 0) {
      addEmptyLine();
    }

    rows = rows.concat([head], body);
  }

  const tableStr = table(rows, { stringLength: calcColoredStringLength });

  console.log(tableStr); // eslint-disable-line no-console
};

module.exports = displayMode;
