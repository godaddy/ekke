import source, { transform } from '../../api/metro/source';
import { describe, it } from 'mocha';
import { promisify } from 'util';
import assume from 'assume';
import path from 'path';
import fs from 'fs';

describe('(api/metro) source', function () {
  const readFile = promisify(fs.readFile);

  describe('#transform', function () {
    it('is a function', function () {
      assume(transform).is.a('function');
    });

    it('returns a empty object as string', function () {
      const fragment = transform([]);

      assume(fragment).is.a('string');
      assume(fragment).equals('{}');
    });

    it('transforms the given file to require statement', function () {
      const fragment = transform(['foo']);

      assume(fragment).is.a('string');
      assume(fragment).equals(`{
  "foo": require("foo")
}`);
    });

    it('correctly transforms multiple files', function () {
      const fragment = transform(['foo', 'bar']);

      assume(fragment).is.a('string');
      assume(fragment).equals(`{
  "foo": require("foo"),
  "bar": require("bar")
}`);
    });
  });

  it('is a function', function () {
    assume(source).is.a('asyncfunction');
  });

  it('returns the location of the created file', async function () {
    const location = await source({
      moduleName: 'ekke-ekke-ekke',
      globs: ['test/api/source.test.js'],
    });

    assume(location).is.a('string');
    assume(fs.existsSync(location)).is.true();
  });

  it('stores files in our tmp directory', async function () {
    const location = await source({
      moduleName: 'ekke-ekke-ekke',
      globs: ['test/api/source.test.js'],
    });

    const filename = path.basename(location);
    const tmp = path.join(__dirname, '..', '..', 'api', 'tmp');

    assume(location).equals(path.join(tmp, filename));
  });

  it('includes our requires as requires', async function () {
    const location = await source({
      moduleName: 'ekke-ekke-ekke',
      globs: ['test/api/source.test.js'],
      requires: ['require-name', 'another-require']
    });

    const file = await readFile(location, 'utf-8');
    assume(file).includes('require("require-name"),');
    assume(file).includes('require("another-require")');
  });

  it('includes our plugins as requires', async function () {
    const location = await source({
      moduleName: 'ekke-ekke-ekke',
      globs: ['test/api/source.test.js'],
      plugins: ['plugin-name', 'another-plugin']
    });

    const file = await readFile(location, 'utf-8');
    assume(file).includes('require("plugin-name"),');
    assume(file).includes('require("another-plugin")');
  });

  it('prefixes the glob with the moduleName', async function () {
    const location = await source({
      moduleName: 'fake-name-here',
      globs: ['test/api/source.test.js']
    });

    const file = await readFile(location, 'utf-8');

    const name = path.join('fake-name-here', 'test', 'api', 'source.test.js');
    assume(file).contains(`require(${JSON.stringify(name)})`);
  });
});
