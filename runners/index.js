import Evaluator from '../native/evaluator';
import uncaught from '../native/uncaught';
import before from '../native/lifecycle';
import diagnostics from 'diagnostics';
import once from 'one-time/async';
import failure from 'failure';

//
// Create our test runner debugger.
//
const debug = diagnostics('ekke:runner');

/**
 * The base of our test runner, provides a clean abstraction for all other
 * test runners to build up without the need of duplicating functionality.
 *
 * @constructor
 * @param {Object} API Pre-initialized versions of screen, subway, and config
 * @public
 */
class Runner {
  constructor({ screen, subway, config, plugin }) {
    this.eva = new Evaluator(subway);
    this.screen = screen;
    this.subway = subway;
    this.plugin = plugin;
    this.config = config;

    this.cleanup = [];
    this.setup();
  }

  /**
   * Creates a new completion handler for the current task.
   *
   * @returns {Function} Completion handler.
   * @public
   */
  complete() {
    return once(async function completed(err) {
      debug('completed the run', err);

      if (err) {
        if (typeof err === 'number') {
          err = new Error(`Test are failing with exit code ${err}`);
        }

        this.subway.send('complete', failure(err));
      } else {
        this.subway.send('complete');
      }

      await this.teardown();
    }.bind(this));
  }

  /**
   * Kickstart the testing.
   *
   * @async
   * @public
   */
  async setup() {
    const complete = this.complete();
    const local = this.eva.local();

    let requires;
    let library;
    let plugins;
    let globs;
    let scope;

    //
    // Setup our screen so the user knows magic is about to happen.
    //
    this.screen.present();

    //
    // Check if we need to process any of the environment before we can
    // execute our test runner. There might be specific fixes that we need
    // to make in order to bend it to our will.
    //
    if (typeof this.environment === 'function') await this.environment(local);
    const sandbox = this.eva.sandproxy(local);

    //
    // Now that we have everything ready to evaluate we're gonna prepare
    // the rest of the environment and setup all our listeners.
    //
    this.cleanup.push(await before({ send: this.subway.send }));
    this.cleanup.push(uncaught(complete));

    //
    // Now that we've setup our uncaught hooks, started intercepting things
    // like console statements, we can attempt to execute the bundle.
    //
    // The `metroRequire` method has 2 modes, it either requires modules
    // based on the generated moduleId that was configured in our metro.config
    // or by using the module names/paths. The thing is, we have no idea what
    // the path of the file is, as it's randomly generated based on the SH256
    // of it's contents, what we do know, is that it's the entry of our bundle.
    //
    // Combining that with the fact that the Metro bundler uses zero based
    // sequential id generation for each moduleId, we can accurately say that
    // module 0 is our entry file, which needs to be required.
    //
    try {
      scope = await this.eva.exec(sandbox);
      ({
        requires,
        library,
        plugins,
        globs,
      } = scope.metroRequire(1));
    } catch (e) {
      debug('critical error: the compilation failed', e);
      return complete(e);
    }

    //
    // Prep the library, so it can create a new instance if needed.
    //
    try {
      this.cleanup.push(await this.before(this.config, library));
    } catch (e) {
      return complete(e);
    }

    //
    // Requires should run before our test suites so they can prepare
    // environments if needed.
    //
    try {
      requires();
    } catch (e) {
      return complete(e);
    }

    try {
      const results = plugins();

      Object.keys(results).forEach((key) => {
        debug(`registering plugin($key)`);
        this.plugin.use(results[key]);
      });
    } catch (e) {
      return complete(e);
    }

    //
    // Execute the test suites so they are executed in our JavaScript
    // environment.
    //
    try {
      globs();
    } catch (e) {
      return complete(e);
    }

    //
    // Finally, if everything went well, we can run our test suite.
    //
    await this.run(complete);
  }

  /**
   * Runs a clean-up operation.
   *
   * @async
   * @public
   */
  async teardown() {
    await Promise.all(
      this.cleanup
        .filter(Boolean) // Remove possible undefineds.
        .map(fn => fn()) // Execute so we get promise instances.
        .filter(Boolean) // Clean up again, to remove non-async functions.
    );

    this.cleanup.length = 0;
    this.screen.restore();
    this.plugin.reset();
    this.library = null;
  }
}

export {
  Runner as default,
  Runner
};
