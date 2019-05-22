import once from 'one-time/async';

/**
 * Lifecyle management for when test suite is about to run.
 *
 * @async
 * @param {Object} Runner Our test runner internals.
 * @returns {Promise<Function>} The after function, that runs the clean-up.
 * @public
 */
async function before({ send }) {
  const ocm = ['log', 'info', 'warn', 'error'];
  const oc = {};

  ocm.forEach(function each(method) {
    oc[method] = console[method];
    console[method] = send.bind(send, method);
  });

  return once(async function after() {
    ocm.forEach(function each(method) {
      console[method] = oc[method];
      delete oc[method];
    });
  });
}

export {
  before as default,
  before
};
