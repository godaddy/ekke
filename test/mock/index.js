import * as ErrorUtils from './errorutils.js';
import AsyncStorage from 'asyncstorageapi';
import poison from 'require-poisoning';
import './servers';

//
// ErrorUtils: While introduced by React-Native, is a global, not an actual
// module that needs to be imported.
//
// XMLHttpRequest: It's 2019, and this is still not a thing.
//
// WebSocket: Yup, also still not a thing in Node.
//
global.ErrorUtils = ErrorUtils;
global.XMLHttpRequest = require('xhr2');
global.WebSocket = require('ws');

const mocks = {
  AsyncStorage,
  Platform: {
    OS: 'ios'
  }
};

//
// We're just gonna polyfill the whole React-Native API with a proxy
// so we have absolute control over the API's and methods that we
// want to mock.
//
poison('react-native', new Proxy(Object.create(null), {
  get: function getter(target, name) {
    return mocks[name];
  }
}));
