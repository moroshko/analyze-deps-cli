const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const execa = require('execa');

chai.use(chaiAsPromised);

const getArguments = mockName =>
  mockName ? ['-p', `./test/mocks/${mockName}`] : [];

const expectSuccess = (mockName, output) =>
  expect(
    execa('./test/bin/deps', getArguments(mockName))
      .then(result => ({
        output: result.stdout.trim(),
        exitCode: result.code
      }))
  ).to.eventually.become({
    output: output.trim(),
    exitCode: 0
  });

const expectError = (mockName, output) =>
  expect(
    execa('./test/bin/deps', getArguments(mockName))
      .catch(error => ({
        output: error.stdout.trim(),
        exitCode: error.code
      }))
  ).to.eventually.become({
    output: output.trim(),
    exitCode: 1
  });

describe('analyse-deps-cli', () => {
  it('should output an error if there is no package.json in the specified location', () =>
    expectError('no-package-json', `
ERROR: test/mocks/no-package-json/package.json doesn't exist`
  ));

  it('should find and analyse package.json', () =>
    expectSuccess(null, `
Analyzing package.json

package  current        latest
rxjs     5.0.0-beta.12  5.0.0-rc.1  prerelease

package             current        latest
semver              ^5.2.0         5.3.0         minor
selenium-webdriver  ^2.53.3        3.0.0-beta-3  premajor
@types/jasmine      ^2.2.22-alpha  2.5.35        preminor
tslint              ^3.15.0-dev.0  3.15.1        prepatch`
  ));

  it('should not output up to date packages', () =>
    expectSuccess('has-latest', `
Analyzing test/mocks/has-latest/package.json

package       current  latest
package-json  ^1.2.0   2.4.0   major
semver        ^5.2.0   5.3.0   minor

package  current  latest
eslint   ^3.7.0   3.7.1   patch`
  ));

  it('should not analyze devDependencies if they do not exist', () =>
    expectSuccess('only-dependencies', `
Analyzing test/mocks/only-dependencies/package.json

package       current  latest
package-json  1.2.0    2.4.0   major
semver        ~5.2.0   5.3.0   minor`
  ));

  it('should output that everything is ok when all packages are up to date', () =>
    expectSuccess('all-latest', `
Analyzing test/mocks/all-latest/package.json

dependencies ✔

devDependencies ✔`
  ));

  it('should output an error when package range is invalid', () =>
    expectSuccess('error', `
Analyzing test/mocks/error/package.json
ERROR: Package \`semver\` doesn't have versions in range ^4.4.0. Latest version is 5.3.0.`
  ));
});
