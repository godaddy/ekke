import tape from 'tape';

/**
 * Create a tape runner.
 *
 * @param {Object} API The plugin API.
 * @public
 */
export default function plugin({ modify }) {
  let output;
  let harness;

  modify('before', async function before({ config }) {
    output = tape.createStream();
    harness = tape.getHarness();

    output.on('data', line => console.log(line.trimRight()));
  });

  modify('run', function run({ done }) {
    return new Promise(function pinky(resolve) {
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

          done(harness._exitCode);
          resolve();
        }
      }(harness._tests.slice(0)));
    });
  });
}
