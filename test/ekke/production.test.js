import { render as renderProd, use, Ekke } from '../../production';
import { describe, it } from 'mocha';
import { View } from 'react-native';
import { render } from 'ekke';
import assume from 'assume';
import React from 'react';

describe('(ekke) production', function () {
  it('is not the same as our development render', function () {
    assume(renderProd).is.a('function');
    assume(render).is.a('function');
    assume(render).does.not.equal(renderProd);
  });

  describe('#render', function () {
    it('is a function', function () {
      assume(renderProd).is.a('function');
    });

    it('throw an error, as it doesnt work in prod', async function () {
      const done = assume.plan(2);

      try { await renderProd(<View />); }
      catch (e) {
        assume(e).is.a('error');
        assume(e.message).equals('The render method is disabled in production');
      }

      done();
    });
  });

  describe('#use', function () {
    it('is a function', function () {
      assume(use).is.a('function');
    });

    it('throw an error, as it doesnt work in prod', async function () {
      const done = assume.plan(2);

      try { await use('name'); }
      catch (e) {
        assume(e).is.a('error');
        assume(e.message).equals('The use method is disabled in production');
      }

      done();
    });
  });

  describe('#Ekke', function () {
    it('it can still render as React component', async function () {
      await render(<Ekke />);

      const ref = React.createRef();
      await render(
        <Ekke>
          <View ref={ ref } />
        </Ekke>
      );

      assume(ref.current).is.a('object');
    });
  });
});
