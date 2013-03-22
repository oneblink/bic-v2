// UMD pattern from https://github.com/umdjs/umd/blob/master/amdWebGlobal.js

/*global define:true*/

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], function ($) {
      // Also create a global in case some scripts
      // that are loaded still are looking for
      // a global even when an AMD loader is in use.
      root.BMP = factory(root, $);
      return (root.BMP);
    });
  } else {
    // Browser globals
    root.BMP = factory(root, root.$);
  }
}(this, function (global, $) {
  'use strict';

  var BMP,
      $doc = $(global.document),
      $body = $(global.document.body),
      nav = global.navigator || {},
      $dialog,
      putDialog,
      showDialog = {},
      hasCordova,
      hasjQueryUI,
      hasjQueryMobile,
      bindQueue;

  BMP = global.BMP = global.BMP || {};

  if (!$ || !$.fn || typeof $.fn.jquery !== 'string') {
    // can't find valid jQuery, bailing out early
    return;
  }

  putDialog = function() {
    var $div = $('<div id="bmp-dialog-async"></div>');
    $div.hide();
    $body.append($div);
    return $div;
  };

  showDialog.jQueryUI = function(message, options) {
    $dialog = $body.find('#bmp-dialog-async');
    if (!$dialog.length) {
      $dialog = putDialog();
    }
    $dialog.empty();
    if ($dialog.hasClass('ui-dialog-content')) {
      $dialog.dialog('destroy');
    }
    $dialog.append('<p>' + message + '</p>');
    options.modal = true;
    options.closeOnEscape = true;
    $dialog.dialog(options);
  };

  hasjQueryUI = function() {
    return $.fn.dialog;
  };

  hasjQueryMobile = function() {
    return $.mobile && $.fn.dialog;
  };

  /**
   * https://developer.mozilla.org/en-US/docs/DOM/window.alert
   * @param {String} message content to be displayed.
   * @param {Object} [options] { title: "...", ok: "..." }
   * @return {Promise} resolved when dismissed by user.
   */
  BMP.alertNoQueue = function(message, options) {
    var dfrd = new $.Deferred(),
        n10n = nav.notification || {},
        alert = n10n.alert,
        dismissedFn;

    options = options || {};
    options.ok = 'OK';

    dismissedFn = function() {
      dfrd.resolve();
    };

    if ($.type(alert) === 'function') {
      // do cordova thing here
      options.title = 'Alert';
      alert(message, dismissedFn, options.title, options.ok);

    /*
    } else if (hasjQueryMobile()) {
      // TODO: do jQueryMobile thing here
      */

    } else if (hasjQueryUI()) {
      // do jQueryUI thing here
      options.title = 'Alert';
      options.buttons = {};
      options.buttons[options.ok] = function() {
        $(this).dialog('close');
      };
      options.close = dismissedFn;

      showDialog.jQueryUI(message, options);

    } else {
      // last resort, use browser global :(
      message = (options.title ? options.title + ' | ' : '') + message;
      global.alert(message);
      dfrd.resolve();
    }
    return dfrd.promise();
  };

  /**
   * https://developer.mozilla.org/en-US/docs/DOM/window.confirm
   * @param {String} message content to be displayed.
   * @param {Object} [options] { title: "...", ok: "...", cancel: "..." }
   * @return {Promise} resolved when dismissed by user, passed Boolean result.
   */
  BMP.confirmNoQueue = function(message, options) {
    var dfrd = new $.Deferred(),
        n10n = nav.notification || {},
        alert = n10n.alert;

    options = options || {};
    options.ok = options.ok || 'OK';
    options.cancel = options.cancel || 'Cancel';

    if ($.type(alert) === 'function') {
      // do cordova thing here
      options.title = options.title || 'Confirm';
      alert(message, function(result) {
        if (result === 1) {
          // OK button pressed
          dfrd.resolve(true);
        } else {
          // Cancel button or dialog dismissed
          dfrd.resolve(false);
        }
      }, options.title, options.ok + ',' + options.cancel);

      /*
       } else if (hasjQueryMobile()) {
       // TODO: do jQueryMobile thing here
       */

    } else if (hasjQueryUI()) {
      // do jQueryUI thing here
      options.title = options.title || 'Confirm';
      options.buttons = {};
      options.buttons[options.cancel] = function() {
        $(this).dialog('close');
      };
      options.buttons[options.ok] = function() {
        dfrd.resolve(true);
        $(this).dialog('close');
      };
      options.close = function() {
        if (!dfrd.isRejected() || !dfrd.isResolved()) {
          dfrd.resolve(false);
        }
      };

      showDialog.jQueryUI(message, options);

    } else {
      // last resort, use browser global :(
      message = (options.title ? options.title + ' | ' : '') + message;
      dfrd.resolve(global.confirm(message));
    }
    return dfrd.promise();
  };

  /**
   * https://developer.mozilla.org/en-US/docs/DOM/window.prompt
   * @param {String} message content to be displayed.
   * @param {String} [value] optional default value to be displayed.
   * @param {Object} [options] { title: "...", ok: "...", cancel: "..." }
   * @return {Promise} resolved when dismissed by user, passed input String.
   */
  BMP.promptNoQueue = function(message, value, options) {
    var dfrd = new $.Deferred();

    if (typeof value !== 'string') {
      options = value;
      value = '';
    }

    options = options || {};
    options.ok = options.ok || 'OK';
    options.cancel = options.cancel || 'Cancel';

    // as of Cordova 2.5, there is no native functionality for this

      /*
       if (hasjQueryMobile()) {
       // TODO: do jQueryMobile thing here

    } else*/ if (hasjQueryUI()) {
      // do jQueryUI thing here
      message += '</p><p><input type="text" value="' + value + '" />';
      options.title = options.title || 'Prompt';
      options.buttons = {};
      options.buttons[options.cancel] = function() {
        $(this).dialog('close');
      };
      options.buttons[options.ok] = function() {
        var $this = $(this);
        dfrd.resolve($this.find('input').val());
        $this.dialog('close');
      };
      options.close = function() {
        if (!dfrd.isRejected() || !dfrd.isResolved()) {
          dfrd.resolve(null);
        }
      };

      showDialog.jQueryUI(message, options);

    } else {
      // last resort, use browser global :(
      message = (options.title ? options.title + ' | ' : '') + message;
      dfrd.resolve(global.prompt(message));
    }
    return dfrd.promise();
  };

  // put alert|confirm|prompt in a queue to prevent lost messages / promises

  /**
   * @param {Object} context the context to use during execution.
   * @param {Function|String} method either the name or the method itself.
   * @param {String} queue the name of the queue to use.
   * @return {Function} a method that returns Promises and queues itself.
   */
  bindQueue = function(context, method, queue) {
    if (typeof method === 'string') {
      method = context[method];
    }

    return function() {
      var args = $.makeArray(arguments),
          dfrd = new $.Deferred();

      $doc.queue(queue, function(next) {
        var result,
            array = $._data($doc[0], queue + 'queue');

        array.unshift('inprogress');
        result = method.apply(context, args);
        result.then(function() {
          dfrd.resolve();
          array.shift(); // clear 'inprogress'
          next();
        }, function() {
          dfrd.reject();
          array.shift(); // clear 'inprogress'
          next();
        });
        return result;
      });

      if ($doc.queue(queue).length && $doc.queue(queue)[0] !== 'inprogress') {
        $doc.dequeue(queue);
      }

      return dfrd.promise();
    };
  };

  BMP.alert = bindQueue(this, BMP.alertNoQueue, 'bmp-alerts');
  BMP.confirm = bindQueue(this, BMP.confirmNoQueue, 'bmp-alerts');
  BMP.prompt = bindQueue(this, BMP.promptNoQueue, 'bmp-alerts');

  return BMP;
}));