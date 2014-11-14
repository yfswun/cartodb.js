var Backbone = require("core/decorators/backbone");

/**
 * global configuration
 */
module.exports = Backbone.Model.extend({
  initialize: function() {
    this.modules = new Backbone.Collection();
    this.modules.bind('add', function(model) {
      this.trigger('moduleLoaded');
    }, this);
  },

  getSqlApiUrl: function() {
    var url = this.get('sql_api_protocol') + '://' +
      this.get('user_name') + '.' +
      this.get('sql_api_domain') + ':' +
      this.get('sql_api_port');
    return url;
  }
});

