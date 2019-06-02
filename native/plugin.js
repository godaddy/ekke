import EventEmitter from 'eventemitter3';
import diagnostics from 'diagnostics';
import shrubbery from 'shrubbery';
import { events } from './bridge';
import failure from 'failure';
import ms from 'millisecond';
import yeast from 'yeast';

//
// Create our debugging instance.
//
const debug = diagnostics('ekke:plugin');

/**
 * Orchestrate plugins.
 *
 * @param {Subway} subway Our communication class.
 * @public
 */
class Plugin extends EventEmitter {
  constructor(subway) {
    super();

    this.modifiers = new Map();     // Registered modifiers.
    this.inflight = new Map();      // Bridge requests that are awaiting reponse
    this.registry = new Map();      // Registry for our plugin functions.
    this.cleanup = [];              // Function to execute on reset.
    this.subway = subway;

    this.shrubbery = shrubbery({
      modifiers: this.modifiers
    }, {
      error: this.emit.bind(this, 'error'),
      context: this
    });

    ['bridge', 'modify', 'transfer'].forEach((method) => {
      this[method] = this[method].bind(this);
    });

    events.on('plugin:registry', this.transfer);
  }

  /**
   * Transfers the list of registered plugins.
   *
   * @param {Function} fn Completion callback.
   * @private
   */
  transfer(fn) {
    fn(this.registry);
  }

  /**
   * Create a communication bridge between the React-Native and our CLI.
   *
   * @param {String} name The name of the bridge to establish.
   * @param {Mixed} data Data structure to send to the CLI.
   * @param {Object} options Bridge configuration.
   * @returns {Promise} Callback once the bridge responded.
   * @public
   */
  bridge(name, data, { timeout = '20 seconds' } = {}) {
    const plugin = this;

    return new Promise(async function communicate(resolve, reject) {
      const reply = `reply:${yeast()}`;
      const timer = setTimeout(function tooLong() {
        responder(new Error('Failed to receive a responser from the CLI in a timely manner'));
      }, ms(timeout));

      /**
       * Clean up the communication and pass the data to the correct
       * promise.
       *
       * @param {Error} err Failure.
       * @param {Mixed} res Response from the bridge.
       * @returns {Void} Return early.
       * @private
       */
      function responder(err, res) {
        plugin.subway.off(reply, responder);
        plugin.inflight.delete(reply);
        clearTimeout(timer);

        if (err) {
          debug(`communication with our CLI failed`, err);
          return reject(failure(err));
        }

        debug(`received response from bridge(${name}/${reply})`, res);
        resolve(res);
      }

      plugin.subway.once(reply, responder);
      plugin.inflight.set(reply, responder);

      try {
        await plugin.subway.send('bridge', { name, reply, data });
        debug(`successfully send bridge(${name}) to our CLI with reply(${reply})`);
      } catch (e) {
        return responder(e);
      }
    });
  }

  /**
   * Execute our plugin.
   *
   * @param {String} name Name of the plugin map we should run on.
   * @param {String} key Key who's functions we should execute.
   * @param {Object|Mixed} data Data the functions should receive.
   * @returns {Object|Mixed} The transformed data.
   * @public
   */
  exec() {
    return this.shrubbery.exec(...arguments);
  }

  /**
   * Assign a new modifier.
   *
   * @param {String} key Key to store the function under.
   * @param {Function} fn Function to be invoked.
   * @param {Object} opts Plugin configuration.
   */
  modify(key, fn, opts) {
    this.shrubbery.add('modifiers', key, fn, opts);
  }

  /**
   * Register a new plugin.
   *
   * @param {Function} fn The plugin that needs to be executed.
   * @public
   */
  use(fn) {
    fn({
      modify: this.modify,
      bridge: this.bridge,

      /**
       * Registers a new function that can be used by developers.
       *
       * @param {String} name The name of the function.
       * @param {Function} plugin Function to be executed.
       * @public
       */
      set: (name, plugin) => {
        if (this.registry.has(name)) {
          debug(`about to override an existing plugin method(${name})`);
        }

        this.registry.set(name, plugin);
      },

      /**
       * Function to be executed when the plugin is removed/destroyed.
       *
       * @param {Function} clear Function to execute.
       * @public
       */
      destroy: (clear) => {
        this.cleanup.push(clear);
      }
    });
  }

  /**
   * Reset our all the plugins and prepare for a new wave of plugins.
   *
   * @public
   */
  reset() {
    this.cleanup.forEach(function destroyPlugins(fn) {
      fn();
    });

    this.inflight.forEach(function rejectRegistry(responder) {
      responder(new Error('Test was completed, but this function was never executed'));
    });

    this.modifiers.clear();
    this.registry.clear();
    this.inflight.clear();
    this.cleanup.length = 0;
  }

  /**
   * Completely destroy the plugin engine, leave no trace behind.
   *
   * @public
   */
  destroy() {
    this.reset();
    events.off('plugin:registry', this.transfer);
  }
}

export {
  Plugin as default,
  Plugin
};
