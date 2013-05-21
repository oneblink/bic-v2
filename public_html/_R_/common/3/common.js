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
