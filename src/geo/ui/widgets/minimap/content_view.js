var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var WidgetViewModel = require('../widget_content_model');
var template = require('./content_template.tpl');
var $ = require('jquery');
var L = require('leaflet');

/**
 *  Mini map widget content view
 *
 */
module.exports = WidgetContent.extend({

  options: {
    rectColor: '#5BA45E',
    mapHeight: 150
  },

  events: {
    'click .js-collapse': '_toggleCollapse'
  },

  initialize: function() {
    this.dataModel = this.model;
    this.viewModel = new WidgetViewModel();
    WidgetContent.prototype.initialize.call(this);
  },

  render: function() {
    var self = this;
    this.clearSubViews();
    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        isCollapsed: this.dataModel.isCollapsed(),
        mapHeight: this.options.mapHeight
      })
    );

    setTimeout(function() {
      self._initMap();
    }, 100);

    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:boundingBox', this._setBounds, this);
    WidgetContent.prototype._initBinds.call(this);
  },

  _initMap: function() {
    this._miniMap = L.map('js-miniMap', {
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      maxZoom: 2,
      zoomControl: false,
      attributionControl: false,
      center: [43, -3],
      zoom: 2
    });
    this._miniMap.addLayer(L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'));
    this._addRect();
    this._setBounds();
  },

  _addRect: function() {
    var bounds = [[54.559322, -5.767822], [56.1210604, -3.021240]];
    this._mapRect = L.rectangle(bounds, {
      color: this.options.rectColor,
      weight: 1
    }).addTo(this._miniMap);
  },

  _setBounds: function() {
    var bounds = this.dataModel.get('boundingBox');
    if (bounds) {
      var boundsArr = bounds.split(',');
      var latlngBounds = [ [ boundsArr[3], boundsArr[2] ], [ boundsArr[1], boundsArr[0] ] ];
      this._miniMap.fitBounds(latlngBounds);
      this._mapRect.setBounds(latlngBounds);
    }
  },

  _toggleCollapse: function() {
    this.dataModel.toggleCollapsed();
  }

});
