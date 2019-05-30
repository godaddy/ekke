import bridge from './fixtures/bridge';
import { describe, it } from 'mocha';
import Ekke from '../../api';
import assume from 'assume';
import path from 'path';

describe.only('(API) Plugins', function () {
  const fixture = path.join(__dirname, 'fixtures');
  let ekke;

  beforeEach(function () {
    ekke = new Ekke();
  });

  describe('#use', function () {
    it('is a function', function () {
      assume(ekke.use).is.a('function');
    });

    it('executes the plugin', function (next) {
      bridge.once('plugin', function plugin(api) {
        assume(api).is.a('object');

        assume(api).is.length(3);
        assume(api.modify).is.a('function');
        assume(api.bridge).is.a('function');
        assume(api.register).is.a('function');

        next();
      });

      ekke.use(fixture);
    });

    describe('#register', function () {
      it('introduces a new function on the API', function (next) {
        function foo() {
          next();
        }

        bridge.once('plugin', function plugin({ register }) {
          assume(ekke.foo).is.not.a('function');
          register('foo', foo);
          assume(ekke.foo).is.a('function');
        });

        ekke.use(fixture);
        ekke.foo();
      });

      it('wraps the supplied function', function (next) {
        function foo(api) {
          assume(this).equals(ekke);

          assume(api).is.a('object');
          assume(api).is.length(2);
          assume(api.debug).is.a('function');
          assume(api.ekke).equals(ekke);

          next();
        }

        bridge.once('plugin', function plugin({ register }) {
          register('foo', foo);

          assume(ekke.foo).does.not.equal('foo');
          assume(ekke.foo.name).contains('foo');
        });

        ekke.use(fixture);
        ekke.foo();
      });
    });

    describe('#modify', function () {
      it('registers the supplied function', function () {
        function foo() {}

        bridge.once('plugin', function plugin({ modify }) {
          modify('foo', foo);
        });

        assume(ekke.plugins.modify).is.a('map');
        assume(ekke.plugins.modify).is.length(0);

        ekke.use(fixture);

        const modifiers = ekke.plugins.modify.get('foo');

        assume(modifiers).is.a('array');
        assume(modifiers).is.length(1);

        assume(modifiers[0]).is.a('object');
        assume(modifiers[0].priority).equals(100);
        assume(modifiers[0].fn).equals(foo);
      });

      it('adds multiple plugins', function () {
        function foo() {}

        function plugin({ modify }) {
          modify('foo', foo);
        }

        bridge.on('plugin', plugin);

        ekke.use(fixture);
        ekke.use(fixture);

        const modifiers = ekke.plugins.modify.get('foo');

        assume(modifiers).is.a('array');
        assume(modifiers).is.length(2);

        assume(modifiers[0]).is.a('object');
        assume(modifiers[0].priority).equals(100);
        assume(modifiers[0].fn).equals(foo);

        assume(modifiers[1]).is.a('object');
        assume(modifiers[1].priority).equals(100);
        assume(modifiers[1].fn).equals(foo);

        bridge.off('plugin', plugin);
      });

      it('sorts the plugins based on `priority`', function () {
        function foo() {}
        function bar() {}
        function baz() {}

        bridge.once('plugin', ({ modify }) => {
          modify('foo', foo, {
            priority: 90
          });
        });
        ekke.use(fixture);

        bridge.once('plugin', ({ modify }) => {
          modify('foo', bar, {
            priority: 120
          });
        });
        ekke.use(fixture);

        bridge.once('plugin', ({ modify }) => {
          modify('foo', baz);
        });
        ekke.use(fixture);

        const modifiers = ekke.plugins.modify.get('foo');

        assume(modifiers).is.a('array');
        assume(modifiers).is.length(3);

        assume(modifiers[0]).is.a('object');
        assume(modifiers[0].priority).equals(120);
        assume(modifiers[0].fn).equals(bar);

        assume(modifiers[1]).is.a('object');
        assume(modifiers[1].priority).equals(100);
        assume(modifiers[1].fn).equals(baz);

        assume(modifiers[2]).is.a('object');
        assume(modifiers[2].priority).equals(90);
        assume(modifiers[2].fn).equals(foo);
      });
    });

    describe('#bridge', function () {
      it('registers the supplied function', function () {
        function foo() {}

        function plugin({ bridge }) {
          bridge('foo', foo);
        }

        assume(ekke.plugins.bridge).is.a('map');
        assume(ekke.plugins.bridge).is.length(0);

        ekke.use(plugin);

        const bridges = ekke.plugins.bridge.get('foo');

        assume(bridges).is.a('array');
        assume(bridges).is.length(1);

        assume(bridges[0]).is.a('object');
        assume(bridges[0].priority).equals(100);
        assume(bridges[0].fn).equals(foo);
      });

      it('adds multiple plugins', function () {
        function foo() {}

        function plugin({ bridge }) {
          bridge('foo', foo);
        }

        ekke.use(plugin);
        ekke.use(plugin);

        const bridges = ekke.plugins.bridge.get('foo');

        assume(bridges).is.a('array');
        assume(bridges).is.length(2);

        assume(bridges[0]).is.a('object');
        assume(bridges[0].priority).equals(100);
        assume(bridges[0].fn).equals(foo);

        assume(bridges[1]).is.a('object');
        assume(bridges[1].priority).equals(100);
        assume(bridges[1].fn).equals(foo);
      });

      it('sorts the plugins based on `priority`', function () {
        function foo() {}
        function bar() {}
        function baz() {}

        ekke.use(({ bridge }) => {
          bridge('foo', foo, {
            priority: 90
          });
        });

        ekke.use(({ bridge }) => {
          bridge('foo', bar, {
            priority: 120
          });
        });

        ekke.use(({ bridge }) => {
          bridge('foo', baz);
        });

        const bridges = ekke.plugins.bridge.get('foo');

        assume(bridges).is.a('array');
        assume(bridges).is.length(3);

        assume(bridges[0]).is.a('object');
        assume(bridges[0].priority).equals(120);
        assume(bridges[0].fn).equals(bar);

        assume(bridges[1]).is.a('object');
        assume(bridges[1].priority).equals(100);
        assume(bridges[1].fn).equals(baz);

        assume(bridges[2]).is.a('object');
        assume(bridges[2].priority).equals(90);
        assume(bridges[2].fn).equals(foo);
      });
    });
  });

  describe('#exec', function () {
    it('executes functions in our given plugin map', async function () {
      const done = assume.plan(6);

      ekke.use(({ modify }) => {
        modify('example', async function example(data) {
          assume(data).is.a('object');

          assume(data).is.length(1);
          assume(data.foo).equals('bar');

          return data;
        });
      });

      const result = await ekke.exec('modify', 'example', {
        foo: 'bar'
      });

      assume(result).is.a('object');
      assume(result).is.length(1);
      assume(result.foo).equals('bar');

      done();
    });

    it('always returns a object', async function () {
      assume(await ekke.exec('modify', 'foo')).deep.equals({});
    });

    it('receives the additional args', async function () {
      ekke.use(({ modify }) => {
        modify('example', async function example(data, ...args) {
          assume(data).is.a('object');

          assume(data).is.length(1);
          assume(data.foo).equals('bar');

          assume(args).is.length(3);
          assume(args[0]).equals('another');
          assume(args[1]).equals('arg');
          assume(args[2]).equals('lol');

          return data;
        });
      });

      const result = await ekke.exec('modify', 'example', {
        foo: 'bar'
      }, 'another', 'arg', 'lol');
    });

    it('executes the methods in order', async function () {
      const results = [];

      ekke.use(({ modify }) => {
        modify('example', async function example() {
          results.push('last');
        }, { priority: 95 });

        modify('example', async function example() {
          results.push('first');
        }, { priority: 195 });

        modify('example', async function example() {
          results.push('middle');
        });
      });

      const data = await ekke.exec('modify', 'example', {
        foo: 'bar'
      });

      assume(results).deep.equals(['first', 'middle', 'last']);
      assume(data).deep.equals({ foo: 'bar' });
    });

    it('executed function can change the result', async function () {
      const done = assume.plan(3);

      ekke.use(({ modify }) => {
        modify('example', async function example(data) {
          assume(data).deep.equals({ send: 'help' });
        }, { priority: 95 });

        modify('example', async function example(data) {
          assume(data.foo).equals('bar');
          data.foo = 'baz';

          return data;
        }, { priority: 195 });

        modify('example', async function example(data) {
          assume(data.foo).equals('baz');

          return { send: 'help' };
        });
      });

      const data = await ekke.exec('modify', 'example', {
        foo: 'bar'
      });

      done();
      assume(data).deep.equals({ send: 'help' });
    });

    it('fails silently so a plugin can not break our core', async function () {
      ekke.use(({ modify }) => {
        modify('example', async function example(data) {
          throw new Error('I should not be causing any harm');
        });
      });

      const data = await ekke.exec('modify', 'example', {
        foo: 'bar'
      });

      assume(data).deep.equals({ foo: 'bar' });
    });
  });
});
