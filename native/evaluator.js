import diagnostics from 'diagnostics';

//
// Create our debug instance.
//
const debug = diagnostics('ekke:evaluate');

/**
 * The evaluator allows us to maintain a history of scopes that we've
 * created in the app, until we figure a way to "un-evaluate".
 *
 * @constructor
 * @param {Subway} subway Our Metro bundler interface.
 * @public
 */
class Evaluator {
  constructor(subway) {
    this.subway = subway;
    this.scopes = [this.scope()];

    //
    // Create a bunch of proxy methods for easy access to the latest scope.
    //
    Object.keys(Evaluator.externals).forEach(method => {
      this[method] = function proxy(...args) {
        return this.scopes[this.scopes.length - 1][method](...args);
      }.bind(this);
    });
  }

  /**
   * Create a local, "global" for the code to execute in. It's worth noting
   * this of course, will not prevent lookup against actual global
   * variables, but only those who reference `this`, `window`, and `global`
   * giving a minimum layer of protection.
   *
   * But a minimum layer is still better than no layer at all.
   *
   * @returns {Object} The global.
   * @public
   */
  local() {
    const sandbox = Object.create(null);

    //
    // React-Native does introduce a couple of globals, lets make sure we mimic
    // those in our local, global.
    //
    // See https://github.com/facebook/react-native/tree/df2eaa9eb69a4b79533e663fd26e8896c0089530/Libraries/Core
    //
    sandbox.process = { ...process, env: { ...process.env } };
    sandbox.nativeRequire = global.nativeRequire;
    sandbox.navigator = { ...global.navigator };
    sandbox.__DEV__ = __DEV__;
    sandbox.window = sandbox;
    sandbox.GLOBAL = sandbox;
    sandbox.global = sandbox;

    return sandbox;
  }

  /**
   * Create a SandBox, Proxy, so if it's not in the provided target, we can
   * fallback to our global.
   *
   * @param {Object} box The sandbox which should be seen as primary
   * @param {Object} fallback The object to fallback to when it's not in the box.
   * @returns {Proxy} Our sandbox proxy.
   * @public
   */
  sandproxy(box = {}, fallback = global) {
    return new Proxy(box, {
      get(target, name) {
        if (name in target) {
          debug(`local read(${name})`);
          return target[name];
        }

        debug(`global read(${name})`);
        return fallback[name];
      },

      set(target, name, value) {
        if (name in target) debug(`local write(${name})`);
        else debug(`global write(${name})`);

        target[name] = value;
        return value;
      },

      has(target, name) {
        return name in target || name in fallback;
      }
    });
  }

  /**
   * Download and execute the bundle.
   *
   * @public
   */
  async download() {
    return await this.subway.bundle({
      entry: this.subway.entry,

      //
      // As we're using `eval` to evaluate the code we want to make sure that
      // the evaluated code has the correct line numbers, so we need to inline
      // the sourcemaps.
      //
      inlineSourceMap: true,

      //
      // runModule, nope, we want absolute control over the execution so we
      // do not want to run the modules automatically when it's evaluated
      //
      runModule: false
    });
  }

  /**
   * Create a sandbox for the code to execute in so we don't have to worry
   * that the test suite will actually kill any of the globals that the
   * app might be depending on.
   *
   * @param {String} [bundle] The bundle to compile.
   * @returns {Function} The compiled bundle, ready for execution.
   * @public
   */
  compile(bundle = '') {
    const { source, map } = this.transform(bundle);
    return new Function('global', `with (global) { ${source} } ${map}`);
  }

  /**
   * Transform the received bundle.
   *
   * @param {String} bundle
   * @returns {Object} Source and Source Map.
   * @public
   */
  transform(bundle) {
    //
    // As you might have noticed from the sourceMap check below, sourcemaps
    // start with comment, that means you cannot append anything behind it as
    // it would be seen as a comment. So in order to wrap our content, we need
    // to seperate the source from the sourcemap, so we can wrap our code
    // with our "sandbox", and re-introduce the sourcemap.
    //
    // TIL: blindly searching for the string:
    //
    // //# sourceMappingURL=data:application/json;charset=utf-8;base64'
    //
    // And splitting content based on the index works fine, until you
    // load in code, like your own library, and suddenly the contents of the
    // file contain the same string.. So a simple indexOf doesn't work. We
    // can however assume that it's before the last \n if we trim it, as our
    // code is not minified we don't have to worry about that.
    //
    const clean = bundle.trim();
    const index = clean.lastIndexOf('\n');
    const source = bundle.slice(0, index).trim();
    const map = bundle.slice(index).trim();

    return { source, map };
  }

  /**
   * Execute the bundle, store references to the newly created scopes.
   *
   * @param {String} sandbox The bundle to execute.
   * @public
   */
  async exec(sandbox) {
    const bundle = await this.download();
    const source = this.compile(bundle);

    //
    // @TODO sandbox
    //
    const result = source.call(global, global);
    const scope = this.scope();

    this.scopes.push({ result, sandbox, ...scope });

    return scope;
  }

  /**
   * Extract the methods that were introduced by the metroRequire from
   * a given object.
   *
   * @param {Object} obj The source where we have to extract our scope from.
   * @returns {Object} The created scope.
   * @public
   */
  scope(obj = global) {
    return Object.entries(Evaluator.externals).reduce(function (memo, [key, value]) {
      memo[key] = obj[value];
      return memo;
    }, {});
  }
}

/**
 * This the method to global mapping of the `metroRequire` polyfill that
 * is loaded in every bundle.
 *
 * @type {Object}
 * @public
 */
Evaluator.externals = {
  registerSegment: '__registerSegment',
  nativeRequire: 'nativeRequire',
  metroAccept: '__accept',
  metroRequire: '__r',
  define: '__d',
  clear: '__c'
};

export {
  Evaluator as default,
  Evaluator
};
