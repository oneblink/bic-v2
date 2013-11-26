/*jslint browser:true, indent:2, maxlen:80*/
/*global suite, test, suiteSetup, suiteTeardown, setup, teardown*/ // Mocha
/*global chai, assert*/ // Chai

/*
suite('', function () {
  'use strict';

  suiteSetup(function () {

  });

  test('', function () {});

});
*/

suite('History.JS', function () {
  'use strict';
  var assert = window.chai.assert;

  test('initialised global variable, defined functions', function () {
    var H = window.History;

    assert(H);
    assert.isTrue(H.enabled);
    assert.isFunction(H.back);
    assert.isFunction(H.pushState);
    assert.isFunction(H.replaceState);
  });

});
