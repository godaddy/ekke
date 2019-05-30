/**
 * Expose exactly the same interface as our development build, but without
 * loading our actual library, so no content except for this file would
 * be included in production.
 *
 * @returns {Component|Null} Children, if used as wrapping component, or nada.
 * @public
 */
function Ekke({ children }) {
  return children || null;
}

//
// Indication of which build is loaded.
//
Ekke.prod = true;
Ekke.dev = false;

/**
 * Create a function that will reject when used in production.
 *
 * @param {String} name The name of the method that is disabled.
 * @returns {Function} A function that will reject.
 * @private
 */
function disable(name) {
  /**
   * Reject when called as functionality is disabled in prod.
   *
   * @returns {Promise} This should never be used in production.
   * @public
   */
  function disabled() {
    return new Promise(function nope(_resolve, reject) {
      reject(new Error('The ' + name + ' method is disabled in production'));
    });
  }

  disabled.displayName = name;
  return disabled;
}

const render = disable('render');
const use = disable('use');

export {
  render,
  Ekke,
  use
};
