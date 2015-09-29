var ChoroplethStyler = function(options) {
  validatePresenceOfRequiredOptions(options, ['tableName', 'columnName']);

  this.columnName = options.columnName;
  this.tableName = options.tableName;
  this.buckets = options.buckets || 3 // 3, 5 or 7;
  this.clusteringMethod = options.clusteringMethod || Object.keys(CLUSTERING_FUNCTIONS[0]);
  this.colorSchema = options.colorSchema || 'blue';

  this.metadata = new Backbone.Model();
}

ChoroplethStyler.prototype.fetchRequiredData = function(callback) {

  var SQLTemplate = _.template('select unnest(<%= functionName %>(array_agg(<%= simplify_fn %>((<%= column %>::numeric))), <%= slots %>)) as buckets from (<%= sql %>) _table_sql where <%= column %> is not null');

  var sql = SQLTemplate({
    slots: this.buckets,
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
        quartiles: buckets
      });
      callback(this.metadata);
    }.bind(this),
    error: function() {
      // TODO: Throw an error
    }
  });
  return this.metadata;
}

ChoroplethStyler.prototype.getCartoCSS = function() {
  var cartoCSS = ChoroplethCSSGenerator.generateCartoCSS({
    tableName: this.tableName,
    columnName: this.columnName,
    colorSchema: this.colorSchema,
    quartiles: this.metadata.get('quartiles')
  });
  return cartoCSS;
}

ChoroplethStyler.prototype.getSQL = function() {
  return 'SELECT * from ' + this.tableName;
}

ChoroplethStyler.prototype.getAttrsForLegend = function() {
  var quartiles = this.metadata.get('quartiles');
  var legendAttrs = {
    type: "choropleth",
    show_title: false,
    title: "",
    template: "",
    items: [
      {
        "name": "Left label",
        "value": _.last(quartiles),
        "type": "text"
      },
      {
        "name": "Right label",
        "value": quartiles[0],
        "type": "text"
      }
    ]

  }

  quartiles.reverse().forEach(function(quartile, index) {
    legendAttrs.items.push({
      "name": "Color",
      "value": COLOR_SCHEMAS[this.colorSchema][index],
      "type": "color"
    });
  }.bind(this));

  return legendAttrs;
}
