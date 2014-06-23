/*jslint indent:2, maxlen:80, node:true*/
/*global suite, test, suiteSetup, suiteTeardown, setup, teardown*/ // Mocha
/*global chai, assert*/ // Chai

/*global Modernizr*/ // object under test

suite('custom Modernizr feature-detects', function () {
  'use strict';

  test('Modernizr.filereader', function () {
    assert.property(Modernizr, 'filereader');
    assert.isBoolean(Modernizr.filereader);
  });

  test('Modernizr.xpath', function () {
    assert.property(Modernizr, 'xpath');
    assert.isBoolean(Modernizr.xpath);
  });

  test('Modernizr.documentfragment', function () {
    assert.property(Modernizr, 'documentfragment');
    assert.isBoolean(Modernizr.documentfragment);
  });

});
