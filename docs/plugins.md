# plugins


## Table of Contents

- [Node.js](#nodejs)
  - [modify](#modify)
    - [babel](#babel)
    - [babel.alias](#babel-alias)
    - [process.browser](#process-browser)
    - [globs](#globs)
    - [library](#library)
    - [metro.config](#metro-config)
  - [bridge](#bridge)
  - [define](#define)
  - [register](#register)
  - [exec](#exec)
- [React-Native](#react-native)
  - [modify](#modify)
    - [teardown](#teardown)
    - [complete](#complete)
    - [uncaught](#uncaught)
    - [before](#before)
    - [config](#config)
    - [run](#run)
  - [bridge](#bridge)
  - [define](#define)
  - [destroy](#destroy)
  - [exec](#exec)

### babel

Introduce new `plugins` and `presets` to the babel configuration that the
`metro` bundler uses to compile the application dependencies. As `metro` uses
a worker farm to distribute the compiler load between all your machine's
cores we require the configuration to be serialisable with `JSON.stringify`.

- Receives the babel config object as argument. Default to `{}`.
- Should return the newly created config object.

```js
function plugin({ modify }) {
  modify('babel', async function babel(config) {
    return require('babel-merge')(config, {
      presets: [
        '@babel/preset-env'
      ]
    })
  });
}
```

### babel.alias

We use the `babel-plugin-require-require` module to rewrite certain require
statements for compatibility reasons. The `babel.alias` hook allows you to
introduce more require statements that should be rewritten.

- Receives a config object. Default to `{}`.
- Should return a modified object where the require statement has been rewritten.

```js
function plugin({ modify }) {
  modify('babel.alias', async function babel(config) {
    return Object.assign(config, {
      'react-native': require.resolve('ekke/api/metro/aliases/react-native')
    });
  });
}
```

### process.browser

Control if the `process.browser` needs to be set before any of our files are
required. Certain Node.js modules might check this property to determine the
correct API to return.

- Receives a boolean as first argument. Default to `false`.
- Should return a boolean that indicates which boolean needs to be set.

```js
function plugin({ modify }) {
  modify('process.browser', async function babel(config) {
    return true;
  });
}
```

### globs

Remove or add files/glob patterns that need to be loaded by the test runner.

- Receives array of glob patterns supplied through the CLI/API.
- Should return a new array of glob patterns.

```js
function plugin({ modify }) {
  modify('globs', async function globs(files) {
    return files.concat('test/**/*.ekke.js')
  });
}
```
