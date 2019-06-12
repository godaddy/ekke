/**
 * Async task executor.
 *
 * @param {Function} fn Completion callback in case of error or done.
 * @return {Function} Async function executor.
 * @public
 */
function tasked(fn) {
  let allowed = true;

  /**
   * Completion callback handler, will prevent multiple execution of the
   * supplied completion callback when we're no longer allowed to do so.
   *
   * @returns {Boolean} Indication if we're allowed.
   * @private
   */
  async function done() {
    if (!allowed) return allowed;

    try { allowed = await fn(...arguments); }
    catch (e) { allowed = false; }

    return allowed;
  }

  /**
   * Register a new task to execute.
   *
   * @param {Function} task Async Function to execute.
   * @return {Boolean} Indication of success.
   * @public
   */
  async function run(task) {
    if (!allowed) return false;

    try { await task(done); }
    catch (e) { return await done(e); }

    return true;
  }

  return { run, done };
}

/**
 * Allow function to return a destroy function.
 *
 * @param {Function} [done] Completion callback for teardown.
 * @returns {Object} Destroy and teardown methods.
 * @public
 */
function destroyer(done) {
  const cleanup = [];

  /**
   * Register a new function to destory.
   *
   * @param {Function} args Functions to execute on destruction.
   * @public
   */
  function destroy(...args) {
    cleanup.push(...args);
  }

  /**
   * Calls all registered callbacks so we can destroy all the things.
   *
   * @return {Promise} All clean up functions called.
   * @public
   */
  async function teardown() {
    const items = cleanup.slice(0);
    cleanup.length = 0;

    await Promise.all(
      items
        .filter(Boolean) // Remove possible undefineds.
        .map(fn => fn()) // Execute so we get promise instances.
        .filter(Boolean) // Clean up again, to remove non-async functions.
    );

    if (done) await done();
  }

  return { destroy, teardown };
}

export {
  tasked,
  destroyer
}
