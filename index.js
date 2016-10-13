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

console.log(chalk.magenta(`Analyzing ${path.relative(process.cwd(), packageJsonPath)}`)); // eslint-disable-line no-console

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const calcColoredStringLength = str => chalk.stripColor(str).length;

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
  let notLatest = {};

  for (let depKey in analysis) {
    const deps = analysis[depKey];

    notLatest[depKey] = notLatest[depKey] || {};

    for (let packageName in deps) {
      const packageAnalysis = deps[packageName];
      const status = packageAnalysis.status;

      if (status === 'error') {
        printError(packageAnalysis.error);
      } else if (status === 'not-latest') {
        notLatest[depKey][packageName] = packageAnalysis;
      }
    }
  }

  return notLatest;
};

const headerMap = {
  dependencies: 'dep',
  devDependencies: 'devDep'
};

const showPrompt = notLatest => {
  let rows = [], headerIndices = {};

  for (let key in notLatest) {
    const deps = notLatest[key];
    const header = [
      chalk.reset(chalk.cyan.underline.bold(headerMap[key])),
      chalk.reset(chalk.red.underline.bold('current')),
      chalk.reset(chalk.green.underline.bold('latest')),
      ''
    ];
    const body = sortBy(Object.keys(deps), packageName => getSortKey(deps[packageName]))
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
    rows = rows.concat([header], body);
  }

  rows = table(rows, { stringLength: calcColoredStringLength });

  const choices = rows.split('\n').map((row, index) => {
    if (headerIndices[index]) {
      return new inquirer.Separator(`  ${row}`);
    }

    return {
      name: row,
      value: {
        key: 'todo',
        packageName: 'todo'
      },
      short: 'todo'
    };
  });
  const question = {
    type: 'checkbox',
    message: 'Select packages to update',
    name: 'updates',
    choices: choices
  };

  return inquirer.prompt([question]);
};

const updatePackageJson = selection => {
  return selection;
};

analyzeDeps(packageJson)
  .then(showErrors)
  .then(showPrompt)
  .then(updatePackageJson);

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
