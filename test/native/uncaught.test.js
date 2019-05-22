import uncaught from '../../native/uncaught';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(native) uncaught', function () {
  function fixture() {}

  beforeEach(function () {
    ErrorUtils.setGlobalHandler(fixture);
    assume(ErrorUtils.getGlobalHandler()).equals(fixture);
  });

  it('is exported as a function', function () {
    assume(uncaught).is.a('function');
  });

  it('returns a destroy function when called', function () {
    const destroy = uncaught(() => {});

    assume(destroy).is.a('function');
  });

  it('restores the previous callback when destroyed', function () {
    const destroy = uncaught(() => {});
    assume(ErrorUtils.getGlobalHandler()).does.not.equals(fixture);

    destroy();
    assume(ErrorUtils.getGlobalHandler()).equals(fixture);
  });

  it('does not restore previous callback when overriden', function () {
    const destroy = uncaught(() => {});

    function nope() {}
    ErrorUtils.setGlobalHandler(nope);

    destroy();
    assume(ErrorUtils.getGlobalHandler()).equals(nope);
  });

  it('can call the destroy method multiple times', function () {
    function one() {}
    function two() {}

    ErrorUtils.setGlobalHandler(one);
    ErrorUtils.setGlobalHandler(two);

    const destroy = uncaught(() => {});

    destroy();
    assume(ErrorUtils.getGlobalHandler()).equals(two);

    destroy();
    assume(ErrorUtils.getGlobalHandler()).equals(two);

    destroy();
    assume(ErrorUtils.getGlobalHandler()).equals(two);
  });

  it('executes the callback when an exception is thrown', function (next) {
    uncaught(function (e, fatal) {
      assume(e).is.a('error');
      assume(e.message).equals('custom error');
      assume(fatal).is.false();

      next();
    });

    ErrorUtils.simulate(new Error('custom error'));
  });

  it('restores the previous listener on callback execution', function (next) {
    uncaught(function (e, fatal) {
      assume(e).is.a('error');
      assume(e.message).equals('custom error');
      assume(fatal).is.false();

      next();
    });

    ErrorUtils.simulate(new Error('custom error'));
    assume(ErrorUtils.getGlobalHandler()).equals(fixture);
  });
});
