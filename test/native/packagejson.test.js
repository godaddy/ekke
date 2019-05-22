import pkg from '../../package.json';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(ekke) package.json', function () {
  const ekke = '../../ekke.js';

  beforeEach(function () {
    const key = require.resolve(ekke);
    delete require.cache[key];
  });

  function prod() {
    process.env.NODE_ENV = 'production';
    return require(ekke);
  }

  function dev() {
    process.env.NODE_ENV = 'asfasdfas';
    return require(ekke);
  }

  it('has a different react-native entry point', function () {
    assume(pkg.main).does.not.equal(pkg['react-native']);

    assume(pkg.main).equals('api/index.js');
    assume(pkg['react-native']).equals('ekke.js');
  });

  describe('production/development builds', function () {
    it('loads `production` for NODE_ENV=production', function () {
      const { Ekke, render } = prod();

      assume(Ekke.prod).is.true();
      assume(Ekke.dev).is.false();

      assume(render).is.a('function');
    });

    it('loads `development` for NODE_ENV= the rest', function () {
      const { Ekke, render } = dev();

      assume(Ekke.prod).is.false();
      assume(Ekke.dev).is.true();

      assume(render).is.a('function');
    });
  });
});
