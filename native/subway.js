import stringify from 'json-stringify-safe';
import EventEmitter from 'eventemitter3';
import { Platform } from 'react-native';
import diagnostics from 'diagnostics';
import qs from 'querystringify';
import Timers from 'tick-tock';
import failure from 'failure';
import ms from 'millisecond';
import once from 'one-time';
import yeast from 'yeast';

//
// Dedicated subway debugger.
//
const debug = diagnostics('ekke:subway');

/**
 * Subway, our API client for Metro.
 *
 * @constructor
 * @param {String} hostname The hostname of the service.
 * @param {Number} port The port number of the host.
 * @public
 */
class Subway extends EventEmitter {
  constructor(hostname, port) {
    super();

    //
    // The entry path, that stores our super secret, test-specific endpoint
    // on our Metro bundler.
    //
    this.entry = 'Ekke-Ekke-Ekke-Ekke-PTANG.Zoo-Boing.Znourrwringmm';

    this.timers = new Timers();           // Our timer management.
    this.hostname = hostname;             // Hostname of the URL to hit.
    this.active = new Set();              // Active running XHR requests.
    this.port = port;                     // Port number of the hostname.
    this.socket = null;                   // Reference to our active socket.
    this.queue = [];                      // Message queue.

    //
    // Methods that need to be pre-bound so they can be shared between different
    // class's
    //
    this.send = this.send.bind(this);
  }

  /**
   * @typedef {object} ConnectionOptions
   * @prop {string} [timeout='1 minute'] Timeout for test runs
   * @prop {string} [namespace='ekke'] Namespace for WebSocket endpoint.
   */
  /**
   * Establish a connection with the WebSocket server that we've attached
   * to the metro bundler so we can notify it of our test suite progress.
   *
   * @param {ConnectionOptions} options Connection configuration.
   * @returns {Function} Clean up function that kills the connection.
   * @public
   */
  connect(options) {
    const { namespace, timeout } = {
      timeout: '1 minute',
      namespace: 'ekke',

      ...options
    };

    const url = `ws://${this.hostname}:${this.port}/${namespace}`;
    const socket = new WebSocket(url);

    /**
     * The full clean-up pass that we need to do when a connection is closed.
     *
     * @type {Function}
     * @param {Boolean} [alive] Should we check if CLI comes back to life?
     * @public
     */
    const cleanup = once(function cleaner(alive = false) {
      try {
        socket.close();
      } catch (e) {
        debug('closing the socket failed, but at least we tried', e);
      }

      this.timers.clear('socket');
      this.socket = null;

      if (alive) this.alive();
    }.bind(this));

    /**
     * Handle incoming messages from the socket.
     *
     * @param {MessageEvent} event The WebSocket Message Event.
     * @private
     */
    socket.addEventListener('message', ({ data }) => {
      let event, payload;

      try {
        ({ event, payload = {} } = JSON.parse(data));
      } catch (e) {
        debug('failed to parse the payload from the ekke CLI', data);
        return;
      }

      this.emit(event, payload, this.send);
    });

    /**
     * The WebSocket connection successfully completed the handshake
     * operation with the server and is ready to send/receive events.
     *
     * @param {OpenEvent} evt The open event.
     * @private
     */
    socket.addEventListener('open', evt => {
      debug('websocket connection is open and ready', evt);
      this.timers.clear('socket');

      if (!this.queue.length) return;

      debug(`flushing queued messages(${this.queue.length})`);

      this.queue.forEach(payload => socket.send(payload));
      this.queue.length = 0;
    });

    /**
     * The WebSocket connection was closed, but this was expected as it was
     * either caused by the server that closed the connection or manual close.
     *
     * @private
     */
    socket.addEventListener('close', () => {
      debug('the websocket connection has been closed, either by server or client');

      cleanup(true);
    });

    /**
     * The connection was closed due to an unexpected error. Could be WebSocket
     * frame/protocol miss match, broken network pipe, anything really.
     *
     * @param {Error} e The cause.
     * @private
     */
    socket.addEventListener('error', e => {
      debug('websocket connection resulted in an error', e);

      cleanup(true);
    });

    this.timers.setTimeout('socket', function timedout() {
      debug('failed to connection in timely manner');
      cleanup(true);
    }, timeout);

    this.socket = socket;
    return cleanup;
  }

  /**
   * Send a message to the CLI.
   *
   * @param {String} event The event name.
   * @param {Object|Array|String} payload What ever the message is.
   * @returns {Promise} Resolves when the message is send.
   * @public
   */
  send(event, ...payload) {
    return new Promise((resolve, reject) => {
      let message;

      try {
        message = stringify({ event, payload });
      } catch (e) {
        return reject(e);
      }

      /**
       * We need to deal with a Node.js based error first callbacks.
       *
       * @param {Error} [err] Error first callback.
       * @param {Mixed} data The actual response.
       * @returns {Void} Return early.
       * @private
       */
      function fn(err, data) {
        if (err) return reject(err);
        resolve(data);
      }

      //
      // We can only send messages when we have a socket, and if the socket
      // is in an WebSocket.OPEN state. In any other case it would most likely
      // cause an error.
      //
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        debug('no active connection has been established yet, queueing message', message);
        this.queue.push(message);

        return resolve();
      }

      //
      // While WebSocket.OPEN should give enough confidence that it's safe to
      // write.. It's better to be safe than sorry here.
      //
      try {
        this.socket.send(message, fn);
      } catch (e) {
        debug('websocket lied, we cant write :sadface:', e);
        reject(e);
      }
    });
  }

  /**
   * Fetches the bundle that the metro bundler has created for us.
   *
   * @param {Object} options Optional request options.
   * @returns {String} The bundle that needs to be evaluated.
   * @public
   */
  async bundle({
    inlineSourceMap = false,  // Inline the source map.
    platform = Platform.OS,   // The platform we want to bundle for.
    excludeSource = false,    // Don't include the source.
    runModule = true,         // Don't execute the imports.
    entry = 'index',          // Path of the entry file we want to load.
    minify = false,           // Minify the source
    method = 'GET',           // HTTP method to use.
    dev = __DEV__             // Debug build
  } = {}) {
    //
    // Construct the bundle URL that Metro bundler uses to output the bundle:
    //
    // http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false
    //
    const query = qs.stringify({
      inlineSourceMap,
      excludeSource,
      runModule,
      platform,
      minify,
      dev
    });

    const url = `http://${this.hostname}:${this.port}/${entry}.bundle?${query}`;

    debug('about to fetch a new bundle', url);
    return await this.request({
      timeout: false,
      method,
      url
    });
  }

  /**
   * Sends a pre-load request to the Metro bundler so it can start building
   * the bundle while we wait for things to setup. We don't really care about
   * what happens to the request, as long as it's made, and starts the bundle
   * operation in the CLI.
   *
   * @public
   */
  preload() {
    this.bundle({ method: 'HEAD', entry: this.entry })
      .then(() => {
        debug('preload request ended successfully');
      })
      .catch(e => {
        debug('preload request ended due to error', e);
      });
  }

  /**
   * Checks if the Metro service that is spawned by our CLI is alive and
   * ready to party.
   *
   * @param {Function} fn Completion callback when service is alive.
   * @param {String|Number} interval How long to wait after each check.
   * @public
   */
  alive(fn, interval = '10 seconds') {
    const subway = this;
    const payload = {
      url: `http://${this.hostname}:${this.port}/package.json.bundle`,
      timeout: '10 seconds',
      method: 'HEAD'
    };

    (async function again() {
      try {
        await subway.request(payload);
      } catch (e) {
        debug('nope, failed to check if server is alive', e);
        return subway.timers.setTimeout('alive', again, ms(interval));
      }

      subway.setup();
      debug('received a reponse from our HEAD request, service is alive');
      if (fn) fn();
    }());
  }

  /**
   * The service is considered alive, lets connect all the things.
   *
   * @public
   */
  async setup() {
    this.preload();
    this.connect();
  }

  /**
   * As the `fetch` API lacks support for aborting and timing out requests
   * we have to use the regular XMLHttpRequest to make HTTP requests.
   *
   * @param {Object} options The request options.
   * @returns {Promise<string>} Pinky promise.
   * @public
   */
  request(options = {}) {
    const { method, url, timeout, headers } = {
      timeout: 20000,
      method: 'GET',

      ...options
    };

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const id = yeast();

      /**
       * Prevents execution of resolve and reject due to race conditions.
       *
       * @type {Function}
       * @param {Error} err Optional error.
       * @param {String} data The response.
       * @returns {Undefined} Nothing useful.
       * @private
       */
      const done = once((err, data) => {
        this.active.delete(xhr);
        this.timers.clear(id);

        if (!err) {
          debug(`(${id}) successfully completed http request`);
          return resolve(data);
        }

        //
        // In case of error we want to be sure that the connection with the
        // server/socket was closed, so we're going to forcefuly abort.
        //
        try {
          xhr.abort();
        } catch (e) {
          debug('aborting xhr failed', e);
        }

        debug(`(${id}) http request failed because of error`, err.message);
        reject(err);
      });

      /**
       * Process readyState changes so we know when data is available.
       *
       * @returns {Undefined} Nothing.
       * @private
       */
      xhr.onreadystatechange = function onreadystatechange() {
        if (xhr.readyState !== 4) {
          return;
        }

        const text = xhr.responseText;
        const status = xhr.status;

        if (!(status >= 200 && status < 300)) {
          debug(text);

          let parsed = {};

          try {
            parsed = JSON.parse(text);
          } catch (e) {
            debug('failed to parse responseText as JSON', e);
          }

          const error = failure('Incorrect status code recieved: ' + status, {
            ...parsed,
            statusCode: status
          });

          return done(error);
        }

        return done(null, text);
      };

      //
      // When users are switching network, from wifi to 4g, or are generally
      // on unstable networks it could take to long for the request to
      // process, so we want to bail out when this happens.
      if (timeout) {
        xhr.timeout = ms(timeout);
        xhr.ontimeout = function ontimeout() {
          done(new Error('Failed to process request in a timely manner'));
        };

        //
        // Fallback for when timeout actually doesn't work, this for example the
        // case with the xhr2 polyfill in node, and could potentially be happening
        // with RN as well, when we timeout in xxx, we mean it, it should just
        // die.
        //
        this.timers.setTimeout(id, xhr.ontimeout, timeout);
      }

      xhr.onerror = function onerror(e) {
        done(new Error('Failed to process request due to error: ' + e.message));
      };

      debug(`(${id}) starting request(${url})`);
      this.active.add(xhr);

      xhr.open(method || 'GET', url);

      //
      // We've opened the xhr requests, so we can now process our custom
      // headers if needed.
      //
      if (headers) {
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
      }

      xhr.send();
    });
  }

  /**
   * Kill anything that still runs, so we can die in peace.
   *
   * @public
   */
  destroy() {
    //
    // If we have an established WebSocket connection, we want to close it
    // and clean up the references.
    //
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    for (const xhr of this.active) {
      try {
        xhr.abort();
      } catch (e) {
        debug('failed to abort the active XHR', e);
      }
    }

    this.active.clear();
    this.timers.end();
  }
}

export {
  Subway as default,
  Subway
};
