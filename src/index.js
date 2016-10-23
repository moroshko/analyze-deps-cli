const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const minimist = require('minimist');
const fileExists = require('file-exists');
const analyzeDeps = require('analyze-deps');
const displayMode = require('./display-mode');
const interactiveMode = require('./interactive-mode');
const helpers = require('./helpers');
const printError = helpers.printError;

const printErrorAndExit = message => {
  printError(message);
  process.exit(1);
};

const args = minimist(process.argv);
const specifiedPackageJsonLocation = args.p;
const isInteractive = args.i;
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

const packageJsonRelativePath = path.relative(process.cwd(), packageJsonPath);

console.log(chalk.magenta(`Analyzing ${packageJsonRelativePath}\n`)); // eslint-disable-line no-console

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

analyzeDeps(packageJson)
  .then(analysis => isInteractive ?
    interactiveMode({
      analysis: analysis,
      packageJson: {
        content: packageJson,
        path: packageJsonPath,
        relativePath: packageJsonRelativePath,
        outputPath: args.o // For testing only
      }
    }) :
    displayMode(analysis)
  );
