import Runner from './';

/**
 * Prepare the environment for the Mocha test runner.
 *
 * @constructor
 * @public
 */
class TapeRunner extends Runner {
  /**
   * Setup our test runner, pre-pare for test import, and execution.
   *
   * @param {Object} config The configuration of all the things.
   * @param {Function} tape The test runner.
   * @returns {Undefined|Function} After clean up function.
   * @public
   */
  async before(config, tape) {
    this.runner = {
      output: tape.createStream(),
      harness: tape.getHarness()
    };

    this.runner.output.on('data', line => console.log(line.trimRight()));
  }

  /**
   * Execute the test runner.
   *
   * @param {Function} completion Callback for when we're done.
   * @public
   */
  async run(completion) {
    const { harness } = this.runner;

    (function iterate(tests) {
      const test = tests.shift();

      if (test) {
        test.run();

        if (!test.ended) {
          return test.once('end', () => iterate(tests));
        }
      }

      if (!tests.length) {
        harness.close();
        completion(harness._exitCode);
      }
    }(harness._tests.slice(0)));
  }
}

export {
  TapeRunner as default,
  TapeRunner
};
