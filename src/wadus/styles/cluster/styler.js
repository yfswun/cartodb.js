var ClusterStyler = function(options) {
  this.tableName = options.tableName;
  this.buckets = options.buckets || 3 // 2, 3, 4, 5;

  var BUCKET_NAMES = ['bucketA', 'bucketB', 'bucketC', 'bucketD', 'bucketE'];
  this.bucketNames = BUCKET_NAMES.slice(0, this.buckets);

  this.metadata = new Backbone.Model();
}

ClusterStyler.prototype.fetchRequiredData = function(callback) {
  callback();

  return this.metadata;
}

ClusterStyler.prototype.getCartoCSS = function() {
  var cartoCSS = ClusterCSSGenerator.generateCartoCSS({
    tableName: this.tableName,
    bucketNames: this.bucketNames
  });
  return cartoCSS;
}

ClusterStyler.prototype.getSQL = function() {
  var tableName = this.tableName;
  var nquartiles = this.buckets;
  var grids = ["A", "B", "C", "D", "E"];
  var bucket = "bucket" + grids[0];
  var mainBucket = bucket;

  var sizes = [];
  var step = 1 / (nquartiles + 1);

  for (var i = 0; i < nquartiles; i++) {
    sizes.push( 1 - step * i)
  }

  var sql = "WITH meta AS ( " +
    "   SELECT greatest(!pixel_width!,!pixel_height!) as psz, ext, ST_XMin(ext) xmin, ST_YMin(ext) ymin FROM (SELECT !bbox! as ext) a " +
    " ), " +
    " filtered_table AS ( " +
    "   SELECT t.* FROM <%= table %> t, meta m WHERE t.the_geom_webmercator && m.ext " +
    " ), ";

  for (var i = 0; i < nquartiles; i++) {
    bucket = "bucket" + grids[i];

    if (i == 0){
      sql += mainBucket + "_snap AS (SELECT ST_SnapToGrid(f.the_geom_webmercator, 0, 0, m.psz * <%= size %>, m.psz * <%= size %>) the_geom_webmercator, count(*) as points_count, 1 as cartodb_id, array_agg(f.cartodb_id) AS id_list "
    }
    if (i > 0){
      sql += "\n" + bucket + "_snap AS (SELECT ST_SnapToGrid(f.the_geom_webmercator, 0, 0, m.psz * " + sizes[i] + " * <%= size %>, m.psz * " + sizes[i] + " * <%= size %>) the_geom_webmercator, count(*) as points_count, 1 as cartodb_id, array_agg(f.cartodb_id) AS id_list "
    }

    sql += " FROM filtered_table f, meta m "

    if (i == 0){
      sql += " GROUP BY ST_SnapToGrid(f.the_geom_webmercator, 0, 0, m.psz * <%= size %>, m.psz * <%= size %>), m.xmin, m.ymin), ";
    }

    if (i > 0){
      sql += " WHERE cartodb_id NOT IN (select unnest(id_list) FROM " + mainBucket + ") ";

      for (var j = 1; j<i; j++) {
        bucket2 = "bucket" + grids[j];
        sql += " AND cartodb_id NOT IN (select unnest(id_list) FROM " + bucket2 + ") ";
      }

      sql += " GROUP BY ST_SnapToGrid(f.the_geom_webmercator, 0, 0, m.psz * " + sizes[i] + " * <%= size %>, m.psz * " + sizes[i] + " * <%= size %>), m.xmin, m.ymin), ";
    }

    sql +=  bucket + "  AS (SELECT * FROM " + bucket + "_snap WHERE points_count > ";

    if (i == nquartiles - 1) {
      sql += " GREATEST(<%= size %> * 0.1, 2) ";
    } else {
      sql += " <%= size %> * " + sizes[i];
    }

    sql += " ) ";

    if (i < nquartiles - 1) sql += ", ";
  }

  sql += " SELECT the_geom_webmercator, 1 points_count, cartodb_id, ARRAY[cartodb_id] as id_list, 'origin' as src, cartodb_id::text cdb_list FROM filtered_table WHERE ";

  for (var i = 0; i < nquartiles; i++) {
    bucket = "bucket" + grids[i];
    sql += "\n" + (i > 0 ? "AND " : "") + "cartodb_id NOT IN (select unnest(id_list) FROM " + bucket + ") ";
  }

  for (var i = 0; i < nquartiles; i++) {
    bucket = "bucket" + grids[i];
    sql += " UNION ALL SELECT *, '" + bucket + "' as src, array_to_string(id_list, ',') cdb_list FROM " + bucket
  }

  return _.template(sql, {
    name: tableName,
    //size: props["radius_min"],
    size: 48,
    table: '(SELECT * from ' + tableName + ')'
  });

}

ClusterStyler.prototype.getAttrsForLegend = function() {
  var legendAttrs = {
    "type": "none",
    "show_title": false,
    "title": "",
    "template": "",
    "items": []
  }
  return legendAttrs;
}
