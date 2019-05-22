const configure = require('./metro/configure');
const WebSocketServer = require('ws').Server;
const Metro = require('metro');

/**
 * Create our server infrastructure.
 *
 * @param {object} data Our API/CLI flags.
 * @returns {Promise<object>} WebSocket and metro bundler
 * @public
 */
module.exports = async function metro(data) {
  const config = await configure(data);

  //
  // Metro inconsistencies:
  //
  // You can configure the `host` through the server config object, but not
  // the port number. They are extracting that from `config.server` object.
  // To provide consistency in the configuration we're going to forcefully
  // override the config.server with our own config data:
  //
  config.server.port = data.port;
  config.server.enableVisualizer = false;
  config.server.runInspectorProxy = false;

  const server = await Metro.runServer(config, {
    hmrEnabled: false,
    host: data.hostname
  });

  //
  // Ideally we want to piggyback the WebSocket servers that Metro creates,
  // but unfortunately there is no way to get into their instances, and they
  // don't listen to responses from the server, which is something that we
  // need in order to stream back the test results.
  //
  const ws = new WebSocketServer({
    path: '/ekke',
    server
  });

  return { ws, server };
};
