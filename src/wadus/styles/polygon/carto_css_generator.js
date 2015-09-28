var PolygonCSSGenerator = {};

PolygonCSSGenerator.generateCartoCSS = function(options) {
  var geometryType = options.geometryType;
  var tableName = options.tableName;

  var css = [];
  css.push(this._cartoCSSHeader());
  css.push(this._cartoCSSForTable(geometryType, tableName));

  return css.join("\n");
}


PolygonCSSGenerator._cartoCSSHeader = function() {
  var css = [];
  css.push("/** Polygon **/\n\n");

  return css.join("\n");
}

PolygonCSSGenerator._cartoCSSForTable = function(geometryType, tableName) {
  var css = [];
  css.push('#' + tableName + '{');
  css.push('  marker-fill-opacity: 0.9;');
  css.push('  marker-line-color: #FFF;');
  css.push('  marker-line-width: 1;');
  css.push('  marker-line-opacity: 1;');
  css.push('  marker-placement: point;');
  css.push('  marker-type: ellipse;');
  css.push('  marker-width: 10;');
  css.push('  marker-fill: #FF6600;');
  css.push('  marker-allow-overlap: true;');
  css.push('}');

  return css.join("\n");
}
