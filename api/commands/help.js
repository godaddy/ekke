const { paint, stripper } = require('es-paint');

/**
 * Output the help information when users are exploring our CLI application.
 *
 * @param {Object} API Our command API.
 * @param {Object} flags CLI flags.
 * @public
*/
module.exports = async function help(API, flags) {
  const painter = flags.color === false ? stripper : paint;
  const { name, version } = require('../../package.json');

  console.log(painter`
${name} (v${version}|>#00A63F)
${"Ekke-Ekke-Ekke-Ekke-PTANG. Zoo-Boing. Z' nourrwringmm..."}|>#00A63F

COMMANDS:

${'run'}|>#00A63F      Run the given glob of test files.
         ${'--port'}|>dimgray           Port number that Metro Bundler should use.
         ${'--hostname'}|>dimgray       Hostname that Metro Bundler should use.
         ${'--using'}|>dimgray          Name of the test runner to use.
         ${'--watch'}|>dimgray          Don't exit when the tests complete but keep listening.
         ${'--no-silent'}|>dimgray      Do not suppress the output of Metro.
         ${'--require'}|>dimgray        Require module (before tests are executed).
         ${'--no-reset-cache'}|>dimgray Do not clear the Metro cache.
${'help'}|>#00A63F     Displays this help message.
         ${'--no-color'}|>dimgray       Disable colors in help message.

EXAMPLES:

$ ${'ekke run ./test/*.test.js'}|>dimgray --using mocha
`);
};
