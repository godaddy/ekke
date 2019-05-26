const EventEmitter = require('eventemitter3');
const diagnostics = require('diagnostics');
const { borked } = require('borked');
const ms = require('millisecond');
const cli = require('argh').argv;

//
// Create a debugger.
//
const debug = diagnostics('ekke:api');

/**
 * A basic API, and CLI interface for Ekke. The only difference between
 * the API and CLI is that you manually need to pass in the options into
 * the constructor, and call our API methods.
 *
 * @constructor
 * @param {Object} [options] Parsed CLI arguments, or options object.
 * @public
 */
class Ekke extends EventEmitter {
  constructor(options = cli) {
    super();

    const ekke = this;

    this.plugins = {
      modify: new Map(),      // Store our modifier functions.
      bridge: new Map()       // Store the bridge functions.
    };

    /**
     * Merge the options, with our defaults to create our API configuration.
     *
     * @returns {Object} The merged configuration.
     * @public
     */
    this.config = () => ({
      argv: [],
      ...Ekke.defaults,
      ...options
    });

    this.ekke = {
      ekke: {
        ekke: {
          /**
           * If you're reading this your WTF-a-minute's must be sky rocketing
           * right now. Yes, I actually made an `ekke` object, with multiple
           * `ekke` keys, just so I could:
           *
           * ekke.ekke.ekke.ekke.PTANGZooBoingZnourrwringmm();
           *
           * To start the CLI application.
           *
           * @public
           */
          async PTANGZooBoingZnourrwringmm() {
            const flags = ekke.config();

            //
            // Attempt to find the command we should be running. If no command or
            // an unknown command is given, we're just gonna assume that the user
            // needs help, and redirect them to our CLI help command.
            //
            // Also by using `flags.argv.shift()` we also ensure that we remove
            // our command name from the `argv` so the command that is called
            // will have a clean `flags.argv` that contains only the stuff
            // it needs.
            //
            let command = flags.argv.shift() || 'help';
            if (typeof ekke[command] !== 'function') command = 'help';

            await ekke[command](flags);
          }
        }
      }
    };

    this.initialize();
  }

  /**
   * Initialize our API.
   *
   * @private
   */
  initialize() {
    //
    // Introduce our commands to the prototype.
    //
    Object.entries(Ekke.commands).forEach(([method, fn]) => {
      if (method in this) debug(`overriding existing method(${method})`);

      this[method] = fn.bind(this, {
        debug: diagnostics(`ekke:${method}`),
        ekke: this
      });
    });

    //
    // Pre-bind our utility functions.
    //
    ['use', 'exec'].forEach(method => {
      this[method] = this[method].bind(this);
    });

    //
    // Proxy the log events to the correct console.
    //
    this.on('log', args => console.log(...args));
    this.on('warn', args => console.warn(...args));
    this.on('info', args => console.info(...args));
    this.on('error', args => console.error(...args));

    //
    // Generic event handling.
    //
    this.on('ping', (args, send) => send('pong', args));
  }

  /**
   * Execute all assigned functions for the given map & method.
   *
   * @param {String} name Name of the plugin map we should run on.
   * @param {String} method Name of the method we want to execute.
   * @param {Object} data Data the functions should receive.
   * @public
   */
  async exec(name, method, data = {}, ...args) {
    const map = this.plugins[name];
    const methods = map.get(method);
    let result = data;

    if (!methods) return result;

    for (let i = 0; i < methods.length; i++) {
      const fn = methods[i].fn;
      const name = fn.displayName || fn.name;
      const timeout = ms(fn.timeout || '20 seconds');

      try {
        result = await borked(fn(result, ...args), timeout) || result;
      } catch (e) {
        debug(`failed to execute(${name})`, e);
      }
    }

    return result;
  }

  /**
   * Register a new plugin.
   *
   * @param {String|Function} name The name of the plugin.
   * @public
   */
  use(name) {
    let plugin;

    if (typeof name === 'function') plugin = name;
    else plugin = require(name);

    /**
     * Assign a plugin in their correct Map() instance.
     *
     * @param {Map} map The map we should register our method in.
     * @param {String} method Name of the event/method.
     * @param {Function} fn Function to be invoked.
     * @param {Object} options Plugin method configuration.
     * @private
     */
    function assign(map, method, fn, { priority = 100 } = {}) {
      const previous = map.get(method) || [];

      map.set(method, previous.concat({ fn, priority }).sort(function sort(a, b) {
        return b.priority - a.priority;
      }));
    }

    plugin({
      modify: assign.bind(assign, this.plugins.modify),
      bridge: assign.bind(assign, this.plugins.bridge),

      /**
       * Registers a new method on the API.
       *
       * @param {String} method Name of the API method we want to register.
       * @param {Function} fn Function to assign as method.
       * @public
       */
      register: (method, fn) => {
        if (method in this) debug(`plugin is overriding existing method ${method}`);

        this[method] = fn.bind(this, {
          debug: diagnostics(`ekke:${method}`),
          ekke: this
        });
      }
    });
  }
}

/**
 * The different commands that we're supporting.
 *
 * @type {Object}
 * @public
 */
Ekke.commands = {
  run: require('./commands/run'),
  help: require('./commands/help')
};

/**
 * The default CLI flags that are being used.
 *
 * @type {Object}
 * @public
 */
Ekke.defaults = {
  'hostname': 'localhost',    // Hostname we should create our server upon
  'port': 1975,               // The port number of the created server
  'silent': true,             // Silence Metro bundler
  'reset-cache': true         // The cache key poorly handled, so turn off by default.
};

//
// Expose our API class.
//
module.exports = Ekke;
