import createEkke from '../../components/ekke';
import { events } from '../../native/bridge';
import Plugin from '../../native/plugin';
import Subway from '../../native/subway';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(ekke) Plugin', function () {
  let sub;
  let plug;

  function create() {
    const { defaultProps } = createEkke(() => {});

    sub = new Subway(defaultProps.hostname, defaultProps.port);
    plug = new Plugin(sub);
  }

  beforeEach(create);
  afterEach(function () {
    plug.destroy();
  });

  describe('#use', function () {
    it('is called with the plugin API', function (next) {
      plug.use(function (api) {
        assume(api).is.a('object');
        assume(api).is.length(4);

        assume(api.modify).is.a('function');
        assume(api.modify).equals(plug.modify);

        assume(api.bridge).is.a('function');
        assume(api.bridge).equals(plug.bridge);

        assume(api.define).is.a('function');
        assume(api.destroy).is.a('function');

        next();
      });
    });

    describe('#define', function () {
      it('registers a new function', function () {
        function example() {};

        plug.use(function ({ define }) {
          define('example', example);
        });

        assume(plug.registry.has('example')).is.true();
        assume(plug.registry.get('example')).equals(example);
      });
    });

    describe('#modify', function () {
      it('assigns a new modifier', function () {
        function bar() {}

        plug.use(function ({ modify }) {
          modify('foo', bar);
        });

        assume(plug.modifiers.has('foo')).is.true();
        assume(plug.modifiers.get('foo')).is.a('array');
        assume(plug.modifiers.get('foo')[0]).is.a('object');
        assume(plug.modifiers.get('foo')[0].fn).equals(bar);
      });
    });

    describe('#destroy', function () {
      it('calls the supplied function on reset', function (next) {
        assume(plug.cleanup).is.length(0);

        plug.use(function ({ destroy }) {
          destroy(next)
        });

        assume(plug.cleanup).is.length(1);
        assume(plug.cleanup[0]).equals(next);

        plug.reset();
      });
    });

    describe('#bridge', function () {
      it('sends an event, but times out', async function () {
        const done = assume.plan(2);
        let bridge;

        plug.use(function (api) {
          bridge = api.bridge;
        });

        try { await bridge('test', 'foo', { timeout: 500 }); }
        catch (e) {
          assume(e).is.a('error');
          assume(e.message).equals('Failed to receive a responser from the CLI in a timely manner');
        }

        done();
      });
    });
  });

  describe('#transfer', function () {
    it('passes the registry to the given function', function (next) {
      plug.transfer(function receiver(registry) {
        assume(registry).equals(plug.registry);

        next();
      });
    });

    it('is assigned as `plugin:registry` listener', function () {
      const listeners = events.listeners('plugin:registry');
      const last = listeners[listeners.length - 1];

      assume(listeners).is.length(2); // our plugin engine, and this test.
      assume(last).equals(plug.transfer);
    });
  });
});
