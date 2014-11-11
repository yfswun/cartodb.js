var Events = require('core/events');

function Promise() { }

Promise.prototype = Events;
Promise.prototype.done = function(fn) {
  return this.on('done', fn);
};

Promise.prototype.error = function(fn) {
  return this.on('error', fn);
};

module.exports = Promise;
