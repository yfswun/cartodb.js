var _ = require('vendor-underscore');

/**
 * load JST templates.
 * rails creates a JST variable with all the templates.
 * This functions loads them as default into given namespace
 */
module.exports = function loadJST(namespace) {
  if(typeof(global.JST) !== undefined) {
    namespace.templates.reset(
      _(JST).map(function(tmpl, name) {
        return { name: name, compiled: tmpl };
      })
    );
  }
};
