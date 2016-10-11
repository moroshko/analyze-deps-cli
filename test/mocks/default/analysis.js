module.exports = {
  dependencies: {
    rxjs: {
      status: 'not-latest',
      current: '5.0.0-beta.12',
      latest: '5.0.0-rc.1',
      diff: 'prerelease'
    }
  },
  devDependencies: {
    'selenium-webdriver': {
      status: 'not-latest',
      current: '^2.53.3',
      latest: '3.0.0-beta-3',
      diff: 'premajor'
    },
    '@types/jasmine': {
      status: 'not-latest',
      current: '^2.2.22-alpha',
      latest: '2.5.35',
      diff: 'preminor'
    },
    tslint: {
      status: 'not-latest',
      current: '^3.15.0-dev.0',
      latest: '3.15.1',
      diff: 'prepatch'
    },
    semver: {
      status: 'not-latest',
      current: '^5.2.0',
      latest: '5.3.0',
      diff: 'minor'
    }
  }
};
