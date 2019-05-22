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
 * Again, nothing but shell of it's former self.
 *
 * @returns {Promise} This should never be used in production.
 * @public
 */
function render() {
  return new Promise(function nope(resolve, reject) {
    reject(new Error('render method is disabled in production'));
  });
}

export {
  Ekke,
  render
};
