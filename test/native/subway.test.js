import Subway from '../../native/subway.js';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(native) subway', function () {
  let sub;

  beforeEach(function () {
    sub = new Subway('localhost', 1975);
  });

  afterEach(function () {
    sub.destroy();
  });

  describe('#send', function () {
    it('is a function', function () {
      assume(sub.send).is.a('function');
    });

    it('queues the message (we have no connection)', function () {
      assume(sub.queue).is.a('array');
      assume(sub.queue).is.length(0);

      sub.send('event', 'message', 'included', 'in', 'payload');

      assume(sub.queue).is.length(1);
      assume(sub.queue[0]).is.a('string');
      assume(sub.queue[0]).equals(JSON.stringify({
        event: 'event',
        payload: ['message', 'included', 'in', 'payload']
      }));
    });
  });

  describe('#request', function () {
    it('makes a http request', async function () {
      const res = await sub.request({
        url: 'http://example.com/foo',
        method: 'GET'
      });

      assume(res).is.a('string');
      assume(res).equals('this is a reply');
    });

    it('throws an error when a non 200 status code is received', async function () {
      const done = assume.plan(4);

      try {
        await sub.request({
          url: 'http://example.com/404',
          method: 'GET'
        });
      } catch (e) {
        assume(e).is.a('error');
        assume(e.message).equals('Incorrect status code recieved: 404');
      }

      try {
        await sub.request({
          url: 'http://example.com/500',
          method: 'GET'
        });
      } catch (e) {
        assume(e).is.a('error');
        assume(e.message).equals('Incorrect status code recieved: 500');
      }

      done();
    });

    it('throws an error on timeout', async function () {
      const done = assume.plan(2);

      try {
        await sub.request({
          url: 'http://example.com/timeout',
          timeout: '1 second',
          method: 'GET'
        });
      } catch (e) {
        assume(e).is.a('error');
        assume(e.message).equals('Failed to process request in a timely manner');
      }

      done();
    });

    it('throws an error when shit breaks', async function () {
      const done = assume.plan(1);

      try {
        await sub.request({
          url: 'http://example.com/error',
          method: 'GET'
        });
      } catch (e) {
        assume(e).is.a('error');
      }

      done();
    });
  });
});
