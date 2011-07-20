/* basic collection of utility functions (some from phpjs.org) not expected to undergo rapid development
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

/* minor improvements to  */
(function(window, undefined) {
	var $ = window.jQuery;
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
				uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
			}
		}
		return uuid.join('');
	};
	Math.uuid.CHARS = '0123456789ABCDEFG'.split('');
}

// see MIT/GPL http://phpjs.org/ for the original source of these functions

function utf8_encode (argString) {
    // http://kevin.vanzonneveld.net
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: sowberry
    // +    tweaked by: Jack
    // +   bugfixed by: Onno Marsman
    // +   improved by: Yves Sucaet
    // +   bugfixed by: Onno Marsman
    // +   bugfixed by: Ulrich
    // +   bugfixed by: Rafal Kukawski
    // *     example 1: utf8_encode('Kevin van Zonneveld');
    // *     returns 1: 'Kevin van Zonneveld'

    if (argString === null || typeof argString === "undefined") {
        return "";
    }

    var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var utftext = "",
        start, end, stringl = 0;

    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if (c1 > 127 && c1 < 2048) {
            enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.slice(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.slice(start, stringl);
    }

    return utftext;
}

function sha1 (str) {
    // http://kevin.vanzonneveld.net
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // + namespaced by: Michael White (http://getsprink.com)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // -    depends on: utf8_encode
    // *     example 1: sha1('Kevin van Zonneveld');
    // *     returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'
    var rotate_left = function (n, s) {
        var t4 = (n << s) | (n >>> (32 - s));
        return t4;
    };

    var cvt_hex = function (val) {
        var str = "";
        var i;
        var v;

        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    };

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;

    str = this.utf8_encode(str);
    var str_len = str.length;

    var word_array = [];
    for (i = 0; i < str_len - 3; i += 4) {
        j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3);
        word_array.push(j);
    }

    switch (str_len % 4) {
    case 0:
        i = 0x080000000;
        break;
    case 1:
        i = str.charCodeAt(str_len - 1) << 24 | 0x0800000;
        break;
    case 2:
        i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000;
        break;
    case 3:
        i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) << 8 | 0x80;
        break;
    }

    word_array.push(i);

    while ((word_array.length % 16) != 14) {
        word_array.push(0);
    }

    word_array.push(str_len >>> 29);
    word_array.push((str_len << 3) & 0x0ffffffff);

    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
        for (i = 0; i < 16; i++) {
            W[i] = word_array[blockstart + i];
        }
        for (i = 16; i <= 79; i++) {
            W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
        }


        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for (i = 0; i <= 19; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 40; i <= 59; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }

    temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();
}

/* from http://phpjs.org/functions/urldecode:572 */
function urldecode (str) {
    // Decodes URL-encoded string  
    // 
    // version: 1103.1210
    // discuss at: http://phpjs.org/functions/urldecode
    // +   original by: Philip Peterson
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: AJ
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +      input by: travc
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Lars Fischer
    // +      input by: Ratheous
    // +   improved by: Orlando
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +      bugfixed by: Rob
    // +      input by: e-mike
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // %        note 1: info on what encoding functions to use from: http://xkr.us/articles/javascript/encode-compare/
    // %        note 2: Please be aware that this function expects to decode from UTF-8 encoded strings, as found on
    // %        note 2: pages served as UTF-8
    // *     example 1: urldecode('Kevin+van+Zonneveld%21');
    // *     returns 1: 'Kevin van Zonneveld!'
    // *     example 2: urldecode('http%3A%2F%2Fkevin.vanzonneveld.net%2F');
    // *     returns 2: 'http://kevin.vanzonneveld.net/'
    // *     example 3: urldecode('http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a');
    // *     returns 3: 'http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a'
    return decodeURIComponent((str + '').replace(/\+/g, '%20'));
}

/* http://phpjs.org/functions/parse_url:485 version 1009.2513 */
// note: Does not replace invalid characters with '_' as in PHP, nor does it return false for bad URLs
function parse_url (str, component) {
	var o = {
		strictMode: false,
		key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
		q: {
			name: "queryKey",
			parser: /(?:^|&)([^&=]*)=?([^&]*)/g
		},
		parser: {
			strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ 
				// Added one optional slash to post-protocol to catch file:/// (should restrict this)
		}
	};
	var m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
	uri = {},
	i = 14;
	while (i--) { uri[o.key[i]] = m[i] || ""; }
	switch (component) {
		case 'PHP_URL_SCHEME':
			return uri.protocol;
		case 'PHP_URL_HOST':
			return uri.host;
		case 'PHP_URL_PORT':
			return uri.port;
		case 'PHP_URL_USER':
			return uri.user;
		case 'PHP_URL_PASS':
			return uri.password;
		case 'PHP_URL_PATH':
			return uri.path;
		case 'PHP_URL_QUERY':
			return uri.query;
		case 'PHP_URL_FRAGMENT':
			return uri.anchor;
		default:
			var retArr = {};
			if (uri.protocol !== '') {retArr.scheme=uri.protocol;}
			if (uri.host !== '') {retArr.host=uri.host;}
			if (uri.port !== '') {retArr.port=uri.port;}
			if (uri.user !== '') {retArr.user=uri.user;}
			if (uri.password !== '') {retArr.pass=uri.password;}
			if (uri.path !== '') {retArr.path=uri.path;}
			if (uri.query !== '') {retArr.query=uri.query;}
			if (uri.anchor !== '') {retArr.fragment=uri.anchor;}
			return retArr;
	}
}

/* from http://phpjs.org/functions/parse_str:484 */
function parse_str (str, array) {
    // http://kevin.vanzonneveld.net
    // +   original by: Cagri Ekin
    // +   improved by: Michael White (http://getsprink.com)
    // +    tweaked by: Jack
    // +   bugfixed by: Onno Marsman
    // +   reimplemented by: stag019
    // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: stag019
    // -    depends on: urldecode
    // +   input by: Dreamer
    // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
    // %        note 1: When no argument is specified, will put variables in global scope.
    // *     example 1: var arr = {};
    // *     example 1: parse_str('first=foo&second=bar', arr);
    // *     results 1: arr == { first: 'foo', second: 'bar' }
    // *     example 2: var arr = {};
    // *     example 2: parse_str('str_a=Jack+and+Jill+didn%27t+see+the+well.', arr);
    // *     results 2: arr == { str_a: "Jack and Jill didn't see the well." }
    var glue1 = '=',
        glue2 = '&',
        array2 = String(str).replace(/^&?([\s\S]*?)&?$/, '$1').split(glue2),
        i, j, chr, tmp, key, value, bracket, keys, evalStr, that = this,
        fixStr = function (str) {
            return that.urldecode(str).replace(/([\\"'])/g, '\\$1').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        };

    if (!array) {
        array = this.window;
    }

    for (i = 0; i < array2.length; i++) {
        tmp = array2[i].split(glue1);
        if (tmp.length < 2) {
            tmp = [tmp, ''];
        }
        key = fixStr(tmp[0]);
        value = fixStr(tmp[1]);
        while (key.charAt(0) === ' ') {
            key = key.substr(1);
        }
        if (key.indexOf('\0') !== -1) {
            key = key.substr(0, key.indexOf('\0'));
        }
        if (key && key.charAt(0) !== '[') {
            keys = [];
            bracket = 0;
            for (j = 0; j < key.length; j++) {
                if (key.charAt(j) === '[' && !bracket) {
                    bracket = j + 1;
                } else if (key.charAt(j) === ']') {
                    if (bracket) {
                        if (!keys.length) {
                            keys.push(key.substr(0, bracket - 1));
                        }
                        keys.push(key.substr(bracket, j - bracket));
                        bracket = 0;
                        if (key.charAt(j + 1) !== '[') {
                            break;
                        }
                    }
                }
            }
            if (!keys.length) {
                keys = [key];
            }
            for (j = 0; j < keys[0].length; j++) {
                chr = keys[0].charAt(j);
                if (chr === ' ' || chr === '.' || chr === '[') {
                    keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
                }
                if (chr === '[') {
                    break;
                }
            }
            evalStr = 'array';
            for (j = 0; j < keys.length; j++) {
                key = keys[j];
                if ((key !== '' && key !== ' ') || j === 0) {
                    key = "'" + key + "'";
                } else {
                    key = eval(evalStr + '.push([]);') - 1;
                }
                evalStr += '[' + key + ']';
                if (j !== keys.length - 1 && eval('typeof ' + evalStr) === 'undefined') {
                    eval(evalStr + ' = [];');
                }
            }
            evalStr += " = '" + value + "';\n";
            eval(evalStr);
        }
    }
}

function htmlspecialchars (string, quote_style, charset, double_encode) {
    // http://kevin.vanzonneveld.net
    // +   original by: Mirek Slugen
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Nathan
    // +   bugfixed by: Arno
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +      input by: Ratheous
    // +      input by: Mailfaker (http://www.weedem.fr/)
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +      input by: felix
    // +    bugfixed by: Brett Zamir (http://brett-zamir.me)
    // %        note 1: charset argument not supported
    // *     example 1: htmlspecialchars("<a href='test'>Test</a>", 'ENT_QUOTES');
    // *     returns 1: '&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;'
    // *     example 2: htmlspecialchars("ab\"c'd", ['ENT_NOQUOTES', 'ENT_QUOTES']);
    // *     returns 2: 'ab"c&#039;d'
    // *     example 3: htmlspecialchars("my "&entity;" is still here", null, null, false);
    // *     returns 3: 'my &quot;&entity;&quot; is still here'
    var optTemp = 0,
        i = 0,
        noquotes = false;
    if (typeof quote_style === 'undefined' || quote_style === null) {
        quote_style = 2;
    }
    string = string.toString();
    if (double_encode !== false) { // Put this first to avoid double-encoding
        string = string.replace(/&/g, '&amp;');
    }
    string = string.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    var OPTS = {
        'ENT_NOQUOTES': 0,
        'ENT_HTML_QUOTE_SINGLE': 1,
        'ENT_HTML_QUOTE_DOUBLE': 2,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,
        'ENT_IGNORE': 4
    };
    if (quote_style === 0) {
        noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
        quote_style = [].concat(quote_style);
        for (i = 0; i < quote_style.length; i++) {
            // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
            if (OPTS[quote_style[i]] === 0) {
                noquotes = true;
            }
            else if (OPTS[quote_style[i]]) {
                optTemp = optTemp | OPTS[quote_style[i]];
            }
        }
        quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
        string = string.replace(/'/g, '&#039;');
    }
    if (!noquotes) {
        string = string.replace(/"/g, '&quot;');
    }

    return string;
}

function htmlspecialchars_decode (string, quote_style) {
    // http://kevin.vanzonneveld.net
    // +   original by: Mirek Slugen
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Mateusz "loonquawl" Zalega
    // +      input by: ReverseSyntax
    // +      input by: Slawomir Kaniecki
    // +      input by: Scott Cariss
    // +      input by: Francois
    // +   bugfixed by: Onno Marsman
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +      input by: Ratheous
    // +      input by: Mailfaker (http://www.weedem.fr/)
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +    bugfixed by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: htmlspecialchars_decode("<p>this -&gt; &quot;</p>", 'ENT_NOQUOTES');
    // *     returns 1: '<p>this -> &quot;</p>'
    // *     example 2: htmlspecialchars_decode("&amp;quot;");
    // *     returns 2: '&quot;'
    var optTemp = 0,
        i = 0,
        noquotes = false;
    if (typeof quote_style === 'undefined') {
        quote_style = 2;
    }
    string = string.toString().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    var OPTS = {
        'ENT_NOQUOTES': 0,
        'ENT_HTML_QUOTE_SINGLE': 1,
        'ENT_HTML_QUOTE_DOUBLE': 2,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,
        'ENT_IGNORE': 4
    };
    if (quote_style === 0) {
        noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
        quote_style = [].concat(quote_style);
        for (i = 0; i < quote_style.length; i++) {
            // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
            if (OPTS[quote_style[i]] === 0) {
                noquotes = true;
            } else if (OPTS[quote_style[i]]) {
                optTemp = optTemp | OPTS[quote_style[i]];
            }
        }
        quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
        string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
        // string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
    }
    if (!noquotes) {
        string = string.replace(/&quot;/g, '"');
    }
    // Put this in last place to avoid escape being double-decoded
    string = string.replace(/&amp;/g, '&');

    return string;
}