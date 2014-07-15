/*jslint browser:true, indent:2, maxlen:80*/
/*global suite, test, suiteSetup, suiteTeardown, setup, teardown*/ // Mocha
/*global chai, assert*/ // Chai

/*global $*/ // jQuery

/*global currentInteraction, currentCategory, currentMasterCategory*/ // BIC v2
/*global siteVars*/ // BIC v2

suite('answerSpace', function () {
  'use strict';
  var assert = window.chai.assert;

  suite('History.JS', function () {

    test('initialised global variable, defined functions', function () {
      var H = window.History;

      assert(H);
      assert.isTrue(H.enabled);
      assert.isFunction(H.back);
      assert.isFunction(H.pushState);
      assert.isFunction(H.replaceState);
    });

  });

  suite('GetConfig XHR', function () {

    test('siteVars.map is defined', function () {
      assert.isObject(siteVars.map);
    });

    test('siteVars.config is defined', function () {
      assert.isObject(siteVars.map);
    });

    test('siteVars.config has items', function () {
      var items;
      items = ['a1', 'i1', 'i2', 'i3'];
      items.forEach(function (item) {
        assert.isObject(siteVars.config[item]);
      });
    });

  });

  suite('displayAnswerSpace() (private)', function () {

    test('#startUp element is removed', function () {
      assert.lengthOf($('#startUp'), 0);
    });

    test('#keywordListView is visible', function () {
      assert.lengthOf($('#keywordListView').filter(':not(:hidden)'), 1);
    });

    test('3 interaction LI elements were created', function () {
      assert.lengthOf($('#keywordListView > ul.box > li[data-id]'), 3);
    });

    test('currentInteraction is initially falsey', function () {
      assert(!currentInteraction);
    });

    test('currentCategory is initially falsey', function () {
      assert(!currentCategory);
    });

    test('currentMasterCategory is initially falsey', function () {
      assert(!currentMasterCategory);
    });

  });

});
