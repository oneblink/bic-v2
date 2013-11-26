/*jslint indent:2, maxlen:80, node:true*/
'use strict';

module.exports = function (grunt) {

  var commonjs = [
    'js/vendor/phpjs-2011-09.js',
    'js/vendor/jshashtable-2.1.js',
    'js/vendor/underscore.js',
    'js/vendor/es5-shim.js',
    'js/lib/bmp-blobs.js',
    'js/lib/Modernizr-tests.js',
    'js/lib/utilities.js',
    'js/lib/BlinkDispatch.js',
    'js/lib/BMP.js',
    'js/lib/BMP.BIC.Config.js',
    'js/lib/BlinkStorage.js'
  ];

  // Project configuration.
  grunt.initConfig({

    jslint: {
      all: {
        src: [
          'Gruntfile.js',
          '**/*.json',
          'js/lib/maps.js',
          'js/lib/utilities.js'
        ],
        exclude: [
          '**/*.min.js',
          '**/node_modules/**',
          'bower_components/**',
          'js/vendor/**/*'
        ],
        directives: {},
        options: {
          errorsOnly: true,
          failOnError: true
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 8083
        }
      }
    },

    mocha: {
      common: {
        options: {
          urls: [
            'http://localhost:8083/tests/browser/common-lib/index.html'
          ],
          run: true
        }
      },
      bic: {
        options: {
          urls: [
//            'http://localhost:8083/tests/browser/bare-example/index.html',
            'http://localhost:8083/tests/browser/bare-answerSpace/index.html'
          ],
          run: false
        }
      },
      options: {
        mocha: {},
        log: false
      }
    },

    uglify: {
      'common-bic2': { // still needed for Forms v2 in basic-mode BIC v2
        options: {
          sourceMapPrefix: 1, // fix ref in .js.map
          sourceMap: 'js/common.js.map',
          sourceMappingURL: 'common.js.map' // fix ref in .min.js
        },
        files: {
          'js/common.min.js': commonjs
        }
      },
      'android-bic2': {
        options: {
          sourceMapPrefix: 1, // fix ref in .js.map
          sourceMap: 'js/android.js.map',
          sourceMappingURL: 'android.js.map' //fix ref in .min.js
        },
        files: {
          'js/android.min.js': commonjs.concat([
            'js/vendor/history-1.7.1-r2.min.js',
            'js/android.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      'gecko-bic2': {
        options: {
          sourceMapPrefix: 1, // fix ref in .js.map
          sourceMap: 'js/gecko.js.map',
          sourceMappingURL: 'gecko.js.map' // fix ref in .min.js
        },
        files: {
          'js/gecko.min.js': commonjs.concat([
            'js/vendor/history-1.7.1-r2.min.js',
            'js/gecko.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      'ios-bic2': {
        options: {
          sourceMapPrefix: 1, // fix ref in .js.map
          sourceMap: 'js/ios.js.map',
          sourceMappingURL: 'ios.js.map' // fix ref in .min.js
        },
        files: {
          'js/ios.min.js': commonjs.concat([
            'js/vendor/history-1.7.1-r2.min.js',
            'js/ios.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      'msie-bic2': {
        options: {
          sourceMapPrefix: 1, // fix ref in .js.map
          sourceMap: 'js/msie.js.map',
          sourceMappingURL: 'msie.js.map' // fix ref in .min.js
        },
        files: {
          'js/msie.min.js': commonjs.concat([
            'js/vendor/history-1.7.1-r2.min.js',
            'js/msie.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      options: {
        preserveComments: 'some',
        beautify: {
          max_line_len: 80
        },
        compress: {}
      }
    },

    compass: {
      bicv2: {
        options: {
          config: 'css/.compass/config.rb',
          basePath: 'css'
        }
      }
    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['jslint', 'connect', 'mocha']);
  grunt.registerTask('build', ['uglify', 'compass']);
  grunt.registerTask('default', ['build', 'test']);

};
