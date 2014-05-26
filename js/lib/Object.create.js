/*jslint browser:true, indent:2*/
/*jslint es5:true, nomen:true*/ // __proto__

// https://github.com/es-shims/es5-shim/blob/ad5e68434ea9b08279aec78ab6661c100cb9b04f/es5-sham.js#L160

// ES5 15.2.3.5
// http://es5.github.com/#x15.2.3.5
if (!Object.create) {

  Object.create = function create(prototype, properties) {
    'use strict';
    var object;
    function Type() { return this; }  // An empty constructor.

    if (prototype === null) {
      // BLINK: prevent sham-usage (arguments[0] === null)
      throw new TypeError("Object.create(null) is a sham in this implementation");
    } else {
      if (typeof prototype !== "object" && typeof prototype !== "function") {
        // In the native implementation `parent` can be `null`
        // OR *any* `instanceof Object`  (Object|Function|Array|RegExp|etc)
        // Use `typeof` tho, b/c in old IE, DOM elements are not `instanceof Object`
        // like they are in modern browsers. Using `Object.create` on DOM elements
        // is...err...probably inappropriate, but the native version allows for it.
        throw new TypeError("Object prototype may only be an Object or null"); // same msg as Chrome
      }
      Type.prototype = prototype;
      object = new Type();
      // BLINK: don't bother setting object.__proto__ (fixes shim-compatibility with IE8)
      // BLINK: we just need to make sure that object.prototype.constructor is appropriate where necessary
    }

    // BLINK: assume that undefined is undefined
    if (properties !== undefined) {
      // BLINK: prevent sham-usage (arguments[1] !== null)
      throw new TypeError("Object.create(prototype, properties) is a sham in this implementation");
    }

    return object;
  };
}

