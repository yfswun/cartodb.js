var _ = require('underscore');
var TorqueLayer = require('./torque-layer');

/**
 * Model for a BITorque Layer
 */
var BITorqueLayer = TorqueLayer.extend({
  defaults: {
    type: 'bi-torque'
  },

  initialize: function (attrs, options) {
    TorqueLayer.prototype.initialize.apply(this, arguments);
  },

  setDataProvider: function (dataProvider) {
    this._dataProvider = dataProvider;
  },

  getDataProvider: function () {
    return this._dataProvider;
  }
});

module.exports = BITorqueLayer;
