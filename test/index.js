const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const mock = require('mock-require');
const execa = require('execa');

chai.use(chaiAsPromised);
mock('analyze-deps', './analyze-deps-mock');

describe('analyse-deps-cli', function() {
  this.timeout(10000);

  it('should ...', () => {
    return expect(execa('./bin/deps'))
      .to.eventually.have.property('stdout').equal('something');
  });
});
