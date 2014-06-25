/*jslint indent:2, browser:true*/
/*jslint nomen:true*/ // Underscore.JS
/*global $, BlinkForms*/ // bmp

(function (window) {
  'use strict';

  var $ = window.$;

  window._Blink.preloadPage = $.noop;

  window.MyAnswers.pendingStore = {
    items: {},
    get: function (key) {
      var dfrd = new $.Deferred();
      dfrd.resolve(window.MyAnswers.pendingStore.items[key]);
      return dfrd.promise();
    },
    set: function (key, value) {
      var dfrd = new $.Deferred();
      window.MyAnswers.pendingStore.items[key] = value;
      dfrd.resolve();
      return dfrd.promise();
    }
  };

  window.MyAnswers.store = window.MyAnswers.siteStore = window.MyAnswers.pendingStore;

}(this));
