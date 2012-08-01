/* basic collection of utility functions not expected to undergo rapid development
 * requires jQuery
 * if Modernizr is being used, please include this after Modernizr
 */

/*jslint browser: true, dangling:true, plusplus: true, white: true*/

(function(window) {
  'use strict';
  var $ = window.jQuery,
      Math = window.Math;
  /* END: var */

  // detect BlinkGap / PhoneGap / Callback
  window.isBlinkGapDevice = function() {
    return window.PhoneGap && $.type(window.device) === 'object' && window.device instanceof window.Device;
  };

  window.computeTimeout = function(messageLength) {
    var lowestTransferRateConst = 1000 / (4800 / 8);
    // maxTransactionTimeout = 180 * 1000;
    return Math.floor((messageLength * lowestTransferRateConst) + 15000);
  };

}(this));

/* logging functions
 * initialises log(), error(), warn(), info() in the global context
 */
(function(window) {
  'use strict';
  var $ = window.jQuery,
      $document = $(window.document),
      early = { // catch messages from before we are ready
        history: []
      },
      console,
      fns = ['log', 'error', 'warn', 'info'],
      /**
   * re-route messages now that we are ready
   * @inner
   */
      initialise = function() {
        $document.off('ready deviceready', initialise);
        setTimeout(function() { // force thread-switch for PhoneGap
          console = window.console || window.debug || { log: $.noop };
          $.each(fns, function(index, fn) {
            var type = $.type(console[fn]);
            if (type === 'function') {
              window[fn] = function() {
                console[fn].apply(console, arguments);
              };
            } else if (type === 'object') {
              window[fn] = function(message) {
                console[fn](message);
              };
            } else if (fn !== 'log') {
              window[fn] = window.log;
            } else {
              window[fn] = $.noop;
            }
          });
          // playback early messages
          $.each(early.history, function(index, message) {
            var fn = window[message.fn],
                type = $.type(fn);
            if (type === 'function') {
              fn.apply(console, message.args);
            } else if (type === 'object') {
              fn(message.args[0]);
            }
          });
          // discard unused objects
          delete early.history;
          $.each(fns, function(index, fn) {
            delete early[fn];
          });
        }, 0);
      },
      /** @inner */
      waitForBlinkGap = function() {
        if (window.PhoneGap && window.PhoneGap.available) {
          if (early.history) {
            initialise();
          }
        } else {
          setTimeout(waitForBlinkGap, 197);
        }
      };

  // setup routing for early messages
  console = early;
  $.each(fns, function(index, fn) {
    early[fn] = function() {
      early.history.push({ 'fn': fn, 'args': $.makeArray(arguments) });
    };
    window[fn] = console[fn];
  });

  // wait until we are ready to start real routing
  if (window.isBlinkGap) {
    waitForBlinkGap();
  } else {
    $document.on('ready', initialise);
  }
}(this));

/* new tests for Modernizr */
(function(window) {
  'use strict';
  var Modernizr = window.Modernizr,
      document = window.document,
      $ = window.jQuery;
  /* END: var */

  if (!Modernizr) {
    window.warn('Blink Modernizr tests need Modernizr to be included first.');
    return;
  }

  Modernizr.addTest('positionfixed', function() {
    var test = document.createElement('div'),
        fake = false,
        root = document.body || (function() {
          fake = true;
          return document.documentElement.appendChild(document.createElement('body'));
        }()),
        oldCssText = root.style.cssText,
        ret, offset;
    /* END: var */
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

  Modernizr.addTest('xpath', function() {
    var xml = $.parseXML('<xml />');
    return !!window.XPathResult && !!xml.evaluate;
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
}(this));

/* convenient additions to the String prototype*/
(function(window) {
  var String = window.String;
  String.prototype.hasEntities = function() {
    var string = this;
    if (string.indexOf('&') === -1) {
      return false;
    }
  // TODO: use RegExp to properly detect HTML Entities
  };
  String.prototype.repeat = function(occurrences) {
    var string = '',
    o;
    for (o = 0; o < occurrences; o++) {
      string += this;
    }
    return string;
  };
}(this));

/* minor improvements to Math */
(function(window) {
  'use strict';
  var Math = window.Math,
      oldRound = Math.round;
  /* END: var */

  /* duck-punching Math.round() so it accepts a 2nd parameter */
  Math.round = function(value, decimals) {
    var order;
    if (!decimals || decimals === 0) {
      return oldRound(value);
    }
    order = Math.pow(10, decimals);
    if (typeof decimals === 'number' && decimals > 0) {
      value = Math.round(value * order) / order;
    }
    return value;
  };

  /*
  * Math.uuid.js, minimalistic uuid generator. Original script from Robert
  * Kieffer, http://www.broofa.com Dual licensed under the MIT and GPL licenses.
  * example: >>> Math.uuid(); // returns RFC4122, version 4 ID
  * "92329D39-6F5C-4520-ABFC-AAB64544E172"
  */
  /*jslint bitwise: true*/
  if (typeof Math.uuid !== 'function') {
    Math.uuid = function() {
      var chars = Math.uuid.CHARS, uuid = [],
          r, i = 36;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data. At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      while (i--) {
        if (!uuid[i]) {
          r = Math.random() * 16 | 0;
          uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
        }
      }
      return uuid.join('');
    };
    Math.uuid.CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A',
      'B', 'C', 'D', 'E', 'F'];
  }
  /*jslint bitwise: false*/
}(this));

/* minor improvements to jQuery */
(function(window) {
  'use strict';
  /*jslint nomen: true*/
  var $ = window.jQuery,
      _oldAttr = $.fn.attr,
      _show = $.fn.show;
  /* END: var */

  /**
   * checks to see if an Object has the listed Properties
   * didn't feel comfortable exposing this to the world
   * really handy for duck-typing (does it quack like a duck?)
   * @param {Object} object object to check.
   * @param {Object|Array} props array of properties, or map of property->type.
   * @return {Boolean} all properties present?
   */
  function hasProperties(object, props) {
    var result = true;
    if (!object || $.type(object) !== 'object') {
      return false;
    }
    if ($.type(props) === 'array') {
      $.each(props, function(index, name) {
        if (typeof object[name] === 'undefined') {
          result = false;
          return false; // break loop now
        }
        return true; // continue testing
      });
      return result;
    }
    if ($.type(props) === 'object') {
      $.each(props, function(name, value) {
        if ($.type(object[name]) !== value) {
          result = false;
          return false; // break loop now
        }
        return true; // continue testing
      });
      return result;
    }
    return false;
  }

  /**
   * @param {Object} Does $.type(object) === 'object'?
   */
  $.isObject = function(variable) {
    return $.type(variable) === 'object';
  };

  /**
   * @return {Boolean} Is object a jQuery Deferred Promise (read-only)?
   */
  $.isPromise = function(object) {
    var type = 'function',
        props = {
          always: type,
          done: type,
          fail: type,
          pipe: type,
          progress: type,
          promise: type,
          state: type,
          then: type
        };
    return hasProperties(object, props);
  };

  /**
   * @return {Boolean} Is object a jQuery Deferred Object (read-write)?
   */
  $.isDeferred = function(object) {
    var type = 'function',
        props = {
          notify: type,
          notifyWith: type,
          reject: type,
          rejectWith: type,
          resolve: type,
          resolveWith: type
        };
    if ($.isPromise(object)) {
      return hasProperties(object, props);
    }
    return false;
  };

  // duck-punching to make attr() return a map
  $.fn.attr = function() {
    var a, aLength, attributes, map;
    if (this[0] && arguments.length === 0) {
      map = {};
      attributes = this[0].attributes;
      aLength = attributes.length;
      $.each(attributes, function(index, attribute) {
        var name = attribute.name || attribute.nodeName,
            value = attribute.value || attribute.nodeValue;
        /* END: var */
        if (name) {
          map[name.toLowerCase()] = value;
        }
      });
      return map;
    }
    return _oldAttr.apply(this, arguments);
  };

  // TODO: remove this backwards-compatibility later
  $.fn.show = function() {
    this.removeAttr('hidden');
    this.removeClass('hidden');
    return _show.apply(this, arguments);
  };

  $.fn.isHidden = function() {
    if (this.prop('hidden') || this.hasClass('hidden')) {
      return true;
    }
    return this[0] && this[0].style && this[0].style.display === 'none';
  };

  // return just the element's HTML tag (no attributes or innerHTML)
  $.fn.tag = function() {
    var tag;
    if (this.length > 0) {
      tag = this[0].nodeName || this[0].tagName || '';
      return tag.toLowerCase();
    }
    return '';
  };

  // return a simple HTML tag string not containing the innerHTML
  $.fn.tagHTML = function() {
    var $this = $(this),
        html;
    if (this[0]) {
      html = '<' + $this.tag();
      $.each($this.attr(), function(key, value) {
        html += ' ' + key + '="' + value + '"';
      });
      html += ' />';
      return html;
    }
  };

  /* function to allow passing an array to jQuery.when() */
  $.whenArray = function(array) {
    return $.when.apply($, array);
  };
  /* automatically wrap Deferred.resolve in a setTimeout
   * @param {jQueryDeferred} deferred
   */
  $.resolveTimeout = function() {
    var args = $.makeArray(arguments),
        deferred = args.shift();
    setTimeout(function() {
      deferred.resolve.apply(deferred, args);
    }, 0);
    return this;
  };

  /*
   * @param {String} string (X)HTML or text to append to the selected element
   * @param {Number} attempts number of times to try
   * @param {String} [needle] resulting HTML must include this for success
   * @param {Number} [lastIndex] only used internally
   * @returns {jQueryPromise}
   */
  /*jslint regexp: true*/
  $.fn.appendWithCheck = function(string, attempts, needle, lastIndex) {
    var $element = $(this),
        deferred = new $.Deferred(),
        MyAnswers = window.MyAnswers;
    /* END: var */
    if ($.type(needle) !== 'string') {
      needle = string.match(/>([^<>\0\n\f\r\t\v]+)</);
      if (!needle) {
        needle = string.match(/(\w+)/);
      }
      needle = $.type(needle) === 'array' ? needle[0] : string;
    }
    if ($.type(lastIndex) !== 'number') {
      MyAnswers.dispatch.add(function() {
        lastIndex = $element.html().lastIndexOf(needle);
      });
    }
    MyAnswers.dispatch.add(function() {
      $element.append(string);
    });
    MyAnswers.dispatch.add(function() {
      var html = $element.html();
      if ($.type(html) !== 'string' || !html ||
          html.lastIndexOf(needle) > lastIndex) {
        deferred.resolve();
      } else if (attempts > 0) {
        $.when($element.appendWithCheck(string, --attempts, needle, lastIndex))
          .fail(deferred.reject)
          .then(deferred.resolve);
      } else {
        deferred.reject();
      }
    });
    return deferred.promise();
  };
  /*jslint regexp: false*/

  $.fn.childrenAsProperties = function() {
    var properties = {};
    $(this).children().each(function(index, element) {
      var $element = $(element),
      name = $element.tag(),
      value = $element.text();
      if (name.length > 0 && value.length > 0) {
        properties[name] = value;
      }
    });
    return properties;
  };

  /*jslint nomen: false*/
}(this));

(function(window) {
  'use strict';
  var $ = window.jQuery,
  _Blink = window._Blink,
  _SERVER = window._SERVER,
  defaults = {
    'PREFIX_GZ': '/_c_/',
    'SUFFIX_GZ': '',
    'PREFIX': '/_c_/',
    'SUFFIX': ''
  },
  /** @const */
  GZ_TYPES = ['css', 'js'],
  /**
   * JavaScript mirror of our PHP class: \Blink\CDN\PlatformCDN
   * @class
   * @param {String} [encoding] Provide the HTTP_ACCEPT_ENCODING Header.
   */
  PlatformCDN = function(encoding) {
    var cfg;
    cfg = _Blink && _Blink.cfg && _Blink.cfg.CDN_PLATFORM;
    cfg = $.isObject(cfg) ? cfg : {};
    cfg = $.extend({}, defaults, cfg);
    encoding = encoding || (_SERVER && _SERVER.HTTP_ACCEPT_ENCODING);
    encoding = typeof encoding === 'string' ? encoding : '';
    if (encoding.indexOf('gzip') === -1) {
      cfg.PREFIX_GZ = cfg.PREFIX;
      cfg.SUFFIX_GZ = cfg.SUFFIX;
    }
    /**
     * add necessary protocol, domain and suffix to a given path
     * @param  {String} path Provide the path to desired resource.
     * @return {String} The completed URL.
     */
    this.getURL = function(path) {
      var extension;
      if (!path || typeof path !== 'string') {
        return '';
      }
      path = $.trim(path);
      path = path.replace(/^\/*/, '');
      extension = path.match(/\.?(\w+)$/);
      extension = $.type(extension) === 'array' ? extension[1] : '';
      if (!extension || $.inArray(extension, GZ_TYPES) === -1) {
        return cfg.PREFIX + path + cfg.SUFFIX;
      }
      return cfg.PREFIX_GZ + path + cfg.SUFFIX_GZ;
    };
    return this;
  };

  // export singleton to global namespace
  window._Blink.cdnp = new PlatformCDN();

}(this));

