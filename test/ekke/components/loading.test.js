import Loading from '../../components/loading';
import { describe, it } from 'mocha';
import { render } from 'ekke';
import assume from 'assume';
import React from 'react';

describe('(ekke) Loading', function () {
  function delay(t) {
    return new Promise((r) => setTimeout(r, t));
  }
  it('is a React Component', function () {
    assume(!!Loading.prototype.isReactComponent).is.true();
  });

  it('generates a different background', async function () {
    const ref = React.createRef();

    await render(<Loading ref={ ref } interval={ 20 } />);

    const loading = ref.current;
    const grd = loading.state.grd;

    await delay(30);

    assume(loading.state.grd).does.not.equal(grd);
  });
});
