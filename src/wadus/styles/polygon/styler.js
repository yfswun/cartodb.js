var PolygonStyler = function(options) {
  validatePresenceOfRequiredOptions(options, ['tableName']);
  
  this.tableName = options.tableName;

  this.metadata = new Backbone.Model();
}

PolygonStyler.prototype.fetchRequiredData = function(callback) {
  callback();

  return this.metadata;
}

PolygonStyler.prototype.getCartoCSS = function() {
  var cartoCSS = PolygonCSSGenerator.generateCartoCSS({
    tableName: this.tableName
  });

  return cartoCSS;
}

PolygonStyler.prototype.getSQL = function() {
  return 'SELECT * from ' + this.tableName;
}

PolygonStyler.prototype.getAttrsForLegend = function() {
  var legendAttrs = {
    "type": "none",
    "show_title": false,
    "title": "",
    "template": "",
    "items": []
  }
  return legendAttrs;
}
