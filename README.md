# `EKKE`

[![Greenkeeper badge](https://badges.greenkeeper.io/godaddy/ekke.svg)](https://greenkeeper.io/)

#### [Ekke-Ekke-Ekke-Ekke][NI] PTANG Zoo Boing! Z' nourrwringmm[...][Ekke]

`ekke` a unique new test runner for React-Native. Unlike other testing
frameworks, it doesn't execute your tests in Node.js, with a bunch of mocks, but
instead, it orchestrates the bundling and execution of tests directly **inside
your React-Native application**.  `ekke` allows your tests to fully access every
API to the platform has to offer.

### Why should you adopt Ekke for React-Native testing?

- **Platform independent** The test runner **does not contain any native code**
  that means that every platform that React-Native supports now, or in the
  future will work out of the box.
- **Code confidence** Tests run in the environment of your production code. No
  need to rely on imperfect mocks. Tests run on devices to guarantee API's match
  specifications.
- **Different test runners** At its core, Ekke is nothing more than an
  orchestration tool. We have built-in support for different test runners.
- **Rendering** It's not just unit tests. Ekke provides a rendering API that
  allows you to mount and render components in your test suite.

<p align="center">
  <img width="800" height="607" src="https://raw.githubusercontent.com/godaddy/ekke/master/docs/ekke-react-native-intro.gif" />
  <br />
  <sub>Ekke in action: running a test suite, streaming results back to the CLI</sub>
</p>

## Installation

The module is released in the public NPM Registry and can be installed by running:

```bash
npm install --save ekke
```

After installation, you can [integrate](#integration) `ekke` into your project.

## Table of Contents

- [Installation](#installation)
- [Integration](#integration)
- [Runners](#runners)
  - [mocha](#mocha)
  - [Tape](#tape)
- [API](#API)
  - [Component](#component)
  - [render](#render)
- [CLI](#cli)
  - [run](#run)
  - [help](#help)
- [Debugging](#debugging)
  - [The Ekke CLI](#the-ekke-cli)
  - [React Native Component](#react-native-component)

## Integration

Ekke needs a host application to run. That can either be the application you are
currently developing or fresh installation of `react-native init`.

Not sure what to pick?

- **Application developers** Using the application that you're currently
  developing is recommended. This allows your test suites to execute in
  precisely the same environment. Also, it will enable your test suites to
  leverage any `NativeModule` that your application might be consuming.
- **Library authors** It depends on the library you're developing. If you are
  building a native add-on, or include `NativeModules` as dependencies, it's
  advised to create an example application in your project that has all native
  libraries linked. TODO: What is the alternative here, if there is one?

Integrating is as easy as importing `ekke`, and including the [component] in
your app!

```js
import { Ekke } from 'ekke';

function App() {
  return (
    <>
      <Ekke />

      <View>
        <Text>Your App Here</Text>
      </View>
    </>
  )
}
```

You can now run your tests by executing the [run] command of the `ekke` CLI:

```sh
# Make sure that the simulator of your choice is running.
react-native run-ios # or react-native run-android

ekke run glob/pattern/*.test.js more/test/files.js --using mocha
```

And now watch the magic unfold on your app.

> If you are worried about shipping `Ekke` in your application, the component is
> using [process.env.NODE_ENV][env] to switch between [development][dev] and
> [production][prod] builds. Production builds will completely remove `Ekke`
> from your code. You can also conditionally include it `{ __DEV__ && <Ekke /> }`.

## Runners

At its core, Ekke is nothing more than an orchestration tool, it runs
[Metro][metro] bundler with a specific configuration, executes code
automatically in the React Native environment, and reports back in the CLI. To
run the test, we need to know which test runner you prefer so we can bundle it
with the tests. The following runners are available:

- [mocha](#mocha)
- [tape](#tape)

### mocha

To use [Mocha](https://mochajs.org/) make sure you have the testing framework as
well as an assertion framework installed in your project:

```bash
npm install --save-dev mocha
npm install --save-dev assume # or any other assert framework, e.g. chai
```

Once all your dependencies finish installing, you can start writing your tests.

```js
import { describe, it } from 'mocha';
import { render } from 'ekke';
import assume from 'assume';

describe('The best test suite in the world', function () {
  it('is amazing', function () {
    const amazing = 'amazing';

    assume(amazing).is.a('string');
    assume(!!amazing).is.true();
  });
});
```

Provide `mocha` as value to the `--using` flag to select it as test runner.

```bash
ekke run test.js --using mocha
```

The following Mocha options can be customized using the follow CLI flags:

- `--mocha.fgrep` Only run tests containing this string.
  **Defaults to `''`**.
- `--mocha.grep` Only run tests matching this string.
  **Defaults to `''`**.
- `--mocha.invert` Inverts grep and fgrep matches.
  **Defaults to `false`**.
- `--mocha.ui` Specify user interface.
  **Defaults to `bdd`**.
- `--mocha.reporter` Specify reporter to use.
  **Defaults to `spec`**.
- `--mocha.slow` Specify "slow" test threshold (in milliseconds).
  **Defaults to `75`**.
- `--mocha.timeout` Specify the test timeout threshold (in milliseconds).
  **Defaults to `2000`**.
- `--mocha.bail` Abort ("bail") after first test failure.
  **Defaults to `true`**.
- `--mocha.color` Force-enable color output.
  **Defaults to `true`**.
- `--mocha.inlineDiffs` Display actual/expected differences inline within each string.
  **Defaults to `true`**.

```bash
ekke run test.js --using mocha --mocha.reporter min --mocha.timeout 5000
```

### Tape

Using [tape](https://github.com/substack/tape) as the test runner is pretty
self-explanatory. You import `tape` into your test files and write your tests
and assertions using provided by the framework.

```js
import { render } from 'ekke';
import test from 'tape';

test('one', function (t) {
  t.plan(2);
  t.ok(true);

  setTimeout(function () {
    t.equal(1+3, 4);
  }, 100);
});
```

Once the tests are completed, simple tell `ekke` that you're `--using tape` to
run the tests.

```bash
ekke run test.js --using tape
```

The will run your tests, and output the TAP (Test. Anything. Protocol) to your
terminal which you can pipe to any of the [Pretty Tap
Reporters](https://github.com/substack/tape#pretty-reporters) that you might
have installed. For example, if you want to use `tap-spec`:

```bash
ekke run test.js --using tape | tap-spec
```

## API

The API exposes the following methods:

- [component](#component)
- [render](#render)

### Component

```js
import { Ekke } from 'ekke';
```

The `Ekke` component controls the orchestration, execution, and rendering of the
test suite. The component can be used as a wrapper, or as a regular component
and be included in your application.

The component accepts the following **optional** properties:

- `interval`, **String**, The component doesn't know when you are using the CLI,
  so it polls at a given interval, with an HTTP request, to the server that runs
  in the CLI to figure out if it's active and is waiting for tests to run. The
  lower the interval, the quicker your tests will be picked up by the component,
  but also the more performance it takes away from your app.
  **Defaults to `10 seconds`**.
- `hostname`, **String**, The hostname of your machine that the CLI server is
  running on.
  **Defaults to `localhost` on iOS and `10.0.2.2` on Android**.
- `port`, **Number**, The port number that the CLI server is running on.
  **Defaults to `1975`**.
- `alive`, **Function**, Function to execute when the `Ekke` test runner is
  activated and is about to run the test suites.

```js
//
// Stand alone.
//
<Ekke />

//
// Or wrap your app with it, you decide what is best for your application.
//
<Ekke>
  <App />
</Ekke>
```

To see an example of the implementation, take a look at our [index.js][index]
file. It's what we use to test our code.

### render

```js
import { render } from 'ekke';
```

The render method allows you to render any React-Native component on the screen
of the application.

```js
import { View } from 'react-native';
import { render } from 'ekke';
import React from 'react';

describe('test', function () {
  it('renders a red square', function () {
    const ref = React.createRef();
    await render(<View style={{
      backgroundColor: 'red',
      width: 100,
      height: 100
    }} ref={ ref } />);

    //
    // You can now use ref.current to access the rendered view.
    // Not only that, but there's big red square on your app as well.
    //
  });
});
```

## CLI

The `ekke` CLI is automatically installed in your `node_modules` when you
install `ekke` in the project as a dependency. We use the CLI to communicate
between the `<Ekke />` component that you included in your application and the
terminal.

The CLI should **not be globally installed**. Instead, you directly reference
the locally installed binary from your `package.json`.

```json
{
  "name": "your-super-awesome-package",
  "scripts": {
    "test": "ekke run test/*.js --using mocha"
  }
}
```

And run the scripts using `npm`.

```bash
npm test

# You can use the double dash support from npm to send additional flags:
# npm test -- --watch
```

Alternatively, you can use the `npx` command to execute the commands as well
without the requirement of global installation of `ekke`:

```bash
npx ekke <commands here>
```

The following CLI commands are available:

- [run](#run)
- [help](#help)

### run

```bash
ekke run <glob or files to run> --flags
```

The `run` command allows you to run your specified tests on the device that
included the `<Ekke />` React component. When you run the command, we will
execute the following:

- Start up the Metro bundler on the specified `hostname` and `port`.
- Attach a WebSocket server on the created Metro bundler, for communication purposes.
- Find all the test files you want to include based on the supplied glob.
- Wait for the poll request from the `<Ekke />` component.
- Bundle all your tests, and the specified library using Metro Bundler.
- Listen to progress events that are sent by `<Ekke />` component over the
  WebSocket connection.
- Proxy all the `console.*`, `process.stdout` to your terminal.
- Close the CLI again with error code `0` or `1` depending on if your tests pass.

The `run` command assumes that all CLI arguments after the `run` command are the
test files that need to execute inside React-Native. We allow single or multiple
files, a [glob][glob] pattern, or a combination of files and globs.

```bash
# Executes test/1.js, test/2.js, and then test/2.js using the mocha runner.
ekke run test/1.js test/2.js test/3.js --using mocha

# The same above, but done using a glob pattern to fetch all .js files
# from the test directory
ekke run test/*.js --using mocha

# Executes test/1.js and then all the .test.js files
ekke run test/1.js test/*.test.js --using tape
```

You can use the following CLI flags to change the behavior of the command:

- `--using {runner}` This tells Ekke which runner should be used to execute your
  tests.
  **Defaults to `mocha`** See [Runners](#runners) for all runners.
- `--watch` By default, we close the process with either an exit code `0` or `1`
  as an indication of the test results (0 passes, 1 failure). If you do not want
  the process to exit, you can use the `--watch` flag to keep the CLI process
  alive.
  **Defaults to false.**
- `--no-reset-cache` The Metro Bundler caching system is disabled by default so
  your tests, and require statements are always freshly compiled. Using this
  flag will re-enable the cache.
  **Defaults to false.**
- `--no-silent` We silence the output of the Metro bundler by default, this
  allows you to see the Metro bundler output again.
  **Defaults to false.**
- `--hostname` The hostname we should attach our Metro Bundler on. The hostname
  should be accessible by React-Native application.
  **Defaults to `localhost`.**
- `--port` The port number we should use for the Metro Bundler, we don't want to
  clash with the Metro bundler of your `react-native start` command so it should
  be different, but still accessible by your React-Native application.
  **Defaults to `1975`** (The year Monty Python and the Holy Grail got released)
- `--require` Files that should be required before your test suites are required
  **Defaults to ¯\_(ツ)_/¯, nothing**

In addition to these default flags, any flag that you prefix with the name of
the runner will be considered as options and used as configuration:

```bash
ekke run test.js --using mocha --mocha.timeout 3000
```

See the [Runners](#runners) for their specific configuration flags.

### help

Display a list of all the available command their supported CLI flags. The help
message is visible when you run `ekke` without, an unknown, or the `help`
command:

```

ekke (v0.0.0)
Ekke-Ekke-Ekke-Ekke-PTANG. Zoo-Boing. Z' nourrwringmm...

COMMANDS:

run      Run the given glob of test files.
         --port           Port number that Metro Bundler should use.
         --hostname       Hostname that Metro Bundler should use.
         --using          Name of the test runner to use.
         --watch          Don't exit when the tests complete but keep listening.
         --no-silent      Do not suppress the output of Metro.
         --require        Require module (before tests are executed).
         --no-reset-cache Do not clear the Metro cache.
help     Displays this help message.
         --no-color       Disable colors in help message.

EXAMPLES:

$ ekke run ./test/*.test.js --using mocha

```

The output contains colors by default if you wish to remove those you can use
the `--no-color` flag.

## Debugging

Both the `CLI` and the `react-native` code bases use [diagnostics] under the
hood for logging purposes. The logs are disabled by default but can be enabled
by using the `DEBUG` feature flags. They both log under the `ekke:*` namespace.

#### The Ekke CLI

```js
DEBUG=ekke* ekke <your command here>
```

#### React Native Component

```js
import { AsyncStorage } from 'react-native';

AsyncStorage.setItem('debug', 'ekke*', function () {
  //
  // Reload your app, and the debug logs will now be enabled.
  //
});
```

For more detailed information about [diagnostics], please see their project page.

## Development

- **Fork** Fork the repository to create a copy to your own GitHub account.
- **Clone** Clone the newly created GitHub repo to your local machine.
- **Branch** Create a fresh new branch from the master branch.
- **Install** Run `npm install` to install dependencies and devDependencies.
- **Setup** Run `npm run setup` to create development specific folders.
- **Hack** Make your changes. Write tests covering your changes.
- **Test** Run both `npm test` and `npm test:ekke` to ensure nothing got broken.
- **Push** Commit and push your changes to fork.
- **Pull Request** Create a pull request from your created branch to our master.
- **Review** We'll review your change, and ask for updates if need.
- **Merge** Virtual high fives are exchanged when your PR lands.

## License

[MIT](LICENSE)

[diagnostics]: https://github.com/3rd-Eden/diagnostics
[metro]: https://github.com/facebook/metro
[NI]: https://en.wikipedia.org/wiki/Knights_Who_Say_%22Ni!%22
[Ekke]: https://youtu.be/RZvsGdJP3ng?t=17
[env]: ./index.js
[dev]: ./development.js
[prod]: ./production.js
[component]: #component
[run]: #run
[index]: ./index.js
[glob]: https://www.npmjs.com/package/glob
