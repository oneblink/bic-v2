/*jslint indent:2, maxlen:80*/
(function (window, $) {
  'use strict';
  var siteVars;

  siteVars = window.siteVars;

  $.holdReady(true);

  siteVars.map = {
    "categories": [],
    "interactions": [1, 2, 3],
    "forms": ["form1"],
    "masterCategories": {}
  };

  siteVars.config = {
    "a1": {
      "pertinent": {
        "name": "test",
        "siteStructure": "interactions only"
      }
    },
    "i1": {
      "pertinent": {
        "order": 1,
        "name": "one",
        "type": "message",
        "message": "<h1>one!</h1>"
      }
    },
    "i2": {
      "pertinent": {
        "order": 2,
        "name": "two",
        "type": "message",
        "message": "<h1>two!</h1>"
      }
    },
    "i3": {
      "pertinent": {
        "order": 10,
        "name": "form1_add",
        "type": "form",
        "blinkFormObjectName": "form1",
        "blinkFormAction": "add"
      }
    },
    "deviceFeatures": [],
    "map": {
      "categories": [],
      "interactions": [1, 2, 3],
      "forms": ["form1"],
      "masterCategories": {}
    }
  };

  $.holdReady(false);

}(this, this.jQuery));


