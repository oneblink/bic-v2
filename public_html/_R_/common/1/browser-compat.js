if (typeof(console) == 'undefined')
{
	if (typeof(debug) != 'undefined' && typeof(debug.log) != 'undefined')
		console = debug;
	else
	{
		console = { };
		console.log = function(string) { };
	}
}

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

// from phpjs.org/functions/urldecode:572 MIT + GPLv2 licenced
function urldecode(f){return decodeURIComponent(f.replace(/\+/g,"%20"))}
// from phpjs.org/functions/parse_str:484 MIT + GPLv2 licenced
function parse_str(f,g){var h=String(f).replace(/^&(.*)$/,"$1").replace(/^(.*)&$/,"$1").split("&"),e,b,a,i,c,d,k=this,j=function(l){return k.urldecode(l).replace(/([\\"'])/g,"\\$1").replace(/\n/g,"\\n").replace(/\r/g,"\\r")};if(!g)g=this.window;for(e=0;e<h.length;e++){b=h[e].split("=");if(b.length<2)b=[b,""];a=j(b[0]);for(i=j(b[1]);a.charAt(0)===" ";)a=a.substr(1);if(a.indexOf("\u0000")!==-1)a=a.substr(0,a.indexOf("\u0000"));if(a&&a.charAt(0)!=="["){d=[];for(b=c=0;b<a.length;b++)if(a.charAt(b)===
"["&&!c)c=b+1;else if(a.charAt(b)==="]")if(c){d.length||d.push(a.substr(0,c-1));d.push(a.substr(c,b-c));c=0;if(a.charAt(b+1)!=="[")break}d.length||(d=[a]);for(b=0;b<d[0].length;b++){a=d[0].charAt(b);if(a===" "||a==="."||a==="[")d[0]=d[0].substr(0,b)+"_"+d[0].substr(b+1);if(a==="[")break}c="array";for(b=0;b<d.length;b++){a=d[b];a=a!==""&&a!==" "||b===0?"'"+a+"'":eval(c+".push([]);")-1;c+="["+a+"]";b!==d.length-1&&eval("typeof "+c)==="undefined"&&eval(c+" = [];")}c+=" = '"+i+"';\n";eval(c)}}};

function emptyDOMelement(element) { while (element.firstChild) element.removeChild(element.firstChild); }
