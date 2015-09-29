function SubLayerFactory() {};

SubLayerFactory.createSublayer = function(type, layer, position) {
  type = type && type.toLowerCase();
  if (!type || type === 'mapnik' || type === 'cartodb') {
    return new CartoDBSubLayer(layer, position);
  } else if (type === 'http') {
    return new HttpSubLayer(layer, position);
  } else {
    throw 'Sublayer type not supported';
  }
};

function SubLayerBase(_parent, position) {
  this._parent = _parent;
  this._position = position;
  this._added = true;
}

SubLayerBase.prototype = {

  toJSON: function() {
    throw 'toJSON must be implemented';
  },

  isValid: function() {
    throw 'isValid must be implemented';
  },

  remove: function() {
    this._check();
    this._parent.removeLayer(this._position);
    this._added = false;
    this.trigger('remove', this);
    this._onRemove();
  },

  _onRemove: function() {},

  toggle: function() {
    this.get('hidden') ? this.show() : this.hide();
    return !this.get('hidden');
  },

  show: function() {
    if(this.get('hidden')) {
      this.set({
        hidden: false
      });
    }
  },

  hide: function() {
    if(!this.get('hidden')) {
      this.set({
        hidden: true
      });
    }
  },

  set: function(new_attrs) {
    this._check();
    var def = this._parent.getLayer(this._position);
    var attrs = def.options;
    for(var i in new_attrs) {
      attrs[i] = new_attrs[i];
    }
    this._parent.setLayer(this._position, def);
    if (new_attrs.hidden !== undefined) {
      this.trigger('change:visibility', this, new_attrs.hidden);
    }
    return this;
  },

  unset: function(attr) {
    var def = this._parent.getLayer(this._position);
    delete def.options[attr];
    this._parent.setLayer(this._position, def);
  },

  get: function(attr) {
    this._check();
    var attrs = this._parent.getLayer(this._position);
    return attrs.options[attr];
  },

  isVisible: function(){
    return ! this.get('hidden');
  },

  _check: function() {
    if(!this._added) throw "sublayer was removed";
  },

  _unbindInteraction: function() {
    if(!this._parent.off) return;
    this._parent.off(null, null, this);
  },

  _bindInteraction: function() {
    if(!this._parent.on) return;
    var self = this;
    // binds a signal to a layer event and trigger on this sublayer
    // in case the position matches
    var _bindSignal = function(signal, signalAlias) {
      signalAlias = signalAlias || signal;
      self._parent.on(signal, function() {
        var args = Array.prototype.slice.call(arguments);
        if (parseInt(args[args.length - 1], 10) ==  self._position) {
          self.trigger.apply(self, [signalAlias].concat(args));
        }
      }, self);
    };
    _bindSignal('featureOver');
    _bindSignal('featureOut');
    _bindSignal('featureClick');
    _bindSignal('layermouseover', 'mouseover');
    _bindSignal('layermouseout', 'mouseout');
  },

  _setPosition: function(p) {
    this._position = p;
  }
};

// give events capabilitues
_.extend(SubLayerBase.prototype, Backbone.Events);


// CartoDB / Mapnik sublayers
function CartoDBSubLayer(layer, position) {
  SubLayerBase.call(this, layer, position);
  this._bindInteraction();

  var layer = this._parent.getLayer(this._position);
  // TODO: Test this
  if (Backbone.Model && layer) {
    this.infowindow = new Backbone.Model(layer.infowindow);
    this.infowindow.bind('change', function() {
      layer.infowindow = this.infowindow.toJSON();
      this._parent.setLayer(this._position, layer);
    }, this);
  }
};

CartoDBSubLayer.prototype = _.extend({}, SubLayerBase.prototype, {

  toJSON: function() {
    var json = {
      type: 'cartodb',
      options: {
        sql: this.getSQL(),
        cartocss: this.getCartoCSS(),
        cartocss_version: this.get('cartocss_version') || '2.1.0'
      }
    };

    var interactivity = this.getInteractivity();
    if (interactivity && interactivity.length > 0) {
      json.options.interactivity = interactivity;
      var attributes = this.getAttributes();
      if (attributes.length > 0) {
        json.options.attributes = {
          id: 'cartodb_id',
          columns: attributes
        }
      }
    }

    if (this.get('raster')) {
      json.options.raster = true;
      json.options.geom_column = "the_raster_webmercator";
      json.options.geom_type = "raster";
      json.options.raster_band = this.get('raster_band') || 0;
      // raster needs 2.3.0 to work
      json.options.cartocss_version = this.get('cartocss_version') || '2.3.0';
    }
    return json;
  },

  isValid: function() {
    return this.get('sql') && this.get('cartocss');
  },

  _onRemove: function() {
    this._unbindInteraction();
  },

  setSQL: function(sql) {
    return this.set({
      sql: sql
    });
  },

  setCartoCSS: function(cartocss) {
    return this.set({
      cartocss: cartocss
    });
  },

  setInteractivity: function(fields) {
    return this.set({
      interactivity: fields
    });
  },

  setInteraction: function(active) {
    this._parent.setInteraction(this._position, active);
  },

  getSQL: function() {
    return this.get('sql');
  },

  getCartoCSS: function() {
    return this.get('cartocss');
  },

  getInteractivity: function() {
    var interactivity = this.get('interactivity');
    if (interactivity) {
      if (typeof(interactivity) === 'string') {
        interactivity = interactivity.split(',');
      }
      return this._trimArrayItems(interactivity);
    }
  },

  getAttributes: function() {
    var columns = [];
    if (this.get('attributes')) {
      columns = this.get('attributes');
    } else {
      columns = _.map(this.infowindow.get('fields'), function(field){
        return field.name;
      });
    }
    return this._trimArrayItems(columns);
  },

  _trimArrayItems: function(array) {
    return _.map(array, function(item) {
      return item.trim();
    })
  },

  visualizeAs: function(visualizationType, options) {

    // TODO: We need to extract this from the viz.json
    var tableName = 'county_points_with_population';

    var options = _.defaults(options || {}, {
      tableName: tableName,
      geometryType: 'point'
    })

    var styler = this._getStylerFor(visualizationType, options);
    if (!styler) {
      throw new Error('The type of visualization "' + visualizationType + '" is not supported');
    }

    styler.fetchRequiredData(function() {

      var sql = 'SELECT * from ' + tableName;
      var sqlWrapper = styler.getSQLWrapper && styler.getSQLWrapper();
      if (sqlWrapper) {
        var sql = sqlWrapper.replace(/__wrapped/g, '(' + sql + ')');
      }

      this.set({
        cartocss: styler.getCartoCSS(),
        sql: sql
      });
      
      var legendAttrs = styler.getAttrsForLegend();
      if (legendAttrs) {
        this.legend.set(legendAttrs)
      } else {
        // TODO: Clear the legend
      }
    }.bind(this));
  },

  _getStylerFor: function(visualizationType, options) {
    var styler;
    if (visualizationType === 'polygon') {
      styler = new PolygonStyler(options);
    } else if (visualizationType === 'category') {
      styler = new CategoryStyler(options);
    } else if (visualizationType === 'bubble') {
      styler = new BubbleStyler(options);
    } else if (visualizationType === 'choropleth') {
      styler = new ChoroplethStyler(options);
    } else if (visualizationType === 'cluster') {
      styler = new ClusterStyler(options);
    }

    // TODO: Register more stylers here
    return styler;
  }


});

// Http sublayer

function HttpSubLayer(layer, position) {
  SubLayerBase.call(this, layer, position);
};

HttpSubLayer.prototype = _.extend({}, SubLayerBase.prototype, {

  toJSON: function() {
    var json = {
      type: 'http',
      options: {
        urlTemplate: this.getURLTemplate()
      }
    };

    var subdomains = this.get('subdomains');
    if (subdomains) {
      json.options.subdomains = subdomains;
    }

    var tms = this.get('tms');
    if (tms !== undefined) {
      json.options.tms = tms;
    }
    return json;
  },

  isValid: function() {
    return this.get('urlTemplate');
  },

  setURLTemplate: function(urlTemplate) {
    return this.set({
      urlTemplate: urlTemplate
    });
  },

  setSubdomains: function(subdomains) {
    return this.set({
      subdomains: subdomains
    });
  },

  setTms: function(tms) {
    return this.set({
      tms: tms
    });
  },

  getURLTemplate: function(urlTemplate) {
    return this.get('urlTemplate');
  },

  getSubdomains: function(subdomains) {
    return this.get('subdomains');
  },

  getTms: function(tms) {
    return this.get('tms');
  }
});

