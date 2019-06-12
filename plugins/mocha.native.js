import Mocha from 'mocha';

/**
 * Create a Mocha test runner.
 *
 * @param {Object} API The plugin API.
 * @public
 */
export default function plugin({ modify }) {
  let mocha;

  modify('before', async function before({ config }) {
    const fgrep = config.fgrep || '';
    const grep = config.grep || '';

    mocha = new Mocha({
      grep: grep.length && grep,
      fgrep: fgrep.length && fgrep
    });

    //
    // Apply all options that were given to us through the bundler process.
    //
    mocha
      .ui(config.ui || 'bdd')
      .slow(config.slow || 75)
      .timeout(config.timeout || 2000)
      .reporter(config.reporter || 'spec')
      .bail('bail' in config ? config.bail : true)
      .useColors('color' in config ? config.color : true)
      .useInlineDiffs('inlineDiffs' in config ? config.inlineDiffs : true);

    if (config.invert) mocha.invert();

    //
    // Last but not least, we need to call this weird internal method to
    // initialize/inject the globals that belong to the selected test `ui` this
    // way when the tests are loaded they can actually access `describe` & `it`.
    //
    mocha.suite.emit('pre-require', global, '', mocha);

    console.log('before lol');
  });

  modify('run', function run({ done }) {
    return new Promise(function pinky(resolve) {
      mocha.run(function () {
        done(...arguments);
        resolve();
      });
    });
  });
}
