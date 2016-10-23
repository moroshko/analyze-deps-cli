module.exports = packageJson => {
  try {
    return Promise.resolve(require(`./${packageJson.name}/analysis`));
  } catch (error) {
    // will be returned when package.json is not specified
    return Promise.resolve(require('./default/analysis'));
  }
};
