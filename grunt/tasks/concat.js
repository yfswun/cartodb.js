
/**
 *  Concat grunt task for CartoDB.js
 *
 */

module.exports = {
  task: function(grunt, config) {
    return {
      // Only required since browserify don't support footer.
      core: {
        options: {
          banner: grunt.file.read('./grunt/templates/version_header.js'),
          footer: '//cartodb.core end'
        },
        files: {
          '<%= config.dist %>/cartodb.core.uncompressed.js': [
            '<%= config.dist %>/cartodb.core.uncompressed.js'
          ]
        }
      },

      torque: {
        options: {
          banner: grunt.file.read('./grunt/templates/version_header.js'),
          footer: grunt.file.read('./grunt/templates/torque_footer.js')
        },
        files: {
          // Torque library
          '<%= config.dist %>/cartodb.mod.torque.uncompressed.js': [
            'vendor/mod/carto.js',
            'vendor/mod/torque.uncompressed.js',
            'src/geo/gmaps/torque.js',
            'src/geo/leaflet/torque.js',
            'src/geo/ui/time_slider.js',
            'vendor/mod/jquery-ui/jquery.ui.core.js',
            'vendor/mod/jquery-ui/jquery.ui.widget.js',
            'vendor/mod/jquery-ui/jquery.ui.mouse.js',
            'vendor/mod/jquery-ui/jquery.ui.slider.js'
          ]
        }  
      },

      themes: {
        options: {},
        files: {
          // CartoDB.js CSSs (themes?)
          '<%= config.dist %>/themes/css/cartodb.css': [
            'themes/css/infowindow/*.css',
            'themes/css/map/*.css',
            'themes/css/tooltip/*.css',
            '!themes/css/cartodb.css'
          ],
          '<%= config.dist %>/themes/css/cartodb.ie.css': [
            'themes/css/ie/*.css',
            '!themes/css/cartodb.ie.css'
          ]
        }  
      }
    }
  }
};
