var Backbone = require("core/decorators/backbone.js");

module.exports = Backbone.Collection.extend({
  model: cdb.core.Error,
  enableTrack: function() {
    var old_onerror = window.onerror;
    window.onerror = function(msg, url, line) {
      cdb.errors.create({
        msg: msg,
        url: url,
        line: line
      });
      if (old_onerror)
        old_onerror.apply(window, arguments);
    };
  }
});

