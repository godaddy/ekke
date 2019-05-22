/**
 * The exception handler.
 *
 * @type {Function}
 * @public
 */
let handler;

/**
 * Returns the current exception handler.
 *
 * @returns {Function|Undefined} Handler.
 * @public
 */
function getGlobalHandler() {
  return handler;
}

/**
 * Set a new exception handler.
 *
 * @param {Function} fn The new handler.
 * @public
 */
function setGlobalHandler(fn) {
  handler = fn;
}

/**
 * Simulate an uncaught exception by triggering the handler.
 *
 * @param {Error} err Error that caused the exception.
 * @param {Boolean} fatal Was the error fatal.
 * @private
 */
function simulate(err, fatal = false) {
  if (handler) handler.call(handler, err, fatal);
}

export {
  getGlobalHandler,
  setGlobalHandler,
  simulate
};
