/**
 * Ekke CLI plugin:
 *
 * We need to force mocha to the node version instead of the browser version in
 * order for it to compile.
 *
 * @param {Object} API The plugin API.
 * @returns
 */
module.exports = function plugin({ modify }) {
  modify('process.browser', function browser() {
    return true;
  });

  modify('babel.alias', function alias(aliases) {
    return Object.assign(aliases, {
      mocha: require.resolve('mocha/lib/mocha')
    });
  });
};
