//
// REQUIREMENTS:
//
//  - Table must have a NUMERIC column
//
// CUSTOMIZABLE STUFF:
//
// All geometries:
//
//  - Quantification/clustering method: Jenks / Equal Interval / Heads-Tails / Quantile
//  - Bubble Radius: min and max radius size
//  - Bubble fill color
//  - Bubble fill opacity
//  - Stroke with
//  - Stroke color
//  - Stroke opacity
//  - Composite operation: multiply, screen, overlay, darken, etc.
//
//  TODO: Should we fetch the schema to check if the table has a NUMERIC column?
//
var BubbleCSSGenerator = {};

BubbleCSSGenerator.generateCartoCSS = function(options) {
  var geometryType = options.geometryType;
  var tableName = options.tableName;
  var columnName = options.columnName;

  var quartiles = options.quartiles;
  var points = options.points;

  var css = [];

  css.push(this._cartoCSSHeader());
  css.push(this._cartoCSSForTable(geometryType, tableName));
  css.push(this._cartoCSSForBubbles(tableName, columnName, quartiles, points));

  return css.join("\n");
}

BubbleCSSGenerator._cartoCSSHeader = function() {
  var css = [];
  css.push("/** Bubble **/\n\n");

  return css.join("\n");
}

BubbleCSSGenerator._cartoCSSForTable = function(geometryType, tableName) {
  var css = [];
  css.push('#' + tableName + '{');
  css.push('  marker-fill-opacity: 0.9;');
  css.push('  marker-line-color: #FFF;');
  css.push('  marker-line-width: 1;');
  css.push('  marker-line-opacity: 1;');
  css.push('  marker-placement: point;');
  css.push('  marker-multi-policy: largest;');
  css.push('  marker-type: ellipse;');
  css.push('  marker-fill: #FF5C00;');
  css.push('  marker-allow-overlap: true;');
  css.push('  marker-clip: false;');
  css.push('}');

  return css.join("\n");
}

BubbleCSSGenerator._cartoCSSForBubbles = function(tableName, columnName, quartiles, points) {
  var css = [];
  for(var i = points - 1; i >= 0; --i) {
    if(quartiles[i]) {
      css.push("#" + tableName +" [" + columnName + " <= " + quartiles[i] + "] {");
      css.push("   marker-width: " + this._getBubbleWidth(i, points) + ";");
      css.push('}');
    }
  }

  return css.join("\n");
}

BubbleCSSGenerator._getBubbleWidth = function(index, points) {
  var minBubbleWidth = 10;
  var maxBubbleWidth = 25;
  var t = index / (points - 1);
  var width = minBubbleWidth + t * (maxBubbleWidth - minBubbleWidth);

  return width.toFixed(1);
}
