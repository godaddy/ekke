import intercept from '../../native/console';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(native) console', function () {
  const api = {
    send: () => {}
  };

  it('is an async function', function () {
    assume(intercept).is.a('asyncfunction');
  });

  it('returns an async function', async function () {
    const after = await intercept({ ...api });

    assume(after).is.a('asyncfunction');
    await after();
  });

  it('intercepts console[info|warn|log|error]', async function () {
    const asserts = [
      { method: 'console.warn', payload: ['what', 'is', 'up'] },
      { method: 'console.log', payload: ['im just loggin', { data: 'here' }] },
      { method: 'console.error', payload: ['error here'] },
      { method: 'console.info', payload: ['works as intended'] }
    ];

    const send = (method, ...payload) => {
      assume({ method, payload }).deep.equals(asserts.shift());
    };

    const after = await intercept({ send });

    console.warn('what', 'is', 'up');
    console.log('im just loggin', { data: 'here' });
    console.error('error here');
    console.info('works as intended');

    await after();
    console.log('    V This log message is intended, please ignore in test output');
  });
});
