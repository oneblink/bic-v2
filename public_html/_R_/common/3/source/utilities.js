/* basic collection of utility functions not expected to undergo rapid development
 * requires jQuery
 */

function log() {
	var console = window.console || window.debug,
		fn, type;
	if (typeof console !== 'undefined') {
		fn = console.log;
		type = $.type(fn);
	}
	if (type === 'function') {
		fn.apply(console, arguments);
	} else if (type === 'object') {
		fn(arguments[0]);
	}
}

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
	var $ = window.jQuery;

	// duck-punching to make attr() return a map
	var _oldAttr = $.fn.attr;
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

	/* return the element type or tag */
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
		if (this.length > 0 && this[0]) {
			html = '<' + $this.tag();
			$.each($this.attr(), function(key, value) {
				html += ' ' + key + '="' + value + '"';
			});
			html += ' />';
			return html;
		}
		return '';
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

