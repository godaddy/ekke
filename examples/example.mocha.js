import { AsyncStorage, View } from 'react-native';
import { describe, it } from 'mocha';
import { render } from 'ekke';
import assume from 'assume';
import React from 'react';
import chai from 'chai';

describe('(example) test suite', function () {
  this.timeout(15000);

  /**
   * A simple delay function so we can pause for a few ms.
   *
   * @param {Number} time Timeout in milliseconds
   * @returns {Promise} Our timeout.
   * @public
   */
  function delay(time) {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  it('runs', function () {
    assume(describe).is.a('function');
    assume(it).is.a('function');

    //
    // Check if all globals are correctly imported.
    //
    assume(after).is.a('function');
    assume(before).is.a('function');
    assume(afterEach).is.a('function');
    assume(beforeEach).is.a('function');
  });

  it('runs an async function', function (next) {
    setTimeout(function () {
      next();
    }, 1500);
  });

  it('runs an async await', async function () {
    await delay(1500);
  });

  describe('#render', function () {
    it('is a render function', function () {
      assume(render).is.a('function');
    });

    it('renders a massive red square', async function () {
      const ref = React.createRef();
      const square = (
        <View
          ref={ ref }
          style={{ backgroundColor: 'red', width: 200, height: 200 }}
        />
      );

      await render(square);
      assume(ref.current).is.a('object');

      //
      // This delay is not needed, but our rendering and test suite is so
      // quick that you barely see it happen on screen, so we give you 1500ms
      // see our amazing red square.
      //
      await delay(1500);
    });
  });

  describe('React-Native', function () {
    describe('AsyncStorage', function () {
      it('set and gets the data', async function () {
        await AsyncStorage.setItem('testing', 'values');

        assume(await AsyncStorage.getItem('testing')).equals('values');
      });

      it('can read the previous stored data', async function () {
        assume(await AsyncStorage.getItem('testing')).equals('values');
      });

      it('can remove the previous stored data', async function () {
        assume(await AsyncStorage.getItem('testing')).equals('values');

        await AsyncStorage.removeItem('testing');
        assume(await AsyncStorage.getItem('testing')).is.a('null');
      });
    });
  });

  describe('chai', function () {
    it('works with the expect syntax', function () {
      const expect = chai.expect;
      const foo = 'bar';

      expect(foo).to.be.a('string');
      expect(foo).to.equal('bar');
      expect(foo).to.have.lengthOf(3);
    });

    it('works with assert syntax', function () {
      const assert = chai.assert;
      const foo = 'bar';

      assert.typeOf(foo, 'string');
      assert.equal(foo, 'bar');
      assert.lengthOf(foo, 3);
    });

    it('works with the should() syntax', function () {
      chai.should();
      const foo = 'bar';

      foo.should.be.a('string');
      foo.should.equal('bar');
      foo.should.have.lengthOf(3);
    });
  });
});
