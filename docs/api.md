# API

The CLI that we've developed is nothing more than an initialization of our API
interface. Everything that you do on the CLI, can be done through a programmable
API.

This means that the following CLI command:

```bash
ekke run test/*.js --using mocha --require foo --require bar
```

Is identical to:

```js
const Ekke = require('ekke/api');
const ekke = new Ekke({ /* options */ });

await ekke.run({
  using: 'mocha',
  require: ['foo', 'bar'],
  argv: ['test/*.js']
});
```

## Usage

Our API module is available in our `api` folder and exposes our API class as
only export.

```js
const Ekke = require('ekke/api');
const ekke = new Ekke({ /* options */ });
```

The `Ekke` class can be configured using an optional options object.

The API has the following method:

- [use](#use)
- [define](#define)
- [exec](#exec)
- [run](#run)
- [help](#help)

#### use

Registers a new plugin. The plugin should either be name of the module that
needs to be required or a path to a file. There is **no duplicate detection**.

```js
ekke.use('ekke-screenshot');
ekke.use(require.resolve('ekke-screenshot'));
ekke.use(path.join(__dirname, 'my-plugin.js'));
```

If you are interested in learning more about our plugins, continue to our
[plugin API](./plugins.md).

#### define

Registers new method on our API. The method will be pre-bound to the created API instance, as well as receive our command interface as first argument.

The command interface is an object with:

- `debug` A dedicated debug logger under the correct namespace
- `ekke` Reference to the API instance.

The method accepts the following methods:

- `name` The name of the method you want to introduce.
- `fn` Function to get executed.

```js
ekke.define('foo', function foo({ debug, ekke }, args) {
  // debug message is locked behind: DEBUG=ekke:foo
  debug('this is a debug message the people will not see');

  console.log(args === 'bar'); // true
});

ekke.foo('bar');
```

#### exec

Executes all the function that are specified a given map/key combination. The
function accepts the following arguments:

- `name` The name of the map, should be the name of the maps you provided to
  the `shrubbery` function. If the name does not exist, it will be created.
- `key` The key who's function should be executed.
- `data` The data that should be passed to each function. This is data a plugin
  can modify. Each modification will be accessible by the next function. When
  a plugin returns a different value, it will be used as new `data` source.
  Once all functions are executed the final result will be returned. You can
  basically see each plugin function as an async map operation.
- `...args` The rest arguments that are always passed to the plugin, not
  intended to be modified, and also not returned.

```js
const result = await ekke.exec('modify', 'metro.config', { foo: 'bar' });
```

#### run

Runs the tests. It's a simple as that.

```js
await ekke.run({ using, watch, require, argv });
```

#### help

Display help information in stdout. The help information is automatically
generated using the `send-help` module that extracts the information from our
defined API methods.

```js
await ekke.help({ verbose: true, color: true });
```
