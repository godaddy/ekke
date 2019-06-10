import { tasked, destroyer } from '../../native/utils';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(native) util', function () {
  describe('#tasked', function () {
    it('is a function', function () {
      assume(tasked).is.a('function');
    });

    it('returns an object', function () {
      const api = tasked(() => {});

      assume(api).is.a('object');
      assume(api).is.length(2);
      assume(api.run).is.a('asyncfunction');
      assume(api.done).is.a('asyncfunction');
    });

    describe('#run', function () {
      it('executes the task', async function () {
        const { run } = tasked(() => { throw new Error('fail'); });
        let called = false;

        await run(() => {
          called = true;
        });

        assume(called).true();
      });

      it('receives the done as argument', async function () {
        const { run, done } = tasked(() => { throw new Error('fail'); });
        let what;

        await run((cb) => {
          what = cb;
        });

        assume(what).equals(done);
      });

      it('executes all tasks', async function () {
        const { run } = tasked(() => { throw new Error('fail'); });
        let calls = [];

        await run(() => {
          calls.push('what');
        });

        await run(async () => {
          calls.push('is');
        });

        await run(async () => {
          calls.push('up');
        });

        assume(calls.join(' ')).equals('what is up');
      });

      it('stop execution on error', async function () {
        const { run } = tasked(() => {});
        let calls = [];

        await run(() => {
          calls.push('what');
        });

        await run(async () => {
          throw new Error('Stop all the execution');
          calls.push('is');
        });

        await run(async () => {
          calls.push('up');
        });

        assume(calls.join(' ')).equals('what');
      });

      it('calls the callback on error', async function () {
        let called = false;
        const { run } = tasked((e) => {
          assume(e).is.a('error');
          assume(e.message).equals('yeh');

          called = true;
        });

        await run(() => {
          throw new Error('yeh');
        });

        assume(called).is.true();
      });

      it('can control if the execution should stop', async function () {
        const { run } = tasked(() => true);
        let calls = [];

        await run(() => {
          calls.push('what');
        });

        await run(async () => {
          throw new Error('Stop all the execution');
          calls.push('is');
        });

        await run(async () => {
          calls.push('up');
        });

        assume(calls.join(' ')).equals('what up');
      });

      it('can control the execution using done', async function () {
        const { run, done } = tasked(() => false);
        let calls = [];

        await run(() => {
          calls.push('what');
        });

        await run(async () => {
          calls.push('is');
        });

        await done();

        await run(async () => {
          calls.push('up');
        });

        assume(calls.join(' ')).equals('what is');
      });
    });
  });

  describe('#destroyer', function () {
    it('is a function', function () {
      assume(destroyer).is.a('function');
    });

    it('returns an object', function () {
      const api = destroyer();

      assume(api).is.a('object');
      assume(api).is.length(2);
      assume(api.destroy).is.a('function');
      assume(api.teardown).is.a('asyncfunction');
    });
    it('registers the cleanup method', async function () {
      const { destroy, teardown } = destroyer();
      let called = false;

      destroy(() => { called = true });
      await teardown();

      assume(called).is.true();
    });

    it('can register multiple functions', async function () {
      const { destroy, teardown } = destroyer();
      const log = [];

      destroy(
        () => { log.push(1); },
        () => { log.push(2); },
      );

      destroy(() => {
        log.push(3);
      });

      assume(log).is.length(0);
      await teardown();
      assume(log).deep.equals([1,2,3]);
    });

    it('calls the when no functions are registered callback', function (next) {
      const { destroy, teardown } = destroyer(next);
      teardown();
    });

    it('calls the callback', function (next) {
      const log = [];
      const { destroy, teardown } = destroyer(function () {
        assume(log).deep.equals([1,2,3]);
        next();
      });

      destroy(
        () => { log.push(1); },
        () => { log.push(2); },
      );

      destroy(() => {
        log.push(3);
      });

      teardown();
    });

    it('only calls the destroy methods once', async function () {
      const { destroy, teardown } = destroyer();
      const log = [];

      destroy(() => {
        log.push('called');
      });

      await teardown();
      await teardown();
      await teardown();

      assume(log).deep.equals(['called']);
    });
  });
});
