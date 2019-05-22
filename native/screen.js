import createRenderer from '../components/renderer';
import { AppRegistry } from 'react-native';
import diagnostics from 'diagnostics';
import bridge from './bridge';
import Ultron from 'ultron';

//
// Dedicated screen logger.
//
const debug = diagnostics('ekke:screen');

/**
 * The Screen class allows us to manage what is current presented on the
 * device's screen. It could be the original application that the developer
 * is working on, or our custom Ekke test runner. This class makes it all
 * possible and orchestrates all the required API calls to hack this
 * together.
 *
 * @constructor
 * @public
 */
class Screen {
  constructor(rootTag) {
    this.bridge = new Ultron(bridge);   // Created a managed EventEmitter.
    this.previous = this.discover();    // Name of the current mounted app.
    this.rootTag = rootTag;             // Reference to the rootTag

    //
    // Create our renderer reference so we
    //
    this.Renderer = createRenderer(this.manager.bind(this));
  }

  /**
   * Manages the interaction between our Screen, Bridge, and Renderer.
   *
   * @param {Function} setState Update rendering.
   * @public
   */
  manager(setState) {
    this.bridge.remove('render');
    this.bridge.on('render', (component, { resolve, reject }) => {
      //
      // In the rare case where `render` is called on a component that is
      // no longer mounted, it could raise an exception, in that case
      // do not want to eternally, but reject our given promise.
      //
      try {
        setState({ component }, resolve);
      } catch (e) {
        debug('failed to render the component', e);
        reject(e);
      }
    });
  }

  /**
   * Present our screen to the general public for viewing purpose.
   *
   * @public
   */
  present() {
    this.render(this.Renderer, 'EkkeEkkeEkkeEkke');
  }

  /**
   * Discover the application that the user has registered so we can
   * eventually restore control to this application once our test-suite
   * has stopped running.
   *
   * @returns {String} The name of the app.
   * @public
   */
  discover() {
    const keys = AppRegistry.getAppKeys();

    debug(`discovered(${keys[0]}) as active app`);
    return keys[0];
  }

  /**
   * Restore the users application by rerunning it in the previous rootTag.
   *
   * @public
   */
  restore() {
    if (this.previous) {
      debug('restoring previous application');
      this.mount(this.previous);
    }
  }

  /**
   * Mount the given application name as current running application.
   *
   * @param {String} name The name of the component to mount.
   * @public
   */
  mount(name) {
    debug(`mounting(${name}) as new screen`);

    AppRegistry.runApplication(name, {
      rootTag: this.rootTag,
      initialProps: {}
    });
  }

  /**
   * Registers a new Application that can be mounted.
   *
   * @param {String} name Name of the app that we register.
   * @param {Component} App Un-initialized component.
   * @returns {Boolean} Indication if the application has been mounted.
   * @public
   */
  register(name, App) {
    if (AppRegistry.getRunnable(name)) {
      debug(`the component(${name}) was already registered, skipping`);
      return false;
    }

    debug(`registering component(${name})`);
    AppRegistry.registerComponent(name, () => App);
    return true;
  }

  /**
   * Render a new Application on the screen.
   *
   * @param {Component} App The Component that needs to be rendered on screen.
   * @param {String} name The name of the component.
   * @public
   */
  render(App, name) {
    if (!name) name = App.name;

    debug(`attempting to render(${name}) as new screen`);

    this.register(name, App);
    this.mount(name);
  }
}

export {
  Screen as default,
  Screen
};
