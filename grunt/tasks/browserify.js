// Using proposed solution for alias mappings from official docs, see https://github.com/jmreidy/grunt-browserify#alias
var remapify = require('remapify');

module.exports = {
  task: function(grunt, config) {
    var banner = grunt.file.read('./grunt/templates/dist_banner.js');

    return {
      options: {
        preBundleCB: function (b) {
          b.plugin(remapify, [
            {
              cwd: './vendor',
              src: './**/*.js',
              expose: 'vendor'
            },
            {
              cwd: './src',
              src: './**/*.js',
              expose: ''
            }
          ]);
        }
      },
      core: {
        src: 'src/cartodb.core.js',
        dest: '<%= config.dist %>/cartodb.core.uncompressed.js'
      },
      standard: {
        options: {
          banner: banner
        },
        src: 'src/cartodb.js',
        dest: '<%= config.dist %>/cartodb.uncompressed.js'
      },
      nojquery: {
        options: {
          banner: banner,
          ignore: ['vendor-jquery']
        },
        src: 'src/cartodb.js',
        dest: '<%= config.dist %>/_cartodb_nojquery.js'
      },
      noleaflet: {
        options: {
          banner: banner,
          ignore: ['**/leaflet.js']
        },
        src: 'src/cartodb.js',
        dest: '<%= config.dist %>/_cartodb_noleaflet.js',
      }
    };
  }
};
