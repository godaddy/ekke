import { render, use } from './native/bridge';
import create from './components/ekke';
import Subway from './native/subway';
import Screen from './native/screen';
import Plugin from './native/plugin';
import runner from './native/runner';

/**
 * Create our Ekke component that allows us to intercept the rootTag
 * from the application.
 *
 * @type {Component}
 * @public
 */
const Ekke = create(async function mounted(rootTag, props = {}) {
  //
  // When we want to test Ekke, in Ekke, but we don't want to execute tests
  // again while our tests are running.
  //
  if (typeof props.NiPengNeeWom === 'function') {
    return props.NiPengNeeWom(...arguments);
  }

  const subway = new Subway(props.hostname, props.port);
  const screen = new Screen(rootTag);
  const plugin = new Plugin(subway);

  subway.on('run', function run(opts = {}) {
    runner({
      config: { ...props, ...opts },
      subway,
      screen,
      plugin
    });
  });

  //
  // Everything is setup correctly, we can now wait for the service to
  // become alive.
  //
  subway.alive(function alive() {
    if (props.alive) props.alive();
  }, props.interval);
});

//
// Indication of which build is loaded.
//
Ekke.prod = false;
Ekke.dev = true;

export {
  Ekke as default,
  render,
  Ekke,
  use
};
