/*jslint indent:2, node:true*/
'use strict';

module.exports = function (grunt) {

  var commonjs = [
    'js/vendor/phpjs-2011-09.js',
    'js/lib/Object.create.js',
    'js/vendor/jshashtable-2.1.js',
    'bower_components/underscore/underscore.js',
    'bower_components/es5-shim/es5-shim.js',
    'bower_components/jquery-migrate/jquery-migrate.js',
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

    jqlint: {
      all: {
        src: [
          '**/*.js',
          '!**/node_modules/**',
          '!**/bower_components/**',
          '!**/*.min.js',
          '!js/vendor/**/*'
        ],
        options: {
          errorsOnly: true,
          failOnError: true
        }
      }
    },

    jslint: {
      all: {
        src: [
          '**/*.json',
          '<%= jqlint.all.src %>',
          '!js/*.js',
          '!js/lib/*.js'
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
          port: 9999
        }
      },
      keepalive: {
        options: {
          port: 9999,
          keepalive: true
        }
      }
    },

    mocha: {
      autorun: {
        options: {
          urls: [
            'http://localhost:9999/tests/browser/bare-example/index.html',
            'http://localhost:9999/tests/browser/common-lib/index.html',
            'http://localhost:9999/tests/browser/bic2-modernizr/index.html',
            'http://localhost:9999/tests/browser/bic2-requestConfig/index.html',
            'http://localhost:9999/tests/browser/bic2-blinkstorage/index.html'
          ],
          run: true
        }
      },
      explicitrun: {
        options: {
          urls: [
            'http://localhost:9999/tests/browser/bare-answerSpace/index.html'
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
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'js/common.min.js': commonjs
        }
      },
      'android-bic2': {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'js/android.min.js': commonjs.concat([
            'bower_components/history.js/scripts/bundled-uncompressed/html4+html5/jquery.history.js',
            'js/android.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      'gecko-bic2': {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'js/gecko.min.js': commonjs.concat([
            'bower_components/history.js/scripts/bundled-uncompressed/html4+html5/jquery.history.js',
            'js/gecko.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      'ios-bic2': {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'js/ios.min.js': commonjs.concat([
            'bower_components/history.js/scripts/bundled-uncompressed/html4+html5/jquery.history.js',
            'js/ios.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      'msie-bic2': {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'js/msie.min.js': commonjs.concat([
            'bower_components/history.js/scripts/bundled-uncompressed/html4+html5/jquery.history.js',
            'js/msie.js',
            'js/lib/maps.js',
            'js/main.js'
          ])
        }
      },
      options: {
        preserveComments: 'some',
        beautify: {
          ascii_only: true,
          max_line_len: 80
        },
        compress: {}
      }
    },

    'saucelabs-mocha': {
      all: { options: require('./saucelabs') }
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
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jqlint');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-saucelabs');

  grunt.registerTask('test', ['jslint', 'jqlint', 'connect:server', 'mocha']);
  grunt.registerTask('travis', ['test', 'saucelabs-mocha']);
  grunt.registerTask('build', ['uglify', 'compass']);
  grunt.registerTask('default', ['build', 'test']);

};
