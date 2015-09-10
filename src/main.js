//
//  THINGS TO CONSIDER / THINK ABOUT
//  
//  1. We need to modify the CartoCSS and SQL of layers so that the Tiler can render
//     the tiles according to what the user is asking for. Right now, Layer s in named_maps
//     are not editable. How will we do this?
//   
//  2. How will the user customize the style of the layer visualization?
//  
//  DATA REQUIRED BY THE GENERATORS
//  
//  The client (cartodb.js) will need the following information:
//
//    - The type of geometry of the dataset (point, polygon, line)
//    - The name of the table linked to the layer that want to style
//    - The URL of the SQL API (protocol, domain, endpoint, port)
//    - The username

var API_KEY = 'API_KEY';
var API_URL = 'http://pabloalonso.cartodb.com/api/v2/sql';

var COLOR_SCHEMAS = {
  'blue': ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#DDDDDD'],
  'green': ['#EDF8FB', '#D7FAF4', '#CCECE6', '#66C2A4', '#41AE76', '#238B45', '#005824'],
  'pink': ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F']
}

var CARTO_CSS_GENERATORS = {
  'category': 'CategoryCSSGenerator',
  'bubble': 'BubbleCSSGenerator'
}

var generators = {};

var LayerAdapter = function(layer, sublayerIndex) {
  this._sublayer = layer.getSubLayer(sublayerIndex);
  this.tableName = this._sublayer.layer_name;
}

LayerAdapter.prototype.visualizeAs = function(visualizationType, options) {
  var columnName = options.columnName;
  var layerName = 'Untitled Table 7'; // The title of the legend
  var tableName = 'untitled_table_7';
  var geometryType = 'point';

  var generatorClass = CARTO_CSS_GENERATORS[visualizationType];
  if (!generators[generatorClass]) {
    throw new Error('The type of visualization "' + visualizationType + '" is not supported');
  }
  var generator = new generators[generatorClass];

  if (visualizationType === 'category') {
    var colorSchema = options.colorSchema;

    fetchCategories({
      tableName: 'untitled_table_7',
      columnName: columnName,
      success: function(categories) {
        var cartoCSS = generator.generateCartoCSS(_.defaults(options, {
          visualizationType: visualizationType,
          geometryType: geometryType,
          tableName: tableName,
          columnName: columnName,
          colorSchema: colorSchema,
          categories: categories
        }));
        this.setCartoCSS(cartoCSS);
      }.bind(this),
      error: function() {}
    })
  } else if (visualizationType === 'bubble') {
    var clusteringMethod = options.clusteringMethod;

    fetchQuartiles({
      columnName: columnName,
      tableName: tableName,
      clusteringMethod: clusteringMethod,
      success: function(quartiles, points) {
        var cartoCSS = generator.generateCartoCSS(_.defaults(options, {
          visualizationType: visualizationType,
          geometryType: geometryType,
          tableName: tableName,
          columnName: columnName,
          quartiles: quartiles,
          points: points
        }));
        this.setCartoCSS(cartoCSS);
      }.bind(this),
      error: function() {}
    })
  }
}

LayerAdapter.prototype.setCartoCSS = function(cartoCSS) {
  this._sublayer.setCartoCSS(cartoCSS);
  console.log(this._sublayer.getCartoCSS());
}

validatePresenceOfRequiredOptions = function(options) {
  for (var i in this.REQUIRED_OPTIONS) {
    var option = this.REQUIRED_OPTIONS[i];
    if (!options[option]) {
      throw new Error(option + " is required");
    }
  }
}

SQLApiRequest = function(sql, options) {
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


var fetchCategories = function(options) {

  var MAX_CATEGORIES = 10;
  var columnName = options.columnName;
  var tableName = options.tableName;
  var successCallback = options.success;
  var errorCallback = options.error;

  var SQLTemplate = _.template('\
    SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql ' +
    'GROUP BY <%= column %> ORDER BY count DESC LIMIT <%= max_values %> '
  );

  var sql = SQLTemplate({
    sql: encodeURIComponent("select * from " + tableName),
    column: columnName,
    max_values: MAX_CATEGORIES + 1
  })

  SQLApiRequest(sql, {
    success: function(data) {

      if (data.rows.length === 0) {
        throw new Error('The specified column is empty');
      }

      var categories = _.compact(data.rows).map(function(row){return {
        name: row.description,
        count: row.count
      }})

      successCallback(categories);
    },
    error: function() {
      errorCallback();
    }
  });
}

var fetchQuartiles = function(options) {
  var POINTS = 10;
  var CLUSTERING_FUNCTIONS = {
    'quantile': 'CDB_QuantileBins',
    'jenks': 'CDB_JenksBins'
  }

  var columnName = options.columnName;
  var tableName = options.tableName;
  var clusteringMethod = options.clusteringMethod || Object.keys(CLUSTERING_FUNCTIONS[0]);
  var successCallback = options.success;
  var errorCallback = options.error;

  var SQLTemplate = _.template('select unnest(<%= functionName %>(array_agg(<%= simplify_fn %>((<%= column %>::numeric))), <%= slots %>)) as buckets from (<%= sql %>) _table_sql where <%= column %> is not null');

  var sql = SQLTemplate({
    slots: POINTS,
    sql: encodeURIComponent("select * from " + tableName),
    column: columnName,
    functionName: CLUSTERING_FUNCTIONS[clusteringMethod],
    simplify_fn: 'distinct'
  })

  SQLApiRequest(sql, {
    success: function(data) {
      var buckets = _(data.rows).pluck('buckets');
      successCallback(buckets, POINTS);
    },
    error: function() {
      errorCallback();
    }
  });
}

