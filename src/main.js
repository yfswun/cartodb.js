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

var LayerAdapter = function(layer, sublayerIndex) {
  this._sublayer = layer.getSubLayer(sublayerIndex);
  this.tableName = this._sublayer.layer_name;

  this.requiredData = new Backbone.Model();
}


LayerAdapter.prototype.visualizeAs = function(visualizationType, options) {
  var options = _.defaults(options, {
    tableName: 'untitled_table_7',
    geometryType: 'point'
  })

  if (visualizationType === 'category') {
    var styler = new CategoryStyler(options);
  } else if (visualizationType === 'bubble') {
    var styler = new BubbleStyler(options);
  } else {
    throw new Error('The type of visualization "' + visualizationType + '" is not supported');
  }

  var requiredData = styler.fetchRequiredData();
  requiredData.bind('change', function() {

    // Generate the CSS
    var cartoCSS = styler.generateCartoCSS(requiredData);
    this.setCartoCSS(cartoCSS);

    // TODO: Generate the SQL
    
    // TODO: Generate the legends
  }.bind(this));

}

LayerAdapter.prototype.setCartoCSS = function(cartoCSS) {
  this._sublayer.setCartoCSS(cartoCSS);
  console.log(this._sublayer.getCartoCSS());
}

var validatePresenceOfRequiredOptions = function(options) {
  for (var i in this.REQUIRED_OPTIONS) {
    var option = this.REQUIRED_OPTIONS[i];
    if (!options[option]) {
      throw new Error(option + " is required");
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
