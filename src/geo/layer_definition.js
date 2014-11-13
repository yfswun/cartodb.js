var _ = require('vendor-underscore');
var Map = require('geo/layer_definition/map.js');
var Profiler = require('core/profiler.js');
var SQL = require('api/sql.js');

function LayerDefinition(layerDefinition, options) {
  Map.call(this, options);
  this.endPoint = Map.BASE_URL;
  this.setLayerDefinition(layerDefinition, { silent: true });
}

/**
 * given a list of sublayers as:
 * {
 *   sql: '...',
 *   cartocss: '..',
 *   cartocss_version:'...', //optional
 *   interactivity: '...' //optional
 * }
 * returns the layer definition for version 1.0.0
 *
 * ``sublayers`` should be an array, an exception is thrown otherwise
 *
 */
LayerDefinition.layerDefFromSubLayers = function(sublayers) {

  if(!sublayers || sublayers.length === undefined) throw new Error("sublayers should be an array");

  var layer_definition = {
    version: '1.0.0',
    stat_tag: 'API',
    layers: []
  };

  for (var i = 0; i < sublayers.length; ++i) {
    layer_definition.layers.push({
      type: 'cartodb',
      options: sublayers[i]
    });
  }

  return layer_definition;
};


LayerDefinition.prototype = _.extend({}, Map.prototype, {

  setLayerDefinition: function(layerDefinition, options) {
    options = options || {};
    this.version = layerDefinition.version || '1.0.0';
    this.stat_tag = layerDefinition.stat_tag;
    this.layers = _.clone(layerDefinition.layers);
    if(!options.silent) {
      this._definitionUpdated();
    }
  },

  toJSON: function() {
    var obj = {};
    obj.version = this.version;
    if(this.stat_tag) {
      obj.stat_tag = this.stat_tag;
    }
    obj.layers = [];
    var layers = this.visibleLayers();
    for(var i = 0; i < layers.length; ++i) {
      var layer = layers[i];
      obj.layers.push({
        type: 'cartodb',
        options: {
          sql: layer.options.sql,
          cartocss: layer.options.cartocss,
          cartocss_version: layer.options.cartocss_version || '2.1.0',
          interactivity: this._cleanInteractivity(layer.options.interactivity)
        }
      });
    }
    return obj;
  },

  removeLayer: function(layer) {
    if(layer < this.getLayerCount() && layer >= 0) {
      this.layers.splice(layer, 1);
      this.interactionEnabled.splice(layer, 1);
      this._reorderSubLayers();
      this.invalidate();
    }
    return this;
  },

  _reorderSubLayers: function() {
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      if(layer.sub) {
        layer.sub._setPosition(i);
      }
    }
  },

  addLayer: function(def, layer) {
    layer = layer === undefined ? this.getLayerCount(): layer;
    if(layer <= this.getLayerCount() && layer >= 0) {
      if(!def.sql || !def.cartocss) {
        throw new Error("layer definition should contain at least a sql and a cartocss");
        return this;
      }
      this.layers.splice(layer, 0, {
        type: 'cartodb',
        options: def
      });
      this._definitionUpdated();
    }
    return this;
  },

  /**
   * set interactivity attributes for a layer.
   * if attributes are passed as first param layer 0 is
   * set
   */
  setInteractivity: function(layer, attributes) {
    if(attributes === undefined) {
      attributes = layer;
      layer = 0;
    }

    if(layer >= this.getLayerCount() && layer < 0) {
      throw new Error("layer does not exist");
    }

    if(typeof(attributes) == 'string') {
      attributes = attributes.split(',');
    }

    for(var i = 0; i < attributes.length; ++i) {
      attributes[i] = attributes[i].replace(/ /g, '');
    }

    this.layers[layer].options.interactivity = attributes;
    this._definitionUpdated();
    return this;
  },

  setQuery: function(layer, sql) {
    if(sql === undefined) {
      sql = layer;
      layer = 0;
    }
    this.layers[layer].options.sql = sql
    this._definitionUpdated();
  },

  getQuery: function(layer) {
    layer = layer || 0;
    return this.layers[layer].options.sql
  },

  /**
   * Change style of the tiles
   * @params {style} New carto for the tiles
   */
  setCartoCSS: function(layer, style, version) {
    if(version === undefined) {
      version = style;
      style = layer;
      layer = 0;
    }

    version = version || window.cartodb.CARTOCSS_DEFAULT_VERSION;


    this.layers[layer].options.cartocss = style;
    this.layers[layer].options.cartocss_version = version;
    this._definitionUpdated();

  },

  /**
   * adds a new sublayer to the layer with the sql and cartocss params
   */
  createSubLayer: function(attrs, options) {
    this.addLayer(attrs);
    return this.getSubLayer(this.getLayerCount() - 1);
  },

  _getSqlApi: function(attrs) {
    attrs = attrs || {};
    var port = attrs.sql_api_port
    var domain = attrs.sql_api_domain + (port ? ':' + port: '')
    var protocol = attrs.sql_api_protocol;
    var version = 'v1';
    if (domain.indexOf('cartodb.com') !== -1) {
      //protocol = 'http';
      domain = "cartodb.com";
      version = 'v2';
    }

    var sql = new SQL({
      user: attrs.user_name,
      protocol: protocol,
      host: domain,
      version: version
    });

    return sql;
  },

  fetchAttributes: function(layer_index, feature_id, columnNames, callback) {
    var layer = this.getLayer(layer_index);
    var sql = this._getSqlApi(this.options);
    this._attrCallbackName = this._attrCallbackName || this._callbackName();

    // prepare columns with double quotes
    columnNames = _.map(columnNames, function(n) {
      return "\"" + n + "\"";
    }).join(',');

    var loadingTime = Profiler.metric('cartodb-js.layergroup.attributes.time').start();
    // execute the sql
    sql.execute('select {{{ fields }}} from ({{{ sql }}}) as _cartodbjs_alias where cartodb_id = {{{ cartodb_id }}}', {
      fields: columnNames,
      cartodb_id: feature_id,
      sql: layer.options.sql
    }, {
      cache: true, // don't include timestamp
      jsonpCallback: '_cdbi_layer_attributes_' + this._attrCallbackName,
      jsonp: true
    }).done(function(interact_data) {
      loadingTime.end();
      if (interact_data.rows.length === 0 ) {
        callback(null);
        return;
      }
      callback(interact_data.rows[0]);
    }).error(function() {
      loadingTime.end();
      Profiler.metric('cartodb-js.layergroup.attributes.error').inc();
      callback(null);
    });
  }
});

module.exports = LayerDefinition;
