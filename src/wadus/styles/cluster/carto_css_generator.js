var ClusterCSSGenerator = {};

ClusterCSSGenerator.generateCartoCSS = function(options) {
  var geometryType = options.geometryType;
  var tableName = options.tableName;
  var bucketNames = options.bucketNames;
  var minMarkerWidth = 24;
  var maxMarkerWidth = 64;

  var css = [];
  css.push(this._cartoCSSHeader());
  css.push(this._cartoCSSForTable(geometryType, tableName, bucketNames, minMarkerWidth, maxMarkerWidth));
  css.push(this._cartoCSSForLabels(tableName, bucketNames));

  return css.join("\n");
}

ClusterCSSGenerator._cartoCSSHeader = function() {
  var css = [];
  css.push("/** Cluster **/\n\n");

  return css.join("\n");
}

ClusterCSSGenerator._cartoCSSForTable = function(geometryType, tableName, bucketNames, minMarkerWidth, maxMarkerWidth) {

  var css = [];
  css.push('#' + tableName + '{');
  css.push('  marker-fill: #FD8D3C;');
  css.push('  marker-fill-opacity: 0.9;');
  css.push('  marker-line-color: #FFF;');
  css.push('  marker-line-width: 1.5;');
  css.push('  marker-line-opacity: 1;');
  css.push('  marker-width: 12;');
  css.push('  marker-allow-overlap: true;');
  css.push("\n");

  // TODO: Calculate this somewhere else and pass makerWidths as a parameter
  var sizes = [minMarkerWidth];

  var buckets = bucketNames.length;
  var step = Math.round((maxMarkerWidth - minMarkerWidth)/ (buckets - 1));
  for (var i = 1; i < buckets - 1; i++) {
    sizes.push(minMarkerWidth + step * i);
  }
  sizes.push(maxMarkerWidth);

  bucketNames.forEach(function(bucket, index) {
    var markerWidth = sizes[index];

    css.push("  [src = '" + bucket + "'] {");
    css.push('    marker-line-width: 5;');
    css.push('    marker-width: ' + markerWidth + ';');
    css.push('  }');
  });

  css.push('}');
  css.push("\n");

  return css.join("\n");
}

ClusterCSSGenerator._cartoCSSForLabels = function(tableName, bucketNames) {
  var css = [];

  css.push('#' + tableName + '::labels {'); 
  css.push('  text-size: 0;');
  css.push('  text-fill: #fff;');
  css.push('  text-opacity: 0.8;');
  css.push('  text-name: [points_count];');
  css.push('  text-face-name: "DejaVu Sans Book"; ');
  css.push('  text-halo-fill: #FFF;');
  css.push('  text-halo-radius: 0;');
  css.push("\n");

  bucketNames.forEach(function(bucket, index) {
    var textSize =  index * 5 + 12;

    css.push("  [src = '" + bucket + "'] {");
    css.push('    text-halo-radius: 0.5;');
    css.push('    text-size: ' + textSize + ';');
    css.push('  }');
  });

  css.push('}');

  return css.join("\n");
}
