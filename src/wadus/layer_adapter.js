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
