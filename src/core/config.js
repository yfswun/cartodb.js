/**
 * global configuration
 */

(function() {

    Config = Backbone.Model.extend({
        VERSION: 2,

        defaults: {
          // user_name: ['sz', 'sz2', 'sz3'],
          // no_cdn: true
        },

        //error track
        REPORT_ERROR_URL: '/api/v0/error',
        ERROR_TRACK_ENABLED: false,

        getSqlApiUrl: function() {
          var url = this.get('sql_api_protocol') + '://' +
            this.get('sql_api_domain') + ':' +
            this.get('sql_api_port');
          return url;
        }
    });

    cdb.config = new Config();

})();
