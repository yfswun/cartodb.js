var BubbleStyler = function(options) {
  validatePresenceOfRequiredOptions(options, ['tableName', 'columnName']);
  
  this.columnName = options.columnName;
  this.tableName = options.tableName;
  this.clusteringMethod = options.clusteringMethod || Object.keys(CLUSTERING_FUNCTIONS[0]);

  this.metadata = new Backbone.Model();
}

BubbleStyler.prototype.fetchRequiredData = function(callback) {
  var POINTS = 10;

  var SQLTemplate = _.template('select unnest(<%= functionName %>(array_agg(<%= simplify_fn %>((<%= column %>::numeric))), <%= slots %>)) as buckets from (<%= sql %>) _table_sql where <%= column %> is not null order by buckets');

  var sql = SQLTemplate({
    slots: POINTS,
    sql: encodeURIComponent("select * from " + this.tableName),
    column: this.columnName,
    functionName: CLUSTERING_FUNCTIONS[this.clusteringMethod],
    simplify_fn: 'distinct'
  })

  SQLApiRequest(sql, {
    success: function(data) {
      var buckets = _(data.rows).pluck('buckets');
      this.metadata.set({
        type: 'quartiles',
        quartiles: buckets,
        points: POINTS
      });
      callback(this.metadata);
    }.bind(this),
    error: function() {
      // TODO: Throw an error
    }
  });
  return this.metadata;
}

BubbleStyler.prototype.getCartoCSS = function() {
  var cartoCSS = BubbleCSSGenerator.generateCartoCSS({
    tableName: this.tableName,
    columnName: this.columnName,
    quartiles: this.metadata.get('quartiles'),
    points: this.metadata.get('points')
  });
  
  return cartoCSS;
}

BubbleStyler.prototype.getSQL = function() {
  return 'SELECT * from ' + this.tableName;
}

BubbleStyler.prototype.getAttrsForLegend = function() {
  var quartiles = this.metadata.get('quartiles');
  var legendAttrs = {
    "type": "bubble",
    "show_title": false,
    "title": "",
    "template": "",
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
