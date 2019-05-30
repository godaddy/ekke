const stringify = require('json-stringify-safe');
const metro = require('../server');

/**
 * Start our servers.
 *
 * @param {Object} API Our command API.
 * @param {Object} flags CLI flags.
 * @public
*/
module.exports = async function run({ debug, ekke }, flags) {
  const { ws } = await metro(flags, ekke);
  const { exec } = ekke;

  ws.on('connection', async (socket) => {
    const runner = flags.using;
    const opts = flags[runner] || {};

    /**
     * Helper function providing a consistent message interface with the
     * Component.
     *
     * @param {String} event Name of the event.
     * @param {Object|Array} payload Data to transfer.
     * @returns {Promise} Resolve when socket has written.
     * @public
     */
    function send(event, payload) {
      return new Promise(function sender(resolve, reject) {
        let message;

        try { message = stringify({ event, payload }); } catch (e) { return reject(e); }

        try {
          socket.send(message, function written(e) {
            if (e) return reject(e);

            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    }

    socket.on('message', (message) => {
      let event, payload;

      try {
        ({ event, payload } = JSON.parse(message));
      } catch (e) {
        debug('failed to decode received JSON payload', message);
        return;
      }

      debug('received message', message);
      ekke.emit(event, payload, send);

      if (event === 'complete') {
        if (payload.length) {
          const failure = payload[0];

          //
          // Very specific failure, it seems like our Metro bundler
          // produced an error while bundling, lets output this to our
          // users for feedback.
          //
          if (failure && typeof failure === 'object') {
            if (failure.errors) {
              failure.errors.forEach((err) => {
                console.error(err.description);
              });
            } else {
              console.error(failure);
            }
          } else {
            console.error.apply(console, payload);
          }

          if (!flags.watch) process.exit(1);
        } else if (!flags.watch) process.exit(0);
      }
    });

    await send('run', { ...flags, opts });
    await exec('modify', 'websocket', { send });
  });
};
