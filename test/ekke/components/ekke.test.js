import createEkke from '../../components/ekke';
import { describe, it } from 'mocha';
import { View } from 'react-native';
import { render } from 'ekke';
import assume from 'assume';
import React from 'react';

describe('(ekke) createEkke', function () {
  it('is a function', function () {
    assume(createEkke).is.a('function');
  });

  it('returns a React Component', function () {
    const Ekke = createEkke(function () {});

    assume(!!Ekke.prototype.isReactComponent).is.true();
  });

  it('executes the supplied callback with a rootTag & props', async function () {
    const next = assume.plan(4);

    const Ekke = createEkke(function mounted(rootTag, props) {
      assume(rootTag).is.a('number');
      assume(props).is.a('object');
      assume(props.port).equals(1975);
      assume(props.interval).equals('10 seconds');
    });

    await render(<Ekke />);
    next();
  });

  it('only calls the supplied callback once', async function () {
    let calls = 0;

    const Ekke = createEkke(function mounted() {
      calls++;
    });

    await render(<Ekke />);
    await render(<Ekke />);
    await render(<Ekke />);
    await render(<Ekke />);
    await render(<Ekke />);

    assume(calls).equals(1);
  });
});
