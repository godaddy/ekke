import createEkke from '../../components/ekke';
import Subway from '../../native/subway';
import EventEmitter from 'eventemitter3';
import pkg from '../../package.json';
import { describe, it } from 'mocha';
import * as RN from 'react-native';
import { render } from 'ekke';
import ms from 'millisecond';
import assume from 'assume';
import yeast from 'yeast';

describe('(ekke) Subway', function () {
  let sub;

  beforeEach(function () {
    //
    // We want to re-use our defaults to establish a connection.
    //
    const { defaultProps } = createEkke(() => {});
    sub = new Subway(defaultProps.hostname, defaultProps.port);
  });

  it('is an EventEmitter', function () {
    assume(sub).is.instanceOf(EventEmitter);
  });

  describe('#bundle', function () {
    this.timeout(ms('2 minutes'));
    let bundle;

    before(async function () {
      bundle = await sub.bundle({ entry: 'package.json' });
    });

    it('requests the package.json as bundle', async function () {
      assume(bundle).includes(pkg.description);
      assume(bundle).includes(pkg.scripts.test);
    });

    it('can request any file from the project root', async function () {
      const test = await sub.bundle({ entry: 'test/ekke/subway.test.js' });

      assume(test).includes('yeah its going to include what ever we put in this assertion random words like this');
    });

    it('can minify the bundle', async function () {
      const test = await sub.bundle({ entry: 'package.json', minify: true });

      assume(test).does.not.equal(bundle);
      assume(bundle).does.includes(`\n\n`);
      assume(test).does.not.include(`\n\n`);
    });

    it('can download development and prod builds', async function () {
      const test = await sub.bundle({ entry: 'package.json', dev: false });

      assume(test).includes('__DEV__=false');
      assume(bundle).includes('__DEV__=true');
    });
  });

  describe('communication', function () {
    it('it flushes the message queue on connect', function (next) {
      const id = yeast();

      sub.once('pong', function (args, send) {
        assume(sub.queue).is.length(0);

        assume(args).is.a('array');
        assume(args[0]).equals(id);
        assume(send).equals(sub.send);

        disconnect();
        next();
      });

      assume(sub.queue).is.length(0);
      sub.send('ping', id);
      assume(sub.queue).is.length(1);

      const disconnect = sub.connect();
    });

    it('does not queue messages after connection', function (next) {
      const disconnect = sub.connect();

      sub.socket.addEventListener('open', function () {
        sub.once('pong', function (args) {
          assume(args[0]).equals('yeet');

          disconnect();
          next();
        });

        assume(sub.queue).is.length(0);
        sub.send('ping', 'yeet');
        assume(sub.queue).is.length(0);
      });
    });
  });

  describe('#alive', function () {
    it('calls the setup function', function (next) {
      sub.setup = next;
      sub.alive();
    });

    it('calls the supplied callback', function (next) {
      sub.setup = () => {};
      sub.alive(next);
    })
  });

  describe('#request', function () {
    it('makes a HTTP request', async function () {
      this.timeout(5000);

      const resp = await sub.request({
        url: 'https://google.com',
        method: 'GET'
      });

      assume(resp).is.a('string');
      assume(resp).includes('google.com');
    });
  });
});
