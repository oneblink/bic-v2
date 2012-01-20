/* basic collection of utility functions not expected to undergo rapid development
 * requires jQuery
 * if Modernizr is being used, please include this after Modernizr
 */

/*jslint browser: true, plusplus: true, white: true */

(function(window, undefined) {
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
(function(window, undefined) {
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
					fn.apply(console, message.arguments);
				} else if (type === 'object') {
					fn(message.arguments[0]);
				}
			});
			// discard unused objects
			delete early.history;
			$.each(fns, function(index, fn) {
				delete early[fn];
			});
		}, 0);
	};

	// setup routing for early messages
	console = early;
	$.each(fns, function(index, fn) {
		early[fn] = function() {
			early.history.push({ 'fn': fn, 'arguments': $.makeArray(arguments) });
		};
		window[fn] = console[fn];
	});

	// wait until we are ready to start real routing
	if (window.PhoneGap && !window.PhoneGap.available) {
		$document.on('deviceready', initialise);
		setTimeout(function() {
			if (early) {
				initialise();
			}
		}, 5 * 1000);
	} else {
		$document.on('ready', initialise);
	}
}(this));

/* new tests for Modernizr */
(function(window, undefined) {
	'use strict';
	var Modernizr = window.Modernizr,
	document = window.document,
	$ = window.jQuery;
	/* END: var */
	
	if (!Modernizr) {
		window.warn('Blink tests for Modernizr cannot run without Modernizr loaded first');
		return;
	}
	
	Modernizr.addTest('positionfixed', function () {
		var test = document.createElement('div'),
		fake = false,
		root = document.body || (function () {
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
	
	Modernizr.addTest('xpath', function () {
		var xml = $.parseXML('<xml />');
		return typeof window.XPathResult !== 'undefined' && typeof xml.evaluate !== 'undefined';
	});
}(this));

/* minor improvements to Math */
(function(window, undefined) {
	'use strict';
	var Math = window.Math,
	oldRound = Math.round;
	/* END: var */
		
	/* duck-punching Math.round() so it accepts a 2nd parameter */
	Math.round = function(value, decimals) {
		if (!decimals || decimals === 0) {
			return oldRound(value);
		}
		if (typeof decimals === 'number' && decimals > 0) {
			value = Math.round(value * Math.pow(10, decimals))/Math.pow(10, decimals);
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
					r = Math.random()*16|0;
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
(function(window, undefined) {
	'use strict';
	/*jslint nomen: true*/
	var $ = window.jQuery,
	_oldAttr = $.fn.attr;
	/* END: var */
	
	// duck-punching to make attr() return a map
	$.fn.attr = function() {
		var a, aLength, attributes,	map;
		if (this[0] && arguments.length === 0) {
			map = {};
			attributes = this[0].attributes;
			aLength = attributes.length;
			for (a = 0; a < aLength; a++) {
				map[attributes[a].name.toLowerCase()] = attributes[a].value;
			}
			return map;
		} else {
			return _oldAttr.apply(this, arguments);
		}
	};
	
	// return just the element's HTML tag (no attributes or innerHTML)
	$.fn.tag = function() {
		var tag;
		if (this.length > 0) {
			tag = this[0].tagName || this[0].nodeName || '';
			return tag.toLowerCase();
		} else {
			return '';
		}
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
	 * @param {String} string the (X)HTML or text to append to the selected element
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
			if ($.type(html) !== 'string' || html.length === 0 || html.lastIndexOf(needle) > lastIndex) {
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

	
	/*jslint nomen: false*/
}(this));

