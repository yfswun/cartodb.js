var ChoroplethCSSGenerator = {};

ChoroplethCSSGenerator.generateCartoCSS = function(options) {
  var geometryType = options.geometryType;
  var tableName = options.tableName;
  var columnName = options.columnName;
  var colorSchema = options.colorSchema;
  var quartiles = options.quartiles;

  var css = [];
  css.push(this._cartoCSSHeader());
  css.push(this._cartoCSSForTable(geometryType, tableName));
  css.push(this._cartoCSSForQuartiles(quartiles, tableName, columnName, colorSchema));

  return css.join("\n");
}


ChoroplethCSSGenerator._cartoCSSHeader = function() {
  var css = [];
  css.push("/** Choropleth **/\n\n");

  return css.join("\n");
}

ChoroplethCSSGenerator._cartoCSSForTable = function(geometryType, tableName) {
  var css = [];
  css.push('#' + tableName + '{');
  css.push('  marker-fill-opacity: 0.9;');
  css.push('  marker-line-color: #FFF;');
  css.push('  marker-line-width: 1;');
  css.push('  marker-line-opacity: 1;');
  css.push('  marker-placement: point;');
  css.push('  marker-type: ellipse;');
  css.push('  marker-width: 10;');
  css.push('  marker-allow-overlap: true;');
  css.push('}');

  return css.join("\n");
}

ChoroplethCSSGenerator._cartoCSSForQuartiles = function(quartiles, tableName, columnName, colorSchema) {
  var css = [];

  quartiles.reverse().forEach(function(quartile, index) {

    css.push('#' + tableName + ' [ ' + columnName + ' <= ' + quartile + '] {');
    css.push('  marker-fill: ' + COLOR_SCHEMAS[colorSchema][index] + ';');
    css.push('}');
  })

  return css.join("\n");
}
