import Runner from './';

/**
 * Prepare the environment for the Mocha test runner.
 *
 * @constructor
 * @public
 */
class MochaRunner extends Runner {
  /**
   * Setup our test runner, pre-pare for test import, and execution.
   *
   * @param {Object} config The configuration of all the things.
   * @param {Function} Mocha The test runner.
   * @returns {Undefined|Function} After clean up function.
   * @public
   */
  async before(config, Mocha) {
    const fgrep = config.fgrep || '';
    const grep = config.grep || '';

    const mocha = (this.runner = new Mocha({
      grep: grep.length && grep,
      fgrep: fgrep.length && fgrep
    }));

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
  }

  /**
   * Execute the test runner.
   *
   * @param {Function} completion Callback for when we're done.
   * @public
   */
  async run(completion) {
    this.runner.run(completion);
  }
}

export {
  MochaRunner as default,
  MochaRunner
};
