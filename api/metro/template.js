//
// The contents of this file will be replaced by the `source.js` file.
//
const env = process.env;
const processed = require('process');
const Buffer = require('buffer').Buffer;
const EventEmitter = require('eventemitter3');

//
// Unfortunately the `process` polyfill, is lacking some features that
// our tests usually depend upon, so we need to polyfill, our polyfill B).
//
processed.env = env;
processed.browser = ${browser};

const events = new EventEmitter();

Object.keys(EventEmitter.prototype).forEach(function polyfill(key) {
  if (typeof events[key] !== 'function') return;

  processed[key] = events[key].bind(events);
});

//
// We want to intercept process.exit, we can act on those events.
//
processed.exit = events.emit.bind(events, 'process.exit');

//
// Expose the libraries as globals so it's polifylled everywhere before we
// require our actual test runners.
//
global.Buffer = Buffer;
global.process = processed;

global.__dirname = '${__dirname}';
global.__filename = 'not supported';

module.exports = {
  library: ${library},

  //
  // All requires that need to be executed **before** the runner, but **after**
  // the plugins.
  //
  requires: function requires() {
    return ${requires};
  },

  //
  // Executes all plugins.
  //
  plugins: function plugins() {
    return ${plugins};
  },

  //
  // Requires all the files that are specified in the provide glob patterns.
  //
  globs: function globs() {
    return ${globs};
  }
}
