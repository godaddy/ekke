import define from '../../api/commands/define';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('(API/commands) define', function () {
  it('is a function', function () {
    assume(define).is.a('function');
  });

  it('introduces the details to the function', function () {
    function example() {}

    const returned = define(example, {
      description: 'Hello world.',
      flags: {
        '--foo': 'bar'
      }
    });

    assume(returned).equals(example);
    assume(example.debug).equals('ekke:example');
    assume(example.ekke).equals('ekke-ekke-ekke');

    assume(example.description).is.a('array');
    assume(example.description).is.length(1);
    assume(example.description[0]).equals('Hello world.');

    assume(example.examples).is.a('array');
    assume(example.examples).is.length(0);

    assume(example.flags).is.a('object');
    assume(example.flags).is.length(1);
    assume(example.flags['--foo']).is.a('array');
    assume(example.flags['--foo']).is.length(1);
    assume(example.flags['--foo'][0]).equals('bar');
  });

  it('automatically transforms long descriptions in multiple items', function () {
    function example() {}

    define(example, {
      description: 'Hello world. This should be, item number 2! And this number 3',
      flags: {
        '--foo': 'This is a flag. Its used set `foo` as a boolean'
      }
    });

    assume(example.description).is.a('array');
    assume(example.description).is.length(3);
    assume(example.description[0]).equals('Hello world.');
    assume(example.description[1]).equals('This should be, item number 2!');
    assume(example.description[2]).equals('And this number 3');

    assume(example.flags['--foo']).is.a('array');
    assume(example.flags['--foo']).is.length(2);
    assume(example.flags['--foo'][0]).equals('This is a flag.');
    assume(example.flags['--foo'][1]).equals('Its used set `foo` as a boolean');
  });
});
