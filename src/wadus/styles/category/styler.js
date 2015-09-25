var CategoryStyler = function(options) {
  this.options = options;
}

CategoryStyler.prototype.fetchRequiredData = function() {
  var MAX_CATEGORIES = 10;
  var columnName = this.options.columnName;
  var tableName = this.options.tableName;

  // var successCallback = options.success;
  // var errorCallback = options.error;

  var SQLTemplate = _.template('\
    SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql ' +
    'GROUP BY <%= column %> ORDER BY count DESC LIMIT <%= max_values %> '
  );

  var sql = SQLTemplate({
    sql: encodeURIComponent("select * from " + tableName),
    column: columnName,
    max_values: MAX_CATEGORIES + 1
  })

  var requiredData = new Backbone.Model({});
  SQLApiRequest(sql, {
    success: function(data) {

      if (data.rows.length === 0) {
        throw new Error('The specified column is empty');
      }

      var categories = _.compact(data.rows).map(function(row){return {
        name: row.description,
        count: row.count
      }})

      requiredData.set({
        type: 'categories',
        categories: categories
      });
      // successCallback(categories);
    },
    error: function() {
      // TODO: Throw an error
    }
  });

  return requiredData;
}

CategoryStyler.prototype.generateCartoCSS = function(data) {
  var generator = new CategoryCSSGenerator();
  var categories = data.get('categories');
  var cartoCSS = generator.generateCartoCSS(_.defaults(this.options, {
    categories: categories
  }));
  return cartoCSS;
}

CategoryStyler.prototype.getAttrsForLegend = function(data) {
  var legendAttrs = {
    type: 'category',
    items: []
  }

  data.get('categories').forEach(function(category) {
    legendAttrs.items.push(
      {
        "name": category.name,
        "value": category.color
      }
    );
  });

  return legendAttrs;
}
