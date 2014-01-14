
var files = [
  'cartodb.js',
  'core/decorator.js',
  'core/config.js',
  'core/log.js',
  'core/profiler.js',
  'core/template.js',
  'core/model.js',
  'core/view.js',

  'geo/geocoder.js',
  'geo/geometry.js',
  'geo/map.js',
  'geo/ui/zoom.js',
  'geo/ui/zoom_info.js',
  'geo/ui/mobile.js',
  'geo/ui/legend.js',
  'geo/ui/switcher.js',
  'geo/ui/infowindow.js',
  'geo/ui/header.js',
  'geo/ui/search.js',
  'geo/ui/layer_selector.js',
  'geo/ui/tiles_loader.js',
  'geo/ui/infobox.js',
  'geo/ui/tooltip.js',

  'geo/layer_definition.js',
  'geo/common.js',

  'geo/leaflet/leaflet_base.js',
  'geo/leaflet/leaflet_plainlayer.js',
  'geo/leaflet/leaflet_tiledlayer.js',
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
  'api/*.js'
].map(function(f) {
  return './src/' + f;
});

var vendor = [
  "vendor/jquery.min.js",
  "vendor/underscore-min.js",
  "vendor/json2.js",
  "vendor/backbone.js",

  "vendor/leaflet.js",
  "vendor/wax.cartodb.js",
  "vendor/GeoJSON.js", //geojson gmaps lib

  "vendor/jscrollpane.js",
  "vendor/mousewheel.js",
  "vendor/mwheelIntent.js",
  "vendor/spin.js",
  "vendor/lzma.js",
];

var mod_torque_files = [
  'vendor/mod/jquery-ui/jquery.ui.core.js',
  'vendor/mod/jquery-ui/jquery.ui.widget.js',
  'vendor/mod/jquery-ui/jquery.ui.mouse.js',
  'vendor/mod/jquery-ui/jquery.ui.slider.js',
  'vendor/mod/carto.js',
  'vendor/mod/torque.uncompressed.js',
  'vendor/mod/torque.cartodb.js',
  'src/geo/gmaps/torque.geometry.js', 
  'src/geo/leaflet/torque.js', 
  'src/geo/ui/time_slider.js',
  'scripts/mod.torque.footer.js',
];

var all_files = vendor.concat(
  files, [
    'src/ui/**/*.js',
    'src/geo/gmaps/gmaps.geometry.js',
    'src/geo/leaflet/leaflet.geometry.js'
  ],
mod_torque_files);

module.exports = {
  src: files,
  vendor: vendor,
  all: all_files,
  mod_torque: mod_torque_files
};
