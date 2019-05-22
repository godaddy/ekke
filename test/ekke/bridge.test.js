import bridge, { render as renderBridge } from '../../native/bridge';
import { describe, it } from 'mocha';
import * as RN from 'react-native';
import { render } from 'ekke';
import assume from 'assume';

describe('(ekke) bridge', function () {
  it('is an eventemitter', function () {
    const next = assume.plan(4);

    assume(bridge.on).is.a('function');
    assume(bridge.once).is.a('function');
    assume(bridge.emit).is.a('function');

    function callback(foo) {
      assume(foo).equals('bar');
      bridge.removeListener('this is test event');
    }

    bridge.on('this is a test event', callback);
    bridge.emit('this is a test event', 'bar');

    next();
  });

  it('exposes the React-Native library', function () {
    //
    // We cannot do a deep equal check as the exports in React-Native
    // are defined as getter so accessing those keys will lazy load
    // the components.
    //
    // We can't even do an assume(RN).equals(bridge.ReactNative);
    // without triggering a spam of import deprecations.
    //
    // So we're just going to a quick test to make sure that
    // some of the "core" components are there.
    //
    assume(RN.View).equals(bridge.ReactNative.View);
    assume(RN.Text).equals(bridge.ReactNative.Text);
    assume(RN.Platform).equals(bridge.ReactNative.Platform);
  });

  it('expose a render function', function () {
    assume(renderBridge).equals(render);
  });
});
