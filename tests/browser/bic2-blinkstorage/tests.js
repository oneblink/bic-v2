/*jslint browser:true, indent:2*/
/*global suite, test, suiteSetup, suiteTeardown, setup, teardown*/ // Mocha
/*global assert, chai*/ // Chai.JS

suite('MyAnswers.determineBlinkStorageEngine()', function () {
  'use strict';

  var assert, userAgents;
  userAgents = [
    {
      string: null,
      expected: null
    },
    {
      string: '',
      expected: null
    },
    {
      string: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36',
      expected: null
    },
    {
      string: 'Mozilla/5.0 (Linux; Android 4.2.2; nl-nl; SAMSUNG GT-I9505 Build/JDQ39) AppleWebKit/535.19 (KHTML, like Gecko) Version/1.0 Chrome/18.0.1025.308 Mobile Safari/535.19',
      expected: null
    },
    {
      string: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:30.0) Gecko/20100101 Firefox/30.0',
      expected: null
    },
    {
      string: 'Mozilla/5.0 (Linux; U; Android 4.2.2; nl-nl; GT-I9505 Build/JDQ39) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
      expected: 'sessionstorage'
    },
    {
      string: 'Mozilla/5.0 (Android; Linux armv7l; rv:9.0) Gecko/20111216 Firefox/9.0 Fennec/9.0',
      expected: 'sessionstorage'
    },
    {
      string: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)',
      expected: null
    },
    {
      string: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.77.4 (KHTML, like Gecko) Version/7.0.5 Safari/537.77.4',
      expected: null
    }
  ];

  suiteSetup(function () {
    assert = window.chai.assert;
  });

  userAgents.forEach(function (userAgent) {
    test(userAgent.string, function () {
      var result;
      result = window.MyAnswers.determineBlinkStorageEngine(userAgent.string);
      assert.equal(result, userAgent.expected);
    });
  });


});
