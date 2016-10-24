const fs = require('fs');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const execa = require('execa');
const rimraf = require('rimraf');
const stripAnsi = require('strip-ansi');

const DOWN = '\u001b[B';
const SPACE = ' ';
const ENTER = '\n';

const outputPath = path.resolve(__dirname, 'temp-output.json');

const getArguments = mockName => {
  let args = ['-i', '-o', outputPath];

  if (mockName !== null) {
    args = args.concat('-p', `./test/mocks/${mockName}`);
  }

  return args;
};

const expectSuccess = (mockName, input, expectedOutput, expectedNewPackageJson) => {
  let expectedResult = {
    newPackageJson: expectedNewPackageJson === null ? null : expectedNewPackageJson.replace(/^\s+/, ''), // Same as .trimLeft() which doesn't seem to be widely supported yet
    exitCode: 0
  };

  if (expectedOutput !== null) {
    expectedResult.output = expectedOutput.trim();
  }

  return expect(
    execa('./test/bin/deps', getArguments(mockName), input ? { input: input.join('') } : {})
      .then(execaResult => {
        let result = {
          exitCode: execaResult.code
        };

        if (expectedOutput !== null) {
          result.output = stripAnsi(execaResult.stdout).trim()
            // Because .editorconfig trims empty lines
            .replace(/\n\s+\n/g, '\n\n')
            // Ugly hack, but it saves the day :)
            .replace(/\.\? Select dependencies to update in .*\n {2}(\(Press <space> to select, <a> to toggle all, <i> to inverse selection\))?/g, '.');
        }

        try {
          result.newPackageJson = fs.readFileSync(outputPath, 'utf8');
        } catch (error) {
          result.newPackageJson = null;
        }

        return result;
      })
  ).to.eventually.become(expectedResult);
};

describe('interactive mode', function() {
  this.timeout(3000);

  beforeEach(done => rimraf(outputPath, {}, done));

  it('should not change package.json when no packages are selected', () =>
    expectSuccess(null, [ENTER], `
Analyzing test/mocks/default/package.json

ERROR: I don't know how to update \`rxjs\` range 5.0.0-beta.12 to include only the latest version 5.0.0-rc.1.
ERROR: I don't know how to update \`selenium-webdriver\` range ^2.53.3 to include only the latest version 3.0.0-beta-3.

? Select dependencies to update in package.json
  (Press <space> to select, <a> to toggle all, <i> to inverse selection)

   dependencies ✔

   devDependency   current        latest
❯◯ tslint          ^3.15.0-dev.0  3.15.1  prepatch
 ◯ semver          ^5.2.0         5.3.0   minor
 ◯ @types/jasmine  ^2.2.22-alpha  2.5.35  preminor

 Press Space to select, Enter to finish, or Control-C to cancel.

Did not change test/mocks/default/package.json`,
      null
    )
  );

  it('should update the selected packages in package.json', () =>
    expectSuccess('has-latest', [SPACE, DOWN, DOWN, SPACE, ENTER], null, `
{
  "name": "has-latest",
  "dependencies": {
    "lodash.mapvalues": "^4.6.0",
    "package-json": "^1.2.0",
    "promise-all": "^1.0.0",
    "semver": "^5.3.0"
  },
  "devDependencies": {
    "eslint": "^3.7.1"
  }
}
`
    )
  );

  it('should output that everything is ok when all packages are up to date', () =>
    expectSuccess('all-latest', null, `
Analyzing test/mocks/all-latest/package.json

dependencies ✔

devDependencies ✔`,
      null
    )
  );
});
