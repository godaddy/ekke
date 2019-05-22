const libs = require('node-libs-react-native');
const path = require('path');

//
// Provide an empty.
//
const empty = path.join(__dirname, 'empty.js');
module.exports = {
  ...libs,

  //
  // So the `node-libs-react-native` does a pretty poor job as being a polyfill
  // for Node.js modules as it doesn't provide good defaults and randomly
  // decides that some of these modules should be gone. In a future revision
  // we should extract this logic to a seperate module, so we don't have
  // to depend on `process` and `stream-browserify` our self and have
  // apply additional fixes to get this working.
  //
  'fs': empty,
  'child_process': empty,
  'dgram': empty,
  'cluster': empty,
  'dns': empty,
  'module': empty,
  'net': empty,
  'readline': empty,
  'repl': empty,
  'tls': empty,
  'vm': empty,
  'stream': require.resolve('stream-browserify'),

  //
  // We need to force mocha to the node version instead of the browser
  // version in order for it to compile.
  //
  'mocha': require.resolve('mocha/lib/mocha'),

  //
  // Prevent duplicate React-Native execution, the polyfill will re-use the
  // existing React-Native import that is bundled with the application. This
  // will ensure that all NativeModules are correctly registered.
  //
  'react-native': path.join(__dirname, 'react-native.js'),

  //
  // Needed for our own testing, we just want to require `ekke`, which
  // will point to the root of our repo.
  //
  'ekke': path.join(__dirname, '..', '..', '..', 'ekke.js')
};
