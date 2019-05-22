const bridge = global['@ Ekke Ekke Ekke Ekke @'];
const ReactNative = bridge.ReactNative;

/**
 * Create a copy of the requireNativeComponent function as we're going
 * to override it when we export again.
 *
 * @type {Function}
 * @public
 */
const requireNativeComponent = ReactNative.requireNativeComponent;

/**
 * Native components register their components using the `requireNativeComponent`
 * method. Unfortunately you cannot register the same component twice, and
 * that is what will happen when load in the JavaScript of previously bundled
 * native modules. So we're going to override the method, silence these
 * invariant errors.
 *
 * @param {String} name Unique name of the component to register.
 * @returns {Component} Native Component
 * @public
 */
function interceptNativeComponent(name) {
  try {
    return requireNativeComponent(name);
  } catch (e) {
    return name;
  }
}

//
// All the exports of React-Native are defined using getter so they can
// lazy load the components that an application requires, and insert
// deprecation warnings. This also means we can't just simply override the
// exports, but need to use `defineProperty` to introduce them.
//
Object.defineProperty(ReactNative, 'requireNativeComponent', {
  get: () => interceptNativeComponent
});

/**
 * Re-Expose the React-Native that we stored in our Ekke global.
 *
 * @type {Object}
 * @public
 */
module.exports = ReactNative;
