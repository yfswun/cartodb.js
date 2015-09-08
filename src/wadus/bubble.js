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

BubbleCSSGenerator = function() {
  this.REQUIRED_OPTIONS = ['columnName'];
  this.POINTS = 10;

  this.CLUSTERING_FUNCTION = {
    'quantile': 'CDB_QuantileBins',
    'jenks': 'CDB_JenksBins'
  }
}

BubbleCSSGenerator.prototype.generateCartoCSS = function(options) {
  validatePresenceOfRequiredOptions(options);

  var visualizationType = options.visualizationType;
  var geometryType = options.geometryType;
  var tableName = options.tableName;
  var columnName = options.columnName;
  var clusteringMethod = options.clusteringMethod || Object.keys(this.CLUSTERING_FUNCTION)[0];
  var successCallback = options.success;

  this._fetchQuartiles({
    column: columnName,
    tableName: tableName,
    clusteringMethod: clusteringMethod,
    success: function(quartiles) {
      var css = [];

      css.push(this._cartoCSSHeader(visualizationType));
      css.push(this._cartoCSSForTable(geometryType, tableName));
      css.push(this._cartoCSSForBubbles(tableName, columnName, quartiles));

      successCallback(css.join("\n"));
    }.bind(this)
  })
}

BubbleCSSGenerator.prototype._fetchQuartiles = function(options) {
  var column = options.column;
  var tableName = options.tableName;
  var clusteringMethod = options.clusteringMethod;
  var successCallback = options.success;
  var errorCallback = options.error;

  var SQLTemplate = _.template('select unnest(<%= functionName %>(array_agg(<%= simplify_fn %>((<%= column %>::numeric))), <%= slots %>)) as buckets from (<%= sql %>) _table_sql where <%= column %> is not null');

  var sql = SQLTemplate({
    slots: this.POINTS,
    sql: encodeURIComponent("select * from " + tableName),
    column: column,
    functionName: this.CLUSTERING_FUNCTION[clusteringMethod],
    simplify_fn: 'distinct'
  })

  SQLApiRequest(sql, {
    success: function(data) {
      var buckets = _(data.rows).pluck('buckets');
      successCallback(buckets);
    },
    error: function() {
      errorCallback();
    }
  });
}

BubbleCSSGenerator.prototype._cartoCSSHeader = function(style) {
  var css = [];
  css.push("/** " + style + "**/\n\n");

  return css.join("\n");
}

BubbleCSSGenerator.prototype._cartoCSSForTable = function(geometryType, tableName) {
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

BubbleCSSGenerator.prototype._cartoCSSForBubbles = function(tableName, columnName, quartiles) {
  var css = [];
  for(var i = this.POINTS - 1; i >= 0; --i) {
    if(quartiles[i]) {
      css.push("#" + tableName +" [" + columnName + " <= " + quartiles[i] + "] {");
      css.push("   marker-width: " + this._getBubbleWidth(i) + ";");
      css.push('}');
    }
  }

  return css.join("\n");
}

BubbleCSSGenerator.prototype._getBubbleWidth = function(index) {
  var minBubbleWidth = 10;
  var maxBubbleWidth = 25;
  var t = index / (this.POINTS - 1);
  var width = minBubbleWidth + t * (maxBubbleWidth - minBubbleWidth);

  return width.toFixed(1);
}

generators.BubbleCSSGenerator = BubbleCSSGenerator;
