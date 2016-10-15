const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const table = require('text-table');
const minimist = require('minimist');
const inquirer = require('inquirer');
const sortBy = require('lodash.sortby');
const fileExists = require('file-exists');
const logSymbols = require('log-symbols');
const analyzeDeps = require('analyze-deps');

const printError = message => {
  console.log(chalk.bgRed(`ERROR: ${message}`)); // eslint-disable-line no-console
};

const printErrorAndExit = message => {
  printError(message);
  process.exit(1);
};

const specifiedPackageJsonLocation = minimist(process.argv).p;
let packageJsonPath;

if (specifiedPackageJsonLocation) {
  packageJsonPath = path.resolve(specifiedPackageJsonLocation, 'package.json');

  if (!fileExists(packageJsonPath)) {
    printErrorAndExit(`${path.relative(process.cwd(), packageJsonPath)} doesn't exist`);
  }
} else {
  const findNearestFile = require('find-nearest-file');

  packageJsonPath = findNearestFile('package.json');

  if (packageJsonPath === null) {
    printErrorAndExit('Couldn\'t find package.json');
  }
}

console.log(chalk.magenta(`Analyzing ${path.relative(process.cwd(), packageJsonPath)}\n`)); // eslint-disable-line no-console

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const successChar = chalk.stripColor(logSymbols.success);

const calcColoredStringLength = str =>
  chalk.stripColor(str).endsWith(successChar) ? 0 : chalk.stripColor(str).length;

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

const diffColorMap = {
  patch: 'green',
  minor: 'yellow',
  major: 'red'
};

const colorizeDiff = diff =>
  diffColorMap[diff] ? chalk[diffColorMap[diff]](diff) : diff;

const showErrors = analysis => {
  let errorsCount = 0, notLatestExist = false, notLatest = {};

  for (let depKey in analysis) {
    const deps = analysis[depKey];

    notLatest[depKey] = notLatest[depKey] || {};

    for (let packageName in deps) {
      const packageAnalysis = deps[packageName];
      const status = packageAnalysis.status;

      if (status === 'error') {
        printError(packageAnalysis.error);
        errorsCount++;
      } else if (status === 'not-latest') {
        notLatest[depKey][packageName] = packageAnalysis;
        notLatestExist = true;
      }
    }
  }

  if (errorsCount > 0) {
    console.log(); // eslint-disable-line no-console
  }

  return {
    errorsCount: errorsCount,
    notLatestExist: notLatestExist,
    notLatest: notLatest
  };
};

const headerMap = {
  dependencies: 'dependency',
  devDependencies: 'devDependency'
};

const separator = str => new inquirer.Separator(chalk.reset(str));
const header = str => chalk.reset(str);
const successMessage = key => `${key} ${logSymbols.success}`;

const updatePackageJson = updates => {
  console.log(updates); // eslint-disable-line no-console
};

const showPrompt = data => {
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
      const packageName = rows[index][0];

      result.push({
        name: row,
        value: {
          key: keysMap[index],
          packageName: packageName
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
        console.log(chalk.magenta('\npackage.json didn\'t change')); // eslint-disable-line no-console
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

analyzeDeps(packageJson)
  .then(showErrors)
  .then(result => result.notLatestExist ? showPrompt(result) : showAllGood(result));

/*
const printAnalysis = analysis =>
  ['dependencies', 'devDependencies'].forEach(key => {
    const singleAnalysis = analysis[key];
    const depsExist = singleAnalysis && Object.keys(singleAnalysis).length > 0;

    if (!depsExist) {
      return;
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
      console.log(`\n${key} ${logSymbols.success}`); // eslint-disable-line no-console
      return;
    }

    if (notLatest.length === 0) {
      return;
    }

    const rows = [headers].concat(notLatest.map(packageName => [
      packageName,
      singleAnalysis[packageName].current,
      singleAnalysis[packageName].latest,
      colorizeDiff(singleAnalysis[packageName].diff)
    ]));
    const tableStr = table(rows, { stringLength: calcColoredStringLength });

    console.log(`\n${tableStr}`); // eslint-disable-line no-console
  });

analyzeDeps(packageJson).then(printAnalysis);
*/
