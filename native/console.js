import once from 'one-time/async';

/**
 * Intercept console messages
 *
 * @async
 * @param {Object} Runner Our test runner internals.
 * @returns {Promise<Function>} The after function, that runs the clean-up.
 * @public
 */
async function intercept({ send }) {
  const ocm = ['log', 'info', 'warn', 'error'];
  const oc = {};

  ocm.forEach(function each(method) {
    oc[method] = console[method];
    console[method] = send.bind(send, `console.${method}`);
  });

  return once(async function after() {
    ocm.forEach(function each(method) {
      console[method] = oc[method];
      delete oc[method];
    });
  });
}

export {
  intercept as default,
  intercept
};
