/*jslint indent:2*/
/*jslint nomen:true*/ // for _SERVER and _Blink
// required for common.min.js
var _SERVER = {
    'HTTP_ACCEPT': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'HTTP_ACCEPT_CHARSET': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
    'HTTP_ACCEPT_ENCODING': 'gzip,deflate,sdch',
    'HTTP_ACCEPT_LANGUAGE': 'en-US,en;q=0.8',
    'HTTP_CONNECTION': 'keep-alive',
    'HTTP_USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_1) AppleWebKit/537.6 (KHTML, like Gecko) Chrome/23.0.1243.2 Safari/537.6',
    'REQUEST_URI': '/test/',
    'SERVER_PROTOCOL': 'HTTP/1.1'
  },
  _Blink = {
    isBlinkGap: false,
    isPhantomJS: true,
    cfg: {
      CDN_PLATFORM: {
        'PREFIX_GZ': '//d1c6dfkb81l78v.cloudfront.net/',
        'SUFFIX_GZ': '.gz',
        'PREFIX': '//d1c6dfkb81l78v.cloudfront.net/',
        'SUFFIX': ''
      }
    }
  },
  // required for BICv2
  isBlinkGap = false,
  MyAnswers = {
    isDebug: false,
    device: {},
    cameraPresent: false
  },
  deviceVars = {
    device: 'ios',
    features: []
  },
  siteVars = {
    id: 1,
    answerSpace: 'test',
    serverDomain: 'localhost',
    serverAppBranch: 'R',
    serverAppVersion: 3
  };

