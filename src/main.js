var API_URL = 'http://pabloalonso.cartodb.com/api/v2/sql';

var COLOR_SCHEMAS = {
  'blue': ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#DDDDDD'],
  'green': ['#EDF8FB', '#D7FAF4', '#CCECE6', '#66C2A4', '#41AE76', '#238B45', '#005824'],
  'pink': ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F']
}

var CLUSTERING_FUNCTIONS = {
  'quantile': 'CDB_QuantileBins',
  'jenks': 'CDB_JenksBins'
}

var validatePresenceOfRequiredOptions = function(options, requiredOptions) {
  for (var i in requiredOptions) {
    var requiredOption = requiredOptions[i];
    if (!options[requiredOption]) {
      throw new Error(requiredOption + " is required");
    }
  }
}

var SQLApiRequest = function(sql, options) {
  var method = options.method || 'POST';
  var successCallback = options.success;
  var errorCallback = options.error;

  $.ajax({
    type: method,
    data: "q=" + sql,
    url: API_URL,
    success: successCallback,
    error: errorCallback
  });
}