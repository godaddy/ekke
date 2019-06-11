const { mergeConfig, loadConfig } = require('metro-config');
const { FileStore } = require('metro-cache');
const resolve = require('metro-resolver').resolve;
const diagnostics = require('diagnostics');
const source = require('./source');
const { write } = require('./env');
const path = require('path');
const glob = require('glob');

//
// Debug logger.
//
const debug = diagnostics('ekke:configure');

/**
 * Generate the contents of the metro.config that should be used to build
 * the tests.
 *
 * @param {Object} flags The configuration flags of the API/CLI.
 * @param {Ekke} ekke The Ekke instance.
 * @returns {Promise<Object>} configuration.
 * @public
 */
async function configure(flags, ekke) {
  const reactNativePath = path.dirname(require.resolve('react-native/package.json'));
  const config = await loadConfig();
  const custom = {
    resolver: {},
    serializer: {},
    transformer: {},
    cacheStores: [
      new FileStore({
        root: flags['cache-location']
      })
    ]
  };

  //
  // We need to create a fake package name that we will point to the root
  // of the users directory so we can resolve their requires and test files
  // without having to rely on `package.json` based resolve due to poor
  // handling of absolute and relative paths.
  //
  // See: https://github.com/facebook/react-native/issues/3099
  //
  const moduleName = 'ekke-ekke-ekke-ekke';

  //
  // Check if we're asked to nuke the cache, we should. This option will
  // be your next best friend.
  //
  custom.resetCache = !!flags['reset-cache'];

  //
  // Prevent the Metro bundler from outputting to the console by using a
  // custom logger that redirects all output to our debug utility. We want
  // to minimize the output so the test responses can be piped to other
  // processes in the case of tap based test runners.
  //
  if (flags.silent) custom.reporter = {
    update: function log(data) {
      debug('status:', data);
    }
  };

  //
  // We want to polyfill the `util`, `http` and other standard Node.js
  // libraries so any Node.js based code has at least a chance to get
  // bundled without throwing any errors. The `extraNodeModules` option
  // gets us there, but it doesn't work for all transforms we need to
  // make, so we need to go deeper, and solve it as an AST level using
  // babel and that requires our own custom transformer.
  //
  custom.transformer.babelTransformerPath = path.join(__dirname, 'babel.js');

  //
  // Metro uses the (jest) worker farm to create multiple babel transform
  // processes to speed up the build time. This is also the reason why they
  // use a `babelTransformerPath` instead of allowing a function.
  //
  // So in order for plugins to modify the babel config, we're going to allow
  // the use the JSON syntax of babel, so we can inject that to the
  // `process.env` which will be passed to the worker processes.
  //
  const babel = await ekke.exec('modify', 'babel', {});
  const alias = await ekke.exec('modify', 'babel.alias', {});

  if (babel) write('babel', babel);
  if (alias) write('babel.alias', alias);

  custom.resolver.extraNodeModules = {
    [moduleName]: process.cwd()
  };

  //
  // It could be that we've gotten multiple glob patterns, so we need to
  // iterate over each.
  //
  const globs = [];
  (flags.argv || []).filter(Boolean).forEach(function find(file) {
    if (!~file.indexOf('*')) return globs.push(file);

    Array.prototype.push.apply(globs, glob.sync(file));
  });

  //
  // Mother of all hacks, we don't have a single entry point, we have multiple
  // as our test files are represented in a glob, that can point to an infinite
  // number of modules.
  //
  // Unfortunately, there isn't an API or config method available in Metro
  // that will allow us to inject files that need to be included AND resolve
  // those files dependencies. The only thing that comes close is the
  // `serializer.polyfillModuleNames` which will include those files, but
  // not their dependencies.
  //
  // That leaves us with this horrible alternative, creating a tmp.js file
  // with absolute paths to the files we want to import. So we're going to
  // intercept the `package.json` bundle operation and return the location of
  // our temp file so that will be required instead of the actual contents of
  // the `package.json` file. But then I realized, we can just put anything
  // we want in the URL, and it would end up here. So let's go with something
  // that fit our theme.
  //
  const filePath = await source({
    browser: await ekke.exec('modify', 'browsermode', false),
    globs: await ekke.exec('modify', 'globs', globs),
    library: await ekke.exec('modify', 'library'),
    requires: [].concat(flags.require),
    plugins: Array.from(ekke.registry),
    moduleName
  });

  custom.resolver.resolveRequest = function resolveRequest(context, file, platform) {
    if (file === './Ekke-Ekke-Ekke-Ekke-PTANG.Zoo-Boing.Znourrwringmm') return {
      type: 'sourceFile',
      filePath
    };

    //
    // We only wanted to abuse the `resolveRequest` method to intercept a
    // give request and point it to a completely different, unknown file. The
    // last thing we've wanted to do the actual resolving, so we're going to
    // rely on the `metro-resolver` module for that..
    //
    // Unfortunately, there's an issue, as we've set a `resolveRequest`
    // function the resolver function thinks it needs to use that resolver to
    // resolve the file, leading to an infinite loop, pain, suffering. So
    // before we can continue, we need to check if we should remove our
    // self from the context so the resolver works as intended again.
    //
    if (context.resolveRequest === resolveRequest) {
      context.resolveRequest = null;
    }

    debug(`resovling file(${file})`);
    return resolve(context, file, platform);
  };

  //
  // It's important to understand that while Metro is branded as the JavaScript
  // bundler for React-Native, it's not configured out of the box to support
  // React-Native, all this configuration work is done by the CLI.
  //
  // That's where package resolving, and custom metro.config creation
  // is happening. The following fields are important for this:
  //
  // - Instructs Metro that React-Native uses a non-standard require system.
  // - Tell Metro to use the non-standard hasteImpl map that ships in React-Native
  //   so it can process the @providesModule statements without blowing up on
  //   warnOnce, or missing invariant modules.
  // - Instruct it to also look, and honor the dedicated `react-native`
  //   field in package.json's
  // - And point to the correct AssetRegistry, also hidden in the React-Native
  //   module.
  //
  // The `providesModuleNodeModules` and `hasteImplModulePath` are currently
  // not needed to correctly configure metro for Ekke as we're replacing
  // `react-native` with  polyfill, but if we for some reason turn this off,
  // we don't want to research the undocumented codebase of Metro, cli, and
  // React-Native again to figure out how to correctly resolve and bundle
  // React-Native.
  //
  custom.resolver.providesModuleNodeModules = ['react-native'];
  custom.resolver.hasteImplModulePath = path.join(reactNativePath, 'jest/hasteImpl');
  custom.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  custom.transformer.assetRegistryPath = path.join(reactNativePath, 'Libraries/Image/AssetRegistry');

  const merged = mergeConfig(config, custom, await ekke.exec('modify', 'metro.config'));
  debug('metro config', merged);

  return merged;
}

//
// Expose our configuration generator
//
module.exports = configure;
