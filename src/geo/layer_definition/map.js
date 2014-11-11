var _ = require('vendor-underscore');
var reqwest = require('vendor/reqwest.min.js');
var Profiler = require('core/profiler.js');
var uniqueCallbackName = require('core/unique_callback_name.js');
var SubLayer = require('geo/layer_definition/sub_layer.js');

function Map(options) {
  var self = this;
  this.options = _.defaults(options, {
    ajax: window.$ ? window.$.ajax : reqwest.compat,
    pngParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
    gridParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
    cors: this.isCORSSupported(),
    btoa: this.isBtoaSupported() ? this._encodeBase64Native : this._encodeBase64,
    MAX_GET_SIZE: 2033,
    force_cors: false,
    instanciateCallback: function() {
      return '_cdbc_' + self._callbackName();
    }
  });

  this.layerToken = null;
  this.urls = null;
  this.silent = false;
  this.interactionEnabled = []; //TODO: refactor, include inside layer
  this._layerTokenQueue = [];
  this._timeout = -1;
  this._queue = [];
  this._waiting = false;
  this.lastTimeUpdated = null;
  this._refreshTimer = -1;
}

Map.BASE_URL = '/api/v1/map';
Map.EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";


Map.prototype = {

  /*
   * TODO: extract these two functions to some core module
   */
  isCORSSupported: function() {
    return 'withCredentials' in new XMLHttpRequest();// || (typeof XDomainRequest !== "undefined";
  },

  isBtoaSupported: function() {
    return typeof window['btoa'] == 'function';
  },

  getLayerCount: function() {
    return this.layers.length;
  },

  _encodeBase64Native: function (input) {
    return btoa(input)
  },

  _callbackName: function() {
    return uniqueCallbackName(JSON.stringify(this.toJSON()));
  },

  // given number inside layergroup
  // returns the real index in tiler layergroup`
  getLayerIndexByNumber: function(number) {
    var layers = {};
    var c = 0;
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      layers[i] = c;
      if(layer.options && !layer.options.hidden) {
        ++c;
      }
    }
    return layers[number];
  },

  /**
   * return the layer number by index taking into
   * account the hidden layers.
   */
  getLayerNumberByIndex: function(index) {
    var layers = [];
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      if(layer.options && !layer.options.hidden) {
        layers.push(i);
      }
    }
    if (index >= layers.length) {
      return -1;
    }
    return +layers[index];
  },

  visibleLayers: function() {
    var layers = [];
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      if(!layer.options.hidden) {
        layers.push(layer);
      }
    }
    return layers;
  },


  // ie7 btoa,
  // from http://phpjs.org/functions/base64_encode/
  _encodeBase64: function (data) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    if (!data) {
      return data;
    }

    do { // pack three octets into four hexets
      o1 = data.charCodeAt(i++);
      o2 = data.charCodeAt(i++);
      o3 = data.charCodeAt(i++);

      bits = o1 << 16 | o2 << 8 | o3;

      h1 = bits >> 18 & 0x3f;
      h2 = bits >> 12 & 0x3f;
      h3 = bits >> 6 & 0x3f;
      h4 = bits & 0x3f;

      // use hexets to index into b64, and append result to encoded string
      tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;
    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
  },

  _array2hex: function(byteArr) {
    var encoded = []
    for(var i = 0; i < byteArr.length; ++i) {
      encoded.push(String.fromCharCode(byteArr[i] + 128));
    }
    return this.options.btoa(encoded.join(''))
  },

  getLayerToken: function(callback) {
    var self = this;
    function _done(data, err) {
      var fn;
      while(fn = self._layerTokenQueue.pop()) {
        fn(data, err);
      }
    }
    clearTimeout(this._timeout);
    this._queue.push(_done);
    this._layerTokenQueue.push(callback);
    this._timeout = setTimeout(function() {
      self._getLayerToken(_done);
    }, 4);
  },

  _requestFinished: function() {
    var self = this;
    this._waiting = false;
    this.lastTimeUpdated = new Date().getTime();

    // refresh layer when invalidation time has passed
    clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(function() {
      self.invalidate();
    }, this.options.refreshTime || (60*120*1000)); // default layergroup ttl

    // check request queue
    if(this._queue.length) {
      var last = this._queue[this._queue.length - 1];
      this._getLayerToken(last);
    }
  },

  _requestPOST: function(params, callback) {
    var self = this;
    var ajax = this.options.ajax;

    var loadingTime = Profiler.metric('cartodb-js.layergroup.post.time').start();

    ajax({
      crossOrigin: true,
      type: 'POST',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      url: this._tilerHost() + this.endPoint + (params.length ? "?" + params.join('&'): ''),
      data: JSON.stringify(this.toJSON()),
      success: function(data) {
        loadingTime.end();
        // discard previous calls when there is another call waiting
        if(0 === self._queue.length) {
          callback(data);
        }
        self._requestFinished();
      },
      error: function(xhr) {
        loadingTime.end();
        Profiler.metric('cartodb-js.layergroup.post.error').inc();
        var err = { errors: ['unknow error'] };
        if (xhr.status === 0) {
          err = { errors: ['connection error'] };
        }
        try {
          err = JSON.parse(xhr.responseText);
        } catch(e) {}
        if(0 === self._queue.length) {
          callback(null, err);
        }
        self._requestFinished();
      }
    });
  },

  // returns the compressor depending on the size
  // of the layer
  _getCompressor: function(payload) {
    var self = this;
    if (this.options.compressor) {
      return this.options.compressor;
    }

    payload = payload || JSON.stringify(this.toJSON());
    if (!this.options.force_compress && payload.length < this.options.MAX_GET_SIZE) {
      return function(data, level, callback) {
        callback("config=" + encodeURIComponent(data));
      };
    }

    return function(data, level, callback) {
      data = JSON.stringify({ config: data });
      LZMA.compress(data, level, function(encoded) {
        callback("lzma=" + encodeURIComponent(self._array2hex(encoded)));
      });
    };

  },

  _requestGET: function(params, callback) {
    var self = this;
    var ajax = this.options.ajax;
    var json = JSON.stringify(this.toJSON());
    var compressor = this._getCompressor(json);
    var endPoint = self.JSONPendPoint || self.endPoint;
    compressor(json, 3, function(encoded) {
      params.push(encoded);
      var loadingTime = Profiler.metric('cartodb-js.layergroup.get.time').start();
      var host = self.options.dynamic_cdn ? self._host(): self._tilerHost();
      ajax({
        dataType: 'jsonp',
        url: host + endPoint + '?' + params.join('&'),
        jsonpCallback: self.options.instanciateCallback,
        cache: !!self.options.instanciateCallback,
        success: function(data) {
          loadingTime.end();
          if(0 === self._queue.length) {
            // check for errors
            if (data.error) {
              Profiler.metric('cartodb-js.layergroup.get.error').inc();
              callback(null, data.error);
            } else {
              callback(data);
            }
          }
          self._requestFinished();
        },
        error: function(data) {
          loadingTime.end();
          Profiler.metric('cartodb-js.layergroup.get.error').inc();
          var err = { errors: ['unknow error'] };
          try {
            err = JSON.parse(xhr.responseText);
          } catch(e) {}
          if(0 === self._queue.length) {
            callback(null, err);
          }
          self._requestFinished();
        }
      });
    });
  },

  _getLayerToken: function(callback) {
    var self = this;
    var params = [];
    callback = callback || function() {};

    // if the previous request didn't finish, queue it
    if(this._waiting) {
      return this;
    }

    this._queue = [];

    // when it's a named map the number of layers is not known
    // so fetch the map
    if (!this.named_map && this.visibleLayers().length === 0) {
      callback(null);
      return;
    }

    // setup params
    var extra_params = this.options.extra_params || {};
    var api_key = this.options.map_key || this.options.api_key || extra_params.map_key || extra_params.api_key;
    if(api_key) {
      params.push("map_key=" + api_key);
    }
    if(extra_params.auth_token) {
      if (_.isArray(extra_params.auth_token)) {
        for (var i = 0, len = extra_params.auth_token.length; i < len; i++) {
          params.push("auth_token[]=" + extra_params.auth_token[i]);
        }
      } else {
        params.push("auth_token=" + extra_params.auth_token);
      }
    }

    if (this.stat_tag) {
      params.push("stat_tag=" + this.stat_tag);
    }
    // mark as the request is being done
    this._waiting = true;
    var req = null;
    if (this._usePOST()) {
      req = this._requestPOST;
    } else {
      req = this._requestGET;
    }
    req.call(this, params, callback);
    return this;
  },

  _usePOST: function() {
    if (this.options.cors) {
      if (this.options.force_cors) {
        return true;
      }
      // check payload size
      var payload = JSON.stringify(this.toJSON());
      if (payload.length < this.options.MAX_GET_SIZE) {
        return false;
      }
    }
    return false;
  },


  getLayer: function(index) {
    return _.clone(this.layers[index]);
  },

  invalidate: function() {
    this.layerToken = null;
    this.urls = null;
    this.onLayerDefinitionUpdated();
  },

  setLayer: function(layer, def) {
    if(layer < this.getLayerCount() && layer >= 0) {
      if (def.options.hidden) {
        var i = this.interactionEnabled[layer];
        if (i) {
          def.interaction = true
          this.setInteraction(layer, false);
        }
      } else {
        if (this.layers[layer].interaction) {
          this.setInteraction(layer, true);
          delete this.layers[layer].interaction;
        }
      }
      this.layers[layer] = _.clone(def);
    }
    this.invalidate();
    return this;
  },


  getTiles: function(callback) {
    var self = this;
    if(self.layerToken) {
      callback && callback(self._layerGroupTiles(self.layerToken, self.options.extra_params));
      return this;
    }
    this.getLayerToken(function(data, err) {
      if(data) {
        self.layerToken = data.layergroupid;
        // if cdn_url is present, use it
        if (data.cdn_url) {
          var c = self.options.cdn_url = self.options.cdn_url || {};
          c.http = data.cdn_url.http || c.http;
          c.https = data.cdn_url.https || c.https;
        }
        self.urls = self._layerGroupTiles(data.layergroupid, self.options.extra_params);
        callback && callback(self.urls);
      } else {
        if (self.visibleLayers().length === 0) {
          callback && callback({
            tiles: [Map.EMPTY_GIF],
            grids: []
          });
          return;
        }
        callback && callback(null, err);
      }
    });
    return this;
  },

  isHttps: function() {
    return this.options.tiler_protocol === 'https';
  },

  _layerGroupTiles: function(layerGroupId, params) {
    var subdomains = this.options.subdomains || ['0', '1', '2', '3'];
    if(this.isHttps()) {
      subdomains = [null]; // no subdomain
    }

    var tileTemplate = '/{z}/{x}/{y}';

    var grids = []
    var tiles = [];

    var pngParams = this._encodeParams(params, this.options.pngParams);
    for(var i = 0; i < subdomains.length; ++i) {
      var s = subdomains[i]
      var cartodb_url = this._host(s) + Map.BASE_URL + '/' + layerGroupId
      tiles.push(cartodb_url + tileTemplate + ".png" + (pngParams ? "?" + pngParams: '') );

      var gridParams = this._encodeParams(params, this.options.gridParams);
      for(var layer = 0; layer < this.layers.length; ++layer) {
        grids[layer] = grids[layer] || [];
        grids[layer].push(cartodb_url + "/" + layer +  tileTemplate + ".grid.json" + (gridParams ? "?" + gridParams: ''));
      }
    }

    return {
      tiles: tiles,
      grids: grids
    }

  },

  _cleanInteractivity: function(attributes) {
    if(!attributes) return;
    if(typeof(attributes) == 'string') {
      attributes = attributes.split(',');
    }

    for(var i = 0; i < attributes.length; ++i) {
      attributes[i] = attributes[i].replace(/ /g, '');
    }

    return attributes;
  },


  onLayerDefinitionUpdated: function() {},

  setSilent: function(b) {
    this.silent = b;
  },

  _definitionUpdated: function() {
    if(this.silent) return;
    this.invalidate();
  },

  _tileJSONfromTiles: function(layer, urls, options) {
    options = options || {};
    var subdomains = options.subdomains || ['0', '1', '2', '3'];

    function replaceSubdomain(t) {
      var tiles = [];
      for (var i = 0; i < t.length; ++i) {
        tiles.push(t[i].replace('{s}', subdomains[i % subdomains.length]));
      }
      return tiles;
    }

    return {
      tilejson: '2.0.0',
      scheme: 'xyz',
      grids: replaceSubdomain(urls.grids[layer]),
      tiles: replaceSubdomain(urls.tiles),
      formatter: function(options, data) { return data; }
    };
  },

  /**
   * get tile json for layer
   */
  getTileJSON: function(layer, callback) {
    layer = layer == undefined ? 0: layer;
    var self = this;
    this.getTiles(function(urls) {
      if(!urls) {
        callback(null);
        return;
      }
      if(callback) {
        callback(self._tileJSONfromTiles(layer, urls));
      }
    });
  },

  /**
   * Change query of the tiles
   * @params {str} New sql for the tiles
   */

  _encodeParams: function(params, included) {
    if(!params) return '';
    var url_params = [];
    included = included || _.keys(params);
    for(var i in included) {
      var k = included[i]
      var p = params[k];
      if(p) {
        if (_.isArray(p)) {
          for (var j = 0, len = p.length; j < len; j++) {
            url_params.push(k + "[]=" + encodeURIComponent(p[j]));
          }
        } else {
          var q = encodeURIComponent(p);
          q = q.replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");
          url_params.push(k + "=" + q);
        }
      }
    }
    return url_params.join('&')
  },


  _tilerHost: function() {
    var opts = this.options;
    return opts.tiler_protocol +
      "://" + ((opts.user_name) ? opts.user_name+".":"")  +
      opts.tiler_domain +
      ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
  },

  _host: function(subhost) {
    var opts = this.options;
    if (opts.no_cdn) {
      return this._tilerHost();
    } else {
      var h = opts.tiler_protocol + "://";
      if (subhost) {
        h += subhost + ".";
      }
      var cdn_host = opts.cdn_url || cdb.CDB_HOST;
      if(!cdn_host.http && !cdn_host.https) {
        throw new Error("cdn_host should contain http and/or https entries");
      }
      h += cdn_host[opts.tiler_protocol] + "/" + opts.user_name;
      return h;
    }
  },

  getTooltipData: function(layer) {
    return this.layers[layer].tooltip;
  },

  getInfowindowData: function(layer) {
    var lyr;
    var infowindow = this.layers[layer].infowindow;
    if (!infowindow && this.options.layer_definition && (lyr = this.options.layer_definition.layers[layer])) {
      infowindow = lyr.infowindow;
    }
    if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
      return infowindow;
    }
    return null;
  },

  containInfowindow: function() {
    var layers =  this.options.layer_definition.layers;
    for(var i = 0; i < layers.length; ++i) {
      var infowindow = layers[i].infowindow;
      if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
        return true;
      }
    }
    return false;
  },

  containTooltip: function() {
    var layers =  this.options.layer_definition.layers;
    for(var i = 0; i < layers.length; ++i) {
      var tooltip = layers[i].tooltip;
      if (tooltip && tooltip.fields && tooltip.fields.length) {
        return true;
      }
    }
    return false;
  },

  getSubLayer: function(index) {
    var layer = this.layers[index];
    layer.sub = layer.sub || new SubLayer(this, index);
    return layer.sub;
  },

  getSubLayerCount: function() {
    return this.getLayerCount();
  },

  getSubLayers: function() {
    var layers = []
    for (var i = 0; i < this.getSubLayerCount(); ++i) {
      layers.push(this.getSubLayer(i))
    }
    return layers;
  }
};

module.exports = Map;
