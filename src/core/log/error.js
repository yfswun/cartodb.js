var Backbone = require("core/decorators/backbone.js");

module.exports = Backbone.Model.extend({
  url: cdb.config.REPORT_ERROR_URL,
  initialize: function() {
    this.set({browser: JSON.stringify($.browser) });
  }
});
