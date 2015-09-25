var CategoryStyler = function(options) {
  this.columnName = options.columnName;
  this.tableName = options.tableName;
  this.colorSchema = options.colorSchema || 'blue';

  this.metadata = new Backbone.Model();
}

CategoryStyler.prototype.fetchRequiredData = function(callback) {
  var MAX_CATEGORIES = 10;

  // var successCallback = options.success;
  // var errorCallback = options.error;

  var SQLTemplate = _.template('\
    SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql ' +
    'GROUP BY <%= column %> ORDER BY count DESC LIMIT <%= max_values %> '
  );

  var sql = SQLTemplate({
    sql: encodeURIComponent("select * from " + this.tableName),
    column: this.columnName,
    max_values: MAX_CATEGORIES + 1
  })

  SQLApiRequest(sql, {
    success: function(data) {

      if (data.rows.length === 0) {
        throw new Error('The specified column is empty');
      }

      var categories = _.compact(data.rows).map(function(row){
        return {
          name: row[this.columnName],
          count: row.count
        }
      }.bind(this));

      this.metadata.set({
        type: 'categories',
        categories: categories
      });
      callback(this.metadata);
    }.bind(this),
    error: function() {
      // TODO: Throw an error
    }
  });

  return this.metadata;
}

CategoryStyler.prototype.getCartoCSS = function() {
  var cartoCSS = CategoryCSSGenerator.generateCartoCSS({
    tableName: this.tableName,
    columnName: this.columnName,
    colorSchema: this.colorSchema,
    categories: this.metadata.get('categories')
  });

  return cartoCSS;
}

CategoryStyler.prototype.getAttrsForLegend = function() {
  var legendAttrs = {
    type: 'category',
    items: []
  }

  this.metadata.get('categories').forEach(function(category, i) {
    legendAttrs.items.push(
      {
        "name": category.name,
        "value": COLOR_SCHEMAS[this.colorSchema][i]
      }
    );
  }.bind(this));

  return legendAttrs;
}
