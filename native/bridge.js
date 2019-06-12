import * as ReactNative from 'react-native';
import EventEmitter from 'eventemitter3';

//
// Globals are bad, disgusting, but in this case, a necessary evil, a way
// to communicate, with the new and old, the tests and the runner.
//
// If you read this and think, oh golly, this is a good idea, then don't,
// it's not. Go back, close this file. Read a book on how to properly write
// JavaScript. Because this is not it.
//

/**
 * In order to prevent potential clashes with existing globals, and globals
 * that accidentally get introduced using code, we need to use a key that
 * cannot be created as a variable.
 *
 * Using @ as prefix/suffix seems to be solution here, including the use of
 * spaces to cover most the use-cases mentioned above.
 *
 * @note Make sure that this key is synced it our React-Native polyfill @ CLI
 * @type {String}
 * @private
 */
const key = '@ Ekke Ekke Ekke Ekke @';

//
// Reason 1, We need globals for Ekke:
//
// This scope is what will be included in the React-Native application that
// includes our <Ekke /> component, so we can execute code, the tests, and
// assert their interaction with the environment they are exposed in. But
// they will be executing in their own scope, with no prior knowledge of
// this executing scope.
//
// This global allows us to include the Ekke library again in tests, so
// when they execute, they will execute this code and see that bridge
// has already been established, and not override it. Allowing this
// single EventEmitter, to be a bridge between both execution context.
//
//
const events = (global[key] = global[key] || new EventEmitter());

//
// Reason 2, We can't have duplicate React-Native includes.
//
// React-Native's native modules are registered in the modules
//
events.ReactNative = ReactNative;

/**
 * Transfers a given React.createElement over the bridge so it can
 * render it on screen during our tests.
 *
 * @param {Object} component The result of React.createElement (<Component />)
 * @returns {Promise} Callback when the component is mounted.
 * @public
 */
function render(component) {
  return new Promise(function delay(resolve, reject) {
    events.emit('render', component, {
      resolve,
      reject
    });
  });
}

/**
 * Retrieves a given plugin function.
 *
 * @param {String} name Name of the registered plugin function.
 * @returns {Promise<function>} Callback when the component is mounted.
 * @public
 */
function use(name) {
  return new Promise(function searching(resolve, reject) {
    events.emit('plugin:registry', function transferred(registry) {
      if (registry.has(name)) return resolve(registry.get(name));

      reject(new Error(`The requested plugin(${name}) was never registered`));
    });
  });
}

export {
  events as default,
  render,
  use,
  events
};
