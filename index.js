const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const table = require('text-table');
const minimist = require('minimist');
const stripAnsi = require('strip-ansi');
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
const calcColoredStringLength = str => stripAnsi(str).length;
const headers = [
  chalk.cyan.underline('package'),
  chalk.red.underline('current'),
  chalk.green.underline('latest'),
  ''
];

const getSortKey = analysis => {
  switch (analysis.diff) {
    case 'major': return 1;
    case 'minor': return 2;
    case 'patch': return 3;
    case 'premajor': return 4;
    case 'preminor': return 5;
    case 'prepatch': return 6;
    case 'prerelease': return 7;
    default: return 8;
  }
};

const diffColorMap = { // Traffic light here :)
  major: 'red',
  minor: 'yellow',
  patch: 'green'
};

const colorizeDiff = diff =>
  diffColorMap[diff] ? chalk[diffColorMap[diff]](diff) : diff;

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
