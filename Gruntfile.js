module.exports = function(grunt) {

  var cartodb_files = require('./files');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ';'
      },
      dist: {
        src: cartodb_files.src,
        dest: 'dist/cartodb.uncompressed.js'
      },
      mod_torque: {
        src: cartodb_files.mod_torque,
        dest: 'dist/cartodb.mod.torque.uncompressed.js'
      }
    },

    jasmine: {
      pivotal: {
          src: cartodb_files.all,
          options: {
            specs: 'test/spec/**/*.js',
            helpers: ['test/lib/sinon-1.3.4.js', 'test/spec/*Helper.js', 'https://maps.google.com/maps/api/js?sensor=false&v=3.12']
          }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Default task(s).
  //grunt.registerTask('default', ['uglify']);
  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('default', ['concat']);

};
