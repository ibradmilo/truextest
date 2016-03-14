module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json'),
    sass:
      dist: {
        options: {
          loadPath: 'src/stylesheets/'
        },
        files: {
          '../css/application.css' : 'src/stylesheets/application.scss'
        }
      }
    ,
    concat_sourcemap:
      options: {},
      target: {
        files: {
          '../css/<%= pkg.name %>.lib.css': ['src/stylesheets/lib/*.css']
        }
      }
    ,
    clean: [
      "build/*"
    ],
    watch:
      sass: {
        files: [
          'src/stylesheets/*.scss',
          'src/stylesheets/common/*.scss',
          'src/stylesheets/pages/*.scss',
        ]
        tasks:
          [
            'sass:dist'
          ]
      }
      css: {
        files: [
          'src/stylesheets/lib/*.css'
        ]
        tasks:
          [
            'concat_sourcemap'
          ]
      }
    ,
    

  grunt.loadNpmTasks 'grunt-contrib-sass';
  grunt.loadNpmTasks 'grunt-contrib-concat';
  grunt.loadNpmTasks 'grunt-concat-sourcemap';
  grunt.loadNpmTasks 'grunt-contrib-coffee';
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch';
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask 'default', ['sass','concat_sourcemap','clean'];
