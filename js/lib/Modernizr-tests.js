/*global DOMParser, ActiveXObject*/ // Web Platform and Internet Explorer APIs

/* new tests for Modernizr */
(function(window) {
  'use strict';
  var Modernizr = window.Modernizr,
      document = window.document,
      $ = window.jQuery,
      // vars for additional canvas tests
      image,
      canvas,
      ctx;

  if (!Modernizr) {
    window.warn('Blink Modernizr tests need Modernizr to be included first.');
    return;
  }

  // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/file-api.js
  Modernizr.addTest('filereader', function() {
    return !!(window.File && window.FileList && window.FileReader);
  });

  Modernizr.addTest('positionfixed', function() {
    var test = document.createElement('div'),
        fake = false,
        root = document.body || (function() {
          fake = true;
          return document.documentElement.appendChild(document.createElement('body'));
        }()),
        oldCssText = root.style.cssText,
        ret, offset;

    root.style.cssText = 'height: 3000px; margin: 0; padding; 0;';
    test.style.cssText = 'position: fixed; top: 100px';
    root.appendChild(test);
    window.scrollTo(0, 500);
    offset = $(test).offset();
    ret = offset.top === 600; // 100 + 500
    if (!ret && typeof test.getBoundingClientRect !== 'undefined') {
      ret = test.getBoundingClientRect().top === 100;
    }
    root.removeChild(test);
    root.style.cssText = oldCssText;
    window.scrollTo(0, 1);
    if (fake) {
      document.documentElement.removeChild(root);
    }
    return ret;
  });

  Modernizr.addTest('xpath', function () {
    // http://developer.samsung.com/forum/board/thread/view.do?boardName=General&messageId=253999
    var tmp, xml, result;
    if (!window.XPathResult || !window.DOMParser) {
      return false; // constructors for Firefox, Safari and Chrome not found
    }
    try {
      tmp = new DOMParser();
      xml = tmp.parseFromString('<book><page /></book>', 'text/xml');
    } catch (ignore) {}
    if (!xml || !xml.documentElement || xml.getElementsByTagName('parsererror').length) {
      return false; // XML didn't parse correctly
    }
    if (!xml.evaluate) {
      return false; // no support for `evaluate` method
    }
    try {
      result = xml.evaluate('/book', xml, null, 9, null);
      return !!(result && result.singleNodeValue);
    } catch (ignore) {}
    return false;
  });

  Modernizr.addTest('documentfragment', function() {
    var outerFragment,
    innerFragment,
    p;

    try {
      p = document.createElement('p');

      outerFragment = document.createDocumentFragment();
      innerFragment = document.createDocumentFragment();

      innerFragment.appendChild(p);
      outerFragment.appendChild(innerFragment);

      // intermediate fragments are supposed to be destroyed
      if (p.parentNode !== outerFragment) {
        return false;
      }
      if (innerFragment.parentNode === outerFragment) {
        return false;
      }

      return true;

    } catch (error) {
      return false;
    }

  });

  /**
   * Check to see if input[type=file] even works on this browser.
   */
  Modernizr.inputtypes.file = (function() {
    var userAgent = navigator.userAgent,
    isAndroid = userAgent.indexOf('Android') !== -1,
    isEclair = isAndroid && /Android 2\.(0|1)/.test(userAgent),
    dummy;
    // check for Android <= 2.1 and report false
    if (isAndroid) {
      if (userAgent.indexOf('Android 1.') !== -1 || isEclair) {
        return false;
      }
    }
    dummy = document.createElement('input');
    dummy.setAttribute('type', 'file');
    return dummy.disabled === false;
  }());

  /**
   * Check to see if non-Integer values are valid in input[type=number].
   * They should be, but some WebKits disagree.
   */
  Modernizr.inputtypes.number = (function() {
    var $number,
        test;
    if (!Modernizr.inputtypes.number) {
      return false;
    }
    $number = $('<input type="number" />');
    $number.val(1.5);
    test = $number[0].checkValidity();
    $number.remove();
    return test;
  }());

// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/canvas-todataurl-type.js
  if (Modernizr.canvas) {
    image = new Image(),
    canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');
    image.onload = function() {
      ctx.drawImage(image, 0, 0);
      Modernizr.addTest('canvastodataurlpng', function() {
        return canvas.toDataURL('image/png').indexOf('data:image/png') === 0;
      });
      Modernizr.addTest('canvastodataurljpeg', function() {
        return canvas.toDataURL('image/jpeg').indexOf('data:image/jpeg') === 0;
      });
      Modernizr.addTest('canvastodataurlwebp', function() {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      });
    };
    image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
  }

}(this));


