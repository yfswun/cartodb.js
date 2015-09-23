var LayerAdapter = function(layer, sublayerIndex) {
  this._sublayer = layer.getSubLayer(sublayerIndex);

  // Metadata that is the result of the data analysis that was required to
  // display the layer in a certain way. This is used to render legends.
  this.metadata = new Backbone.Model();
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

  var metadata = styler.fetchRequiredData();
  metadata.bind('change', function() {
    metadata.unbind('change');
    this.metadata.set(metadata.toJSON());

    // Generate the CSS
    var cartoCSS = styler.generateCartoCSS(this.metadata);
    this.setCartoCSS(cartoCSS);

    // TODO: Generate the SQL
    
    // TODO: Generate the legends
  }.bind(this));
}

LayerAdapter.prototype.setCartoCSS = function(cartoCSS) {
  this._sublayer.setCartoCSS(cartoCSS);
  console.log(this._sublayer.getCartoCSS());
}
