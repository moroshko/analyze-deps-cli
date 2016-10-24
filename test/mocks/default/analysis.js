module.exports = {
  dependencies: {
    rxjs: {
      status: 'error',
      error: 'I don\'t know how to update `rxjs` range 5.0.0-beta.12 to include only the latest version 5.0.0-rc.1.'
    }
  },
  devDependencies: {
    'selenium-webdriver': {
      status: 'error',
      error: 'I don\'t know how to update `selenium-webdriver` range ^2.53.3 to include only the latest version 3.0.0-beta-3.'
    },
    '@types/jasmine': {
      status: 'not-latest',
      current: '^2.2.22-alpha',
      latest: '2.5.35',
      latestRange: '^2.5.35',
      diff: 'preminor'
    },
    tslint: {
      status: 'not-latest',
      current: '^3.15.0-dev.0',
      latest: '3.15.1',
      latestRange: '^3.15.1',
      diff: 'prepatch'
    },
    semver: {
      status: 'not-latest',
      current: '^5.2.0',
      latest: '5.3.0',
      latestRange: '^5.3.0',
      diff: 'minor'
    }
  }
};
