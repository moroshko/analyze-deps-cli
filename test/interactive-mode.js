const fs = require('fs');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const execa = require('execa');
const stripAnsi = require('strip-ansi');

const outputPath = path.resolve(__dirname, 'temp-output.json');

const DOWN = '\u001b[B';

const getArguments = mockName => {
  let args = ['-i', '-o', outputPath];

  if (mockName !== null) {
    args = args.concat('-p', `./test/mocks/${mockName}`);
  }

  return args;
};

const expectSuccess = (mockName, input, output) =>
  expect(
    execa('./test/bin/deps', getArguments(mockName), input ? { input: input } : {})
      .then(result => ({
        output: stripAnsi(result.stdout).trim(),
        //   .replace(/\n\s+\n/g, '\n\n') // Ugly hacks here, but they save the day :)
        //   .replace(/\.\? Select dependencies to update in .*\n  \(Press <space> to select.*/g, '.'),
        newPackageJson: fs.readFileSync(outputPath, 'utf8'),
        exitCode: result.code
      }))
  ).to.eventually.become({
    output: output.trim(),
    exitCode: 0
  });

describe('interactive mode', function() {
  this.timeout(5000);

  it('should not change package.json when no packages are selected', () =>
    expectSuccess(null, `${DOWN} \n`, `
Analyzing package.json

? Select dependencies to update in package.json
  (Press <space> to select, <a> to toggle all, <i> to inverse selection)

   dependency          current        latest
❯◯ rxjs                5.0.0-beta.12  5.0.0-rc.1    prerelease

   devDependency       current        latest
 ◯ tslint              ^3.15.0-dev.0  3.15.1        prepatch
 ◯ semver              ^5.2.0         5.3.0         minor
 ◯ @types/jasmine      ^2.2.22-alpha  2.5.35        preminor
 ◯ selenium-webdriver  ^2.53.3        3.0.0-beta-3  premajor

 Press Space to select, Enter to finish, or ⌘-C to cancel.

Did not change package.json`
  ));
});
