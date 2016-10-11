module.exports = packageJson => {
  console.log('Mock is run!', packageJson); // eslint-disable-line no-console

  return Promise.resolve({
    dependencies: {
      'lodash.mapvalues': {
        status: 'latest'
      },
      'package-json': {
        status: 'not-latest',
        current: '^1.2.0',
        latest: '2.4.0',
        diff: 'major'
      },
      'promise-all': {
        status: 'latest'
      },
      semver: {
        status: 'not-latest',
        current: '^5.2.0',
        latest: '5.3.0',
        diff: 'minor'
      }
    },
    devDependencies: {
      eslint: {
        status: 'not-latest',
        current: '^3.7.0',
        latest: '3.7.1',
        diff: 'patch'
      }
    }
  });
};
