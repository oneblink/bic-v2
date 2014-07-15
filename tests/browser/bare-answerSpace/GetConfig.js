/*jslint indent:2, maxlen:80*/

/*global localStorage, openDatabase*/ // Web APIs

(function (window, $) {
  'use strict';
  var siteVars, db;

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

  // wipe storage
  if (window.localStorage) {
    window.localStorage.clear();
  }
  if (window.openDatabase) {
    db = window.openDatabase('test', "1.0", 'test', 0);
    db.transaction(function (tx) {
      ['jstore', 'site', 'pending', 'pendingV1'].forEach(function (table) {
        tx.executeSql('DROP TABLE IF EXISTS ' + table);
      });
    });
  }

  $.holdReady(false);

}(this, this.jQuery));
