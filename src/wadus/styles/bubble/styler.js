var BubbleStyler = function(options) {
  this.options = options;
}

BubbleStyler.prototype.fetchRequiredData = function() {
  var POINTS = 10;

  // TODO: Move this somewhere else
  var CLUSTERING_FUNCTIONS = {
    'quantile': 'CDB_QuantileBins',
    'jenks': 'CDB_JenksBins'
  }

  var columnName = this.options.columnName;
  var tableName = this.options.tableName;
  var clusteringMethod = this.options.clusteringMethod || Object.keys(CLUSTERING_FUNCTIONS[0]);
  var dataModel = this.options.data;

  var SQLTemplate = _.template('select unnest(<%= functionName %>(array_agg(<%= simplify_fn %>((<%= column %>::numeric))), <%= slots %>)) as buckets from (<%= sql %>) _table_sql where <%= column %> is not null');

  var sql = SQLTemplate({
    slots: POINTS,
    sql: encodeURIComponent("select * from " + tableName),
    column: columnName,
    functionName: CLUSTERING_FUNCTIONS[clusteringMethod],
    simplify_fn: 'distinct'
  })

  var requiredData = new Backbone.Model({});
  SQLApiRequest(sql, {
    success: function(data) {
      var buckets = _(data.rows).pluck('buckets');
      requiredData.set({
        type: 'quartiles',
        quartiles: buckets,
        points: POINTS
      });
    },
    error: function() {
      // TODO: Throw an error
    }
  });

  return requiredData;
}

BubbleStyler.prototype.generateCartoCSS = function(data) {
  var generator = new BubbleCSSGenerator();
 
  var quartiles = data.get('quartiles');
  var points = data.get('points');

  var cartoCSS = generator.generateCartoCSS(_.defaults(this.options, {
    quartiles: quartiles,
    points: points
  }));
  
  return cartoCSS;
}

BubbleStyler.prototype.getAttrsForLegend = function(data) {
  var quartiles = data.get('quartiles');
  var legendAttrs = {
    "type": "bubble",
    "show_title": false,
    "title": "",
    "template": "",
    "visible": true,
    "items": [
      {
        "name": "Left label",
        "value": quartiles[0],
        "legend_type": "bubble",
        "type": "text"
      },
      {
        "name": "Right Label",
        "value": _.last(quartiles),
        "legend_type": "bubble",
        "type": "text",
      },
      {
        "name": "Color",
        "value": "#FF5C00"
      }
    ]
  }
  return legendAttrs;
}
