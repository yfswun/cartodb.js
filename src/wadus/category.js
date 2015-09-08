//
// CUSTOMIZABLE STUFF:
// 
// All geometries:
// 
//  - Color of each category
//  
// Point:
// 
//  - Marker width
//  - Marker fill opacity
//  - Stroke width
//  - Stroke color
//  - Stroke opacity
//  
// Polygon:
// 
//  - Polygon fill opacity
//  - Stroke width
//  - Stroke color
//  - Stroke opacity
//  
// Line:
// 
//  - Stroke width
//  - Stroke opacity
//

var REQUIRED_OPTIONS = ['columnName', 'colorSchema'];

validatePresenceOfRequiredOptions = function(options) {
  for (var i in REQUIRED_OPTIONS) {
    var option = REQUIRED_OPTIONS[i];
    if (!options[option]) {
      throw new Error(option + " is required");
    }    
  }
}

var generateCartoCSS = function(options) {
  validatePresenceOfRequiredOptions(options);

  var visualizationType = options.visualizationType;
  var geometryType = options.geometryType;
  var tableName = options.tableName;
  var columnName = options.columnName;
  var colorSchema = options.colorSchema || 'aqua';
  var successCallback = options.success;

  fetchCategories({
    column: columnName,
    tableName: tableName,
    success: function(data) {
      var categories = data.categories;

      var css = [];
      css.push(cartoCSSHeader(visualizationType));
      css.push(cartoCSSForTable(geometryType, tableName));

      for (var i in categories) {
        css.push(cartoCSSForCategory(tableName, columnName, categories[i], COLOR_SCHEMAS[colorSchema][i]));
      }

      successCallback(css.join("\n"));
    }
  })
}

var fetchCategories = function(options) {
  var MAX_VALUES = 10;
  var column = options.column;
  var tableName = options.tableName;
  var successCallback = options.success;
  var errorCallback = options.error;

  var SQLTemplate = _.template('\
    SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql ' +
    'GROUP BY <%= column %> ORDER BY count DESC LIMIT <%= max_values %> '
  );

  var sql = SQLTemplate({
    sql: encodeURIComponent("select * from " + tableName),
    column: column,
    max_values: MAX_VALUES + 1
  })

  SQLApiRequest(sql, {
    success: function(data) {
      successCallback({
        type: data.fields[column].type || 'string',
        categories: _(data.rows).pluck(column)
      });
    },
    error: function() {}
  });
}

var SQLApiRequest = function(sql, options) {
  var method = options.method || 'POST';
  var successCallback = options.success;
  var errorCallback = options.error;

  $.ajax({
    type: method,
    data: "q=" + sql + "&api_key=" + API_KEY,
    url: API_URL,
    success: successCallback,
    error: errorCallback
  });  
}

var cartoCSSHeader = function(style) {
  var css = [];
  css.push("/** " + style + "**/\n\n");

  return css.join("\n");
}

var cartoCSSForTable = function(geometryType, tableName) {
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

var cartoCSSForCategory = function(tableName, columnName, category, color) {  
  var css = [];
  css.push('#' + tableName + '[' + columnName + '="' + category + '"] {');
  css.push('  marker-fill: ' + color + ';');
  css.push('}');

  return css.join("\n");
}