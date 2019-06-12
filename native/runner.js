import { tasked, destroyer } from '../native/utils';
import Evaluator from '../native/evaluator';
import uncaught from '../native/uncaught';
import intercept from '../native/console';
import diagnostics from 'diagnostics';
import failure from 'failure';

//
// Setup our debug instance.
//
const debug = diagnostics('ekke:runner');

/**
 * Run the metro bundle, tests, plugins, everything. Basically the heart of
 * the project.
 *
 * @param {Screen} screen Screen API.
 * @param {Subway} subway Subway API.
 * @param {Object} config Configuration.
 * @param {Plugin} plugin Plugin API.
 * @public
 */
async function runner({ screen, subway, config, plugin }) {
  const eva = new Evaluator(subway);

  const { destroy, teardown } = destroyer(async function destoryed() {
    debug('tearing down the whole test suite');
    await plugin.exec('modifiers', 'teardown');

    screen.restore();
    plugin.reset();
  });

  const { run } = tasked(async function completion(e) {
    if (e) debug('received an error while executing a task', e.message);

    const { err, complete } = plugin.exec('modifiers', 'complete', { err: e, complete: true });

    //
    // We used to have an error, but our plugin system modified it to no error
    // so we should just
    //
    if (!complete) return true;

    if (err) {
      if (typeof err === 'number') {
        err = new Error(`Test are failing with exit code ${err}`);
      }

      subway.send('complete', failure(err));
    } else {
      subway.send('complete');
    }

    await teardown();
    return false;
  });

  //
  // Prepare the environment:
  //
  destroy(await intercept({ send: subway.send }));
  screen.present();

  await run(async (fail) => {
    destroy(uncaught(async (err, fatal) => {
      ({ err, fatal } = plugin.exec('modifiers', 'uncaught', { err, fatal }));

      if (err) complete(err, { fatal, uncaught: true });
    }));
  });

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
  let requires;
  let library;
  let plugins;
  let globs;
  let scope;

  await run(async () => {
    const local = eva.local();
    const sandbox = eva.sandproxy(local);

    scope = await eva.exec(sandbox);

    ({
      requires,
      plugins,
      globs
    } = scope.metroRequire(1));
  });

  //
  // Execute the the plugins as quickly as possible so they can start listening
  // to the various of plugin events.
  //
  debug('executes the --plugin');
  await run(() => {
    const results = plugins();

    Object.keys(results).forEach((key) => {
      //
      // Our source file uses require statements to import that plugins. If
      // these plugins are written in an ES6 format, they would expose a
      // `default` which we should use instead.
      //
      const target = results[key];
      const fn = typeof target === 'function' ? target : target.default;

      debug(`registering plugin($key)`);
      plugin.use(fn);
    });
  });

  config = await plugin.exec('modifiers', 'config', config);
  await plugin.exec('modifiers', 'before', { requires, globs, config });

  //
  // Execute all files that should be ran before we require the test files.
  //
  debug('executes the --require');
  await run(() => requires());

  //
  // Execute all the files that we found with our globs.
  //
  debug('executing glob requires');
  await run(() => globs());

  //
  // Finally, instruct the plugins that we can run whatever they wanted
  // to execute. In case of runners, this is the executing the test suite.
  //
  await run(async (done) => {
    await plugin.exec('modifiers', 'run', { done });

    done(new Error('None of the plugins executed the done function'));
  });
}

export {
  runner as default,
  runner
}
