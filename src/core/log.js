var Backbone = require("core/decorators/backbone.js");
var _console = require("core/log/console.js");

module.exports = Backbone.Model.extend({
  error: function() {
    _console.error.apply(_console, arguments);
    if(cdb.config.ERROR_TRACK_ENABLED) {
      cdb.errors.create({
        msg: Array.prototype.slice.call(arguments).join('')
      });
    }
  },

  log: function() {
    _console.log.apply(_console, arguments);
  },

  info: function() {
    _console.log.apply(_console, arguments);
  },

  debug: function() {
    _console.log.apply(_console, arguments);
  }
});
