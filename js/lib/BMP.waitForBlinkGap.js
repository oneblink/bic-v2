/*jslint browser:true, indent:2*/
/*global $*/ // jQuery

/**
 *
 */
(function (window) {
  'use strict';
  var BMP;

  BMP = window.BMP;

  /**
   * @return {jQueryPromise}
   */
  BMP.waitForBlinkGap = function () {
    var dfrd, start, checkFn, readyHandler;

    dfrd = new $.Deferred();
    start = new Date();

    readyHandler = function () {
      document.removeEventListener('deviceready', readyHandler, false);
      dfrd.resolve();
    };

    checkFn = function () {
      if (window.isBlinkGap || window.PhoneGap || window.cordova) {
        if (window.PhoneGap && window.PhoneGap.available) {
          dfrd.resolve();
        } else if (document.addEventListener) {
          document.addEventListener('deviceready', readyHandler, false);
        }
      } else if (($.now() - start) > 10 * 1000) {
        dfrd.reject(new Error('waitForBlinkGap(): still no PhoneGap after 10 seconds'));
      } else {
        setTimeout(checkFn, 197);
      }
    };

    checkFn();

    return dfrd.promise();
  };
}(this));
