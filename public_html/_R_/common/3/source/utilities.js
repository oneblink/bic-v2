/* basic collection of utility functions not expected to undergo rapid development
 * requires jQuery
 * if Modernizr is being used, please include this after Modernizr
 */

/* logging functions 
 * initialises log(), error(), warn(), info() in the global context
 */
(function(window, undefined) {
	var $ = window.jQuery,
		document = window.document,
		early = { // catch messages from before we are ready
			history: []
		},
		console,
		fns = ['log', 'error', 'warn', 'info'];

	// setup routing for early messages
	console = early;
	$.each(fns, function(index, fn) {
		early[fn] = function() {
			early.history.push({ 'fn': fn, 'arguments': $.makeArray(arguments) });
		};
		window[fn] = console[fn];
	});

	// re-route messages now that we are ready
	function initialise() {
		console = window.console || window.debug || { log: $.noop };
		$.each(fns, function(index, fn) {
			var type = $.type(console[fn]);
			if (type === 'function') {
				window[fn] = function() {
					console[fn].apply(console, arguments);
				}
			} else if (type === 'object') {
				window[fn] = function() {
					console[fn](arguments[0]);
				}
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
		delete early;
	}

	if (window.PhoneGap) {
		$(document).bind('deviceready', initialise);
	} else {
		$(document).ready(initialise);
	}
}(this));

/* new tests for Modernizr */
(function(window, undefined) {
	var Modernizr = window.Modernizr,
		document = window.document;
	
	if (!Modernizr) {
		return;
	}
	
	Modernizr.addTest('positionfixed', function () {
		var test  = document.createElement('div'),
			fake = false,
			root = document.body || (function () {
				fake = true;
				return document.documentElement.appendChild(document.createElement('body'));
			}());
		var oldCssText = root.style.cssText,
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
		var xml = $.parseXML('<xml />');
		return typeof window.XPathResult !== 'undefined' && typeof xml.evaluate !== 'undefined';
	});
}(this));

function computeTimeout(messageLength) {
  var lowestTransferRateConst = 1000 / (4800 / 8);
		// maxTransactionTimeout = 180 * 1000;
  return Math.floor((messageLength * lowestTransferRateConst) + 15000);
}

/* duck-punching Math.round() so it accepts a 2nd parameter */
(function(window, undefined) {
	var Math = window.Math,
		oldRound = Math.round;
	Math.round = function(value, decimals) {
		if (!decimals || decimals === 0) {
			return oldRound(value);
		}
		if (typeof decimals === 'number' && decimals > 0) {
			value = Math.round(value * Math.pow(10, decimals))/Math.pow(10, decimals);
		}
		return value;
	};
}(this));

/* minor improvements to jQuery */
(function(window, undefined) {
	var $ = window.jQuery,
		_oldAttr = $.fn.attr;
	
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
	$.fn.appendWithCheck = function(string, attempts, needle, lastIndex) {
		var $element = $(this),
			deferred = new $.Deferred();
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
	
	/*
	 * @param {Array} urls array of URL strings to request
	 * @returns {jQueryPromise}
	 */
	$.getScripts = function(urls) {
		var type = $.type(urls),
		dfrd = new $.Deferred();
		/* END: var */
		if (type === 'string') {
			urls = [ urls ];
		} else if (type !== 'array' || urls.length === 0) {
			setTimeout(dfrd.resolve, 47); // TODO: maybe this should reject instead?
			return dfrd.promise();
		}
		$.getScript(urls[0])
		.always(function(data, status, jqxhr) {
			if (jqxhr.status === 304 || jqxhr.status === 200 || jqxhr.status === 0) {
				urls.splice(0, 1);
				$.when($.getScripts(urls))
				.fail(dfrd.reject)
				.then(dfrd.resolve);
			} else {
				dfrd.reject();
			}
		});
		return dfrd.promise();
	};
}(this));

/*
 * Math.uuid.js, minimalistic uuid generator. Original script from Robert
 * Kieffer, http://www.broofa.com Dual licensed under the MIT and GPL licenses.
 * example: >>> Math.uuid(); // returns RFC4122, version 4 ID
 * "92329D39-6F5C-4520-ABFC-AAB64544E172"
 */
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
	Math.uuid.CHARS = '0123456789ABCDEFG'.split('');
}
