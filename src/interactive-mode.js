const chalk = require('chalk');
const table = require('text-table');
const sortBy = require('lodash.sortby');
const inquirer = require('inquirer');
const logSymbols = require('log-symbols');
const helpers = require('./helpers');
const printError = helpers.printError;
const calcColoredStringLength = helpers.calcColoredStringLength;
const colorizeDiff = helpers.colorizeDiff;
const getSortKey = helpers.getSortKey;

const separator = str => new inquirer.Separator(chalk.reset(str));
const header = str => chalk.reset(str);
const successMessage = key => `${key} ${logSymbols.success}`;

const updatePackageJson = updates => {
  console.log(updates); // eslint-disable-line no-console
  // const newPackageJson = updates.reduce((result, update) => {
  //   packageJson[]
  //   return result;
  // }, packageJson);

  // console.log(newPackageJson); // eslint-disable-line no-console
};

const headerMap = {
  dependencies: 'dependency',
  devDependencies: 'devDependency'
};

const showPrompt = (data, packageJsonRelativePath) => {
  const errorsCount = data.errorsCount;
  const notLatest = data.notLatest;
  let rows = [], headerIndices = {}, keysMap = [];

  for (let key in notLatest) {
    const deps = notLatest[key];
    const packageNames = Object.keys(deps);
    const head = packageNames.length === 0 ? [
      header(successMessage(key))
    ] : [
      header(chalk.cyan.underline.bold(headerMap[key])),
      header(chalk.red.underline.bold('current')),
      header(chalk.green.underline.bold('latest')),
      header('')
    ];
    const body = sortBy(packageNames, packageName => getSortKey(deps[packageName]))
      .map(packageName => {
        const analysis = deps[packageName];

        return [
          packageName,
          analysis.current,
          analysis.latest,
          colorizeDiff(analysis.diff)
        ];
      });

    headerIndices[rows.length] = true;
    keysMap = keysMap.concat('header', (new Array(body.length)).fill(key));
    rows = rows.concat([head], body);
  }

  const tableRows = table(rows, { stringLength: calcColoredStringLength });
  const choices = tableRows.split('\n').reduce((result, row, index) => {
    if (headerIndices[index]) {
      result.push(separator(' '));
      result.push(separator(`  ${row}`));
    } else {
      const key = keysMap[index];
      const packageName = rows[index][0];
      const analysis = notLatest[key][packageName];
      const latestRange = analysis.latestRange;

      result.push({
        name: row,
        value: {
          key: key,
          packageName: packageName,
          latestRange: latestRange
        },
        short: packageName // will be displayed once the selection is finished
      });
    }

    return result;
  }, []).concat(
    separator(' '),
    separator(`Press ${chalk.green('Space')} to select, ${chalk.green('Enter')} to finish, or ${chalk.green('⌘-C')} to cancel.`)
  );
  const question = {
    type: 'checkbox',
    message: 'Select dependencies to update in package.json\n\n ',
    name: 'updates',
    choices: choices,
    pageSize: process.stdout.rows - errorsCount - 4
  };

  return inquirer.prompt([question])
    .then(result => {
      if (result.updates.length === 0) {
        console.log(chalk.magenta(`\n${packageJsonRelativePath} didn't change`)); // eslint-disable-line no-console
      } else {
        updatePackageJson(result.updates);
      }
    });
};

const showAllGood = data => {
  const notLatest = data.notLatest;
  let first = true;

  for (let key in notLatest) {
    console.log(`${first ? '' : '\n'}${successMessage(key)}`); // eslint-disable-line no-console
    first = false;
  }
};

const showErrors = analysis => {
  let errorsCount = 0, notLatest = {}, notLatestExist = false;

  for (let key in analysis) {
    const deps = analysis[key];

    notLatest[key] = notLatest[key] || {};

    for (let packageName in deps) {
      const packageAnalysis = deps[packageName];
      const status = packageAnalysis.status;

      if (status === 'error') {
        printError(packageAnalysis.error);
        errorsCount++;
      } else if (status === 'not-latest') {
        notLatest[key][packageName] = packageAnalysis;
        notLatestExist = true;
      }
    }
  }

  if (errorsCount > 0) {
    console.log(); // eslint-disable-line no-console
  }

  return Promise.resolve({
    errorsCount: errorsCount,
    notLatest: notLatest,
    notLatestExist: notLatestExist
  });
};

const interactiveMode = data =>
  showErrors(data.analysis)
    .then(result => result.notLatestExist ?
      showPrompt(result, data.packageJsonRelativePath) :
      showAllGood(result)
    );

module.exports = interactiveMode;
