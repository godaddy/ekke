import createRenderer from '../../components/renderer';
import { describe, it } from 'mocha';
import { View } from 'react-native';
import { render } from 'ekke';
import assume from 'assume';
import React from 'react';

describe('(ekke) createRenderer', function () {
  it('is a function', function () {
    assume(createRenderer).is.a('function');
  });

  it('returns a React Component', function () {
    const Renderer = createRenderer(() => {});
    assume(!!Renderer.prototype.isReactComponent).is.true();
  });

  it('calls the supplied callback when the component is mounted', async function () {
    const next = assume.plan(1);

    const Renderer = createRenderer((setState) => {
      assume(setState).is.a('function');
    });

    await render(<Renderer />);
    next();
  });

  it('can render custom components using the supplied fn', async function () {
    let setState;

    class Square extends React.Component {
      render() {
        return (
          <View style={{ backgroundColor: 'blue', width: 100, height: 100 }} />
        );
      }
    }

    function paint(Component) {
      return new Promise((resolve) => {
        const ref = React.createRef();

        setState({ component: <Component ref={ ref } /> }, function () {
          resolve(ref);
        });
      });
    }

    const Renderer = createRenderer((state) => {
      setState = state;
    });

    await render(<Renderer />);
    assume(setState).is.a('function');

    const one = await paint(Square);
    assume(one.current).exists();

    const two = await paint(Square);
    assume(one.current).does.not.exist();
    assume(two.current).exists();
  });
});
