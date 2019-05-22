import { render as renderDev, Ekke } from '../../development';
import { describe, it } from 'mocha';
import { View } from 'react-native';
import { render } from 'ekke';
import assume from 'assume';
import React from 'react';

describe('(ekke) development', function () {
  describe('#render', function () {
    it('is the same as our render method', function () {
      assume(renderDev).is.a('function');
      assume(renderDev).equals(render);
    });
  });

  describe('#Ekke', function () {
    it('exposes the Ekke component', function () {
      assume(React.isValidElement(<Ekke />)).is.true();
    });

    it('gets initialized', async function () {
      const next = assume.plan(4);

      function NiPengNeeWom(rootTag, props) {
        assume(rootTag).is.a('number');

        assume(props).is.a('object');
        assume(props.hostname).is.a('string');
        assume(props.NiPengNeeWom).equals(NiPengNeeWom);
      }

      await render(
        <Ekke NiPengNeeWom={ NiPengNeeWom } />
      );

      next();
    });

    it('renders the children if provided', async function () {
      /**
       * Fail safe to ensure that Ekke's initialized is never executed
       * more than once. The first initialization happens in our first test.
       */
      function nope() {
        throw new Error('I should never be executed');
      }

      await render(<Ekke NiPengNeeWom={ nope } />);

      const ref = React.createRef();
      await render(
        <Ekke NiPengNeeWom={ nope }>
          <View ref={ ref } />
        </Ekke>
      );

      assume(ref.current).is.a('object');
    })
  });
});
