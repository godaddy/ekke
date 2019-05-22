const EventEmitter = require('eventemitter3');
const diagnostics = require('diagnostics');
const cli = require('argh').argv;

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
   * @public
   */
  initialize() {
    //
    // Introduce our commands to the prototype.
    //
    Object.entries(Ekke.commands).forEach(([method, fn]) => {
      this[method] = fn.bind(this, {
        debug: diagnostics(`ekke:${method}`),
        ekke: this
      });
    });

    //
    // Proxy the log events to the correct console.
    //
    this.on('log', args => console.log(...args));
    this.on('warn', args => console.warn(...args));
    this.on('info', args => console.info(...args));
    this.on('error', args => console.error(...args));

    //
    // Generic event handling
    //
    this.on('ping', (args, send) => send('pong', args));
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
