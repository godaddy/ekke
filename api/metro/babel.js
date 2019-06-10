const { getCacheKey } = require('metro-react-native-babel-transformer');
const { transformSync } = require('@babel/core');
const merge = require('babel-merge');
const aliases = require('./aliases');
const { read } = require('./env');

/**
 * Generates all the required presets for babel transformation.
 *
 * @param {Array} existing Any presets would have existed before.
 * @param {Object} options Options provided to the transform.
 * @returns {Array} All combined presets.
 * @public
 */
function presets(existing = [], options) {
  const { experimentalImportSupport, ...presetOptions } = options;

  return [
    [require.resolve('metro-react-native-babel-preset'), {
      ...presetOptions,

      disableImportExportTransform: experimentalImportSupport,
      enableBabelRuntime: options.enableBabelRuntime
    }],

    ...existing
  ];
}

/**
 * The various of plugins that we need to make things happen.
 *
 * @param {Array} existing Any presets would have existed before.
 * @param {Object} options Options provided to the transform.
 * @returns {Array} All combined presets.
 * @public
 */
function plugins(existing = [], options) {
  const optional = [];

  if (options.inlineRequires) {
    optional.push(require.resolve('babel-preset-fbjs/plugins/inline-requires'));
  }

  return [
    [require.resolve('babel-plugin-rewrite-require'), {
      throwForNonStringLiteral: true,
      Object.assign(aliases, read('babel.alias') || {})
    }],

    ...optional,
    ...existing
  ];
}

/**
 * A custom babel transformer, this gives us finegrain control over the
 * transformation process, and more power than some of the metro options
 * that are provided.
 *
 * @param {Object} transformOptions Our transformer options.
 * @returns {Object} Our transformed AST.
 * @public
 */
function transform(transformOptions) {
  const { filename, options, src } = transformOptions;

  //
  // Development builds are controlled by the `options` that are specified
  // by the metro bundler, not using env variables that a user might has set
  // so we need to ensure that we nuke their babel-env and force it to the
  // right execution env.
  //
  const old = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : old || 'production';

  const config = {
    caller: {
      name: 'metro',
      platform: options.platform
    },
    ast: true,
    babelrc: !!options.enableBabelRCLookup,
    code: false,
    highlightCode: true,
    filename: filename,
    sourceType: 'unambiguous',

    ...merge({
      presets: presets([], options),
      plugins: plugins(transformOptions.plugins, options)
    }, read('babel') || {})
  };

  try {
    const result = transformSync(src, config);

    //
    // When a file is ignored, it doesn't return a result, so we need to
    // optionally return the transformed AST.
    //
    return result
      ? { ast: result.ast }
      : { ast: null };
  } finally {
    process.env.BABEL_ENV = old;
  }
}

//
// Expose the transform method.
//
module.exports = {
  getCacheKey,
  transform,
  presets,
  plugins
};
