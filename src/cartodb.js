// Extracted from cartodb.core.js since cartodb.core.js don't depended on these extra stuff.
cdb = require("cartodb.core.js"); // defines window.cdb (used below), as well as defining all core stuff.

// TODO: All these stuff was actually included in core, but could not be workable, due to missing the requirements
// (these requires), seemed to only be available for non-core bundles (standard/noqjuery/noleaflet). Correct?
JST = global.JST || {};
var loadJST = require('core/load_jst.js');
var Events = require('core/events.js');
var Backbone = require('core/decorators/backbone.js');
var $ = require('vendor-jquery');
var L = require('vendor/leaflet.js');
var Mustache = require('vendor/mustache.js');
var _ = require('vendor-underscore');
var Model = require('core/model.js');
var Config = require('core/config.js');

// TODO: Actually used? No references of usage/official doc support anywhere... was located in src/core/model.js
var debugCallbacks = require('core/debug_callbacks.js');
cdb._debugCallbacks = debugCallbacks;

// TODO: random global stuff found here&there that it's not clear how to scope or browserify-shim'em, so let's leave
// them on the global scope for now...
require('vendor/json2.js');
require('core/decorators/json_ie7_shim.js');
require('vendor/wax.cartodb.js');

/**
 * Base Model for all CartoDB models.
 * DO NOT USE Backbone.Model directly.
 */
cdb.core.Model = Model;

// Moved from grunt/template/wrapper_footer to expose them on the global cdb object.
cdb.Backbone = Backbone;
cdb.$ = $;
cdb.L = L;
cdb.Mustache = Mustache;
cdb._ = _;

cdb.config = new Config();
cdb.config.VERSION = 2;
cdb.config.REPORT_ERROR_URL = '/api/v0/error';
cdb.config.ERROR_TRACK_ENABLED = false;
cdb.config.set({
  cartodb_attributions: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
  cartodb_logo_link: "http://www.cartodb.com"
});

// TODO: migrated from old files, MUST be loaded here to access the globally defined(...) cdb.config stuff
var Log = require('core/log.js');
var Error = require('core/log/error.js');
var ErrorList = require('core/log/error_list.js');
cdb.errors = new ErrorList();
cdb.log = new Log({tag: 'cdb'});

// TODO: cdb.core.x migrated from old files, really used or can be deleted?
cdb.core.Error = Error;
cdb.core.ErrorList = ErrorList;
cdb.core.Log = Log;

// TODO: Can this removed/replaced easily? what's the usage?
cdb.files = [
  "../vendor/jscrollpane.js",
  "../vendor/mousewheel.js",
  "../vendor/mwheelIntent.js",
  "../vendor/spin.js",
  "../vendor/lzma.js",

  'core/config.js',
  'core/log.js',
  'core/profiler.js',
  'core/template.js',
  'core/model.js',
  'core/view.js',

  'geo/geocoder.js',
  'geo/geometry.js',
  'geo/map.js',
  'geo/ui/text.js',
  'geo/ui/annotation.js',
  'geo/ui/image.js',
  'geo/ui/share.js',
  'geo/ui/zoom.js',
  'geo/ui/zoom_info.js',
  'geo/ui/legend.js',
  'geo/ui/switcher.js',
  'geo/ui/infowindow.js',
  'geo/ui/header.js',
  'geo/ui/search.js',
  'geo/ui/layer_selector.js',
  'geo/ui/mobile.js',
  'geo/ui/tiles_loader.js',
  'geo/ui/infobox.js',
  'geo/ui/tooltip.js',
  'geo/ui/fullscreen.js',

  'geo/layer_definition.js',
  'geo/common.js',

  'geo/leaflet/leaflet_base.js',
  'geo/leaflet/leaflet_plainlayer.js',
  'geo/leaflet/leaflet_tiledlayer.js',
  'geo/leaflet/leaflet_gmaps_tiledlayer.js',
  'geo/leaflet/leaflet_wmslayer.js',
  'geo/leaflet/leaflet_cartodb_layergroup.js',
  'geo/leaflet/leaflet_cartodb_layer.js',
  'geo/leaflet/leaflet.js',

  'geo/gmaps/gmaps_base.js',
  'geo/gmaps/gmaps_baselayer.js',
  'geo/gmaps/gmaps_plainlayer.js',
  'geo/gmaps/gmaps_tiledlayer.js',
  'geo/gmaps/gmaps_cartodb_layergroup.js',
  'geo/gmaps/gmaps_cartodb_layer.js',
  'geo/gmaps/gmaps.js',

  'ui/common/dialog.js',
  'ui/common/share.js',
  'ui/common/notification.js',
  'ui/common/table.js',
  'ui/common/dropdown.js',

  'vis/vis.js',
  'vis/overlays.js',
  'vis/layers.js',

  // PUBLIC API
  'api/layers.js',
  'api/sql.js',
  'api/vis.js'
];

/**
 * Side effects:
 * - loads JST templates into namespace.templates (see loadJST)
 * - "defines a simple class" function, set to namespace.Class which inherits Events.
 * - instantiates a namespace.god model
 * - calls ready function, if provided.
 *
 * @param ready {function} optional
 * @return results of ready(), otherwise false.
 */
cdb.init = function cdbInit(ready) {
  var Class = cdb.Class = function() {};
  _.extend(Class.prototype, Events);

  loadJST(cdb);
  cdb.god = new Model();

  ready && ready();
};

/**
 * load all the javascript files. For testing, do not use in production
 */
cdb.load = function cdbLoad(prefix, ready) {
  var c = 0;

  var next = function () {
    var script = document.createElement('script');
    script.src = prefix + cdb.files[c];
    document.body.appendChild(script);
    ++c;
    if (c == cdb.files.length) {
      if (ready) {
        script.onload = ready;
      }
    } else {
      script.onload = next;
    }
  };

  next();
};
