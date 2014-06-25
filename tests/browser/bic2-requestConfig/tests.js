/*jslint indent:2, browser:true*/
/*global suite:true, test:true, suiteSetup:true, suiteTeardown:true, setup:true,
 teardown:true, chai:true, assert:true, sinon:true*/ // Mocha + Chai + Sinon
/*global requestConfig*/ //exposed by bic2
/*jslint nomen:true*/ // Underscore.JS

suite('testing username in QSA to get config', function () {
  'use strict';
  var server;

  suiteSetup(function () {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondWith('/_R_/xhr/GetConfig.php?_asn=test', [200, { "Content-Type": "application/json" }, '{"a1": {"title": "Ember","comment": "great", "pertinent": {"siteStructure":"MasterCategory"}}}']);
    server.respondWith('/_R_/xhr/GetConfig.php?_asn=test&_username=geeta', [200, { "Content-Type": "application/json" }, '{"a1": {"title": "Hamster","comment": "faily done", "pertinent": {"siteStructure":"Category"}}}']);
  });

  test('requestConfig with isLoggedIn=false', function (done) {
    var res = requestConfig();
    res.done(function () {
      window.MyAnswers.siteStore.get('config').then(function (data) {
        assert.equal(data, '{"a1":{"title":"Ember","comment":"great","pertinent":{"siteStructure":"MasterCategory"}}}', 'result data mismatch');
        done();
      });
    }).fail(function () {
      assert(false, 'called fail!');
      done();
    });
  });

  test('requestConfig with isLoggedIn=true', function (done) {
    var res,
      MyAnswers = window.MyAnswers || {};
    MyAnswers.isLoggedIn = true;
    MyAnswers.loginAccount = {username: 'geeta'};
    res = requestConfig();
    res.done(function () {
      window.MyAnswers.siteStore.get('config').then(function (data) {
        assert.equal(data, '{"a1":{"title":"Hamster","comment":"faily done","pertinent":{"siteStructure":"Category"}}}', 'result data mismatch');
        done();
      });
    }).fail(function () {
      assert(false, 'called fail!');
      done();
    });
  });

});
