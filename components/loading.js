import { version, name } from '../package.json';
import { View, Text } from 'react-native';
import React, { Component } from 'react';
import references from 'references';
import PropTypes from 'prop-types';

const XD = {
  ROOT: {
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flex: 1
  },
  GRD: {
    position: 'absolute',
    fontFamily: 'Courier New',
    top: 0,
    color: 'rgba(255, 255, 255, .3)'
  },
  TXT: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  BOX: {
    backgroundColor: '#00A63F',
    padding: 15
  },
  V: {
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, .6)'
  }
};

/**
 * Simple broken grid generator that somehow generates interesting
 * background images during render.
 *
 * @param {Object} schema Some params to tweak stuff that we never touch.
 * @returns {String} Some ASCII pattern.
 * @public
 */
function background({ corner = '+', spaces = 4, blocks = 12, rng = 7 } = {}) {
  const glitches = '▒░~%°*▓#@,`.▘';
  const divider = spaces + 1;
  const dot = '·';
  let bg = '';

  /**
   * Generates the tile for our background.
   *
   * @returns {String} The background glitch to use.
   * @private
   */
  function tile() {
    if (Math.floor(Math.random() * rng) + 1 !== 7) return dot;

    return glitches.charAt(Math.floor(Math.random() * glitches.length));
  }

  for (let r = 0; r < blocks * spaces; r++) {
    for (let b = 0; b < blocks; b++) {
      bg += `${r % divider ? dot : corner} `;

      for (let s = 0; s < spaces; s++) {
        bg += `${tile()} `;
      }
    }
    bg += `${r % divider ? dot : corner}\n`;
  }

  return bg;
}

/**
 * A default loading screen for when our Ekke tests are running.
 *
 * @returns {Component} Our full screen loading component.
 * @public
 */
class Loading extends Component {
  constructor() {
    super(...arguments);

    this.references = references();
    this.interval = null;
    this.state = {
      grd: background()
    };
  }

  /**
   * Waiting for tests is boring, we don't really have the time to built in
   * a basic game like snake, space invaders, developer quiz, and what not.
   * If you read this feel free to come up with some crazy, open for PR's.
   *
   * So for now we're just going to animate the background by re-generating
   * our art on interval.
   *
   * @private
   */
  componentDidMount() {
    this.interval = setInterval(
      function again() {
        this.setState({ grd: background() });
      }.bind(this),
      this.props.interval
    );
  }

  /**
   * Clear our component when it gets unmounted.
   *
   * @private
   */
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  /**
   * Render our loading screen while the tests are being activated.
   *
   * @returns {Component} Our default screen.
   * @public
   */
  render() {
    const ref = this.references.create;

    return (
      <View style={ XD.ROOT }>
        <Text style={ XD.GRD } ref={ ref('grd') }>{this.state.grd}</Text>

        <View style={ XD.BOX }>
          <Text style={ XD.TXT } ref={ ref('name') }>{name}</Text>
          <Text style={ XD.V } ref={ ref('version') }>{version}</Text>
        </View>
      </View>
    );
  }
}

/**
 * PropType validation..
 *
 * @type {Object}
 * @public
 */
Loading.propTypes = {
  interval: PropTypes.number
};

/**
 * Default props.
 *
 * @type {Object}
 * @public
 */
Loading.defaultProps = {
  interval: 1500
};

export {
  Loading as default
};
