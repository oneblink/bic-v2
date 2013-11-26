/*jslint browser:true, indent:2, maxlen:80*/
/*global suite, test, suiteSetup, suiteTeardown, setup, teardown*/ // Mocha
/*global chai, assert*/ // Chai

/*jslint nomen:true*/ // _Blink
/*global $, Modernizr, _Blink*/ // test subjects

suite('jQuery', function () {
  'use strict';

  test('defined functions', function () {
    assert.equal(typeof $.type !== 'undefined', true,
                 'jQuery.type is ' + typeof $.type);
    assert.equal(typeof $.type, 'function',
                 'jQuery.type is ' + typeof $.type);
    assert.equal(typeof $.fn.remove !== 'undefined', true,
                 'jQuery.fn.remove is ' + typeof $.fn.remove);
    assert.equal(typeof $.fn.remove, 'function',
                 'jQuery.fn.remove is ' + typeof $.fn.remove);
  });

});

suite('Modernizr', function () {
  'use strict';

  test('initialised global variable', function () {
    assert.equal($.type(window.Modernizr), 'object',
                 'global Modernizr object is ' + $.type(window.Modernizr));
//    assert.equal($.type(Modernizr.load), 'function',
//                 'Modernizr.load is ' + $.type(Modernizr.load));
    assert.equal($.type(Modernizr.addTest), 'function',
                 'Modernizr.addTest is ' + $.type(Modernizr.addTest));
  });

//  test('execute: dynamically load CSS', function(done) {
//    var cssUrl = '/public_html/_c_/normalize/2011.40/normalize.css';
//    assert.equal($('link[href="' + cssUrl + '"]').length, 0,
//                 'no CSS=' + cssUrl + ' already in <link />');
//    Modernizr.load({
//      load: cssUrl,
//      complete: function() {
//        assert.equal($('link[href="' + cssUrl + '"]').length, 1,
//                     'CSS=' + cssUrl + ' in <link />');
//        setTimeout(function() {
//          $('link[href="' + cssUrl + '"]').remove();
//          setTimeout(function() {
//            assert.equal($('link[href="' + cssUrl + '"]').length, 0,
//                         'CSS=' + cssUrl + ' still in <link />');
//            done();
//          }, 193);
//        }, 193);
//      }
//    });
//  });

});

suite('common.min.js', function () {
  'use strict';

  test('defined log() functions', function () {
    assert.equal($.type(window.log), 'function',
                 'global log() is ' + $.type(window.log));
    assert.equal($.type(window.error), 'function',
                 'global error() is ' + $.type(window.error));
    assert.equal($.type(window.warn), 'function',
                 'global warn() is ' + $.type(window.warn));
    assert.equal($.type(window.info), 'function',
                 'global info() is ' + $.type(window.info));
  });

  test('execute: log(), error(), warn(), info()', function () {
    window.log('BlinkUtilities: function log is well-defined');
    assert.ok(true, 'log() ran correctly');
    window.error('BlinkUtilities: function error is well-defined');
    assert.ok(true, 'error() ran correctly');
    window.warn('BlinkUtilities: function warn is well-defined');
    assert.ok(true, 'warn() ran correctly');
    window.info('BlinkUtilities: function info is well-defined');
    assert.ok(true, 'info() ran correctly');
  });

});

suite('_Blink', function () {
  'use strict';

  test('.hasFontFor()', function () {
    assert(typeof _Blink.hasFontFor, 'function', 'defined .hasFontFor()');
    assert(!_Blink.hasFontFor('&#xFFFD;'), '"missing" character missing');
    assert(_Blink.hasFontFor('I'), '"I" not missing');
  });

});

suite('jQuery', function () {
  'use strict';

  test('initialised global variable', function () {
    assert.notEqual(typeof window.jQuery, 'undefined',
                          'global jQuery object is ' + typeof window.jQuery);
    assert.notEqual(window.jQuery, null,
                          'global jQuery object is null');
    assert.equal(typeof window.jQuery, 'function',
                       'global jQuery object is ' + typeof window.jQuery);
  });

});
