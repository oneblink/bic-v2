if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, fromIndex) {
        if (fromIndex == null) {
            fromIndex = 0;
        } else if (fromIndex < 0) {
            fromIndex = Math.max(0, this.length + fromIndex);
        }
        for (var i = fromIndex, j = this.length; i < j; i++) {
            if (this[i] === obj)
                return i;
        }
        return -1;
    };
}

// JSON2.js minified
if(!this.JSON){this.JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==="string"){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());

/*
 * Math.uuid.js, minimalistic uuid generator.
 * Original script from Robert Kieffer, http://www.broofa.com 
 * 
 * Dual licensed under the MIT and GPL licenses.
 * 
 * example: 
 * >>> Math.uuid(); // returns RFC4122, version 4 ID 
 * "92329D39-6F5C-4520-ABFC-AAB64544E172"
 */
if (typeof Math.uuid !== 'function') {
	Math.uuid = function() {
		var chars = Math.uuid.CHARS, uuid = [],
			r, i = 36;
 
		// rfc4122 requires these characters
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		uuid[14] = '4';
 
		// Fill in random data.  At i==19 set the high bits of clock sequence as
		// per rfc4122, sec. 4.1.5
		while (i--) {
			if (!uuid[i]) {
				r = Math.random()*16|0;
				uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
			}
		}
		return uuid.join('');
	}
	Math.uuid.CHARS = '0123456789ABCDEFG'.split('');
}

/**
 * minified source/jshashtable-2.1.js
 *
 * Author: Tim Down <tim@timdown.co.uk>
 * Version: 2.1
 * Build date: 21 March 2010
 * Website: http://www.timdown.co.uk/jshashtable
 */
var Hashtable=function(){function r(a){if(typeof a=="string")return a;else if(typeof a.hashCode==j){a=a.hashCode();return typeof a=="string"?a:r(a)}else if(typeof a.toString==j)return a.toString();else try{return String(a)}catch(c){return Object.prototype.toString.call(a)}}function C(a,c){return a.equals(c)}function D(a,c){return typeof c.equals==j?c.equals(a):a===c}function s(a){return function(c){if(c===null)throw Error("null is not a valid "+a);else if(typeof c=="undefined")throw Error(a+" must not be undefined");
}}function o(a,c,f,d){this[0]=a;this.entries=[];this.addEntry(c,f);if(d!==null)this.getEqualityFunction=function(){return d}}function p(a){return function(c){for(var f=this.entries.length,d,i=this.getEqualityFunction(c);f--;){d=this.entries[f];if(i(c,d[0]))switch(a){case t:return true;case u:return d;case v:return[f,d[1]]}}return false}}function w(a){return function(c){for(var f=c.length,d=0,i=this.entries.length;d<i;++d)c[f+d]=this.entries[d][a]}}function l(a,c){var f=a[c];return f&&f instanceof
o?f:null}function x(a,c){var f=this,d=[],i={},m=typeof a==j?a:r,E=typeof c==j?c:null;this.put=function(b,e){n(b);y(e);var h=m(b),g,k=null;if(g=l(i,h))if(h=g.getEntryForKey(b)){k=h[1];h[1]=e}else g.addEntry(b,e);else{g=new o(h,b,e,E);d[d.length]=g;i[h]=g}return k};this.get=function(b){n(b);var e=m(b);if(e=l(i,e))if(b=e.getEntryForKey(b))return b[1];return null};this.containsKey=function(b){n(b);var e=m(b);return(e=l(i,e))?e.containsKey(b):false};this.containsValue=function(b){y(b);for(var e=d.length;e--;)if(d[e].containsValue(b))return true;
return false};this.clear=function(){d.length=0;i={}};this.isEmpty=function(){return!d.length};var q=function(b){return function(){for(var e=[],h=d.length;h--;)d[h][b](e);return e}};this.keys=q("keys");this.values=q("values");this.entries=q("getEntries");this.remove=function(b){n(b);var e=m(b),h=null,g=l(i,e);if(g){h=g.removeEntryForKey(b);if(h!==null)if(!g.entries.length){a:{for(b=d.length;b--;){g=d[b];if(e===g[0]){b=b;break a}}b=null}z(d,b);delete i[e]}}return h};this.size=function(){for(var b=0,
e=d.length;e--;)b+=d[e].entries.length;return b};this.each=function(b){for(var e=f.entries(),h=e.length,g;h--;){g=e[h];b(g[0],g[1])}};this.putAll=function(b,e){for(var h=b.entries(),g,k,A,B=h.length,F=typeof e==j;B--;){g=h[B];k=g[0];g=g[1];if(F&&(A=f.get(k)))g=e(k,A,g);f.put(k,g)}};this.clone=function(){var b=new x(a,c);b.putAll(f);return b}}var j="function",z=typeof Array.prototype.splice==j?function(a,c){a.splice(c,1)}:function(a,c){var f,d,i;if(c===a.length-1)a.length=c;else{f=a.slice(c+1);a.length=
c;d=0;for(i=f.length;d<i;++d)a[c+d]=f[d]}},n=s("key"),y=s("value"),t=0,u=1,v=2;o.prototype={getEqualityFunction:function(a){return typeof a.equals==j?C:D},getEntryForKey:p(u),getEntryAndIndexForKey:p(v),removeEntryForKey:function(a){if(a=this.getEntryAndIndexForKey(a)){z(this.entries,a[0]);return a[1]}return null},addEntry:function(a,c){this.entries[this.entries.length]=[a,c]},keys:w(0),values:w(1),getEntries:function(a){for(var c=a.length,f=0,d=this.entries.length;f<d;++f)a[c+f]=this.entries[f].slice(0)},
containsKey:p(t),containsValue:function(a){for(var c=this.entries.length;c--;)if(a===this.entries[c][1])return true;return false}};return x}();
