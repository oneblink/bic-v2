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