import Evaluator from '../../native/evaluator';
import createEkke from '../../components/ekke';
import Subway from '../../native/subway';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(ekke) Evaluator', function () {
  let sub;
  let eva;

  function create() {
    const { defaultProps } = createEkke(() => {});

    sub = new Subway(defaultProps.hostname, defaultProps.port);
    eva = new Evaluator(sub);
  }

  beforeEach(create);

  describe('bundle interactions:', function () {
    let bundle;

    before(async function () {
      if (!eva) create();

      bundle = await eva.download();
    });

    describe('#download', function () {
      it('downloads the bundle', async function () {
        assume(bundle).is.a('string');
        assume(bundle).includes('Anything I have write is in the bundle O_o');
      });
    });

    describe('#transform', function () {
      it('separates the code from the source map', function () {
        const { source, map } = eva.transform(bundle);

        assume(source).is.a('string');
        assume(map).is.a('string');

        assume(source).startWith('var __DEV__=true');
        assume(source).endsWith(');');

        assume(map).startWith('//# sourceMappingURL=data:application/json;charset=utf-8;base64');
        assume(map.split('\n')).is.length(1);
      });
    });

    describe('#compile', function () {
      it('transforms the bundle into a function', function () {
        const compiled = eva.compile(bundle);

        assume(compiled).is.a('function');
      });
    });
  });

  describe('#scope', function () {
    it('returns the current scope of global metro requires', function () {
      const scope = eva.scope();

      assume(scope).is.a('object');
      assume(scope.registerSegment).is.a('function');
      assume(scope.metroRequire).is.a('function');
      assume(scope.metroAccept).is.a('function');

      if (scope.nativeRequire) {
        assume(scope.nativeRequire).is.a('function');
      }

      assume(scope.define).is.a('function');
      assume(scope.clear).is.a('function');
    });

    it('can use the metroRequire', function () {
      const scope = eva.scope();
      const pkg = scope.metroRequire('package.json');

      assume(pkg).is.a('object');
      assume(pkg.name).equals('ekke');
    });

    it('reads out the global scope by default', function () {
      const globalScope = eva.scope(global);
      const scope = eva.scope();

      Object.keys(scope).forEach((x) => assume(scope[x]).equals(globalScope[x]));
    });

    it('reads the scope from passed object', function () {
      const scope = eva.scope({ __r: 'fake' });

      assume(scope.metroRequire);
    });

    it('each scope is directly accessible from the instance', function () {
      const scope = eva.scope();
      Object.keys(scope).forEach((x) => assume(eva[x]).is.a('function'));

      const pkg = eva.metroRequire('package.json');
      assume(pkg).is.a('object');
      assume(pkg.name).equals('ekke');
    })
  });
});
