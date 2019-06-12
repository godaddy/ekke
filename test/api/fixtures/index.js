const bridge = require('./bridge');

module.exports = function plugin(...args) {
  bridge.emit('plugin', ...args, this);
};
