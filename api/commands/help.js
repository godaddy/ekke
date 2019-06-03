const define = require('./define');
const halp = require('send-help');

/**
 * Output the help information when users are exploring our CLI application.
 *
 * @param {Object} _ Our command API.
 * @param {Object} flags CLI flags.
 * @public
*/
async function help({ ekke }, flags) {
  const { name, version, description } = require('../../package.json');
  const specific = Array.isArray(flags.argv) && flags.argv[0];

  const output = halp(Object.keys(ekke).filter(function filter(name) {
    const command = ekke[name];
    return typeof command === 'function' && command.ekke === 'ekke-ekke-ekke';
  }).reduce(function reduce(memo, name) {
    memo[name] = ekke[name];
    return memo;
  }, {}), {
    name,
    flags,
    version,
    specific,
    description,
    accent: '#00A63F',
    subtle: 'dimgray',
    color: flags.color,
  });

  console.log('\n' + output.trim() + '\n');
}

//
// Expose the interface.
//
module.exports = define(help, {
//
  // Detailed explanation of what this command does, and achieves.
  //
  description: 'Displays this help message.',

  //
  // Different API examples to aid the user.
  //
  examples: 'ekke help',

  //
  // The flags, options, that can be configured for this command.
  //
  flags: {
    '--no-color': 'Disable colors in help message.'
  }
});
