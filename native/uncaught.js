import diagnostics from 'diagnostics';
import once from 'one-time';

//
// Dedicated uncaught exception logger.
//
const debug = diagnostics('ekke:uncaught');

/**
 * Adds an uncaught exception handler.
 *
 * @param {Function} fn Function to execute when an uncaughtException handles.
 * @returns {Function} Function to restore the error handler.
 * @public
 */
function capture(fn) {
  const old = ErrorUtils.getGlobalHandler();

  /**
   * A function that will restore the error handler to it's original state
   * as we've found it, we only want to restore it once or we could accidentally
   * override another error handler.
   *
   * @type {Function}
   * @public
   */
  const restore = once(function previous() {
    if (ErrorUtils.getGlobalHandler() !== handler) {
      debug('unable to restore old handler, as our current got replaced');
      return;
    }

    debug('restoring previous replaced handler');
    ErrorUtils.setGlobalHandler(old);
  });

  /**
   * Our custom uncaughtException handler, we want to store this reference so
   * when we attempt to restore the error handler, we could check if the
   * current handler this function so we don't accidentally override a new handler.
   *
   * @type {Function}
   * @private
   */
  const handler = once(function uncaughtException(...args) {
    debug('captured uncaught exception', args);

    //
    // We only want to call our own error handler as this exception happened
    // while running the test suite we don't accidenlty want to trigger any
    // error reporting that shouldn't be triggered.
    //
    fn(...args);
  });

  ErrorUtils.setGlobalHandler(handler);
  return restore;
}

export {
  capture as default,
  capture
};
