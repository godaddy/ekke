import bridge, { render } from '../../native/bridge';
import EventEmitter from 'eventemitter3';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(native) bridge', function () {
  it('exposes a render method', function () {
    assume(render).is.a('function');
  });

  it('exposes the eventemitter', function () {
    assume(bridge).is.instanceOf(EventEmitter);
  });
});
