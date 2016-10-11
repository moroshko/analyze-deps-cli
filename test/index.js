const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const execa = require('execa');

chai.use(chaiAsPromised);

const expectError = (mockName, errorMessage) =>
  expect(
    execa('./test/bin/deps', ['-p', `./test/mocks/${mockName}`])
      .catch(error => ({
        output: error.stdout.trim(),
        exitCode: error.code
      }))
  ).to.eventually.become({
    output: errorMessage.trim(),
    exitCode: 1
  });

const expectOutput = (mockName, output) =>
  expect(
    execa('./test/bin/deps', ['-p', `./test/mocks/${mockName}`])
      .then(result => result.stdout.trim())
  ).to.eventually.become(output.trim());

describe('analyse-deps-cli', () => {
  it('should output an error if cannot find package.json', () =>
    expectError('no-package-json', `
ERROR: test/mocks/no-package-json/package.json doesn't exist
`));

  it('should not output up to date packages', () =>
    expectOutput('has-latest', `
Analyzing test/mocks/has-latest/package.json

package       current  latest
package-json  ^1.2.0   2.4.0   major
semver        ^5.2.0   5.3.0   minor

package  current  latest
eslint   ^3.7.0   3.7.1   patch
`));
});
