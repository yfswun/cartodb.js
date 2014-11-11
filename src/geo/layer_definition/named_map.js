var Map = require('geo/layer_definition/map.js');
var _ = require('vendor-underscore');
var Profiler = require('core/profiler.js');

function NamedMap(named_map, options) {
  Map.call(this, options);
  this.options.pngParams.push('auth_token');
  this.options.gridParams.push('auth_token');
  this.endPoint = Map.BASE_URL + '/named/' + named_map.name;
  this.JSONPendPoint = Map.BASE_URL + '/named/' + named_map.name + '/jsonp';
  this.layers = _.clone(named_map.layers) || [];
  for(var i = 0; i < this.layers.length; ++i) {
    var layer = this.layers[i];
    layer.options = layer.options || { hidden: false };
    layer.options.layer_name = layer.layer_name;
  }
  this.named_map = named_map;
  this.stat_tag = named_map.stat_tag;
  var token = named_map.auth_token || options.auth_token;
  if (token) {
    this.setAuthToken(token);
  }
}

NamedMap.prototype = _.extend({}, Map.prototype, {

  setAuthToken: function(token) {
    if(!this.isHttps()) {
      throw new Error("https must be used when auth_token is set");
    }
    this.options.extra_params = this.options.extra_params || {};
    this.options.extra_params.auth_token = token;
    this.invalidate();
    return this;
  },

  setParams: function(attr, v) {
    var params;
    if (arguments.length === 2) {
      params = {}
      params[attr] = v;
    } else {
      params = attr;
    }
    if (!this.named_map.params) {
      this.named_map.params = {};
    }
    for (var k in params) {
      if (params[k] === undefined || params[k] === null) {
        delete this.named_map.params[k];
      } else {
        this.named_map.params[k] = params[k];
      }
    }
    this.invalidate();
    return this;
  },

  toJSON: function() {
    var p = this.named_map.params || {};
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      p['layer' + i] = layer.options.hidden ? 0: 1;
    }
    return p;
  },

  containInfowindow: function() {
    var layers = this.layers || [];
    for(var i = 0; i < layers.length; ++i) {
      var infowindow = layers[i].infowindow;
      if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
        return true;
      }
    }
    return false;
  },

  containTooltip: function() {
    var layers = this.layers || [];
    for(var i = 0; i < layers.length; ++i) {
      var tooltip = layers[i].tooltip;
      if (tooltip) {
        return true;
      }
    }
    return false;
  },

  _attributesUrl: function(layer, feature_id) {
    // /api/maps/:map_id/:layer_index/attributes/:feature_id
    var host = this.options.dynamic_cdn ? this._host(): this._tilerHost();
    var url = [
      host,
      //'api',
      //'v1',
      Map.BASE_URL.slice(1),
      this.layerToken,
      layer,
      'attributes',
      feature_id].join('/');

    var extra_params = this.options.extra_params || {};
    var token = extra_params.auth_token;
    if (token) {
      if (_.isArray(token)) {
        var tokenParams = [];
        for (var i = 0, len = token.length; i < len; i++) {
          tokenParams.push("auth_token[]=" + token[i]);
        }
        url += "?" + tokenParams.join('&')
      } else {
        url += "?auth_token=" + token
      }
    }
    return url;
  },

  // for named maps attributes are fetch from attributes service
  fetchAttributes: function(layer_index, feature_id, columnNames, callback) {
    this._attrCallbackName = this._attrCallbackName || this._callbackName();
    var ajax = this.options.ajax;
    var loadingTime = Profiler.metric('cartodb-js.named_map.attributes.time').start();
    ajax({
      dataType: 'jsonp',
      url: this._attributesUrl(layer_index, feature_id),
      jsonpCallback: '_cdbi_layer_attributes_' + this._attrCallbackName,
      cache: true,
      success: function(data) {
        loadingTime.end();
        callback(data);
      },
      error: function(data) {
        loadingTime.end();
        Profiler.metric('cartodb-js.named_map.attributes.error').inc();
        callback(null);
      }
    });
  },

  setSQL: function(sql) {
    throw new Error("SQL is read-only in NamedMaps");
  },

  setCartoCSS: function(sql) {
    throw new Error("cartocss is read-only in NamedMaps");
  },

  getCartoCSS: function() {
    throw new Error("cartocss can't be accessed in NamedMaps");
  },

  getSQL: function() {
    throw new Error("SQL can't be accessed in NamedMaps");
  },

  setLayer: function(layer, def) {
    var not_allowed_attrs = {'sql': 1, 'cartocss': 1, 'interactivity': 1 };

    for(var k in def.options) {
      if (k in not_allowed_attrs) {
        delete def.options[k];
        throw new Error( k + " is read-only in NamedMaps");
      }
    }
    return Map.prototype.setLayer.call(this, layer, def);
  },

  removeLayer: function(layer) {
    throw new Error("sublayers are read-only in Named Maps");
  },

  createSubLayer: function(attrs, options) {
    throw new Error("sublayers are read-only in Named Maps");
  },

  addLayer: function(def, layer) {
    throw new Error("sublayers are read-only in Named Maps");
  },

  // for named maps the layers are always the same (i.e they are
  // not removed to hide) so the number does not change
  getLayerIndexByNumber: function(number) {
    return +number;
  }


});

module.exports = NamedMap;
