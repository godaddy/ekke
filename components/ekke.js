import { Platform } from 'react-native';
import diagnostics from 'diagnostics';
import PropTypes from 'prop-types';
import { Component } from 'react';
import once from 'one-time';

//
// Our dedicated component logger.
//
const debug = diagnostics('ekke:component');

/**
 * HOC: Create our Ekke component that will extract the rootTag id that was
 * used to render the users application, in addition to that we will extract
 * all the props that we applied to the component and use those as configuration
 * values.
 *
 * @param {Function} extract Function to call once we've obtained the rootTag.
 * @returns {Component} The Ekke component.
 * @public
 */
function createEkke(extract) {
  const expose = once(extract);

  /**
   * Story time children:
   *
   * We want Ekke to have the ability to render components in the application
   * so we can assert against it. We use the `AppRegistry` API to render
   * a different application, but this API _needs_ to have the `rootTag`
   * to render the app. There is no actual API inside React-Native to retrieve
   * this information. This specific information is however available by the
   * React AppContainer which wraps _every_ rendered React-Native Application
   * and provides this information through the legacy context API.
   *
   * So in order to get access to this information, we need to have a React
   * component, that uses the legacy API to extract the `rootTag` from the
   * `this.context` API, so we can pass it our `AppRegistry` orchestration.
   * And this is exactly what this component is doing.
   *
   * @constructor
   * @public
   */
  class Ekke extends Component {
    render() {
      const root = this.context.rootTag;

      //
      // Additional check, for when React-Native will migrate away from the
      // old context API, because then this code will no longer work as
      // intended and most likely will end up as an undefined.
      //
      // When that happens we will rather not execute our test suite because
      // there will be errors everywhere.
      //
      if (typeof root === 'number') {
        debug('found root tag, getting ready to initialize...');
        expose(root, { ...this.props });
      } else {
        debug('the rootTag context is no longer a number, please report this bug');
      }

      return this.props.children || null;
    }
  }

  /**
   * Specify which pieces of data we want to extract from the context API.
   *
   * @type {Object}
   * @public
   */
  Ekke.contextTypes = {
    rootTag: PropTypes.number
  };

  /**
   * The propTyes that get specified on our Ekke component are used our
   * primary source of configuration values.
   *
   * @type {Object}
   * @public
   */
  Ekke.propTypes = {
    hostname: PropTypes.string.isRequired,
    port: PropTypes.number.isRequired,
    children: PropTypes.node,
    interval: PropTypes.string,
    alive: PropTypes.func,

    //
    // This is an internal property and is hidden behind the 3 sacred words:
    // "Ni," "Peng," and "Nee-wom"!
    //
    // It should *not* be documented and consumed by the general public.
    //
    NiPengNeeWom: PropTypes.func
  };

  /**
   * Our default props, as we use the props as configuration values,
   * these are actually our default configuration values.
   *
   * @type {Object}
   * @public
   */
  Ekke.defaultProps = {
    interval: '10 seconds',
    hostname: Platform.OS === 'android' ? '10.0.2.2' : 'localhost',
    port: 1975
  };

  return Ekke;
}

export {
  createEkke as default,
  createEkke
};
