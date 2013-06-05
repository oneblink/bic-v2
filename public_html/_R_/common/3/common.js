// see MIT/GPL http://phpjs.org/ for the original source of these functions

function explode (delimiter, string, limit) {
    // Splits a string on string separator and return array of components. If limit is positive only limit number of components is returned. If limit is negative all components except the last abs(limit) are returned.  
    // 
    // version: 1103.1210
    // discuss at: http://phpjs.org/functions/explode
    // +     original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +     improved by: kenneth
    // +     improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +     improved by: d3x
    // +     bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // *     example 1: explode(' ', 'Kevin van Zonneveld');
    // *     returns 1: {0: 'Kevin', 1: 'van', 2: 'Zonneveld'}
    // *     example 2: explode('=', 'a=bc=d', 2);
    // *     returns 2: ['a', 'bc=d']
    var emptyArray = {
        0: ''
    };
 
    // third argument is not required
    if (arguments.length < 2 || typeof arguments[0] == 'undefined' || typeof arguments[1] == 'undefined') {
        return null;
    }
 
    if (delimiter === '' || delimiter === false || delimiter === null) {
        return false;
    }
 
    if (typeof delimiter == 'function' || typeof delimiter == 'object' || typeof string == 'function' || typeof string == 'object') {
        return emptyArray;
    }
 
    if (delimiter === true) {
        delimiter = '1';
    }
 
    if (!limit) {
        return string.toString().split(delimiter.toString());
    } else {
        // support for limit argument
        var splitted = string.toString().split(delimiter.toString());
        var partA = splitted.splice(0, limit - 1);
        var partB = splitted.join(delimiter.toString());
        partA.push(partB);
        return partA;
    }
}

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

function setlocale (category, locale) {
	// Set locale information  
	// 
	// version: 1107.2516
	// discuss at: http://phpjs.org/functions/setlocale
	// +   original by: Brett Zamir (http://brett-zamir.me)
	// +   derived from: Blues at http://hacks.bluesmoon.info/strftime/strftime.js
	// +   derived from: YUI Library: http://developer.yahoo.com/yui/docs/YAHOO.util.DateLocale.html
	// -    depends on: getenv
	// %          note 1: Is extensible, but currently only implements locales en,
	// %          note 1: en_US, en_GB, en_AU, fr, and fr_CA for LC_TIME only; C for LC_CTYPE;
	// %          note 1: C and en for LC_MONETARY/LC_NUMERIC; en for LC_COLLATE
	// %          note 2: Uses global: php_js to store locale info
	// %          note 3: Consider using http://demo.icu-project.org/icu-bin/locexp as basis for localization (as in i18n_loc_set_default())
	// *     example 1: setlocale('LC_ALL', 'en_US');
	// *     returns 1: 'en_US'
	var categ = '',
	cats = [],
	i = 0,
	d = this.window.document;
 
	// BEGIN STATIC
	var _copy = function _copy(orig) {
		if (orig instanceof RegExp) {
			return new RegExp(orig);
		} else if (orig instanceof Date) {
			return new Date(orig);
		}
		var newObj = {};
		for (var i in orig) {
			if (typeof orig[i] === 'object') {
				newObj[i] = _copy(orig[i]);
			} else {
				newObj[i] = orig[i];
			}
		}
		return newObj;
	};
 
	// Function usable by a ngettext implementation (apparently not an accessible part of setlocale(), but locale-specific)
	// See http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms though amended with others from
	// https://developer.mozilla.org/En/Localization_and_Plurals (new categories noted with "MDC" below, though
	// not sure of whether there is a convention for the relative order of these newer groups as far as ngettext)
	// The function name indicates the number of plural forms (nplural)
	// Need to look into http://cldr.unicode.org/ (maybe future JavaScript); Dojo has some functions (under new BSD),
	// including JSON conversions of LDML XML from CLDR: http://bugs.dojotoolkit.org/browser/dojo/trunk/cldr
	// and docs at http://api.dojotoolkit.org/jsdoc/HEAD/dojo.cldr
	var _nplurals1 = function (n) { // e.g., Japanese
		return 0;
	};
	var _nplurals2a = function (n) { // e.g., English
		return n !== 1 ? 1 : 0;
	};
	var _nplurals2b = function (n) { // e.g., French
		return n > 1 ? 1 : 0;
	};
	var _nplurals2c = function (n) { // e.g., Icelandic (MDC)
		return n % 10 === 1 && n % 100 !== 11 ? 0 : 1;
	};
	var _nplurals3a = function (n) { // e.g., Latvian (MDC has a different order from gettext)
		return n % 10 === 1 && n % 100 !== 11 ? 0 : n !== 0 ? 1 : 2;
	};
	var _nplurals3b = function (n) { // e.g., Scottish Gaelic
		return n === 1 ? 0 : n === 2 ? 1 : 2;
	};
	var _nplurals3c = function (n) { // e.g., Romanian
		return n === 1 ? 0 : (n === 0 || (n % 100 > 0 && n % 100 < 20)) ? 1 : 2;
	};
	var _nplurals3d = function (n) { // e.g., Lithuanian (MDC has a different order from gettext)
		return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
	};
	var _nplurals3e = function (n) { // e.g., Croatian
		return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
	};
	var _nplurals3f = function (n) { // e.g., Slovak
		return n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
	};
	var _nplurals3g = function (n) { // e.g., Polish
		return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
	};
	var _nplurals3h = function (n) { // e.g., Macedonian (MDC)
		return n % 10 === 1 ? 0 : n % 10 === 2 ? 1 : 2;
	};
	var _nplurals4a = function (n) { // e.g., Slovenian
		return n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3;
	};
	var _nplurals4b = function (n) { // e.g., Maltese (MDC)
		return n === 1 ? 0 : n === 0 || (n % 100 && n % 100 <= 10) ? 1 : n % 100 >= 11 && n % 100 <= 19 ? 2 : 3;
	};
	var _nplurals5 = function (n) { // e.g., Irish Gaeilge (MDC)
		return n === 1 ? 0 : n === 2 ? 1 : n >= 3 && n <= 6 ? 2 : n >= 7 && n <= 10 ? 3 : 4;
	};
	var _nplurals6 = function (n) { // e.g., Arabic (MDC) - Per MDC puts 0 as last group
		return n === 0 ? 5 : n === 1 ? 0 : n === 2 ? 1 : n % 100 >= 3 && n % 100 <= 10 ? 2 : n % 100 >= 11 && n % 100 <= 99 ? 3 : 4;
	};
	// END STATIC
	// BEGIN REDUNDANT
	this.php_js = this.php_js || {};
 
	var phpjs = this.php_js;
 
	// Reconcile Windows vs. *nix locale names?
	// Allow different priority orders of languages, esp. if implement gettext as in
	//     LANGUAGE env. var.? (e.g., show German if French is not available)
	if (!phpjs.locales) {
		// Can add to the locales
		phpjs.locales = {};
 
		phpjs.locales.en = {
			'LC_COLLATE': // For strcoll
 
 
			function (str1, str2) { // Fix: This one taken from strcmp, but need for other locales; we don't use localeCompare since its locale is not settable
				return (str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1);
			},
			'LC_CTYPE': { // Need to change any of these for English as opposed to C?
				an: /^[A-Za-z\d]+$/g,
				al: /^[A-Za-z]+$/g,
				ct: /^[\u0000-\u001F\u007F]+$/g,
				dg: /^[\d]+$/g,
				gr: /^[\u0021-\u007E]+$/g,
				lw: /^[a-z]+$/g,
				pr: /^[\u0020-\u007E]+$/g,
				pu: /^[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]+$/g,
				sp: /^[\f\n\r\t\v ]+$/g,
				up: /^[A-Z]+$/g,
				xd: /^[A-Fa-f\d]+$/g,
				CODESET: 'UTF-8',
				// Used by sql_regcase
				lower: 'abcdefghijklmnopqrstuvwxyz',
				upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
			},
			'LC_TIME': { // Comments include nl_langinfo() constant equivalents and any changes from Blues' implementation
				a: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				// ABDAY_
				A: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
				// DAY_
				b: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				// ABMON_
				B: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				// MON_
				c: '%a %d %b %Y %r %Z',
				// D_T_FMT // changed %T to %r per results
				p: ['AM', 'PM'],
				// AM_STR/PM_STR
				P: ['am', 'pm'],
				// Not available in nl_langinfo()
				r: '%I:%M:%S %p',
				// T_FMT_AMPM (Fixed for all locales)
				x: '%m/%d/%Y',
				// D_FMT // switched order of %m and %d; changed %y to %Y (C uses %y)
				X: '%r',
				// T_FMT // changed from %T to %r  (%T is default for C, not English US)
				// Following are from nl_langinfo() or http://www.cptec.inpe.br/sx4/sx4man2/g1ab02e/strftime.4.html
				alt_digits: '',
				// e.g., ordinal
				ERA: '',
				ERA_YEAR: '',
				ERA_D_T_FMT: '',
				ERA_D_FMT: '',
				ERA_T_FMT: ''
			},
			// Assuming distinction between numeric and monetary is thus:
			// See below for C locale
			'LC_MONETARY': { // Based on Windows "english" (English_United States.1252) locale
				int_curr_symbol: 'USD',
				currency_symbol: '$',
				mon_decimal_point: '.',
				mon_thousands_sep: ',',
				mon_grouping: [3],
				// use mon_thousands_sep; "" for no grouping; additional array members indicate successive group lengths after first group (e.g., if to be 1,23,456, could be [3, 2])
				positive_sign: '',
				negative_sign: '-',
				int_frac_digits: 2,
				// Fractional digits only for money defaults?
				frac_digits: 2,
				p_cs_precedes: 1,
				// positive currency symbol follows value = 0; precedes value = 1
				p_sep_by_space: 0,
				// 0: no space between curr. symbol and value; 1: space sep. them unless symb. and sign are adjacent then space sep. them from value; 2: space sep. sign and value unless symb. and sign are adjacent then space separates
				n_cs_precedes: 1,
				// see p_cs_precedes
				n_sep_by_space: 0,
				// see p_sep_by_space
				p_sign_posn: 3,
				// 0: parentheses surround quantity and curr. symbol; 1: sign precedes them; 2: sign follows them; 3: sign immed. precedes curr. symbol; 4: sign immed. succeeds curr. symbol
				n_sign_posn: 0 // see p_sign_posn
			},
			'LC_NUMERIC': { // Based on Windows "english" (English_United States.1252) locale
				decimal_point: '.',
				thousands_sep: ',',
				grouping: [3] // see mon_grouping, but for non-monetary values (use thousands_sep)
			},
			'LC_MESSAGES': {
				YESEXPR: '^[yY].*',
				NOEXPR: '^[nN].*',
				YESSTR: '',
				NOSTR: ''
			},
			nplurals: _nplurals2a
		};
		phpjs.locales.en_US = _copy(phpjs.locales.en);
		phpjs.locales.en_US.LC_TIME.c = '%a %d %b %Y %r %Z';
		phpjs.locales.en_US.LC_TIME.x = '%D';
		phpjs.locales.en_US.LC_TIME.X = '%r';
		// The following are based on *nix settings
		phpjs.locales.en_US.LC_MONETARY.int_curr_symbol = 'USD ';
		phpjs.locales.en_US.LC_MONETARY.p_sign_posn = 1;
		phpjs.locales.en_US.LC_MONETARY.n_sign_posn = 1;
		phpjs.locales.en_US.LC_MONETARY.mon_grouping = [3, 3];
		phpjs.locales.en_US.LC_NUMERIC.thousands_sep = '';
		phpjs.locales.en_US.LC_NUMERIC.grouping = [];
 
		phpjs.locales.en_GB = _copy(phpjs.locales.en);
		phpjs.locales.en_GB.LC_TIME.r = '%l:%M:%S %P %Z';
 
		phpjs.locales.en_AU = _copy(phpjs.locales.en_GB);
		phpjs.locales.C = _copy(phpjs.locales.en); // Assume C locale is like English (?) (We need C locale for LC_CTYPE)
		phpjs.locales.C.LC_CTYPE.CODESET = 'ANSI_X3.4-1968';
		phpjs.locales.C.LC_MONETARY = {
			int_curr_symbol: '',
			currency_symbol: '',
			mon_decimal_point: '',
			mon_thousands_sep: '',
			mon_grouping: [],
			p_cs_precedes: 127,
			p_sep_by_space: 127,
			n_cs_precedes: 127,
			n_sep_by_space: 127,
			p_sign_posn: 127,
			n_sign_posn: 127,
			positive_sign: '',
			negative_sign: '',
			int_frac_digits: 127,
			frac_digits: 127
		};
		phpjs.locales.C.LC_NUMERIC = {
			decimal_point: '.',
			thousands_sep: '',
			grouping: []
		};
		phpjs.locales.C.LC_TIME.c = '%a %b %e %H:%M:%S %Y'; // D_T_FMT
		phpjs.locales.C.LC_TIME.x = '%m/%d/%y'; // D_FMT
		phpjs.locales.C.LC_TIME.X = '%H:%M:%S'; // T_FMT
		phpjs.locales.C.LC_MESSAGES.YESEXPR = '^[yY]';
		phpjs.locales.C.LC_MESSAGES.NOEXPR = '^[nN]';
 
		phpjs.locales.fr = _copy(phpjs.locales.en);
		phpjs.locales.fr.nplurals = _nplurals2b;
		phpjs.locales.fr.LC_TIME.a = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
		phpjs.locales.fr.LC_TIME.A = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
		phpjs.locales.fr.LC_TIME.b = ['jan', 'f\u00E9v', 'mar', 'avr', 'mai', 'jun', 'jui', 'ao\u00FB', 'sep', 'oct', 'nov', 'd\u00E9c'];
		phpjs.locales.fr.LC_TIME.B = ['janvier', 'f\u00E9vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'ao\u00FBt', 'septembre', 'octobre', 'novembre', 'd\u00E9cembre'];
		phpjs.locales.fr.LC_TIME.c = '%a %d %b %Y %T %Z';
		phpjs.locales.fr.LC_TIME.p = ['', ''];
		phpjs.locales.fr.LC_TIME.P = ['', ''];
		phpjs.locales.fr.LC_TIME.x = '%d.%m.%Y';
		phpjs.locales.fr.LC_TIME.X = '%T';
 
		phpjs.locales.fr_CA = _copy(phpjs.locales.fr);
		phpjs.locales.fr_CA.LC_TIME.x = '%Y-%m-%d';
	}
	if (!phpjs.locale) {
		phpjs.locale = 'en_US';
		var NS_XHTML = 'http://www.w3.org/1999/xhtml';
		var NS_XML = 'http://www.w3.org/XML/1998/namespace';
		if (d.getElementsByTagNameNS && d.getElementsByTagNameNS(NS_XHTML, 'html')[0]) {
			if (d.getElementsByTagNameNS(NS_XHTML, 'html')[0].getAttributeNS && d.getElementsByTagNameNS(NS_XHTML, 'html')[0].getAttributeNS(NS_XML, 'lang')) {
				phpjs.locale = d.getElementsByTagName(NS_XHTML, 'html')[0].getAttributeNS(NS_XML, 'lang');
			} else if (d.getElementsByTagNameNS(NS_XHTML, 'html')[0].lang) { // XHTML 1.0 only
				phpjs.locale = d.getElementsByTagNameNS(NS_XHTML, 'html')[0].lang;
			}
		} else if (d.getElementsByTagName('html')[0] && d.getElementsByTagName('html')[0].lang) {
			phpjs.locale = d.getElementsByTagName('html')[0].lang;
		}
	}
	phpjs.locale = phpjs.locale.replace('-', '_'); // PHP-style
	// Fix locale if declared locale hasn't been defined
	if (!(phpjs.locale in phpjs.locales)) {
		if (phpjs.locale.replace(/_[a-zA-Z]+$/, '') in phpjs.locales) {
			phpjs.locale = phpjs.locale.replace(/_[a-zA-Z]+$/, '');
		}
	}
 
	if (!phpjs.localeCategories) {
		phpjs.localeCategories = {
			'LC_COLLATE': phpjs.locale,
			// for string comparison, see strcoll()
			'LC_CTYPE': phpjs.locale,
			// for character classification and conversion, for example strtoupper()
			'LC_MONETARY': phpjs.locale,
			// for localeconv()
			'LC_NUMERIC': phpjs.locale,
			// for decimal separator (See also localeconv())
			'LC_TIME': phpjs.locale,
			// for date and time formatting with strftime()
			'LC_MESSAGES': phpjs.locale // for system responses (available if PHP was compiled with libintl)
		};
	}
	// END REDUNDANT
	if (locale === null || locale === '') {
		locale = this.getenv(category) || this.getenv('LANG');
	} else if (Object.prototype.toString.call(locale) === '[object Array]') {
		for (i = 0; i < locale.length; i++) {
			if (!(locale[i] in this.php_js.locales)) {
				if (i === locale.length - 1) {
					return false; // none found
				}
				continue;
			}
			locale = locale[i];
			break;
		}
	}
 
	// Just get the locale
	if (locale === '0' || locale === 0) {
		if (category === 'LC_ALL') {
			for (categ in this.php_js.localeCategories) {
				cats.push(categ + '=' + this.php_js.localeCategories[categ]); // Add ".UTF-8" or allow ".@latint", etc. to the end?
			}
			return cats.join(';');
		}
		return this.php_js.localeCategories[category];
	}
 
	if (!(locale in this.php_js.locales)) {
		return false; // Locale not found
	}
 
	// Set and get locale
	if (category === 'LC_ALL') {
		for (categ in this.php_js.localeCategories) {
			this.php_js.localeCategories[categ] = locale;
		}
	} else {
		this.php_js.localeCategories[category] = locale;
	}
	return locale;
}

/**
 * @param {String} fmt format string (C library strftime-style)
 * @param {String} timestamp ISO 8601 formatted time string
 * @returns {String}
 */
function strftime (fmt, timestamp) {
	// Format a local time/date according to locale settings  
	// 
	// version: 1107.2516
	// discuss at: http://phpjs.org/functions/strftime
	// +      original by: Blues (http://tech.bluesmoon.info/)
	// + reimplemented by: Brett Zamir (http://brett-zamir.me)
	// +   input by: Alex
	// +   bugfixed by: Brett Zamir (http://brett-zamir.me)
	// +   improved by: Brett Zamir (http://brett-zamir.me)
	// -       depends on: setlocale
	// %        note 1: Uses global: php_js to store locale info
	// *        example 1: strftime("%A", 1062462400); // Return value will depend on date and locale
	// *        returns 1: 'Tuesday'
	// BEGIN REDUNDANT
	this.php_js = this.php_js || {};
	this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
	// END REDUNDANT
	var phpjs = this.php_js;
 
	// BEGIN STATIC
	var _xPad = function (x, pad, r) {
		if (typeof r === 'undefined') {
			r = 10;
		}
		for (; parseInt(x, 10) < r && r > 1; r /= 10) {
			x = pad.toString() + x;
		}
		return x.toString();
	};
 
	var locale = phpjs.localeCategories.LC_TIME;
	var locales = phpjs.locales;
	var lc_time = locales[locale].LC_TIME;
 
	var _formats = {
		a: function (d) {
			return lc_time.a[d.getDay()];
		},
		A: function (d) {
			return lc_time.A[d.getDay()];
		},
		b: function (d) {
			return lc_time.b[d.getMonth()];
		},
		B: function (d) {
			return lc_time.B[d.getMonth()];
		},
		C: function (d) {
			return _xPad(parseInt(d.getFullYear() / 100, 10), 0);
		},
		d: ['getDate', '0'],
		e: ['getDate', ' '],
		g: function (d) {
			return _xPad(parseInt(this.G(d) / 100, 10), 0);
		},
		G: function (d) {
			var y = d.getFullYear();
			var V = parseInt(_formats.V(d), 10);
			var W = parseInt(_formats.W(d), 10);
 
			if (W > V) {
				y++;
			} else if (W === 0 && V >= 52) {
				y--;
			}
 
			return y;
		},
		H: ['getHours', '0'],
		I: function (d) {
			var I = d.getHours() % 12;
			return _xPad(I === 0 ? 12 : I, 0);
		},
		j: function (d) {
			var ms = d - new Date('' + d.getFullYear() + '/1/1 GMT');
			ms += d.getTimezoneOffset() * 60000; // Line differs from Yahoo implementation which would be equivalent to replacing it here with:
			// ms = new Date('' + d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() + ' GMT') - ms;
			var doy = parseInt(ms / 60000 / 60 / 24, 10) + 1;
			return _xPad(doy, 0, 100);
		},
		k: ['getHours', '0'],
		// not in PHP, but implemented here (as in Yahoo)
		l: function (d) {
			var l = d.getHours() % 12;
			return _xPad(l === 0 ? 12 : l, ' ');
		},
		m: function (d) {
			return _xPad(d.getMonth() + 1, 0);
		},
		M: ['getMinutes', '0'],
		p: function (d) {
			return lc_time.p[d.getHours() >= 12 ? 1 : 0];
		},
		P: function (d) {
			return lc_time.P[d.getHours() >= 12 ? 1 : 0];
		},
		s: function (d) { // Yahoo uses return parseInt(d.getTime()/1000, 10);
			return Date.parse(d) / 1000;
		},
		S: ['getSeconds', '0'],
		u: function (d) {
			var dow = d.getDay();
			return ((dow === 0) ? 7 : dow);
		},
		U: function (d) {
			var doy = parseInt(_formats.j(d), 10);
			var rdow = 6 - d.getDay();
			var woy = parseInt((doy + rdow) / 7, 10);
			return _xPad(woy, 0);
		},
		V: function (d) {
			var woy = parseInt(_formats.W(d), 10);
			var dow1_1 = (new Date('' + d.getFullYear() + '/1/1')).getDay();
			// First week is 01 and not 00 as in the case of %U and %W,
			// so we add 1 to the final result except if day 1 of the year
			// is a Monday (then %W returns 01).
			// We also need to subtract 1 if the day 1 of the year is
			// Friday-Sunday, so the resulting equation becomes:
			var idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1);
			if (idow === 53 && (new Date('' + d.getFullYear() + '/12/31')).getDay() < 4) {
				idow = 1;
			} else if (idow === 0) {
				idow = _formats.V(new Date('' + (d.getFullYear() - 1) + '/12/31'));
			}
			return _xPad(idow, 0);
		},
		w: 'getDay',
		W: function (d) {
			var doy = parseInt(_formats.j(d), 10);
			var rdow = 7 - _formats.u(d);
			var woy = parseInt((doy + rdow) / 7, 10);
			return _xPad(woy, 0, 10);
		},
		y: function (d) {
			return _xPad(d.getFullYear() % 100, 0);
		},
		Y: 'getFullYear',
		z: function (d) {
			var o = d.getTimezoneOffset();
			var H = _xPad(parseInt(Math.abs(o / 60), 10), 0);
			var M = _xPad(o % 60, 0);
			return (o > 0 ? '-' : '+') + H + M;
		},
		Z: function (d) {
			return d.toString().replace(/^.*\(([^)]+)\)$/, '$1');
		/*
            // Yahoo's: Better?
            var tz = d.toString().replace(/^.*:\d\d( GMT[+-]\d+)? \(?([A-Za-z ]+)\)?\d*$/, '$2').replace(/[a-z ]/g, '');
            if(tz.length > 4) {
                tz = Dt.formats.z(d);
            }
            return tz;
            */
		},
		'%': function (d) {
			return '%';
		}
	};
	// END STATIC
	/* Fix: Locale alternatives are supported though not documented in PHP; see http://linux.die.net/man/3/strptime */

	var _date = ((typeof(timestamp) == 'undefined') ? new Date() : // Not provided
		(typeof(timestamp) == 'object') ? new Date(timestamp) : // Javascript Date()
		new Date(timestamp * 1000) // PHP API expects UNIX timestamp (auto-convert to int)
		);
	var _aggregates = {
		c: 'locale',
		D: '%m/%d/%y',
		F: '%y-%m-%d',
		h: '%b',
		n: '\n',
		r: 'locale',
		R: '%H:%M',
		t: '\t',
		T: '%H:%M:%S',
		x: 'locale',
		X: 'locale'
	};
 
 
	// First replace aggregates (run in a loop because an agg may be made up of other aggs)
	while (fmt.match(/%[cDFhnrRtTxX]/)) {
		fmt = fmt.replace(/%([cDFhnrRtTxX])/g, function (m0, m1) {
			var f = _aggregates[m1];
			return (f === 'locale' ? lc_time[m1] : f);
		});
	}
 
	// Now replace formats - we need a closure so that the date object gets passed through
	var str = fmt.replace(/%([aAbBCdegGHIjklmMpPsSuUVwWyYzZ%])/g, function (m0, m1) {
		var f = _formats[m1];
		if (typeof f === 'string') {
			return _date[f]();
		} else if (typeof f === 'function') {
			return f(_date);
		} else if (typeof f === 'object' && typeof(f[0]) === 'string') {
			return _xPad(_date[f[0]](), f[1]);
		} else { // Shouldn't reach here
			return m1;
		}
	});
	return str;
}

// Underscore.js 1.4.4
// ===================

// > http://underscorejs.org
// > (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
// > Underscore may be freely distributed under the MIT license.

// Baseline setup
// --------------
(function() {

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

// Copyright 2009-2012 by contributors, MIT License
// vim: ts=4 sts=4 sw=4 expandtab

// Module systems magic dance
(function (definition) {
    // RequireJS
    if (typeof define == "function") {
        define(definition);
    // YUI3
    } else if (typeof YUI == "function") {
        YUI.add("es5", definition);
    // CommonJS and <script>
    } else {
        definition();
    }
})(function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
        }
        // XXX bound.length is never writable, so don't even try
        //
        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.
        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    };
}

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
// Having a toString local variable name breaks in Opera so use _toString.
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}

//
// Array
// =====
//

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.12
// Default value for second param
// [bugfix, ielt9, old browsers]
// IE < 9 bug: [1,2].splice(0).join("") == "" but should be "12"
if ([1,2].splice(0).length != 2) {
    var array_splice = Array.prototype.splice;
    Array.prototype.splice = function(start, deleteCount) {
        if (!arguments.length) {
            return [];
        } else {
            return array_splice.apply(this, [
                start === void 0 ? 0 : start,
                deleteCount === void 0 ? (this.length - start) : deleteCount
            ].concat(slice.call(arguments, 2)))
        }
    };
}

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.13
// Return len+argCount.
// [bugfix, ielt8]
// IE < 8 bug: [].unshift(0) == undefined but should be "1"
if ([].unshift(0) != 1) {
    var array_unshift = Array.prototype.unshift;
    Array.prototype.unshift = function() {
        array_unshift.apply(this, arguments);
        return this.length;
    };
}

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object
                // context
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value and an empty array
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    };
}

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value, empty array
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    };
}

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}

//
// Object
// ======
//

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14
if (!Object.keys) {
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
var negativeDate = -62198755200000,
    negativeYearString = "-000001";
if (
    !Date.prototype.toISOString ||
    (new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1)
) {
    Date.prototype.toISOString = function toISOString() {
        var result, length, value, year, month;
        if (!isFinite(this)) {
            throw new RangeError("Date.prototype.toISOString called on non-finite value.");
        }

        year = this.getUTCFullYear();

        month = this.getUTCMonth();
        // see https://github.com/kriskowal/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;

        // the date time string format is specified in 15.9.1.15.
        result = [month + 1, this.getUTCDate(),
            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = (
            (year < 0 ? "-" : (year > 9999 ? "+" : "")) +
            ("00000" + Math.abs(year))
            .slice(0 <= year && year <= 9999 ? -4 : -6)
        );

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two
            // digits.
            if (value < 10) {
                result[length] = "0" + value;
            }
        }
        // pad milliseconds to have three digits.
        return (
            year + "-" + result.slice(0, 2).join("-") +
            "T" + result.slice(2).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z"
        );
    };
}


// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
var dateToJSONIsSupported = false;
try {
    dateToJSONIsSupported = (
        Date.prototype.toJSON &&
        new Date(NaN).toJSON() === null &&
        new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
        Date.prototype.toJSON.call({ // generic
            toISOString: function () {
                return true;
            }
        })
    );
} catch (e) {
}
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be toPrimitive(O, hint Number).
        var o = Object(this),
            tv = toPrimitive(o),
            toISO;
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === "number" && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        toISO = o.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof toISO != "function") {
            throw new TypeError("toISOString property is not callable");
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(o);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (!Date.parse || "Date.parse is buggy") {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign +
                                      // 6-digit extended year
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:\\.(\\d{3}))?" + // milliseconds capture
                ")?" +
            "(" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");

        var months = [
            0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365
        ];

        function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return (
                months[month] +
                Math.floor((year - 1969 + t) / 4) -
                Math.floor((year - 1901 + t) / 100) +
                Math.floor((year - 1601 + t) / 400) +
                365 * (year - 1970)
            );
        }

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            Date[key] = NativeDate[key];
        }

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = Number(match[1]),
                    month = Number(match[2] || 1) - 1,
                    day = Number(match[3] || 1) - 1,
                    hour = Number(match[4] || 0),
                    minute = Number(match[5] || 0),
                    second = Number(match[6] || 0),
                    millisecond = Number(match[7] || 0),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    offset = !match[4] || match[8] ?
                        0 : Number(new NativeDate(1970, 0)),
                    signOffset = match[9] === "-" ? 1 : -1,
                    hourOffset = Number(match[10] || 0),
                    minuteOffset = Number(match[11] || 0),
                    result;
                if (
                    hour < (
                        minute > 0 || second > 0 || millisecond > 0 ?
                        24 : 25
                    ) &&
                    minute < 60 && second < 60 && millisecond < 1000 &&
                    month > -1 && month < 12 && hourOffset < 24 &&
                    minuteOffset < 60 && // detect invalid offsets
                    day > -1 &&
                    day < (
                        dayFromMonth(year, month + 1) -
                        dayFromMonth(year, month)
                    )
                ) {
                    result = (
                        (dayFromMonth(year, month) + day) * 24 +
                        hour +
                        hourOffset * signOffset
                    ) * 60;
                    result = (
                        (result + minute + minuteOffset * signOffset) * 60 +
                        second
                    ) * 1000 + millisecond + offset;
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}


//
// String
// ======
//


// ES5 15.5.4.14
// http://es5.github.com/#x15.5.4.14
// [bugfix, chrome]
// If separator is undefined, then the result array contains just one String,
// which is the this value (converted to a String). If limit is not undefined,
// then the output array is truncated so that it contains no more than limit
// elements.
// "0".split(undefined, 0) -> []
if("0".split(void 0, 0).length) {
    var string_split = String.prototype.split;
    String.prototype.split = function(separator, limit) {
        if(separator === void 0 && limit === 0)return [];
        return string_split.apply(this, arguments);
    }
}

// ECMA-262, 3rd B.2.3
// Note an ECMAScript standart, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
if("".substr && "0b".substr(-1) !== "b") {
    var string_substr = String.prototype.substr;
    /**
     *  Get the substring of a string
     *  @param  {integer}  start   where to start the substring
     *  @param  {integer}  length  how many characters to return
     *  @return {string}
     */
    String.prototype.substr = function(start, length) {
        return string_substr.call(
            this,
            start < 0 ? ((start = this.length + start) < 0 ? 0 : start) : start,
            length
        );
    }
}

// ES5 15.5.4.20
// http://es5.github.com/#x15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        if (this === undefined || this === null) {
            throw new TypeError("can't convert "+this+" to object");
        }
        return String(this)
            .replace(trimBeginRegexp, "")
            .replace(trimEndRegexp, "");
    };
}

//
// Util
// ======
//

// ES5 9.4
// http://es5.github.com/#x9.4
// http://jsperf.com/to-integer

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}

// ES5 9.9
// http://es5.github.com/#x9.9
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};

});

/**
 * Copyright 2010 Tim Down.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * jshashtable
 *
 * jshashtable is a JavaScript implementation of a hash table. It creates a single constructor function called Hashtable
 * in the global scope.
 *
 * Author: Tim Down <tim@timdown.co.uk>
 * Version: 2.1
 * Build date: 21 March 2010
 * Website: http://www.timdown.co.uk/jshashtable
 */

var Hashtable = (function() {
	var FUNCTION = "function";

	var arrayRemoveAt = (typeof Array.prototype.splice == FUNCTION) ?
		function(arr, idx) {
			arr.splice(idx, 1);
		} :

		function(arr, idx) {
			var itemsAfterDeleted, i, len;
			if (idx === arr.length - 1) {
				arr.length = idx;
			} else {
				itemsAfterDeleted = arr.slice(idx + 1);
				arr.length = idx;
				for (i = 0, len = itemsAfterDeleted.length; i < len; ++i) {
					arr[idx + i] = itemsAfterDeleted[i];
				}
			}
		};

	function hashObject(obj) {
		var hashCode;
		if (typeof obj == "string") {
			return obj;
		} else if (typeof obj.hashCode == FUNCTION) {
			// Check the hashCode method really has returned a string
			hashCode = obj.hashCode();
			return (typeof hashCode == "string") ? hashCode : hashObject(hashCode);
		} else if (typeof obj.toString == FUNCTION) {
			return obj.toString();
		} else {
			try {
				return String(obj);
			} catch (ex) {
				// For host objects (such as ActiveObjects in IE) that have no toString() method and throw an error when
				// passed to String()
				return Object.prototype.toString.call(obj);
			}
		}
	}

	function equals_fixedValueHasEquals(fixedValue, variableValue) {
		return fixedValue.equals(variableValue);
	}

	function equals_fixedValueNoEquals(fixedValue, variableValue) {
		return (typeof variableValue.equals == FUNCTION) ?
			   variableValue.equals(fixedValue) : (fixedValue === variableValue);
	}

	function createKeyValCheck(kvStr) {
		return function(kv) {
			if (kv === null) {
				throw new Error("null is not a valid " + kvStr);
			} else if (typeof kv == "undefined") {
				throw new Error(kvStr + " must not be undefined");
			}
		};
	}

	var checkKey = createKeyValCheck("key"), checkValue = createKeyValCheck("value");

	/*----------------------------------------------------------------------------------------------------------------*/

	function Bucket(hash, firstKey, firstValue, equalityFunction) {
        this[0] = hash;
		this.entries = [];
		this.addEntry(firstKey, firstValue);

		if (equalityFunction !== null) {
			this.getEqualityFunction = function() {
				return equalityFunction;
			};
		}
	}

	var EXISTENCE = 0, ENTRY = 1, ENTRY_INDEX_AND_VALUE = 2;

	function createBucketSearcher(mode) {
		return function(key) {
			var i = this.entries.length, entry, equals = this.getEqualityFunction(key);
			while (i--) {
				entry = this.entries[i];
				if ( equals(key, entry[0]) ) {
					switch (mode) {
						case EXISTENCE:
							return true;
						case ENTRY:
							return entry;
						case ENTRY_INDEX_AND_VALUE:
							return [ i, entry[1] ];
					}
				}
			}
			return false;
		};
	}

	function createBucketLister(entryProperty) {
		return function(aggregatedArr) {
			var startIndex = aggregatedArr.length;
			for (var i = 0, len = this.entries.length; i < len; ++i) {
				aggregatedArr[startIndex + i] = this.entries[i][entryProperty];
			}
		};
	}

	Bucket.prototype = {
		getEqualityFunction: function(searchValue) {
			return (typeof searchValue.equals == FUNCTION) ? equals_fixedValueHasEquals : equals_fixedValueNoEquals;
		},

		getEntryForKey: createBucketSearcher(ENTRY),

		getEntryAndIndexForKey: createBucketSearcher(ENTRY_INDEX_AND_VALUE),

		removeEntryForKey: function(key) {
			var result = this.getEntryAndIndexForKey(key);
			if (result) {
				arrayRemoveAt(this.entries, result[0]);
				return result[1];
			}
			return null;
		},

		addEntry: function(key, value) {
			this.entries[this.entries.length] = [key, value];
		},

		keys: createBucketLister(0),

		values: createBucketLister(1),

		getEntries: function(entries) {
			var startIndex = entries.length;
			for (var i = 0, len = this.entries.length; i < len; ++i) {
				// Clone the entry stored in the bucket before adding to array
				entries[startIndex + i] = this.entries[i].slice(0);
			}
		},

		containsKey: createBucketSearcher(EXISTENCE),

		containsValue: function(value) {
			var i = this.entries.length;
			while (i--) {
				if ( value === this.entries[i][1] ) {
					return true;
				}
			}
			return false;
		}
	};

	/*----------------------------------------------------------------------------------------------------------------*/

	// Supporting functions for searching hashtable buckets

	function searchBuckets(buckets, hash) {
		var i = buckets.length, bucket;
		while (i--) {
			bucket = buckets[i];
			if (hash === bucket[0]) {
				return i;
			}
		}
		return null;
	}

	function getBucketForHash(bucketsByHash, hash) {
		var bucket = bucketsByHash[hash];

		// Check that this is a genuine bucket and not something inherited from the bucketsByHash's prototype
		return ( bucket && (bucket instanceof Bucket) ) ? bucket : null;
	}

	/*----------------------------------------------------------------------------------------------------------------*/

	function Hashtable(hashingFunctionParam, equalityFunctionParam) {
		var that = this;
		var buckets = [];
		var bucketsByHash = {};

		var hashingFunction = (typeof hashingFunctionParam == FUNCTION) ? hashingFunctionParam : hashObject;
		var equalityFunction = (typeof equalityFunctionParam == FUNCTION) ? equalityFunctionParam : null;

		this.put = function(key, value) {
			checkKey(key);
			checkValue(value);
			var hash = hashingFunction(key), bucket, bucketEntry, oldValue = null;

			// Check if a bucket exists for the bucket key
			bucket = getBucketForHash(bucketsByHash, hash);
			if (bucket) {
				// Check this bucket to see if it already contains this key
				bucketEntry = bucket.getEntryForKey(key);
				if (bucketEntry) {
					// This bucket entry is the current mapping of key to value, so replace old value and we're done.
					oldValue = bucketEntry[1];
					bucketEntry[1] = value;
				} else {
					// The bucket does not contain an entry for this key, so add one
					bucket.addEntry(key, value);
				}
			} else {
				// No bucket exists for the key, so create one and put our key/value mapping in
				bucket = new Bucket(hash, key, value, equalityFunction);
				buckets[buckets.length] = bucket;
				bucketsByHash[hash] = bucket;
			}
			return oldValue;
		};

		this.get = function(key) {
			checkKey(key);

			var hash = hashingFunction(key);

			// Check if a bucket exists for the bucket key
			var bucket = getBucketForHash(bucketsByHash, hash);
			if (bucket) {
				// Check this bucket to see if it contains this key
				var bucketEntry = bucket.getEntryForKey(key);
				if (bucketEntry) {
					// This bucket entry is the current mapping of key to value, so return the value.
					return bucketEntry[1];
				}
			}
			return null;
		};

		this.containsKey = function(key) {
			checkKey(key);
			var bucketKey = hashingFunction(key);

			// Check if a bucket exists for the bucket key
			var bucket = getBucketForHash(bucketsByHash, bucketKey);

			return bucket ? bucket.containsKey(key) : false;
		};

		this.containsValue = function(value) {
			checkValue(value);
			var i = buckets.length;
			while (i--) {
				if (buckets[i].containsValue(value)) {
					return true;
				}
			}
			return false;
		};

		this.clear = function() {
			buckets.length = 0;
			bucketsByHash = {};
		};

		this.isEmpty = function() {
			return !buckets.length;
		};

		var createBucketAggregator = function(bucketFuncName) {
			return function() {
				var aggregated = [], i = buckets.length;
				while (i--) {
					buckets[i][bucketFuncName](aggregated);
				}
				return aggregated;
			};
		};

		this.keys = createBucketAggregator("keys");
		this.values = createBucketAggregator("values");
		this.entries = createBucketAggregator("getEntries");

		this.remove = function(key) {
			checkKey(key);

			var hash = hashingFunction(key), bucketIndex, oldValue = null;

			// Check if a bucket exists for the bucket key
			var bucket = getBucketForHash(bucketsByHash, hash);

			if (bucket) {
				// Remove entry from this bucket for this key
				oldValue = bucket.removeEntryForKey(key);
				if (oldValue !== null) {
					// Entry was removed, so check if bucket is empty
					if (!bucket.entries.length) {
						// Bucket is empty, so remove it from the bucket collections
						bucketIndex = searchBuckets(buckets, hash);
						arrayRemoveAt(buckets, bucketIndex);
						delete bucketsByHash[hash];
					}
				}
			}
			return oldValue;
		};

		this.size = function() {
			var total = 0, i = buckets.length;
			while (i--) {
				total += buckets[i].entries.length;
			}
			return total;
		};

		this.each = function(callback) {
			var entries = that.entries(), i = entries.length, entry;
			while (i--) {
				entry = entries[i];
				callback(entry[0], entry[1]);
			}
		};

		this.putAll = function(hashtable, conflictCallback) {
			var entries = hashtable.entries();
			var entry, key, value, thisValue, i = entries.length;
			var hasConflictCallback = (typeof conflictCallback == FUNCTION);
			while (i--) {
				entry = entries[i];
				key = entry[0];
				value = entry[1];

				// Check for a conflict. The default behaviour is to overwrite the value for an existing key
				if ( hasConflictCallback && (thisValue = that.get(key)) ) {
					value = conflictCallback(key, thisValue, value);
				}
				that.put(key, value);
			}
		};

		this.clone = function() {
			var clone = new Hashtable(hashingFunctionParam, equalityFunctionParam);
			clone.putAll(that);
			return clone;
		};
	}

	return Hashtable;
})();

/*global define:true, require:true*/ // require.js
/*jslint indent:2*/
/*jslint browser:true nomen:true*/

(function (window) {
  'use strict';

  var BMP = window.BMP,
    URL = {},
    generateUUID,
    blobs = {}; // in-memory storage

  /**
   * @param {Blob} blob object to store.
   * @param {Object} [options] optional parameters with 'autoRevoke' attribute.
   * @returns {String} Blob URI.
   */
  URL.createObjectURL = function (blob, options) {
    var key = generateUUID(),
      autoRevoke = !!(options && options.autoRevoke) || false;

    blobs[key] = blob;
    // TODO: handle autoRevoke when specification is finalised
    return 'blob:' + key;
  };

  URL.revokeObjectURL = function (uri) {
    var key = uri.replace('blob:', '');
    delete blobs[key];
  };

  /**
   * non-W3C standard, but used for our implementation
   */
  URL.retrieveObject = function (uri) {
    var key = uri.replace('blob:', '');
    return blobs[key];
  };

  /**
   * non-W3C standard, but used for our implementation
   */
  URL.revokeAllObjectURLs = function () {
    blobs = {};
  };

  generateUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      /*jslint bitwise:true*/
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      /*jslint bitwise:false*/
      return v.toString(16);
    });
  };

  window.BMP = window.BMP || {};
  window.BMP.URL = URL;
}(this));

(function (window) {
  'use strict';
  var BMP,
    MIME;

  window.BMP = window.BMP || {};
  BMP = window.BMP;

  BMP.MIME = BMP.MIME || {};
  MIME = BMP.MIME;

  /**
   * @const
   */
  MIME.TEXT_TYPES = [
    'application/javascript',
    'application/json',
    'application/x-javascript'
  ];

  /**
   * @param {String} type e.g. 'image/jpeg'
   * @returns {Boolean}
   */
  MIME.isText = function (type) {
    // TODO: strip type parameters (semi-colon and onwards) ??
    if (type.indexOf('text/') === 0) {
      return true;
    }
    if (MIME.TEXT_TYPES.indexOf(type) !== -1) {
      return true;
    }
    return false;
  };

}(this));

/*jslint indent:2*/
/*jslint browser:true*/
/*jslint nomen:true, plusplus:true*/

(function (window) {
  'use strict';
  var b, isConstructableBlob = true,
    Blob,
    NestedBlob,
    convertArrayBufferToBase64,
    convertStringToArrayBuffer,
    MIME = window.BMP.MIME;

  try {
    b = new window.Blob();
    b = null;
  } catch (err) {
    isConstructableBlob = false;
  }

  // http://stackoverflow.com/questions/9267899
  convertArrayBufferToBase64 = function (buffer) {
    var binary = '',
      bytes = new window.Uint8Array(buffer),
      len = bytes.byteLength,
      i;

    for (i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  /**
   * @constructor
   * @param {Array} [data] contains 1 {String}
   * @param {Object} [options] properties Object with "type" attribute
   */
  Blob = function (data, options) {
    var datum;

    if (data && !Array.isArray(data)) {
      throw new Error('first argument should be an Array');
    }

    options = options || {};

    this.size = 0;
    this.type = '';
    this.base64 = '';
    this.text = '';

    if (typeof options === 'object') {
      this.type = options.type || this.type;
    }

    if (data && data.length) {
      datum = data[0];
      if (typeof datum === 'string') {
        if (datum.indexOf('data:') === 0 && this.type === 'text/plain') {
          this.size += datum.length;
          this.text += datum;
        } else {
          this.size += datum.length;
          this.base64 += datum;
        }
      }
    }

    return this;
  };

  /**
   * cross-browser constructor for Blob
   * @param {Array} data Array of {ArrayBuffer|ArrayBufferView|Blob|String}.
   * @param {Object} [options] optional Object with "type" attribute
   */
  Blob.createNative = function (data, options) {
    var builder;
    options = options || {};
    if (isConstructableBlob) {
      return new window.Blob(data, options);
    }
    if (window.BlobBuilder) {
      builder = new window.BlobBuilder();
      builder.append(data);
      return builder.getBlob(options);
    }
    return new Blob(data, options);
  };

  /**
   * @param {String} url
   * @param {Function} onSuccess function({BMP.Blob} blob)
   * @param {Function} onError function({Error} error)
   */
  Blob.fromBlobURL = function (url, onSuccess, onError) {
    var xhr,
      blob;

    onSuccess = onSuccess || function () {};
    onError = onError || function () {};

    if (!window.URL || !window.URL.createObjectURL) {
      this.fromNativeBlob(window.BMP.URL.retrieveObject(url), function (blob) {
        onSuccess(blob);
      }, function (err) {
        onError(err);
      });

    } else { // native URL.createObjectURL, therefore use XMLHTTPRequest
      Blob.nativelyFromBlobURL(url, onSuccess, onError);
    }
  };

  /**
   * @param {Blob} blob
   * @param {Function} onSuccess function({BMP.Blob} blob)
   * @param {Function} onError function({Error} error)
   */
  Blob.fromNativeBlob = function (blob, onSuccess, onError) {
    var fr = new window.FileReader();

    onSuccess = onSuccess || function () {};
    onError = onError || function () {};

    fr.onload = function (event) {
      var result;
      fr.onload = null;
      try {
        result = event.target.result;
        blob = Blob.fromDataURI(event.target.result);
        if (!blob) {
          throw new Error('Blob.fromNativeBlob: fromDataURI gave no blob');
        }
      } catch (err) {
        onError(err);
        return;
      }
      onSuccess(blob);
    };
    fr.onerror = function (event) {
      fr.onerror = null;
      onError(event.target.error);
    };
    try {
      fr.readAsDataURL(blob);
    } catch (err) {
      fr.onload = null;
      fr.onerror = null;
      onError(err);
    }
  };

  /**
   * @param {String} dataURI
   * @returns {BMP.Blob} not native Blob!
   */
  Blob.fromDataURI = function (dataURI) {
    var parts,
      type,
      encoding,
      data,
      blob = new Blob();

    parts = dataURI.split(','); // 0 => header, 1 => data
    data = parts[1];
    parts = parts[0].split(':'); // 0 => 'data', 1 => type;encoding
    parts = parts[1].split(';'); // 0 => type, 1 => encoding
    type = parts[0];
    encoding = parts[1];

    if (encoding === 'base64') {
      blob.base64 = data;
    } else {
      blob.text = data;
    }
    blob.type = type;
    blob.size = data.length;

    try {
      blob = Blob.fromDataURI(window.atob(blob.base64));
      blob.makeNested();
    } catch (err) {
      // do nothing, let original blob be returned
    }

    return blob;
  };

  /**
   * @param {String} url
   * @param {Function} onSuccess function({BMP.Blob} blob)
   * @param {Function} onError function({Error} error)
   */
  Blob.nativelyFromBlobURL = function (url, onSuccess, onError) {
    var xhr,
      blob;

    onSuccess = onSuccess || function () {};
    onError = onError || function () {};

    xhr = new window.XMLHttpRequest();
    xhr.onreadystatechange = function () {
      var mime,
        base64,
        serializer;

      if (this.readyState === window.XMLHttpRequest.DONE) {
        this.onreadystatechange = null;
        mime = this.getResponseHeader('Content-Type');
        if (this.status === 200) {
          if (this.responseType === 'arraybuffer') {
            base64 = convertArrayBufferToBase64(this.response);
            blob = new Blob([base64], { type: mime });

          } else if (this.responseType === 'blob') {
            Blob.fromNativeBlob(this.response, function (blob) {
              onSuccess(blob);
            }, function (err) {
              onError(err);
            });

          } else if (this.responseType === 'document') {
            serializer = new window.XMLSerializer();
            base64 = window.btoa(serializer.serializeToString(this.response));
            blob = new Blob([base64], { type: mime });

          } else if (this.responseType === 'json') {
            base64 = window.btoa(JSON.stringify(this.response));
            blob = new Blob([base64], { type: mime });

          } else { // this.responseType === 'text'
            blob = new Blob([this.response], { type: mime });
          }
          if (blob) {
            onSuccess(blob);
          } else {
            onError(new Error('error retrieving target Blob via Blob URL'));
          }

        } else { // status === 500
          onError(new Error(this.url + ' -> ' + this.status));
        }
      }
    };
    xhr.open('GET', url);
    xhr.send();
  };

  /**
   * @param {BMP.Blob} blob
   */
  Blob.isNested = function () {

  };

  /**
   * @returns {Blob} a Base64-encoded BMP.Blob within a Blob
   */
  Blob.prototype.makeNested = function () {
    var dataURI = 'data:';
    dataURI += this.type;
    dataURI += ';base64,';
    dataURI += this.base64;
    this.type = 'text/plain';
    this.text = dataURI;
    this.base64 = null;
  };

  Blob.prototype.undoNested = function () {
    var blob = Blob.fromDataURI(this.text);
    this.type = blob.type;
    this.base64 = blob.base64;
    this.text = null;
  };

  Blob.prototype.toNative = function () {
    return window.BMP.Blob.createNative([window.atob(this.base64)], {
      type: this.type
    });
  };

  window.BMP = window.BMP || {};
  window.BMP.Blob = Blob;
  window.BMP.NestedBlob = NestedBlob;
}(this));


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

//* convenient additions to the String prototype*/
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

  // from http://api.jquery.com/jQuery.getScript/
  $.getCachedScript = function(url, options) {
    options = $.extend(options || {}, {
      dataType: "script",
      cache: true,
      url: url
    });
    return $.ajax(options);
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

  /**
   * use a hidden <iframe> to load a page,
   * deleting the iframe when the page's <body> gains the "s-ready" class
   * @param {String} src URL for the HTML content to be loaded.
   */
  _Blink.preloadPage = function(src) {
    var $iframe = $('<iframe></iframe>'),
        checkCountdown = 30,
        iframeWindow,
        onReadyFn = function() {
          $iframe.remove();
        },
        testReadyFn = function() {
          checkCountdown--;
          if ($(iframeWindow.document.body).hasClass('s-ready')) {
            onReadyFn();
          } else if (checkCountdown < 0) {
            warn('preloadPage(): timed out waiting for "s-ready"');
            onReadyFn();
          } else {
            setTimeout(testReadyFn, 2000);
          }
        };

    $iframe.attr({
      height: 10,
      width: 10,
      'src': src
    });
    $iframe.css({
      position: 'absolute',
      top: '-50px',
      left: '-50px'
    });
    $('body').append($iframe);
    iframeWindow = $iframe[0].contentWindow;
    if ($.isWindow(iframeWindow) && iframeWindow.document) {
      if ($(iframeWindow.document.body).hasClass('s-ready')) {
        onReadyFn();
      } else {
        setTimeout(testReadyFn, 2000);
      }
    } else {
      warn('preloadPage(): unable to find Window or Document in <iframe>');
    }
  };

  /**
   * Convert a DOM HTML or XML Node into an XML String.
   * @param {Node} node XML or HTML Node to convert.
   * @return {String} XML String.
   */
  _Blink.stringifyDOM = function(node) {
    var xmlSerializer;
    if (node.xml) {
      return node.xml;
    }
    if (window.XMLSerializer) {
      xmlSerializer = new window.XMLSerializer();
      return xmlSerializer.serializeToString(node);
    }
    return null;
  };

  /**
   * @param {String} char Single character to be tested.
   */
  _Blink.hasFontFor = function(char) {
    var me = _Blink.hasFontFor,
        result,
        $body,
        $target,
        $test;
    try {
      if (!me.results) {
        me.results = {};
      }
      if (typeof me.results[char] === 'boolean') {
        result = me.results[char];
      } else {
        $body = $(window.document.body);
        $target = $('<span>' + char + '</span>');
        $test = $('<span>&#xFFFD;</span>');
        $target.add($test).appendTo($body);
        result = $target.innerWidth() !== $test.innerWidth();
        me.results[char] = result;
        $target.add($test).remove();
      }
    } catch (err) {
      error(error);
      result = false;
    }
    return result;
  };

  // export singleton to global namespace
  window._Blink.cdnp = new PlatformCDN();

}(this));


/* 
 * basic class for queuing execution
 * requires utilities.js
 */

/*jslint white:true*/

(function(window) {
	'use strict';
	var $ = window.jQuery,
	BlinkDispatch = function(interval) {
		var timeout = null,
		self = this; // to facilitate self-references
		/* END: var */
		this.queue = [];
		this.interval = interval || 0;
		this.isPaused = false;
		
		/**
		 * check to see if we have items in the queue, and process the first one
		 */
		function processQueue() {
			if (self.isPaused || timeout !== null || self.queue.length === 0) {return;}
			var item = self.queue.shift(),
			result;
			/* END: var */
			if (typeof item === 'function') {
				result = item();
			}
			// check to see if we have queued a jQuery Deferred Promise
			if (typeof $ === 'function' && $() instanceof $
					&& result && typeof result === 'object'
					&& result.promise && typeof result.promise === 'function') {
				timeout = 0; // placeholder value
				$.when(result)
				.always(function() {
					timeout = setTimeout(function() {
						timeout = null;
						processQueue();
					}, self.interval);
				});
			} else { // not a Promise
				timeout = setTimeout(function() {
					timeout = null;
					processQueue();
				}, self.interval);
			}
		}
		/**
		 * public function to trigger processing of the queue
		 */
		this.poke = function() {
			processQueue();
		}
		this.pause = function() {
			clearTimeout(timeout);
			timeout = null;
			this.isPaused = true;
		};
		this.resume = function() {
			this.isPaused = false;
			processQueue();
		};
		return this;
	};
	/* END: var */
	BlinkDispatch.prototype.add = function(item) {
		this.queue.push(item);
		this.poke();
	};
	
	window.BlinkDispatch = BlinkDispatch;
}(this));

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
          dfrd.resolve.apply(dfrd, $.makeArray(arguments));
          array.shift(); // clear 'inprogress'
          next();
        }, function() {
          dfrd.reject.apply(dfrd, $.makeArray(arguments));
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
// UMD pattern from https://github.com/umdjs/umd/blob/master/amdWebGlobal.js

/*global define:true*/
/*jslint nomen:true*/ // for Underscore.JS

(function(root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['underscore'], function(_) {
      // Also create a global in case some scripts
      // that are loaded still are looking for
      // a global even when an AMD loader is in use.
      root.BMP = factory(root, _);
      return (root.BMP);
    });
  } else {
    // Browser globals
    root.BMP = factory(root, root._);
  }
}(this, function(global, _) {
  'use strict';

  var BMP,
      BIC,
      Config;

  BMP = global.BMP = global.BMP || {};
  BIC = BMP.BIC = BMP.BIC || {};

  /**
   * convenience prototype to collect configuration-specific functionality
   * @constructor
   * @param {Object} cfg plain object { setting: 'value', ... }.
   */
  Config = function(cfg) {
    this.cfg = cfg;
  };

  /**
   * @return {Object} plain object usable as Cordova CameraOptions.
   */
  Config.prototype.toCameraOptions = function() {
    var options = {},
        cameraOpts;

    if (_.isNumber(this.cfg.imageCaptureQuality)) {
      options.quality = this.cfg.imageCaptureQuality;
    }
    if (_.isNumber(this.cfg.imageCaptureScale)) {
      options.imageScale = this.cfg.imageCaptureScale;
    }
    if (_.isString(this.cfg.cameraOptions)) {
      try {
        cameraOpts = JSON.parse(this.cfg.cameraOptions);
        if (!_.isObject(cameraOpts) || _.isArray(cameraOpts)) {
          cameraOpts = {};
        }
      } finally {
        cameraOpts = cameraOpts || {};
      }
      _.extend(options, cameraOpts);
    }
    return options;
  };

  BIC.Config = Config;
  return BMP;
}));
/*
 * custom library to abstract access to available local storage mechanisms
 * requires: jQuery 1.5+, utilities.js (optional)
 *
 * valid storage types are: localstorage, sessionstorage, websqldatabase, indexeddb
 *
 * This has been designed with seemless operation of asynchronous storage methods,
 * via the jQuery Deferred Promises mechanism in jQuery 1.5.
 *
 * The SQL-specific terms "database" and "table" have been replaced with
 * the more neutral "partition" and "section", respectively.
 */

/*jslint plusplus:true, white:true*/

(function(window) {
  'use strict';
  var available,
  $ = window.jQuery,
  BMP = window.BMP,
  alert = BMP.alert,
  // for websqldatabase
  estimatedSize,
  webSqlDbs = {}, // store open handles to databases (websqldatabase)
  errorHandler,
  openSection,
  openWebSQL,
   // logging functions
  logger = {},
  log, error, warn, info,
  /**
   * @inner
   * @construct
   */
  BlinkStorage = function(type, partition, section) {
    var self = this,
      readyDeferred = new $.Deferred(),
      sql, // for webslqdatabase and blinkgapsql
      db, // for websqldatabase, localstorage or sessionstorage
      memory; // for memory
    if (typeof partition !== 'string' || partition.length < 1) {
      partition = 'default';
    }
    if (typeof section !== 'string' || section.length < 1) {
      section = 'main';
    }

    if (typeof type !== 'string') {
      type = available[0];
    } else if (type === 'sessionstorage' && $.inArray('sessionstorage', available) === -1) {
      type = 'memory';
    } else if ($.inArray(type, available) === -1) {
      type = available[0];
    }

    self.type = type;
    self.partition = partition;
    self.section = section;

    readyDeferred.done(function() {
      log('BlinkStorage(): ' + type + ' -> ' + partition + ' : ' + section + ' ready');
    });
    self.ready = function() {
      return readyDeferred.promise();
    };

    if (type === 'localstorage' || type === 'sessionstorage') {

      db = (type === 'localstorage') ? window.localStorage : window.sessionStorage;

      self.get = function(key) {
        var dfrd = new $.Deferred();
        dfrd.resolve(db.getItem(partition + ':' + section + ':' + key));
        // dfrd.reject(); not sure if this is needed
        return dfrd.promise();
      };

      self.set = function(key, value) {
        var dfrd = new $.Deferred();
        db.setItem(partition + ':' + section + ':' + key, value);
        dfrd.resolve();
        return dfrd.promise();
      };

      self.remove = function(key) {
        var dfrd = new $.Deferred();
        db.removeItem(partition + ':' + section + ':' + key);
        dfrd.resolve();
        return dfrd.promise();
      };

      self.keys = function() {
        var dfrd = new $.Deferred(),
        found = [],
        length = db.length,
        index, parts,
        current,
        prefix = partition + ':' + section + ':';
        /* END: var */
        for (index = 0; index < length; index++) {
          current = db.key(index);
          if (current.indexOf(prefix) === 0) {
            found.push(current.replace(prefix, ''));
          }
        }
        dfrd.resolve(found);
        return dfrd.promise();
      };

      self.count = function() {
        var dfrd = new $.Deferred();
        $.when(self.keys()).done(function(keys) {
          dfrd.resolve(keys.length);
        });
        return dfrd.promise();
      };

      readyDeferred.resolve();

    } else if (type === 'websqldatabase') {

      estimatedSize = (window.device ? 5 : 0.75) * 1024 * 1024;
      /* @inner */
      errorHandler = function(arg1, arg2) {
        var sqlError = arg2 && arg1.executeSql ? arg2 : arg1;
        error('BlinkStorage error1: ' + sqlError.code + ' ' + sqlError.message);
        if (sqlError.code === 3 || sqlError.code === 4 || sqlError.code === 7) {
          BMP.alert(sqlError.code + '\n' + sqlError.message, { title: 'Storage error!' });
        }
        return false;
      };
      /* @inner */
      openSection = function() {
        db.transaction(function(tx) {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS `' + section + '` (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)',
            [],
            readyDeferred.resolve,
            readyDeferred.reject
          );
        }, errorHandler, $.noop);
      };
      /* @inner */
      openWebSQL = function() {
        try {
          db = window.openDatabase(partition, '1.0', partition, estimatedSize);
          webSqlDbs[partition] = db;
          // fix for Android and others with incomplete WebSQL implementation
          db.readTransaction = db.readTransaction || db.transaction;
        } catch (error) {
          readyDeferred.reject();
          throw 'BlinkStorage: ' + error;
        }
      };

      // cache SQL so each string only occupies memory once per DB
      sql = {
        get: 'SELECT v FROM `' + section + '` WHERE k = ?',
        set: 'INSERT OR REPLACE INTO `' + section + '` (k, v) VALUES (?, ?)',
        remove: 'DELETE FROM `' + section + '` WHERE k = ?',
        keys: 'SELECT k FROM `' + section + '`',
        count: 'SELECT count(k) AS `count` FROM ' + section
      };

      if (webSqlDbs[partition]) {
        db = webSqlDbs[partition];
      } else {
        openWebSQL();
      }
      openSection();

      self.get = function(key) {
        var dfrd = new $.Deferred();
        db.readTransaction(function(tx) {
          tx.executeSql(sql.get, [key],
            function(tx, result) { // SQL success handler
              if (result.rows.length === 1) {
                dfrd.resolve(result.rows.item(0).v);
              } else {
                dfrd.resolve(null);
                if (result.rows.length > 1) {
                  error('BlinkStorage: SELECT returned multiple rows');
                }
              }
            },
            errorHandler // SQL error handler
          );
        }, errorHandler, $.noop); // transaction handlers
        return dfrd.promise();
      };

      self.set = function(key, value, attempts) {
        var deferred = new $.Deferred(),
        dfrdSQL = new $.Deferred(),
        retryFn = function() {
          setTimeout(function() { // retry after 2 seconds
            $.when(self.set(key, value, attempts))
            .fail(deferred.reject)
            .then(deferred.resolve);
          }, 2 * 1000);
        };
        /* END: var */
        attempts = typeof attempts !== 'number' ? 2 : attempts;
        if (attempts-- <= 0) {
          deferred.reject();
          return deferred.promise();
        }
        // perform transaction
        setTimeout(function() {
          db.transaction(function(tx) {
            // execute INSERT OR REPLACE statement
            tx.executeSql(sql.set, [key, value],
              function(tx, result) { // SQL success handler
                if (result.rowsAffected !== 1) {
                  error('BlinkStorage: INSERT did not affect 1 row');
                  retryFn();
                } else {
                  dfrdSQL.resolve();
                }
              },
              function(tx, sqlError) { // SQL error handler
                errorHandler(sqlError);
                retryFn();
              }
            );
          },
          function(tx, sqlError) { // transaction error handler
            errorHandler(tx, sqlError);
            retryFn();
          },
          function() { // transaction success handler
            if (dfrdSQL.state() === 'pending') {
              // if TX finishes before SQL then we have a problem
              retryFn();
            } else {
              deferred.resolve();
            }
          });
        }, 0);
        return deferred.promise();
      };

      self.remove = function(key) {
        var dfrd = new $.Deferred();
        db.transaction(function(tx) {
          tx.executeSql(sql.remove, [key], function(tx, result) {
            dfrd.resolve();
          });
        }, errorHandler, $.noop);
        return dfrd.promise();
      };

      self.keys = function() {
        var dfrd = new $.Deferred();
        db.readTransaction(function(tx) {
          tx.executeSql(sql.keys, [], function(tx, result) {
            var index, row,
              length = result.rows.length,
              found = [];
            for (index = 0; index < length; index++) {
              row = result.rows.item(index);
              found.push(row.k);
            }
            dfrd.resolve(found);
          });
        }, errorHandler, $.noop);
        return dfrd.promise();
      };

      self.count = function() {
        var dfrd = new $.Deferred();
        db.readTransaction(function(tx) {
          tx.executeSql(sql.count, [], function(tx, result) {
              var count = result.rows.item(0).count;
              if ($.isNumeric(count)) {
                dfrd.resolve(parseInt(count, 10));
              } else {
                error('BlinkStorage: SELECT count(k) non-numeric');
                dfrd.reject();
              }
            }
          );
        }, errorHandler, $.noop);
        return dfrd.promise();
      };

    } else if (type === 'memory') {

      memory = {};

      self.get = function(key) {
        var dfrd = new $.Deferred();
        dfrd.resolve(memory[partition + ':' + section + ':' + key]);
        // dfrd.reject(); not sure if this is needed
        return dfrd.promise();
      };

      self.set = function(key, value) {
        var dfrd = new $.Deferred();
        memory[partition + ':' + section + ':' + key] = value;
        dfrd.resolve();
        return dfrd.promise();
      };

      self.remove = function(key) {
        var dfrd = new $.Deferred();
        delete memory[partition + ':' + section + ':' + key];
        dfrd.resolve();
        return dfrd.promise();
      };

      self.keys = function() {
        var dfrd = new $.Deferred(),
        found = [],
        prefix = partition + ':' + section + ':',
        key;
        /* END: var */
        for (key in memory) {
          if (memory.hasOwnProperty(key)) {
            if (key.indexOf(prefix) === 0) {
              found.push(key.replace(prefix, ''));
            }
          }
        }
        dfrd.resolve(found);
        return dfrd.promise();
      };

      self.count = function() {
        var dfrd = new $.Deferred();
        $.when(self.keys()).done(function(keys) {
          dfrd.resolve(keys.length);
        });
        return dfrd.promise();
      };

      readyDeferred.resolve();
    }
    return this;
  };
  /* END: var */

  if (!$) {
    BMP.alert('jQuery must be be loaded first', { title: 'Storage error!' });
    return;
  }

  // setup loggers
  $.each(['log', 'error', 'warn', 'info'], function(index, fn) {
    logger[fn] = function() {
      if (window[fn]) {
        window[fn].apply(window, arguments);
      }
    };
  });
  log = logger.log;
  error = logger.error;
  warn = logger.warn;
  info = logger.info;

  BlinkStorage.prototype.removeKeysRegExp = function(regexp) {
    var store = this,
      deferred = new $.Deferred(function(dfrd) {
      $.when(store.keys()).done(function(keys) {
        var k, kLength = keys.length,
          removeDefers = [];
        for (k = 0; k < kLength; k++) {
          if (keys[k].search(regexp) !== -1) {
            removeDefers.push(store.remove(keys[k]));
          }
        }
        $.when(removeDefers).done(dfrd.resolve());
      });
    });
    return deferred.promise();
  };

  // perform engine detection
  BlinkStorage.prototype.available = [];
  available = BlinkStorage.prototype.available;
  // TODO: add detection for indexedDB
  if (typeof window.openDatabase !== 'undefined') {
    available.push('websqldatabase');
  }
  if (typeof window.localStorage !== 'undefined') {
    available.push('localstorage');
  }
  if (typeof window.sessionStorage !== 'undefined') {
    available.push('sessionstorage');
  }
  available.push('memory');
  if (typeof window.log === 'function') {
    info('BlinkStorage(): available=[' + available.join(',') + ']');
  }

  window.BlinkStorage = BlinkStorage;
}(this));
