module.exports = packageJson => {
  try {
    return Promise.resolve(require(`./mocks/${packageJson.name}/analysis`));
  } catch (error) {
    return Promise.reject(new Error(`Mock \`${packageJson.name}\` doesn\'t exist`));
  }
};
