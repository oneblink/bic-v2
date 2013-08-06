/*jslint browser:true, devel:true, regexp:true, sloppy:true, white:true*/
/*jslint nomen:true, plusplus:true*/

/*global info:true, log:true, warn:true, error:true*/
/*global computeTimeout:true, isBlinkGapDevice:true, MyAnswersDevice:true*/
/*global init_device:true, onDeviceReady:true, prepareHistorySideBar:true*/
/*global BlinkDispatch:true, BlinkForms:true, BlinkStorage:true*/

/*global $:true, Hashtable:true, History:true, Modernizr:true*/
/*global explode:true, implode:true*/
/*global _Blink:true*/

var MyAnswers = MyAnswers || {},
    siteVars = siteVars || {},
    deviceVars = deviceVars || {},
    hasCategories = false, hasMasterCategories = false,
    hasInteractions = false,
    answerSpaceOneKeyword = false,
    currentInteraction, currentCategory, currentMasterCategory,
    currentConfig = {},
    starsProfile = {};
/* END: var */

document.getElementById('startUp-loadMain').className = 'working';

currentConfig.downloadTimeout = 30;
currentConfig.uploadTimeout = 45;
deviceVars.isOnline = true;

function PictureSourceType() {}
function lastPictureTaken() {}

MyAnswers.mainDeferred = new $.Deferred();
MyAnswers.browserDeferred = new $.Deferred();
MyAnswers.formsDeferred = new $.Deferred();
MyAnswers.dfrdMoJOs = null; // processMoJOs() promise
MyAnswers.dfrdGoogleMaps = null;
siteVars.mojos = siteVars.mojos || {};
siteVars.forms = siteVars.forms || {};

MyAnswers.isLoggedIn = false;
MyAnswers.isCustomLogin = false;
MyAnswers.isEmptySpace = false; // empty except for loginUseInteractions

// *** BEGIN UTILS ***

function isCameraPresent() {
  var test = isBlinkGapDevice();
  info('isBlinkGapDevice(): ' + test);
  return test && window.device.camerapresent;
}

function triggerScroll(event) {
  $(window).trigger('scroll');
}

function insertHTML(element, html) {
  if ($.type(element) === 'object') {
    MyAnswers.dispatch.add(function() {$(element).html(html);});
  }
}

function insertText(element, text) {
  if ($.type(element) === 'object' && typeof text === 'string') {
    MyAnswers.dispatch.add(function() {$(element).text(text);});
  }
}

function setMainLabel(label) {
  var mainLabel = document.getElementById('mainLabel');
  insertText(mainLabel, label);
}

/**
 * convert 'argument=value&args[0]=value1&args[1]=value2'
 * into '{"argument":"value","args[0]":"value1","args[1]":"value2"}'
 */
function deserialize(argsString) {
  var args = argsString.split('&'),
    result = { };
  $.each(args, function(index, string) {
    var equalIndex, name, value;
    if (string.length !== 0 && (equalIndex = string.indexOf('=')) !== -1) {
      name = string.substring(0, equalIndex);
      value = string.substring(equalIndex + 1);
      result[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  });
  return result;
}

function getURLParameters() {
  var href = window.location.href,
      matches,
      parameters = {},
      regexp = new RegExp('/' + siteVars.answerSpace + '/([^/?]*)', 'i');

  if (href.indexOf('?') !== -1) {
    matches = href.match(/\?([^#]*)#?.*$/);
    if (matches && matches.length >= 2) {
      parameters = deserialize(matches[1]);
      if (typeof parameters.keyword === 'string') {
        parameters.keyword = parameters.keyword.replace('/', '');
      }
    }
  }
  matches = href.match(regexp);
  if (matches && matches.length >= 2) {
    parameters.keyword = matches[1];
  }
  return parameters;
}

// TODO: deprecate this function
function isAJAXError(status)
{
  switch (status) {
    case null:
    case 'timeout':
    case 'error':
    case 'notmodified':
    case 'parseerror':
      return true;
    default:
      return false;
  }
}

function populateDataTags($element, data) {
  var d;
  for (d in data) {
    if (data.hasOwnProperty(d)) {
      $element.attr('data-' + d, data[d]);
    }
  }
}

function processBlinkAnswerMessage(message) {
  var i,
      iLength,
      isPersist = MyAnswers.device.persistentStorage;

  message = $.parseJSON(message);
  if (isPersist && typeof message.mojotarget === 'string') {
    if (typeof message.mojoxml === 'string') {
      log('controlMessage: populating Data Suitcase: ' + message.mojotarget);
      MyAnswers.store.set('mojoXML:' + message.mojotarget, message.mojoxml);
    } else if (typeof message.mojodelete !== 'undefined') {
      log('controlMessage: deleting Data Suitcase: ' + message.mojotarget);
      MyAnswers.store.remove('mojoXML:' + message.mojotarget);
    }
  }
  if (isPersist && message.startype) {
    starsProfile[message.startype] = starsProfile[message.startype] || {};
    if (message.clearstars) {
      delete starsProfile[message.startype];
    }
    if ($.type(message.staroff) === 'array') {
      iLength = message.staroff.length;
      for (i = 0; i < iLength; i++) {
        delete starsProfile[message.startype][message.staroff[i]];
      }
    }
    if ($.type(message.staron) === 'array') {
      iLength = message.staron.length;
      for (i = 0; i < iLength; i++) {
        starsProfile[message.startype][message.staron[i]] = starsProfile[message.startype][message.staron[i]] || {};
      }
    }
    MyAnswers.store.set('starsProfile', JSON.stringify(starsProfile));
  }
}

// *** END OF UTILS ***

// *** BEGIN PHONEGAP UTILS ***

function getPicture_Success(imageData) {
  var i, thisElement;
  //  log("getPicture_Success: " + imageData);
  lastPictureTaken.image.put(lastPictureTaken.currentName, imageData);
  for (i in document.forms[0].elements) {
    if (document.forms[0].elements.hasOwnProperty(i)) {
      thisElement = document.forms[0].elements[i];
      if (thisElement.name) {
        if (thisElement.type && (thisElement.type.toLowerCase() === 'radio' || thisElement.type.toLowerCase() === 'checkbox') && thisElement.checked === false) {
          $.noop(); // do nothing for unchecked radio or checkbox
        } else {
          if (thisElement.type && (thisElement.type.toLowerCase() === 'button') && (lastPictureTaken.image.size() > 0)) {
            if (lastPictureTaken.currentName === thisElement.name) {
              thisElement.style.backgroundColor = 'red';
            }
          }
        }
      }
    }
  }
  log('getpic success ' + imageData.length);
}

function getPicture(sourceType) {
  var cfg = new BMP.BIC.Config(currentConfig),
      options = cfg.toCameraOptions();

  if (sourceType !== undefined) {
    options.sourceType = sourceType;
  }
  // if no sourceType specified, the default is CAMERA
  navigator.camera.getPicture(getPicture_Success, null, options);
}

function selectCamera(nameStr) {
  log('selectCamera: ');
  lastPictureTaken.currentName = nameStr;
  getPicture(PictureSourceType.CAMERA);
}

function selectLibrary(nameStr) {
  log('selectLibrary: ');
  lastPictureTaken.currentName = nameStr;
  getPicture(PictureSourceType.PHOTO_LIBRARY);
}

// *** END PHONEGAP UTILS ***

// *** BEGIN BLINK UTILS ***


/**
 * @param name
 * @param level "interactions" or "categories" or "masterCategories".
 * @return numeric identifier, or boolean false if not found
 */
function resolveItemName(name, level) {
  var prefix, list, l, lLength, id;
  level = (typeof level === 'string' && level) || 'interactions';
  prefix = level.substring(0, 1);
  if (typeof name === 'number' && !isNaN(name) && $.type(siteVars.config[prefix + name]) === 'object') {
    return name;
  }
  if (typeof name !== 'string') {return false;}
  name = decodeURI(name.replace(/\+/g, ' ').toLowerCase());
  list = siteVars.map[level];
  lLength = list.length;
  for (l = 0; l < lLength; l++) {
    id = prefix + list[l];
    if ($.type(siteVars.config[id]) === 'object' && name === siteVars.config[id].pertinent.name.toLowerCase()) {
      return list[l];
    }
  }
  if ($.type(siteVars.config[prefix + name]) === 'object') {
    return name;
  }
  return false;
}

//take 2 plain XML strings, then transform the first using the second (XSL)
//insert the result into element
function performXSLT(xmlString, xslString) {
  var deferred = new $.Deferred(function(dfrd) {
    var html, xml, xsl,
        processor,
        transformer,
        ActiveXObject = window.ActiveXObject;
    if (typeof xmlString !== 'string' || typeof(xslString) !== 'string') {
      dfrd.reject('XSLT failed due to poorly formed XML or XSL.');
      return;
    }
    xml = $.parseXML(xmlString);
    xsl = $.parseXML(xslString);
    /*
     * if (deviceVars.hasWebWorkers === true) {
     * log('performXSLT(): enlisting Web Worker to perform
     * XSLT'); var message = { }; message.fn = 'processXSLT'; message.xml =
     * xmlString; message.xsl = xslString; message.target = target;
     * MyAnswers.webworker.postMessage(message); return '<p>This keyword is
     * being constructed entirely on your device.</p><p>Please wait...</p>'; }
     */
    if (window.XSLTProcessor) {
      log('performXSLT(): performing XSLT via XSLTProcessor (W3C)');
      processor = new window.XSLTProcessor();
      processor.importStylesheet(xsl);
      html = processor.transformToFragment(xml, document);
    } else if (typeof xml.transformNode !== 'undefined') {
      // have to use typeof here, checking for "truthy" breaks in IE
      log('performXSLT(): performing XSLT via transformNode (IE)');
      html = xml.transformNode(xsl);
    } else if (window.xsltProcess) {
      log('performXSLT(): performing XSLT via AJAXSLT library');
      html = window.xsltProcess(xml, xsl);
    } else {
      html = '<p>Your browser does not support Data Suitcase keywords.</p>';
    }
    dfrd.resolve(html);
  });
  return deferred.promise();
}

//test to see if the user it viewing the highest level screen
function isHome() {
  var siteStructure = siteVars.config['a' + siteVars.id].pertinent.siteStructure,
    currentView = $('.view:visible').first().attr('id');
  switch (siteStructure) {
    case 'master categories':
      return currentView === 'masterCategoriesView';
    case 'categories':
      return currentView === 'categoriesView';
    default:
      return currentView === 'keywordListView';
  }
}

// perform all steps necessary to populate element with Data Suitcase result
function generateMojoAnswer(args) {
  log('generateMojoAnswer(): currentConfig=' + currentConfig.name);
  var deferred = new $.Deferred(),
      dfrdXml = new $.Deferred(), // promise for when we have XML
      xml,
      xsl = currentConfig.xsl,
      placeholders, p, pLength,
      value,
      variable, condition,
      starType,
      starDetailFn = function(d, detail) {
        xml += '<' + d + '>' + detail + '</' + d + '>';
      },
      conditionStarFn = function(star, details) {
        condition += ' or ' + variable + '=\'' + star + '\'';
      };
  /* END: var */
  if ($.type(xsl) !== 'string' || xsl.length === 0) {
    deferred.reject('<p>Error: this Interaction does not have any XSL to transform.</p>');
    return deferred.promise();
  }
  // adjust XSL for arguments
  if (args) {
    placeholders = xsl.match(/\$args\[[\w\:][\w\:\-\.]*\]/g);
    pLength = placeholders ? placeholders.length : 0;
    for (p = 0; p < pLength; p++) {
      value = typeof args[placeholders[p].substring(1)] === 'string' ? args[placeholders[p].substring(1)] : '';
      // TODO: find a better solution upstream for having to decode this here
      value = value.replace('"', '');
      value = value.replace("'", '');
      value = decodeURIComponent(value);
      xsl = xsl.replace(placeholders[p], value);
    }
  }
  // adjust XSL for Stars
  starType = xsl.match(/blink-stars\(([@\w.]+),\W*(\w+)\W*\)/);
  while (starType) {
    condition = '';
    variable = starType[1];
    starType = starType[2];
    if ($.type(starsProfile[starType]) === 'object') {
      $.each(starsProfile[starType], conditionStarFn);
      condition = condition.substr(4);
    }
    if (condition.length > 0) {
      xsl = xsl.replace(/\(?blink-stars\(([@\w.]+),\W*(\w+)\W*\)\)?/, '(' + condition + ')');
    } else {
      xsl = xsl.replace(/\(?blink-stars\(([@\w.]+),\W*(\w+)\W*\)\)?/, '(false())');
    }
    starType = xsl.match(/blink-stars\(([@\w.]+),\W*(\w+)\W*\)/);
  }
  // resolve Data Suitcase type (legacy Stars format)
  if ($.type(currentConfig.xml) === 'string'
      && currentConfig.xml.indexOf('stars:') === 0) {
    currentConfig.mojoType = 'stars';
    currentConfig.xml = currentConfig.xml.replace(/^stars:/, '');
  }
  // make sure we have XML
  if (currentConfig.mojoType === 'stars') { // use starred items
    starType = currentConfig.xml;
    xml = '';
    if ($.type(starsProfile[starType]) !== 'object') {
      xml = '<stars></stars>';
    } else {
      $.each(starsProfile[starType], function(s, details) {
        xml += '<' + starType + ' id="' + s + '">';
        $.each(details, starDetailFn);
        xml += '</' + starType + '>';
      });
      xml = '<stars>' + xml + '</stars>';
    }
    setTimeout(dfrdXml.resolve, 0);

  } else if (currentConfig.mojoType === 'active-forms') {
    $.when(window.getActiveFormsXML())
    .always(function(formsXml) {
          xml = formsXml;
          setTimeout(dfrdXml.resolve, 0);
        });

  } else if ($.type(currentConfig.xml) === 'string' && !!currentConfig.xml) {
    $.when(MyAnswers.store.get('mojoXML:' + currentConfig.xml))
    .always(function(data) {
//          var general = '<p>The data used to contruct this page is not currently stored on your device.</p>',
//              hosted = '<p>Please try again in 30 seconds.</p>';
          /* END: var */
          xml = data;
          if(!xml){
            xml = '<xml />';
          }
          setTimeout(dfrdXml.resolve, 0);
        });

  } else {
    xml = '<xml />';
    setTimeout(dfrdXml.resolve, 0);
  }
  // only continue if we haven't already resolve / failed
  if (deferred.state() !== 'pending') {
    return deferred.promise();
  }
  // continue with processing
  $.when(dfrdXml)
  .always(function() {
        $.when(performXSLT(xml, xsl)).done(function(html) {
          deferred.resolve(html);
        }).fail(function(html) {
          deferred.resolve(html);
        });
      });
  return deferred.promise();
}

function getActiveFormsXML() {
  var dfrd = new $.Deferred(),
      xml = '';
  /* END: var */
  $.when(MyAnswers.pendingStore.keys(), MyAnswers.pendingV1Store.keys())
  .fail(function() {
        xml = '<type>error</type>';
        xml += '<message>Unable to list active form records.</message>';
        xml = '<status>' + xml + '</status>';
        dfrd.resolve('<?xml version="1.0"?>\n<records>' + xml + '</records>');
      })
  .then(function(keys, keysV1) {
        var promises = [],
            /**
     * @inner
     */
            keysFn = function(index, key, version) {
              var keyParts = key.split(':'),
                  interaction = siteVars.config['i' + keyParts[0]],
                  name = interaction ? interaction.pertinent.name : '* unknown *',
                  label = interaction ? (interaction.pertinent.displayName || interaction.pertinent.name) : '* unknown *',
                  form = keyParts[1],
                  uuid = keyParts[2],
                  record = '',
                  dfrdSummary;
              /* END: var */
              record += '<id>' + key + '</id>\n';
              record += '<interaction>' + name + '</interaction>\n';
              record += '<interactionLabel>' + label + '</interactionLabel>\n';
              record += '<uuid>' + uuid + '</uuid>\n';
              record += '<form>' + form + '</form>\n';
              record += '<blinkFormsVersion>' + version + '</blinkFormsVersion>\n';
              if (version === 2) {
                // relying on deferred callbacks running in attach-order
                dfrdSummary = MyAnswers.pendingStore.get(key);
                promises.push(dfrdSummary.promise());
                $.when(dfrdSummary)
        .fail(function() {
                      xml += '<record>' + record + '</record>\n';
                    })
        .then(function(json) {
                      var fields = '',
                          metadata;
                      /* END: var */
                      if (typeof json !== 'string' || json.length === 0) {
                        return;
                      }
                      if ($.type(json) !== 'object') {
                        json = $.parseJSON(json);
                      }
                      if ($.type(json) === 'array') {
                        if (json.length >= 3) {
                          // TODO: actually store this metadata so it can be retrieved here
                          metadata = json[2];
                          if (metadata.status) {
                            record += '<status>' + metadata.status + '</status>\n';
                          }
                        }
                        $.each(json[1], function(name, value) {
                          var field = '';
                          field += '<name>' + name + '</name>\n';
                          field += '<value>' + htmlspecialchars(value) + '</value>\n';
                          // TODO: provide access to field type and label
                          fields += '<field>' + field + '</field>\n';
                        });
                        record += '<fields>' + fields + '</fields>\n';
                      }
                      xml += '<record>' + record + '</record>\n';
                    });
              } else { // version === 1
                xml += '<record>' + record + '</record>\n';
              }
            };
        $.each(keys, function(index, key) {
          keysFn(index, key, 2);
        });
        $.each(keysV1, function(index, key) {
          keysFn(index, key, 1);
        });
        $.whenArray(promises)
    .fail(function() {
              xml = '<type>error</type>';
              xml += '<message>Unable to list active form records.</message>';
              xml = '<status>' + xml + '</status>';
              dfrd.resolve('<?xml version="1.0"?>\n<records>' + xml + '</records>');
            })
    .then(function() {
              dfrd.resolve('<?xml version="1.0"?>\n<records>' + xml + '</records>');
            });
      });
  return dfrd.promise();
}

function setSubmitCachedFormButton() {
  var $button = $('#pendingButton'),
      count = 0;
  /* END: var */
  // update pending forms button if necessary
  if ($button.length > 0) {
    $.when(window.countPendingForms())
    .fail(function() {
          $button.hide();
        })
    .then(function(count) {
          var buttonText = count + ' Pending';
          MyAnswers.dispatch.add(function() {
            if (typeof count === 'number' && count > 0) {
              insertText($button[0], buttonText);
              $button.show();
            } else {
              $button.hide();
            }
            log('setSubmitCachedFormButton(): ' + buttonText);
          });
        });
  }
}

// *** END BLINK UTILS ***

// *** BEGIN EVENT HANDLERS ***

function onStarClick(event)
{
  var id = $(this).data('id'),
    type = $(this).data('type'),
    data = $(this).data(),
    k,
    date = new Date();
  delete data.id;
  delete data.type;
  if ($(this).hasClass('blink-star-on'))
  {
    $(this).addClass('blink-star-off');
    $(this).removeClass('blink-star-on');
    delete starsProfile[type][id];
    if ($.isEmptyObject(starsProfile[type])) {
      delete starsProfile[type];
    }
  }
  else if ($(this).hasClass('blink-star-off'))
  {
    $(this).addClass('blink-star-on');
    $(this).removeClass('blink-star-off');
    if ($.type(starsProfile[type]) !== 'object') {
      starsProfile[type] = { };
    }
    starsProfile[type][id] = { };
    for (k in data)  {
      if (data.hasOwnProperty(k)) {
        starsProfile[type][id][k.toUpperCase()] = data[k];
      }
    }
    starsProfile[type][id].time = date.getTime();
    starsProfile[type][id].type = type;
    starsProfile[type][id].id = id;
  }
  MyAnswers.store.set('starsProfile', JSON.stringify(starsProfile));
}

function onLinkClick(event) {
  var $element = $(this),
  a, attributes = $element.attr(),
  id,
  isUnique = false, // true if we need to make the state unique
  isPushState = true, // false if we should replace instead of push the state
  data = null, title = null, url = null, // arguments for History
  parts; // variables for working with legacy links

  try {
    log('onLinkClick(): ' + $(this).tagHTML());
    // TODO: find a more efficient way to decide if we need to make the state unique
    if ($element.hasClass('button') && $element.closest('.bLive-screen').length > 0) {
      isUnique = true;
      isPushState = false;
      // TODO: double-check which BlinkLive buttons need separate History states
    }
    // turn any legacy links into new format before continuing
    if (typeof attributes.href === 'string') {
      attributes.href = $.trim(attributes.href);
      parts = explode('?', attributes.href, 2);
      if(parts[1]) {
        $.each(deserialize(parts[1].trim()), function(key, value) {
          attributes[key] = value;
        });
      }
      if (attributes.href.indexOf('../') !== -1) {
        parts[0] = parts[0].replace(/^\.\.\//, '');
        attributes.interaction = parts[0].replace(/^(.*)(?:\/)$/g, '$1');
        delete attributes.href;
      }
      if (attributes.href && attributes.href[0] === '#') {
        // allow the browser to handle "#..."
        return true;
      }
      if (attributes.href && attributes.href[0] === '?') {
        delete attributes.interaction;
        delete attributes.keyword;
        delete attributes.style;
        delete attributes['class'];
        url = attributes.href;
        data = History.getState().data;
        data.arguments = attributes;
        title = window.document.title;
        if (isPushState) {
          History.pushState(data, title, url);
        } else {
          History.replaceState(data, title, url);
        }
        event.preventDefault();
        return false;
      }
    }
    // process link
    if (typeof attributes.href === 'undefined' && typeof attributes.onclick === 'undefined') {
      if (typeof attributes.back !== 'undefined') {
        History.back();
        event.preventDefault();
        return false;
      }
      if (typeof attributes.home !== 'undefined') {
        url = '/' + siteVars.answerSpace + '/';
      } else if (typeof attributes.login !== 'undefined') {
        data = {login: true};
      } else if (attributes.interaction || attributes.keyword) {
        id = resolveItemName(attributes.interaction || attributes.keyword, 'interactions');
        if (id) {
          $.each(attributes, function(key, value) {
            if (key[0] === '_') {
              attributes['args[' + key.substr(1) + ']'] = value;
              delete attributes[key];
            }
          });
          delete attributes.interaction;
          delete attributes.keyword;
          delete attributes.style;
          delete attributes['class'];
          if (attributes['data-submit-stars-type']) {
            attributes._submitStarsType = $element.data('submitStarsType');
            attributes._submitStarsPost = $element.data('submitStarsPost') || 'stars';
          }
          url = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?' + $.param(attributes);
          data = {m: currentMasterCategory, c: currentCategory, i: id, 'arguments': attributes};
        }
      } else if (typeof attributes.category !== 'undefined') {
        id = resolveItemName(attributes.category, 'categories');
        if (id) {
          url = '/' + siteVars.answerSpace + '/?_c=' + id;
          data = {m: currentMasterCategory, c: id};
        }
      } else if (typeof attributes.mastercategory !== 'undefined') {
        id = resolveItemName(attributes.mastercategory, 'masterCategories');
        if (id) {
          url = '/' + siteVars.answerSpace + '/?_m=' + id;
          data = {m: id};
        }
      }
      if (isUnique) { // we need to make the state unique somehow
        if ($.type(data) === 'object') {
          data._timestamp = $.now();
        } else {
          data = {_timestamp: $.now()};
        }
      }
      if (data || url) { // make sure we actually have a state to push
        if (isPushState) {
          History.pushState(data, title, url);
        } else {
          History.replaceState(data, title, url);
        }
      }
      event.preventDefault();
      return false;
    }
  } catch (e) {
    error('Error in onLinkClick handler...');
    error(e);
  }
  return true;
}

// *** END EVENT HANDLERS ***

// *** PENDING QUEUE HELPERS ***


/**
 * Count the number of stored submissions for both BlinkForms v1 and v2.
 * @return {jQueryPromise} number of stored forms
 */
function countPendingForms() {
  var deferred = new $.Deferred();
  $.when(MyAnswers.pendingStore.count(), MyAnswers.pendingV1Store.count())
  .then(function(size2, size1) {
    deferred.resolve(size2 + size1);
  })
  .fail(function() {
    error('countPendingForms() unable to query storage');
    deferred.resolve(0);
  });
  return deferred.promise();
}


/**
 * Add a BlinkForms v2 submission to the queue.
 * @param {String} interaction ID.
 * @param {String} form name of the form object.
 * @param {String} uuid UUID.
 * @param {Object} data key=>value pairs to be JSON-encoded.
 * @param {Object} summary key=>value pairs to be JSON-encoded.
 * @return {jQueryPromise}
 */
function pushPendingForm(interaction, form, uuid, data, summary) {
  var deferred = new $.Deferred();
  $.when(MyAnswers.pendingStore.set(interaction + ':' + form + ':' + uuid, JSON.stringify(data)))
    .then(function() {
      deferred.resolve();
    })
    .fail(function() {
      deferred.reject();
    })
    .always(setSubmitCachedFormButton);
  return deferred.promise();
}


/**
 * Remove a BlinkForms v2 submission from the queue.
 * @param {String} interaction ID.
 * @param {String} form name of the form object.
 * @param {String} uuid UUID.
 * @return {jQueryPromise}
 */
function clearPendingForm(interaction, form, uuid) {
  var deferred = new $.Deferred();
  $.when(MyAnswers.pendingStore.remove(interaction + ':' + form + ':' + uuid))
    .then(function() {
      deferred.resolve();
    })
    .fail(function() {
      deferred.reject();
    })
    .always(setSubmitCachedFormButton);
  return deferred.promise();
}


/**
 * Add a BlinkForms v1 submission to the queue.
 * @param {String} interaction ID.
 * @param {String} form name of the form object.
 * @param {String} uuid UUID.
 * @param {Object} data key=>value pairs to be JSON-encoded.
 * @return {jQueryPromise}
 */
function pushPendingFormV1(interaction, uuid, data) {
  var deferred = new $.Deferred();
  $.when(MyAnswers.pendingV1Store.set(interaction + ':' + uuid, JSON.stringify(data))).then(function() {
    deferred.resolve(data);
  }).fail(function() {
    deferred.reject();
  }).always(setSubmitCachedFormButton);
  return deferred.promise();
}


/**
 * Remove a BlinkForms v2 submission from the queue.
 * @param {String} interaction ID.
 * @param {String} form name of the form object.
 * @param {String} uuid UUID.
 * @return {jQueryPromise}
 */
function clearPendingFormV1(interaction, uuid) {
  var deferred = new $.Deferred();
  $.when(MyAnswers.pendingV1Store.remove(interaction + ':' + uuid)).then(function() {
    deferred.resolve();
  }).fail(function() {
    deferred.reject();
  }).always(setSubmitCachedFormButton);
  return deferred.promise();
}

// *** END PENDING QUEUE HELPERS ***

function requestMoJO(mojo) {
  var deferred = new $.Deferred();
  if ($.type(mojo) !== 'string' || mojo.length === 0) {
    deferred.resolve();
    return deferred.promise();
  }
  $.when(MyAnswers.store.get('mojoLastChecked:' + mojo)).done(function(value) {
    var requestData = {
        _id: siteVars.id,
        _m: mojo
      };
    value = parseInt(value, 10);
    if (typeof value === 'number' && !isNaN(value)) {
      requestData._lc = value;
    }
    if (deviceVars.isOnline) {
      $.ajax({
        url: siteVars.serverAppPath + '/xhr/GetMoJO.php',
        data: requestData,
        dataType: 'xml',
        complete: function(jqxhr, status) {
          if (jqxhr.status === 200) {
            $.when(MyAnswers.store.set('mojoXML:' + mojo, jqxhr.responseText))
              .fail(deferred.reject)
              .then(deferred.resolve);
          //                MyAnswers.store.set('mojoLastUpdated:' + mojo, new Date(jqxhr.getResponseHeader('Last-Modified')).getTime());
          //          } else if (jqxhr.status === 304) {
          //            deferred.resolve();
          } else {
            //            deferred.reject();
            deferred.resolve();
          }
        },
        timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500 * 1024))
      });
    } else {
      deferred.reject();
    }
  });
  $.when(deferred.promise())
    .then(function() {
      MyAnswers.store.set('mojoLastChecked:' + mojo, $.now());
    });
  return deferred.promise();
}

function processMoJOs(interaction) {
  var deferred = new $.Deferred(),
  deferredFetches = {},
  interactions = interaction ? [interaction] : siteVars.map.interactions,
  i, iLength = interactions.length,
  config;
  /* END: var */
  for (i = 0; i < iLength; i++) {
    config = siteVars.config['i' + interactions[i]];
    if ($.type(config) === 'object') {
      config = config.pertinent;
      if ($.type(config) === 'object' && config.type === 'xslt' && config.mojoType === 'server-hosted') {
        if (typeof config.xml === 'string' && config.xml.substring(0, 6) !== 'stars:') {
          if (!siteVars.mojos[config.xml]) {
            siteVars.mojos[config.xml] = {
              maximumAge: config.maximumAge || 0,
              minimumAge: config.minimumAge || 0
            };
          } else {
            siteVars.mojos[config.xml].maximumAge = config.maximumAge ? Math.min(config.maximumAge, siteVars.mojos[config.xml].maximumAge) : siteVars.mojos[config.xml].maximumAge;
            siteVars.mojos[config.xml].minimumAge = config.minimumAge ? Math.max(config.minimumAge, siteVars.mojos[config.xml].minimumAge) : siteVars.mojos[config.xml].minimumAge;
          }
          if (!deferredFetches[config.xml]) {
            deferredFetches[config.xml] = requestMoJO(config.xml);
          }
        }
      }
    }
  }
  deferredFetches = $.map(deferredFetches, function(value, key) {
    return value;
  });
  $.whenArray(deferredFetches)
  .fail(deferred.reject)
  .then(deferred.resolve);
  return deferred.promise();
}

function goBackToHome() {
  History.replaceState(null, null, '/' + siteVars.answerSpace + '/');
  MyAnswers.$body.trigger('taskComplete');
  //  getSiteConfig();
}

function showLoginView(event) {
  var id,
    requestUri,
    $view = $('#loginView');
  if (!currentConfig.loginAccess) {
    return false;
  }
  if (MyAnswers.isCustomLogin) {
    id = resolveItemName(currentConfig.loginPromptInteraction, 'interactions');
    if (!id) {
      BMP.alert('error: interaction used for login prompt is inaccessible or misconfigured');
      return false;
    }
    requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?';
    History.pushState({m: null, c: null, i: id}, null, requestUri);
    return false;
  }
  $.when(MyAnswersDevice.prepareView($view)).always(function() {
    MyAnswersDevice.showView($view);
    setMainLabel('Login');
  });
}

function updateLoginButtons() {
  var loginStatus = document.getElementById('loginStatus'),
      loginButton = document.getElementById('loginButton'),
      logoutButton = document.getElementById('logoutButton'),
      /** @inner */
      submitLogoutFn = function(event) {
        var id, requestUri;
        log('submitLogout();');
        if (!currentConfig.loginAccess) {
          return false;
        }
        if (currentConfig.loginUseInteractions) {
          id = resolveItemName(currentConfig.loginPromptInteraction, 'interactions');
          if (!id) {
            BMP.alert('error: login interaction is inaccessible or misconfigured');
            return false;
          }
          requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?';
          History.pushState({
            m: null,
            c: null,
            i: id
          }, null, requestUri);
          return false;
        }
        BMP.confirm('Log out?')
            .then(function(result) {
              if (result) {
                $.ajax({
                  type: 'GET',
                  cache: 'false',
                  url: siteVars.serverAppPath + '/xhr/GetLogin.php',
                  data: {
                    '_a': 'logout'
                  },
                  complete: function(xhr, textstatus) {
                    if (xhr.status === 200) {
                      var data = $.parseJSON(xhr.responseText);
                      if (data) {
                        if (data.status === 'LOGGED IN') {
                          MyAnswers.loginAccount = data;
                          MyAnswers.isLoggedIn = true;
                        } else {
                          MyAnswers.isLoggedIn = false;
                          delete MyAnswers.loginAccount;
                          window.location.reload();
                        }
                      }
                      updateLoginButtons();
                      //          getSiteConfig();
                      goBackToHome();
                    }
                  },
                  timeout: currentConfig.downloadTimeout * 1000
                });
              }
            });

        return false;
      };
  /* END: var */
  if (!siteVars.hasLogin) {
    return;
  }
  if (MyAnswers.isLoggedIn) {
    if (typeof MyAnswers.loginAccount !== 'undefined' && typeof MyAnswers.loginAccount !== 'boolean') {
      MyAnswers.dispatch.add(function() {
        var $loginStatus = $(loginStatus),
            text = 'logged in as<br />';
        if ($.type(MyAnswers.loginAccount) === 'object') {
          text += '<span class="loginAccount">' + MyAnswers.loginAccount.name || MyAnswers.loginAccount.username + '</span>';
        } else {
          text += '<span class="loginAccount">' + MyAnswers.loginAccount + '</span>';
        }
        $loginStatus.empty();
        $loginStatus.append(text);
        $loginStatus.unbind();
        $loginStatus.bind('click', submitLogoutFn);
      });
      $(loginStatus).show();
    } else {
      $(logoutButton).show();
    }
    $(loginButton).hide();
  } else {
    $(loginStatus).hide();
    $(logoutButton).hide();
    $(loginButton).show();
  }
  if (currentCategory !== undefined) {
    MyAnswers.populateItemListing('interactions', $('#keywordListView'));
  }
}

function requestLoginStatus() {
  var deferred = new $.Deferred();
  if (!siteVars.hasLogin || !deviceVars.isOnline) {
    deferred.reject();
    return deferred.promise();
  }
  $.ajax({
    url: siteVars.serverAppPath + '/xhr/GetLogin.php',
    dataType: 'json',
    complete: function(xhr, xhrStatus) {
      if (isAJAXError(xhrStatus) || xhr.status !== 200) {
        deferred.reject();
        return;
      }
      var data = $.parseJSON(xhr.responseText);
      if (data) {
        if (data.status === 'LOGGED IN') {
          MyAnswers.loginAccount = data;
          MyAnswers.isLoggedIn = true;
        } else {
          MyAnswers.isLoggedIn = false;
          delete MyAnswers.loginAccount;
        }
      }
      updateLoginButtons();
      deferred.resolve();
    },
    timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500))
  });
  return deferred.promise();
}

function submitLogin() {
  log('submitLogin();');
  $.ajax({
    type: 'GET',
    cache: 'false',
    url: siteVars.serverAppPath + '/xhr/GetLogin.php',
    data: $('#loginView').find('form').serializeArray(),
    complete: function(xhr, textstatus) {
      $('#loginView').find('input[type=password]').val('');
      if (xhr.status === 200) {
        var data = $.parseJSON(xhr.responseText);
        if (data) {
          if (data.status === 'LOGGED IN') {
            MyAnswers.loginAccount = data;
            MyAnswers.isLoggedIn = true;
            //            window.location.reload();
            $.when(window.requestConfig()).always(function() {
              if (siteVars.map && siteVars.config) {
                window.processConfig();
                window.updateNavigationButtons();
                // explicity do not implement loginToDefaultScreen here
              } else {
                BMP.alert('error: insufficient data, check network and reload / refresh');
              }
            });
          } else {
            MyAnswers.isLoggedIn = false;
            delete MyAnswers.loginAccount;
          }
        }
        updateLoginButtons();
      //        getSiteConfig();
      } else {
        BMP.alert('Unable to login:  (' + textstatus + ' ' + xhr.status + ') ' + xhr.responseText);
      }
    },
    timeout: currentConfig.downloadTimeout * 1000
  });
}

MyAnswers.gotoDefaultScreen = function() {
  var History = window.History,
      requestUri;

  if (currentConfig.defaultScreen === 'login' || MyAnswers.isLoginOnly) {
    showLoginView();
    /*History.pushState({
      login: true
    });*/
  } else if (currentConfig.defaultScreen === 'interaction' && hasInteractions && typeof siteVars.config['i' + currentConfig.defaultInteraction] !== undefined) {
    requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + currentConfig.defaultInteraction].pertinent.name + '/?';
    History.pushState({
      i: currentConfig.defaultInteraction
    }, null, requestUri);
  } else if (currentConfig.defaultScreen === 'category' && hasCategories && typeof siteVars.config['c' + currentConfig.defaultCategory] !== undefined) {
    requestUri = '/' + siteVars.answerSpace + '/?_c=' + currentConfig.defaultCategory;
    History.pushState({
      c: currentConfig.defaultCategory
    }, null, requestUri);
  } else if (currentConfig.defaultScreen === 'master category' && hasMasterCategories && typeof siteVars.config['m' + currentConfig.defaultMasterCategory] !== undefined) {
    requestUri = '/' + siteVars.answerSpace + '/?_m=' + currentConfig.defaultMasterCategory;
    History.pushState({
      m: currentConfig.defaultMasterCategory
    }, null, requestUri);
  } else { // default "home"
    History.replaceState({
      _now: $.now()
    }, null, '/' + siteVars.answerSpace + '/');
  }
};

function updateNavigationButtons() {
  var isPersist = MyAnswers.device.persistentStorage;
  MyAnswers.dispatch.add(function() {
    try {
      var $navBars = $('.navBar'),
          $navButtons = $('#homeButton, #backButton'),
          $helpButton = $('#helpButton'),
          $formsButton = $('#pendingButton'),
          helpContents,
          isHelp,
          isLogin = siteVars.hasLogin,
          isHome = window.isHome(),
          isNoNavButtons = isHome || MyAnswers.isEmptySpace || MyAnswers.isLoginOnly,
          isNoNavBar,
          dfrdForms;
      /* END: var */
      // determine if we need the help button
      switch ($('.view:visible').first().attr('id'))
      {
        case 'keywordView':
        case 'answerView':
        case 'answerView2':
          if (currentInteraction) {
            helpContents = siteVars.config['i' + currentInteraction].pertinent.help;
          }
          break;
        case 'helpView':
          helpContents = null;
          break;
        default:
          helpContents = siteVars.config['a' + siteVars.id];
          break;
      }
      isHelp = typeof helpContents === 'string';
      if (isHelp) {
        $helpButton.show();
        $helpButton.removeAttr('disabled');
      } else {
        $helpButton.hide();
      }
      // determine if we need to count the active forms in the queue
      if ($formsButton.length > 0 && isNoNavButtons) {
        dfrdForms = countPendingForms();
      } else {
        dfrdForms = true;
      }
      $.when(dfrdForms) // after we've counted the forms (if necessary), ...
      .always(function(formsCount) {
            if (typeof formsCount !== 'number') {
              formsCount = 0;
            }
            isNoNavBar = isNoNavButtons && !isLogin && !isHelp && !formsCount;
            if (isNoNavBar) {
              $navBars.hide();
            } else if (isNoNavButtons) {
              $navBars.show();
              $navButtons.hide();
            } else {
              $navButtons.show();
              $navButtons.prop('disabled', false);
              $navBars.show();
            }
          });
      $('#loginButton, #logoutButton, #pendingButton').removeAttr('disabled');
      // update data suitcases if necessary
      if (isPersist && isHome && MyAnswers.dfrdMoJOs.state() !== 'pending') {
        processMoJOs();
      }
      // update the sidebar
      MyAnswers.dispatch.add(function() {$(window).trigger('scroll');});
      if (MyAnswers.sideBar) {
        MyAnswers.sideBar.update();
      }
    } catch (e) {
      error('Error in updateNavigationButtons...');
      error(e);
    }
  });
}

function initialiseAnswerFeatures($view) {
  log('initialiseAnswerFeatures(): view=' + $view.attr('id'));
  var deferred = new $.Deferred(),
    promises = [],
    oldLoginStatus,
    current = $.type(currentInteraction) === 'string' ? currentInteraction : String(currentInteraction),
    prompt = $.type(currentConfig.loginPromptInteraction) === 'string' ? currentConfig.loginPromptInteraction : String(currentConfig.loginPromptInteraction);
  // loginUseInteractions
  if (currentConfig.loginAccess && currentConfig.loginUseInteractions && prompt === current) {
    oldLoginStatus = MyAnswers.isLoggedIn;
    $.when(requestLoginStatus()).always(function() {
      if (MyAnswers.isLoggedIn !== oldLoginStatus) {
        if (MyAnswers.isLoggedIn) {
          $.when(window.requestConfig()).always(function() {
            if (siteVars.map && siteVars.config) {
              window.processConfig();
              window.updateNavigationButtons();
              if (currentConfig.loginToDefaultScreen) {
                MyAnswers.gotoDefaultScreen();
              }
            } else {
              BMP.alert('error: insufficient data, check network and reload / refresh');
            }
          });
        } else {
          window.location.reload();
        }
      }
    });
  }
  // END: loginUseInteractions
  MyAnswers.dispatch.add(function() {
    var $inputs = $view.find('input, textarea, select'),
      $form = $view.find('form').first(),
      isGoogleJSLoaded = typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined' && typeof window.google.maps.Map !== 'undefined';
    MyAnswers.$body.trigger('taskBegun');
    $inputs.unbind('blur', triggerScroll);
    $inputs.bind('blur', triggerScroll);
    if (MyAnswers.device.persistentStorage) {
      $view.find('.blink-starrable').each(function(index, element) {
        var $div = $('<div class="blink-starrable" />'),
          data = $(element).data();
        populateDataTags($div, data);
        $div.bind('click', onStarClick);
        if ($.type(starsProfile[$(element).data('type')]) !== 'object' || $.type(starsProfile[$(element).data('type')][$(element).data('id')]) !== 'object') {
          $div.addClass('blink-star-off');
        } else {
          $div.addClass('blink-star-on');
        }
        $(element).replaceWith($div);
      });
    }
    if ($view.find('div.googlemap').size() > 0) { // check for items requiring Google features (so far only #map)
      if (isGoogleJSLoaded) {
        setTimeout(function() {
          MyAnswers.setupGoogleMaps($view);
        }, 1000);
      } else {
        MyAnswers.dfrdGoogleMaps = new $.Deferred();
        $.getCachedScript('//maps.googleapis.com/maps/api/js?key=' + _Blink.cfg.GOOGLE_API_KEY + '&v=3&sensor=true&callback=MyAnswers.onGoogleMapsLoad')
        .fail(function() {
          throw ('unable to download Google Maps JavaScript library');
        })
        .then(function() {
          $.when(MyAnswers.dfrdGoogleMaps.promise())
          .fail(function() {
            log('initialiseAnswerFeatures() error: unable to initialise Google Maps API');
          })
          .then(function() {
            delete window.onGoogleMapsLoad;
            delete MyAnswers.dfrdGoogleMaps;
            MyAnswers.setupGoogleMaps($view);
          });
        });
      }
    }
    if ($form.length !== 0) {
      if (typeof $form.data('objectName') === 'string' && $form.data('objectName').length > 0) {
        $.when(MyAnswers.formsDeferred.promise())
        .always(function() {
          promises.push(BlinkForms.initialiseForm($form));
        });
      } else if (!isCameraPresent()) {
        $form.find('input[onclick*="selectCamera"]').attr('disabled', 'disabled');
      }
    }
  });
  MyAnswers.dispatch.add(function() {
    $.when.apply($, promises).always(function() {
      MyAnswers.$body.trigger('taskComplete');
      deferred.resolve();
      $view.trigger('viewReady');
    });
  });
  return deferred.promise();
}

// run after any change to current*
function updateCurrentConfig() {
  var configs = [],
      features = _.clone(deviceVars.features),
      isRotating = $.inArray('portrait', deviceVars.features) !== -1 &&
          $.inArray('landscape', deviceVars.features) !== -1,
      a = 'a' + siteVars.id,
      m = 'm' + currentMasterCategory,
      c = 'c' + currentCategory,
      i = 'i' + currentInteraction,
      object,
      /**
       * for use with jQuery.map()
       * @param {String} value the complete override string.
       * @param {Number} index (not used).
       * @return {String|Null} original value upon match, else null.
       */
      isFeatureMatch = function(value, index) {
        // overrides are made up of mandatory sets
        var sets = value.split('+'),
            s, sLength = sets.length,
            options, o, oLength,
            isSetPresent,
            isOptionPresent;

        for (s = 0; s < sLength; s++) {
          options = sets[s].split('|');
          oLength = options.length;
          isSetPresent = true;
          isOptionPresent = false;

          if (sets[s].indexOf('|') !== -1) {
            // set contains multiple options (at least one must match)
            for (o = 0; o < oLength; o++) {
              if ($.inArray(options[o], features) !== -1) {
                isOptionPresent = true;
                break;
              }
            }
            if (!isOptionPresent) {
              isSetPresent = false;
            }
          } else if ($.inArray(sets[s], features) === -1) {
            // set is simply a single condition
            isSetPresent = false;
          }
          if (!isSetPresent) {
            // part of the override did not match, exit early
            return null;
          }
        }
        // the entire override matches current features
        return value;
      },
      /**
       * @param {Array} override names of configuration sections.
       * @return {Number} weight for Underscore.sortBy().
       */
      sortOverrides = function(override) {
        if (!override || typeof override !== 'string' ||
            override.indexOf('+') === -1) {
          return 0;
        }
        return override.match(/\+/g).length;
      },
      /**
       * for use with jQuery.each()
       * @param {Number} index 0-based position of value (not used).
       * @param {String} value name of the particular override section.
       */
      pushConfig = function(index, value) {
        configs.push(object[value]);
      };

  // TODO: need to fold orientation-specific config into this somewhere
  log('updateCurrentConfig(): ' + a + ' ' + m + ' ' + c + ' ' + i);
  currentConfig = {};
  configs.push(currentConfig);
  // setting current orientation
  if (isRotating) {
    features = _.without(features, 'portrait', 'landscape');
    features.push(MyAnswers.orientation);
  }
  // populate the stack with configs we need to consider
  $.each([a, m, c, i], function(index, id) {
    var overrides,
        isSimple;

    object = siteVars.config[id];
    if (!object || !$.isObject(object)) {
      return;
    }
    overrides = _.keys(object);
    isSimple = overrides.length === 1 && overrides[0] === 'pertinent';
    if (isSimple) {
      configs.push(object.pertinent);
    } else {
      configs.push(object.pertinent);
      overrides = $.map(overrides, isFeatureMatch);
      overrides = _.sortBy(overrides, sortOverrides);
      $.each(overrides, pushConfig);
    }
  });
  // flatten the stack
  $.extend.apply(this, configs);
  // perform inherited changes
  MyAnswers.dispatch.add(function() {
    var $banner = $('#bannerBox'),
      $image = $banner.find('img'),
      imageSrc = currentConfig.logoBanner;
    if (typeof currentConfig.logoBanner === 'string') {
      if (imageSrc !== $image.attr('src')) {
        $image.attr('src', imageSrc);
      }
      $banner.show();
    } else {
      $image.removeAttr('src');
      $banner.hide();
    }
  });
  // fix footer
  MyAnswers.dispatch.add(function() {
    if (MyAnswers.$footer.html() !== currentConfig.footer) {
      MyAnswers.$footer.html(currentConfig.footer);
    }
    if (currentConfig.footerPosition === 'screen-bottom') {
      MyAnswers.$footer.css({
        position: 'fixed',
        bottom: '0px',
        'z-index': 1
      });
    } else {
      MyAnswers.$footer.removeAttr('style');
    }
  });
  // fix styles
  MyAnswers.dispatch.add(function() {
    var style = '',
      $style = $('style[data-setting="styleSheet"]');
    style += currentConfig.styleSheet || '';
    style += currentConfig.interfaceStyle ? 'body { ' + currentConfig.interfaceStyle + ' }\n' : '';
    style += currentConfig.backgroundStyle ? '.box { ' + currentConfig.backgroundStyle + ' }\n' : '';
    style += currentConfig.inputPromptStyle ? '#argsBox { ' + currentConfig.inputPromptStyle + ' }\n' : '';
    style += currentConfig.evenRowStyle ? 'ul.box > li:nth-child(even), tr.even { ' + currentConfig.evenRowStyle + ' }\n' : '';
    style += currentConfig.oddRowStyle ? 'ul.box > li:nth-child(odd), tr.odd { ' + currentConfig.oddRowStyle + ' }\n' : '';
    style += currentConfig.headerStyle ? 'body > header { ' + currentConfig.headerStyle + ' }\n' : '';
    style += currentConfig.footerStyle ? 'body > footer { ' + currentConfig.footerStyle + ' }\n' : '';
    style += currentConfig.masterCategoriesStyle ? '#masterCategoriesBox > .masterCategory { ' + currentConfig.masterCategoriesStyle + ' }\n' : '';
    style += currentConfig.categoriesStyle ? '#categoriesBox > .category { ' + currentConfig.categoriesStyle + ' }\n' : '';
    style += currentConfig.interactionsStyle ? '#keywordBox > .interaction, #keywordList > .interaction { ' + currentConfig.interactionsStyle + ' }\n' : '';
    if (!$style.length) {
      return;
    }
    if ($style[0].styleSheet) {
      // Internet Explorer 8
      if (style !== $style[0].styleSheet.cssText) {
        $style[0].styleSheet.cssText = style;
      }
    } else {
      // other browsers
      if (style !== $style.text()) {
        $style.text(style);
      }
    }
  });
  MyAnswers.dispatch.add(function() {
    var $view = $('.view:visible').last(),
        level;
    try {
      if ($view.hasClass('listing')) {
        switch ($view.attr('id')) {
        case 'masterCategoriesView':
          level = 'masterCategories';
          break;
        case 'categoriesView':
          level = 'categories';
          break;
        default:
          level = 'interactions';
        }
        MyAnswers.populateItemListing(level, $view);
      }
    } catch (error) {
      error('Error in updateCurrentConfig...');
    }
  });
}

(function(window) {
  var MyAnswers = window.MyAnswers;

  function onMasterCategoryClick(event) {
    History.pushState({
      m: $(this).data('id')
      } , null, '/' + siteVars.answerSpace + '/?_m=' + $(this).data('id'));
  }
  function onCategoryClick(event) {
    History.pushState({
      m: $(this).data('masterCategory'),
      c: $(this).data('id')
      }, null, '/' + siteVars.answerSpace + '/?_c=' + $(this).data('id'));
  }
  function onKeywordClick(event) {
    var interaction = siteVars.config['i' + $(this).data('id')].pertinent.name;
    History.pushState({
      m: $(this).data('masterCategory'),
      c: $(this).data('category'),
      i: $(this).data('id')
      }, null, '/' + siteVars.answerSpace + '/' + interaction + '/');
  }
  function onHyperlinkClick(event) {
    //window.location.assign($(this).data('hyperlink'));
    window.open($(this).data('hyperlink'),$(this).data('target'));
  }

  MyAnswers.populateItemListing = function(level, $view) {
    var arrangement, display, order, list, $visualBox, $listBox, type,
      name, $item, $label, $description,
      hook = {},
      o, oLength,
      category, columns, $images,
      itemConfig;
    hook.interactions = function($item) {
      var id = $item.attr('data-id'),
          pertinent = siteVars.config['i' + id].pertinent;
      if (pertinent.type === 'hyperlink' && pertinent.hyperlink) {
        $item.attr('data-hyperlink', pertinent.hyperlink);
        $item.attr('data-target', pertinent.hyperlinkTarget);
        $item.bind('click', onHyperlinkClick);
      } else {
        $item.bind('click', onKeywordClick);
      }
    };
    hook.categories = function($item) {
      var id = $item.attr('data-id');
      if (siteVars.map['c' + id].length === 1) {
        $item.attr('data-category', id);
        $item.attr('data-id', siteVars.map['c' + id][0]);
        hook.interactions($item);
      } else if (siteVars.map['c' + id].length > 0) {
        $item.bind('click', onCategoryClick);
      }
    };
    hook.masterCategories = function($item) {
      var id = $item.attr('data-id');
      if (siteVars.map['m' + id].length === 1) {
        $item.attr('data-master-category', id);
        $item.attr('data-id', siteVars.map['m' + id][0]);
        hook.categories($item);
      } else if (siteVars.map['m' + id].length > 0) {
        $item.bind('click', onMasterCategoryClick);
      }
    };
    MyAnswers.dispatch.add(function() {
      $view.children('.box:not(.welcomeBox)').remove();
      $visualBox = $('<div class="box bordered" />');
      $listBox = $('<ul class="box" />');
      switch (level) {
        case 'masterCategories':
          arrangement = currentConfig.masterCategoriesArrangement;
          display = currentConfig.masterCategoriesDisplay;
          order = siteVars.map.masterCategories;
          list = order;
          type = 'm';
          break;
        case 'categories':
          arrangement = currentConfig.categoriesArrangement;
          display = currentConfig.categoriesDisplay;
          order = siteVars.map.categories;
          list = siteVars.map['m' + currentMasterCategory] || order;
          type = 'c';
          break;
        case 'interactions':
          arrangement = currentConfig.interactionsArrangement;
          display = currentConfig.interactionsDisplay;
          order = siteVars.map.interactions;
          list = siteVars.map['c' + currentCategory] || order;
          type = 'i';
          break;
      }
      if ($view.attr('id') === 'BlinkSideBar') {
        arrangement = 'list';
        display = currentConfig.sidebarDisplay;
      }
      log('MyAnswers.populateItemListing(): ' + level + ' ' + arrangement + ' ' + display + ' ' + type + '[' + list.join(',') + ']');
      switch (arrangement) {
        case 'list':
          columns = 1;
          break;
        case '2 column':
          columns = 2;
          break;
        case '3 column':
          columns = 3;
          break;
        case '4 column':
          columns = 4;
          break;
      }
      oLength = order.length;
      for (o = 0; o < oLength; o++) {
        itemConfig = siteVars.config[type + order[o]];
        if (typeof itemConfig !== 'undefined' && $.inArray(order[o], list) !== -1 && itemConfig.pertinent.display !== 'hide') {
          name = itemConfig.pertinent.displayName || itemConfig.pertinent.name;
          if (display !== 'text only' && itemConfig.pertinent.icon) {
            $item = $('<img />');
            $item.attr({
              'class': 'v' + columns + 'col',
              'src': itemConfig.pertinent.icon,
              'alt': name
            });
            $visualBox.append($item);
          } else {
            $item = $('<li />');
            $label = $('<div class="label" />');
            $label.text(name);
            $item.append($label);
            if (typeof itemConfig.pertinent.description === 'string') {
              $description = $('<div class="description" />');
              $description.text(itemConfig.pertinent.description);
              $item.append($description);
            }
            $listBox.append($item);
          }
          $item.attr('data-id', order[o]);
          hook[level]($item);
        }
      }
    });
    MyAnswers.dispatch.add(function() {
      if ($visualBox.children().size() > 0) {
        $images = $visualBox.find('img');
        if (columns === 1) {
          $images.first().addClass('topLeft topRight');
          $images.last().addClass('bottomLeft bottomRight');
        } else {
          $images.first().addClass('topLeft');
          if ($images.size() >= columns) {
            $images.eq(columns - 1).addClass('topRight');
          }
          if ($images.size() % columns === 0) {
            $images.eq(columns * -1).addClass('bottomLeft');
            $images.last().addClass('bottomRight');
          }
        }
        $visualBox.appendTo($view);
      }
      if ($listBox.children().size() > 0) {
        $listBox.appendTo($view);
      }
    });
  };

}(this));

(function(window) {
  var $ = window.jQuery,
    MyAnswers = window.MyAnswers,
    deviceVars = window.deviceVars,
    BlinkSideBar = {},
    $sideBar = $('#BlinkSideBar'),
    $stack = $('#stackLayout'),
    currentLevel, oldLevel,
    currentItem, oldItem;

  BlinkSideBar.show = function() {
    MyAnswers.dispatch.add(function() {
      $stack.addClass('bSideBar-on');
      $stack.find('.selected').removeClass('selected');
      $stack.find('[data-id=' + currentCategory + ']').addClass('selected');
    });
  };
  BlinkSideBar.hide = function() {
    MyAnswers.dispatch.add(function() {
      $stack.removeClass('bSideBar-on');
    });
  };
  BlinkSideBar.update = function() {
    var config = siteVars.config['a' + siteVars.id].pertinent;
    if ($.inArray('phone', deviceVars.features) !== -1 || $(window).width() < 768 || config.sidebarDisplay === 'disabled') {
      this.hide();
      return;
    }
    if (hasMasterCategories && currentMasterCategory) {
      currentLevel = 'masterCategories';
      currentItem = currentMasterCategory;
    } else if (hasCategories && currentCategory) {
      currentLevel = 'categories';
      currentItem = currentCategory;
    } else if (hasInteractions && currentCategory) {
      currentLevel = 'interactions';
      currentItem = currentInteraction;
    } else {
      this.hide();
      return;
    }
    if (oldLevel !== currentLevel) {
      MyAnswers.populateItemListing(currentLevel, $sideBar);
    }
    oldLevel = currentLevel;
    oldItem = currentItem;
    this.show();
  };

  MyAnswers.sideBar = BlinkSideBar;
}(this));


function showMasterCategoriesView(reverse) {
  var $view = $('#masterCategoriesView');
  log('showMasterCategoriesView()');
  currentInteraction = null;
  currentCategory = null;
  currentMasterCategory = null;
  $.when(MyAnswersDevice.prepareView($view, reverse)).always(function() {
    MyAnswers.populateItemListing('masterCategories', $view);
    updateCurrentConfig();
    setMainLabel('Master Categories');
    MyAnswersDevice.showView($view, reverse);
  });
}

function goBackToMasterCategoriesView() {
  var $view = $('#masterCategoriesView');
  log('goBackToMasterCategoriesView()');
  $.when(MyAnswersDevice.prepareView($view, true)).always(function() {
    updateCurrentConfig();
    setMainLabel('Master Categories');
    MyAnswersDevice.showView($('#masterCategoriesView'), true);
  });
}

function showCategoriesView(masterCategory) {
  var $view = $('#categoriesView');
  log('showCategoriesView(): ' + masterCategory);
  currentInteraction = null;
  currentCategory = null;
  if (hasMasterCategories && masterCategory) {
    currentMasterCategory = masterCategory;
  }
  $.when(MyAnswersDevice.prepareView($view)).always(function() {
    updateCurrentConfig();
    setMainLabel(masterCategory ? siteVars.config['m' + masterCategory].pertinent.name : 'Categories');
    MyAnswers.populateItemListing('categories', $view);
    MyAnswersDevice.showView($view);
  });
}

function goBackToCategoriesView() {
  var $view = $('#categoriesView');
  currentInteraction = null;
  currentCategory = null;
  log('goBackToCategoriesView()');
  $.when(MyAnswersDevice.prepareView($view, true)).always(function() {
    updateCurrentConfig();
    setMainLabel(currentMasterCategory ? siteVars.config['m' + currentMasterCategory].pertinent.name : 'Categories');
    MyAnswersDevice.showView($view, true);
  });
}

function restoreSessionProfile(token) {
  log('restoreSessionProfile():');
  var requestData, requestUrl = siteVars.serverAppPath + '/util/GetSession.php',
    deferred = new $.Deferred();
  if ($.type(token) !== 'string' || token.length === 0) {
    deferred.reject();
    return deferred.promise();
  }
  requestData = '_as=' + siteVars.answerSpace + '&_t=' + token;
  $.ajax({
    url: requestUrl,
    data: requestData,
    dataType: 'json',
    complete: function(xhr, xhrStatus) {
      if (isAJAXError(xhrStatus) || xhr.status !== 200)
      {
        BMP.alert('Connection error, please try again later. (' + xhrStatus + ' ' + xhr.status + ')');
        deferred.reject();
        return deferred.promise();
      }
      var data = $.parseJSON(xhr.responseText);
      if (data === null)
      {
        log('restoreSessionProfile error: null data');
        BMP.alert('Connection error, please try again later. (' + xhrStatus + ' ' + xhr.status + ')');
        deferred.reject();
        return deferred.promise();
      }
      if (typeof data.errorMessage !== 'string' && typeof data.statusMessage !== 'string')
      {
        log('restoreSessionProfile success: no error messages, data: ' + data);
        if (data.sessionProfile === null) {
          deferred.reject();
          return deferred.promise();
        }
        MyAnswers.store.set('starsProfile', JSON.stringify(data.sessionProfile.stars));
        starsProfile = data.sessionProfile.stars;
      }
      if (typeof data.errorMessage === 'string')
      {
        log('restoreSessionProfile error: ' + data.errorMessage);
        deferred.reject();
      }
      setTimeout(function() {
        deferred.resolve();
      }, 100);
    },
    timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(10 * 1024))
  });
  return deferred.promise();
}

/**
 * @param {jQuery} $xml XML document wrapped in a jQuery object.
 * @return {Object} plain Object { "form": { "field": "subForm", ... } }.
 * @private
 */
function processFormsMap($xml) {
  var map = {},
      $form,
      objectId;
      // for use with jQuery.each
      eachElement = function(index, element) {
        var $element = $(element);
        map[objectId][$element.attr('id')] = $element.attr('object');
      };

  if (! $xml instanceof jQuery || !$xml.length) {
    return {};
  }
  $xml.children('formObject[id]').each(function(index, element) {
    $form = $(element);
    objectId = $form.attr('id');
    map[objectId] = {};
    $form.children('formElement[id][object]').each(eachElement);
  });
  return map;
}

function processForms() {
  var dispatch = new BlinkDispatch(0),
  ajaxDeferred = new $.Deferred(),
  libraryDeferred = new $.Deferred(),
  promises,
  validActions = ['add', 'delete', 'edit', 'find', 'list', 'search', 'view'],
  /* @inner */
  formActionFn = function(id, element) {
    var dfrd = new $.Deferred();
    dispatch.add(function() {
      var $action = $(element),
        action = $action.tag(),
        storeKey = 'formXML:' + id + ':' + action,
        $children = $action.children(), c, cLength = $children.length,
        xml,
        html = '';
      if (validActions.indexOf($action.tag()) !== -1) {
        for (c = 0; c < cLength; c++) {
          xml = _Blink.stringifyDOM($children[c]);
          if (xml) {
            html += xml;
          }
        }
        $.when(MyAnswers.store.set(storeKey, html))
        .fail(function() {
          warn('processForms()->formActionFn(): failed storing ' + storeKey);
          dfrd.reject();
        })
        .then(function() {
          MyAnswers.store.set('formLastChecked:' + id + ':' + action, $.now());
          if (MyAnswers.isDebug) {
            log('processForms()->formActionFn(): formXML=' + storeKey);
          }
          dfrd.resolve();
        });
      } else {
        dfrd.resolve();
      }
    });
    return dfrd.promise();
  },
  /* @inner */
  formObjectFn = function(index, element) {
    var $formObject = $(element);
    if ($formObject.tag() === '_map') {
      siteVars.map.forms = processFormsMap($formObject);
    } else {
      $formObject.children().each(function(index, element) {
        promises.push(formActionFn($formObject.attr('id'), element));
      });
    }
  };
  /* END: var */
  if (window.BlinkForms && window.BlinkFormObject && window.BlinkFormElement) {
    libraryDeferred = true;
  } else {
    libraryDeferred = $.getCachedScript(siteVars.serverAppPath + '/forms2.min.js');

  }
  promises = [libraryDeferred];
  if (MyAnswers.device.persistentStorage) {
    promises.push(ajaxDeferred.promise());
    if (deviceVars.isOnline) {
      $.ajax({
        // TODO: send through lastChecked time when updating forms
        url: siteVars.serverAppPath + '/xhr/GetForm.php',
        dataType: 'xml',
        complete: function(jqxhr, status) {
          var $data;
          if (jqxhr.status === 200 && typeof jqxhr.responseText === 'string') {
            jqxhr.responseText = jqxhr.responseText.substring(jqxhr.responseText.indexOf('<formObjects>'));
            $data = $($.parseXML(jqxhr.responseText));
            // $data contains XMLDocument / <formObjects> / <formObject>s
            $data.children().children().each(formObjectFn);
    //      MyAnswers.store.set('formLastUpdated:' + form, new Date(jqxhr.getResponseHeader('Last-Modified')).getTime());
          }
          if (jqxhr.status === 200 || jqxhr.status === 304) {
            ajaxDeferred.resolve();
          } else {
            warn('processForms()->GetForm.XHR: failed ' + jqxhr.status);
            ajaxDeferred.reject();
          }
        },
        timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500 * 1024))
      });
    } else {
      ajaxDeferred.resolve();
    }
  }
  $.whenArray(promises)
  .fail(MyAnswers.formsDeferred.reject)
  .then(MyAnswers.formsDeferred.resolve);
}

function processConfig() {
  var siteStructure,
  config;
  /* END: var */
  MyAnswers.isEmptySpace = false;
  MyAnswers.isLoginOnly = false;
  log('processConfig(): currentMasterCategory=' + currentMasterCategory + ' currentCategory=' + currentCategory + ' currentInteraction=' + currentInteraction);
  if ($.type(siteVars.config['a' + siteVars.id]) === 'object') {
    config = siteVars.config['a' + siteVars.id].pertinent;
    siteStructure = config.siteStructure;
    if (siteStructure === 'master categories') {
      hasMasterCategories = siteVars.map.masterCategories.length > 0;
    }
    if (siteStructure !== 'interactions only') { // masterCategories or categories
      hasCategories = siteVars.map.categories.length > 0;
    }
    hasInteractions = siteVars.map.interactions.length > 0;
    answerSpaceOneKeyword = siteVars.map.interactions.length === 1;
    if (config.loginAccess && config.loginUseInteractions
          && config.loginPromptInteraction && config.loginStatusInteraction
          && siteVars.config['i' + config.loginPromptInteraction]
          && siteVars.config['i' + config.loginStatusInteraction]) {
      MyAnswers.isCustomLogin = true;
    }
    if (siteVars.map && siteVars.map.masterCategories.length === 0 && siteVars.map.categories.length === 0
          && siteVars.map.interactions.length === (MyAnswers.isCustomLogin ? 2 : 0)) {
      MyAnswers.isEmptySpace = true;
    }
    if (config.loginAccess && !MyAnswers.isLoggedIn) {
      if (config.registeredOnly === 'deny anonymous' || MyAnswers.isEmptySpace) {
        MyAnswers.isLoginOnly = true;
      }
    }
  } else {
    log('processConfig(): unable to retrieve answerSpace config');
  }
}

function requestConfig() {
  var now = $.now(),
      dfrd = new $.Deferred(),
      isPersist = MyAnswers.device.persistentStorage,
      url = siteVars.serverAppPath + '/xhr/GetConfig.php';

  if (!deviceVars.isOnline) {
    dfrd.reject();
    return dfrd.promise();
  }
  $.ajax({
    url: url + '?_asn=' + siteVars.answerSpace,
    type: 'POST',
    dataType: 'json',
    timeout: computeTimeout(40 * 1024),
    complete: function(jqxhr, status) {
      var data,
          items = ['a' + siteVars.id],
          siteStructure;

      if (jqxhr.status === 200) {
        data = $.parseJSON(jqxhr.responseText);
        if ($.type(data.map) === 'object') {
          siteVars.map = data.map;
          if (isPersist) {
            MyAnswers.siteStore.set('map', JSON.stringify(siteVars.map));
          }
        }
        if ($.type(data['a' + siteVars.id]) === 'object') {
          siteStructure = data['a' + siteVars.id].pertinent.siteStructure;
        }
        if (siteVars.map) {
          if (siteStructure === 'master categories' &&
              siteVars.map.masterCategories.length > 0) {
            items = items.concat($.map(siteVars.map.masterCategories,
                                       function(element, index) {
              return 'm' + element;
            }));
          }
          if (siteStructure !== 'interactions only' &&
              siteVars.map.categories.length > 0) {
            // masterCategories or categories
            items = items.concat($.map(siteVars.map.categories,
                                       function(element, index) {
              return 'c' + element;
            }));
          }
          if (siteVars.map.interactions.length > 0) {
            items = items.concat($.map(siteVars.map.interactions,
                                       function(element, index) {
              return 'i' + element;
            }));
          }
        }
      }
      if (data) {
        if ($.type(siteVars.config) !== 'object' || items.length > 0) {
          siteVars.config = {};
        }
        $.each(items, function(index, id) {
          if ($.type(data[id]) === 'object') {
            siteVars.config[id] = data[id];
          }
        });
        if (isPersist) {
          MyAnswers.siteStore.set('config', JSON.stringify(siteVars.config));
        }
        deviceVars.features = data.deviceFeatures;
      }
      if (jqxhr.status === 200 || jqxhr.status === 304 || jqxhr.status === 0) {
        dfrd.resolve();
      } else {
        dfrd.reject();
      }
    }
  });
  return dfrd.promise();
}

MyAnswers.dumpLocalStorage = function() {
  $.when(MyAnswers.store.keys()).done(function(keys) {
    var k, kLength = keys.length,
      getFn = function(value) {
        value = value.length > 20 ? value.substring(0, 20) + '...' : value;
        log('dumpLocalStorage(): found value: ' + value);
      };
    for (k = 0; k < kLength; k++) {
      log('dumpLocalStorage(): found key: ' + keys[k]);
      $.when(MyAnswers.store.get(keys[k])).done(getFn);
    }
  });
};

function gotoStorageView() {
  var interaction,
      url;
  /* END: var */
  if (currentConfig.activeFormsUseInteraction) {
    interaction = siteVars.config['i' + currentConfig.activeFormsInteraction];
    if ($.type(interaction) === 'object') {
      url = '/' + siteVars.answerSpace + '/' + interaction.pertinent.name + '/?';
      History.pushState({ i: currentConfig.activeFormsInteraction }, null, url);
    } else {
      BMP.alert('Interaction for active forms listing could not be found.');
      return;
    }
  } else {
    url = '/' + siteVars.answerSpace + '/?_storage=true';
    History.pushState({storage: true}, null, url);
  }
}

function showPendingView() {
  var $view = $('#pendingView'),
      $box = $('#pendingBox'),
      $section = $box.children('[data-blink-form-version=2]'),
      $sectionV1 = $box.children('[data-blink-form-version=1]'),
      $noMessage = $box.children('.bForm-noPending');
  /* END: var */
  // update pending forms listing if necessary
  $.when(MyAnswers.pendingStore.keys(), MyAnswers.pendingV1Store.keys())
  .then(function(keys, keysV1) {
        var count = keys.length + keysV1.length,
            buttonText = count + ' Pending',
            /**
      * @inner
      */
            keysFn = function(index, key, $section) {
              var version = $section.data('blinkFormVersion'),
                  $template = $section.children('.template'),
                  $entry = $template.clone(),
                  keyParts = key.split(':'),
                  interaction = siteVars.config['i' + keyParts[0]],
                  name = interaction ? (interaction.pertinent.displayName || interaction.pertinent.name) : '* unknown *',
                  form = keyParts[1],
                  uuid = keyParts[2],
                  $summary;
              /* END: var */
              $entry.children('h3').text(name);
              $entry.children('pre.uuid').text(uuid);
              $entry.attr('data-id', key);
              // populate summary "list" fields in the <dl />
              if (version === 2) {
                $.when(MyAnswers.pendingStore.get(key))
          .then(function(json) {
                      if (typeof json !== 'string' || json.length === 0) {
                        return;
                      }
                      if ($.type(json) !== 'object') {
                        json = $.parseJSON(json);
                      }
                      if ($.type(json) === 'array') {
                        $summary = $entry.children('dl');
                        $.each(json[1], function(name, value) {
                          $summary.append('<dt>' + name + '</dt><dd>' + value + '</dd>');
                        });
                      }
                    });
              }
              $entry.data('interaction', keyParts[0]);
              $entry.data('form', form);
              MyAnswers.dispatch.add(function() {
                $entry.appendTo($section);
                $entry.show().removeClass('template');
              });
            };
        /* END: var */
        MyAnswers.dispatch.add(function() {
          $section.children('.bForm-pending:not(.template)').remove();
          if (keys.length > 0) {
            $.each(keys, function(index, key) {
              keysFn(index, key, $section);
            });
            $section.show();
          } else {
            $section.hide();
          }
          $sectionV1.children('.bForm-pending:not(.template)').remove();
          if (keysV1.length > 0) {
            $.each(keysV1, function(index, key) {
              keysFn(index, key, $sectionV1);
            });
            $sectionV1.show();
          } else {
            $sectionV1.hide();
          }
          if ((keysV1.length + keys.length) > 0) {
            $noMessage.hide();
          } else {
            $noMessage.show();
          }
        });
        MyAnswers.dispatch.add(function() {
          $.when(MyAnswersDevice.prepareView($view)).always(function() {
            MyAnswersDevice.showView($view);
          });
        });
      });
}

function createParamsAndArgs(keywordID) {
  var config = siteVars.config['i' + keywordID],
    returnValue = 'asn=' + siteVars.answerSpace + '&iact=' + encodeURIComponent(config.pertinent.name),
    args = '',
    argElements = $('#argsBox').find('input, textarea, select');
  if (typeof config === 'undefined' || !config.pertinent.inputPrompt) {return returnValue;}
  args = '';
  argElements.each(function(index, element) {
    if (this.type && (this.type.toLowerCase() === 'radio' || this.type.toLowerCase() === 'checkbox') && !this.checked) {
      $.noop(); // do nothing if not checked
    } else if (this.name) {
      args += '&' + this.name + '=' + (this.value ? encodeURIComponent(this.value) : '');
    } else if (this.id && this.id.match(/\d+/g)) {
      args += '&args[' + this.id.match(/\d+/g) + ']=' + (this.value ? encodeURIComponent(this.value) : '');
    }
  });
  if (args.length > 0) {
    returnValue += encodeURI(args);
  } else if (argElements.size() === 1 && this.value) {
    returnValue += '&args=' + encodeURIComponent(this.value);
  }
  return returnValue;
}

function showAnswerView(interaction, argsString, reverse) {
  log('showAnswerView(): interaction=' + interaction + ' args=' + argsString);
  var html, args,
    $view = $('#answerView'),
    $answerBox = $('#answerBox'),
    answerBox = $answerBox[0],
    completeFn = function() {
      $.when(initialiseAnswerFeatures($view)).always(function() {
        setMainLabel(currentConfig.displayName || currentConfig.name);
        MyAnswersDevice.showView($view, reverse);
        MyAnswers.dispatch.add(function() {
          MyAnswers.$body.trigger('taskComplete');
        });
      });
    },
    isPersist = MyAnswers.device.persistentStorage,
    isLocalXSLT = !deviceVars.disableXSLT && isPersist;

  interaction = resolveItemName(interaction);
  if (interaction === false) {
    BMP.alert('The requested Interaction could not be found.');
    return;
  }
  MyAnswers.$body.trigger('taskBegun');
  $.when(MyAnswersDevice.prepareView($view, reverse)).always(function() {
    currentInteraction = interaction;
    updateCurrentConfig();
    if (typeof currentConfig.xml === 'string' && currentConfig.xml.substring(0, 6) !== 'stars:') {
      if (currentConfig.mojoType === 'server-hosted' &&
          MyAnswers.dfrdMoJOs.state() !== 'pending') {
        requestMoJO(currentConfig.xml);
      }
    }
    if (typeof argsString === 'string' && argsString.length > 0) {
      args = {};
      $.extend(args, deserialize(argsString));
    } else if ($.type(argsString) === 'object') {
      args = argsString;
    } else {
      args = {};
    }
    if (currentConfig.inputPrompt && !argsString) {
      $.extend(args, deserialize(createParamsAndArgs(interaction)));
      delete args.answerSpace;
      delete args.interaction;
    }
    if (currentConfig.type === 'hyperlink') {
      window.open(currentConfig.hyperlink,currentConfig.hyperlinkTarget);
    } else if (currentConfig.type === 'message') {
      insertHTML(answerBox, currentConfig.message);
      completeFn();
    } else if (currentConfig.type === 'xslt' && isLocalXSLT) {
      $.when(MyAnswers.dfrdMoJOs)
      .always(function() {
        $.when(generateMojoAnswer(args))
        .always(function(html) {
          insertHTML(answerBox, html);
          completeFn();
        });
      });

    } else if (reverse && isPersist) {
      $.when(MyAnswers.store.get('answer___' + interaction)).done(function(html) {
        insertHTML(answerBox, html);
        completeFn();
      });
    } else if (currentConfig.type === 'form' && currentConfig.blinkFormObjectName && currentConfig.blinkFormAction) {
      $.when(MyAnswers.dfrdMoJOs, MyAnswers.formsDeferred.promise())
      .fail(function() {
        html = '<p>Error: forms Interactions are currently unavailable. Reload the application and try again.</p>';
      })
      .then(function() {
        html = $('<form data-object-name="' + currentConfig.blinkFormObjectName + '" novalidate="novalidate" data-action="' + currentConfig.blinkFormAction + '" />');
        html.data(args);
      })
      .always(function() {
        insertHTML(answerBox, html);
        completeFn();
      });
    } else {
      var answerUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php',
      requestData = {
        asn: siteVars.answerSpace,
        iact: currentConfig.name
      },
      fallbackToStorage = function() {
        if (isPersist) {
          $.when(MyAnswers.store.get('answer___' + interaction)).done(function(html) {
            if (typeof html === 'undefined') {
              html = '<p>Unable to reach server, and unable to display previously stored content.</p>';
            }
            insertHTML(answerBox, html);
            completeFn();
          });
        } else {
          html = '<p>Unable to reach server.</p>';
          insertHTML(answerBox, html);
          completeFn();
        }
      },
      postData = {},
      starsData = {},
      method = 'GET';
      /* END :var */
      if (!$.isEmptyObject(args)) {
        $.extend(requestData, args);
      }
      if (requestData._submitStarsType) {
        method = 'POST';
        if ($.type(requestData._submitStarsType) === 'string') {
          requestData._submitStarsType = [requestData._submitStarsType];
        }
        if ($.type(requestData._submitStarsType) === 'array') {
          $.each(requestData._submitStarsType, function(index, value) {
            starsData[value] = starsProfile[value] || {};
          });
        }
        postData[requestData._submitStarsPost || 'stars'] = starsData;
        delete requestData._submitStarsPost;
        delete requestData._submitStarsType;
        answerUrl += '?' + $.param(requestData);
        requestData = postData;
      }
      $.ajax({
        type: method,
        url: answerUrl,
        data: requestData,
        complete: function(xhr, textstatus) { // readystate === 4
          if (textstatus === 'timeout') {
            insertHTML(answerBox, 'Error: the server has taken too long to respond.  (' + textstatus + ' ' + xhr.status + ')');
            completeFn();
          } else if (isAJAXError(textstatus) || xhr.status !== 200) {fallbackToStorage();}
          else {
            log('GetAnswer: storing server response');
            html = xhr.responseText;
            var blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:\{.*\} -->/g),
              b, bLength;
            if ($.type(blinkAnswerMessage) === 'array') {
              bLength = blinkAnswerMessage.length;
              for (b = 0; b < bLength; b++) {
                processBlinkAnswerMessage(blinkAnswerMessage[b].substring(24, blinkAnswerMessage[b].length - 4));
              }
            }
            if (isPersist) {
              MyAnswers.store.set('answer___' + interaction, html);
            }
            insertHTML(answerBox, html);
            completeFn();
          }
        },
        timeout: Math.max(currentConfig.downloadTimeout * 1000, 60 * 1000)
      });
    }
  });
}

/*
 * event handler for the "go" button on inputPrompt screens
 */
function getAnswer(event) {
  var id = resolveItemName(currentInteraction, 'interactions'),
    requestUri,
    args, argsString;
  if (id) {
    args = deserialize(createParamsAndArgs(currentInteraction));
    delete args.asn;
    delete args.iact;
    argsString = $.param(args);
    requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?' + argsString;
    History.pushState({m: currentMasterCategory, c: currentCategory, i: id, 'arguments': args}, null, requestUri);
  }
}

function showKeywordView(keyword) {
  var $view = $('#keywordView');
  $.when(MyAnswersDevice.prepareView($view)).always(function() {
    var config = siteVars.config['i' + keyword].pertinent,
      argsBox = $('#argsBox')[0];
    currentInteraction = keyword;
    updateCurrentConfig();
    insertHTML(argsBox, config.inputPrompt);
    MyAnswersDevice.showView($view);
    setMainLabel(config.displayName || config.name);
  });
}

function goBackToKeywordView(keyword) {
  var $view = $('#keywordView');
  $.when(MyAnswersDevice.prepareView($view, true)).always(function() {
    var config = siteVars.config['i' + keyword].pertinent;
    currentInteraction = keyword;
    updateCurrentConfig();
    MyAnswersDevice.showView($view, true);
    setMainLabel(config.displayName || config.name);
  });
}

function gotoNextScreen(keyword, category, masterCategory) {
  var config,
    i, iLength = siteVars.map.interactions.length;
  log('gotoNextScreen(): ' + keyword);
  keyword = resolveItemName(keyword);
  if (keyword === false) {
    BMP.alert('The requested Interaction could not be found.');
    return;
  }
  config = siteVars.config['i' + keyword];
  if (hasMasterCategories && masterCategory) {
    currentMasterCategory = masterCategory;
  }
  if (hasCategories && category) {
    currentCategory = category;
  }
  currentInteraction = keyword;
  if (config.pertinent.inputPrompt) {
    showKeywordView(keyword);
  } else {
    showAnswerView(keyword);
  }
}

function showSecondLevelAnswerView(keyword, arg0, reverse) {
  var id = resolveItemName(keyword, 'interactions'),
    requestUri;
  log('showSecondLevelAnswerView(): keyword=' + keyword + ' args=' + arg0);
  if (id) {
    requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?' + arg0;
    History.pushState({m: currentMasterCategory, c: currentCategory, i: id, 'arguments': deserialize(arg0)}, null, requestUri);
  }
}

function showKeywordListView(category, masterCategory) {
  var mainLabel,
    $view = $('#keywordListView');
  currentInteraction = null;
  currentCategory = category;
  if (hasMasterCategories && masterCategory) {
    currentMasterCategory = masterCategory;
  }
  log('showKeywordListView(): hasCategories=' + hasCategories + ' currentCategory=' + currentCategory);
  $.when(MyAnswersDevice.prepareView($view)).always(function() {
    updateCurrentConfig();
    if (hasCategories) {
      if (typeof prepareHistorySideBar === 'function') {
        prepareHistorySideBar();
      }
      mainLabel = currentConfig.displayName || currentConfig.name;
    } else {
      mainLabel = 'Interactions';
    }
    MyAnswers.populateItemListing('interactions', $view);
    MyAnswersDevice.showView($view);
    setMainLabel(mainLabel);
  });
}

function goBackToKeywordListView(event) {
  var mainLabel,
    config,
    $view = $('#keywordListView');
  currentInteraction = null;
  // log('goBackToKeywordListView()');
  if (answerSpaceOneKeyword) {
    showKeywordView(0);
    return;
  }
  if (hasMasterCategories && currentMasterCategory === null) {
    goBackToMasterCategoriesView();
    return;
  }
  if (hasCategories && currentCategory === null) {
    goBackToCategoriesView(hasMasterCategories ? currentCategory : null);
    return;
  }
  if (hasCategories) {
    config = siteVars.config['c' + currentCategory].pertinent;
    mainLabel = config.displayName || config.name;
  } else {
    mainLabel = 'Interactions';
  }
  $.when(MyAnswersDevice.prepareView($view, true)).always(function() {
    updateCurrentConfig();
    MyAnswersDevice.showView($view, true);
    setMainLabel(mainLabel);
  });
}

function showHelpView(event)
{
  var helpContents,
    helpBox = document.getElementById('helpBox'),
    $view = $('#helpView');
  $.when(MyAnswersDevice.prepareView($view)).always(function() {
    switch ($('.view:visible').first().attr('id'))
    {
      case 'keywordView':
      case 'answerView':
      case 'answerView2':
        if (currentInteraction) {
          helpContents = siteVars.config['i' + currentInteraction].pertinent.help || 'Sorry, no guidance has been prepared for this item.';
        }
        break;
      default:
        helpContents = siteVars.config['a' + siteVars.id].pertinent.help || 'Sorry, no guidance has been prepared for this item.';
    }
    insertHTML(helpBox, helpContents);
    MyAnswersDevice.showView($view);
  });
}

function goBackToTopLevelAnswerView(event) {
  var $view = $('#answerView');
  log('goBackToTopLevelAnswerView()');
  $.when(MyAnswersDevice.prepareView($view, true)).always(function() {
    MyAnswersDevice.showView($view, true);
  });
}

function submitFormWithRetry(data) {
  var str, arr, method, uuid,
  localKeyword,
  answerUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?',
  $view = $('.view:visible'),
  $box = $view.children('.box').first(),
  requestData;
  /* END: var */
  if ($.type(data) === 'object') {
    str = data.data;
    arr = data.action.split('/');
    method = data.method;
    uuid = data.uuid;
    if (arr[0] === '..') {
      answerUrl += 'asn=' + siteVars.answerSpace + '&iact=' + encodeURIComponent(arr[1]) + (arr[2].length > 1 ? '&' + arr[2].substring(1) : '');
      localKeyword = arr[1];
    } else {
      answerUrl += 'asn=' + arr[1] + '&iact=' + encodeURIComponent(arr[2]);
      localKeyword = arr[2];
    }
    if (method === 'GET') {
      requestData = '&' + str;
    } else {
      method = 'POST';
      requestData = str;
    }

    MyAnswers.$body.trigger('taskBegun');
    $.ajax({
      type: method,
      cache: 'false',
      url: answerUrl,
      data: requestData,
      complete: function(xhr, textstatus) { // readystate === 4
        var html;
        if (isAJAXError(textstatus) || xhr.status !== 200) {
          html = 'Unable to contact server. Your submission has been stored for future attempts.  (' + textstatus + ' ' + xhr.status + ')';
        } else {
          if (MyAnswers.device.persistentStorage) {
            clearPendingFormV1(data.interaction, uuid);
          }
          html = xhr.responseText;
        }
        $.when(MyAnswersDevice.prepareView($view)).always(function() {
          insertHTML($box[0], html);
          $.when(initialiseAnswerFeatures($box)).always(function() {
            MyAnswersDevice.showView($view);
          });
          MyAnswers.$body.trigger('taskComplete');
        });
      },
      timeout: Math.max(currentConfig.uploadTimeout * 1000, computeTimeout(answerUrl.length + requestData.length))
    });
  } else {
    log('submitFormWithRetry(): error: no forms in the queue');
  }
}

function submitForm() {
  var str = '',
    $form = $('.view:visible').find('form').first(),
    action = $form.attr('action'),
    method = $form.attr('method'),
    uuid = Math.uuid(),
    data;

  $form.find('input, textarea, select').each(function(index, element) {
    if (element.name)
    {
      if (element.type && (element.type.toLowerCase() === 'radio' || element.type.toLowerCase() === 'checkbox') && element.checked === false)
      {
        $.noop(); // do nothing for unchecked radio or checkbox
      }
      else
      {
        if (element.type && (element.type.toLowerCase() === 'button') && (lastPictureTaken.image.size() > 0))
        {
          if (lastPictureTaken.image.containsKey(element.name))
          {
            str += '&' + element.name + '=' + encodeURIComponent(lastPictureTaken.image.get(element.name));
            // log("if: " + str);
          }
        }
        else
        {
          if (element.type && (element.type.toLowerCase() === 'button')) {
            if ((element.value !== 'Gallery') && (element.value !== 'Camera'))
            {
              str += '&' + element.name + '=' + encodeURIComponent(element.value);
            }
            else
            {
              str += '&' + element.name + '=';
            }
          }
          else
          {
            str += '&' + element.name + '=' + encodeURIComponent(element.value);
          }
          // log("else: " + str);
        }
      }
    }
  });
  log('lastPictureTaken.image.size() = ' + lastPictureTaken.image.size());
  lastPictureTaken.image.clear();

  // var str = $('form').first().find('input, textarea, select').serialize();
  log('submitForm(2): ' + document.forms[0].action);
  // log("submitForm(2a): " + str);

  data = {
    data: str,
    'action': action,
    'method': $.type(method) === 'string' ? method.toUpperCase() : 'post',
    'uuid': uuid,
    interaction: currentInteraction
  };

  if (MyAnswers.device.persistentStorage) {
    $.when(pushPendingFormV1(currentInteraction, uuid, data))
      .fail(function() {
        BMP.alert('Error: unable to feed submission through queue.');
      })
      .then(submitFormWithRetry);
    // queuePendingFormData(str, document.forms[0].action, document.forms[0].method.toLowerCase(), Math.uuid(), submitFormWithRetry);
  } else {
    submitFormWithRetry(data);
  }
  return false;
}

function submitAction(keyword, action) {
  log('submitAction(): keyword=' + keyword + ' action=' + action);
  var $view = $('.view:visible,'),
    $box = $view.children('.box'),
    form = $box.find('form').first(),
    $submits = form.find('input[type=submit]'),
    sessionInput = form.find('input[name=blink_session_data]'),
    formData = (action === 'cancel=Cancel') ? '' : form.find('input, textarea, select').serialize(),
    method = form.attr('method'),
    requestData, requestUrl,
    serializedProfile;
  if ($submits.length === 1 && $submits.attr('name') && $submits.val()) {
    formData += '&' + $submits.attr('name') + '=' + $submits.val();
  }
  if (sessionInput.size() === 1 && ! $.isEmptyObject(starsProfile)) {
    serializedProfile = '{"stars":' + JSON.stringify(starsProfile) + '}';
    formData = formData.replace('blink_session_data=', 'blink_session_data=' + encodeURIComponent(serializedProfile));
    method = 'post';
  }
  if ($.type(method) === 'string' && method.toLowerCase() === 'get') {
    method = 'GET';
    requestUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?asn=' + siteVars.answerSpace + '&iact=' + keyword;
    requestData = '&' + formData + (typeof action === 'string' && action.length > 0 ? '&' + action : '');
  } else {
    method = 'POST';
    requestUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?asn=' + siteVars.answerSpace + '&iact=' + keyword + (typeof action === 'string' && action.length > 0 ? '&' + action : '');
    requestData = formData;
  }
  MyAnswers.$body.trigger('taskBegun');
  $.ajax({
    type: method,
    cache: 'false',
    url: requestUrl,
    data: requestData,
    complete: function(xhr, textstatus) { // readystate === 4
      var html,
          b, bLength,
          blinkAnswerMessage;
      /* END: var */
      if (isAJAXError(textstatus) || xhr.status !== 200) {
        html = 'Unable to contact server.';
      } else {
        html = xhr.responseText;
      }
      blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:\{.*\} -->/g);
      if ($.type(blinkAnswerMessage) === 'array') {
        bLength = blinkAnswerMessage.length;
        for (b = 0; b < bLength; b++) {
          processBlinkAnswerMessage(blinkAnswerMessage[b].substring(24, blinkAnswerMessage[b].length - 4));
        }
      }
      $.when(MyAnswersDevice.prepareView($view)).always(function() {
        insertHTML($box[0], html);
        $.when(initialiseAnswerFeatures($box)).always(function() {
          MyAnswersDevice.showView($view);
        });
        MyAnswers.$body.trigger('taskComplete');
      });
    },
    timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(requestUrl.length + requestData.length))
  });
  return false;
}

// *** BEGIN APPLICATION INIT ***

/* moving non-public functions into a closure for safety */
(function(window) {
  var document = window.document,
    siteVars = window.siteVars,
    deviceVars = window.deviceVars,
    MyAnswers = window.MyAnswers,
    $ = window.jQuery,
    $startup = $('#startUp'),
    navigator = window.navigator,
    $window = $(window),
    History, _pushState, _replaceState,  // defined in onBrowserReady
    google; // defined in MyAnswers.setupGoogleMaps

  /* *** BLINKGAP FUNCTIONS *** */

  /**
   * @return {jQueryPromise}
   */
  function waitForBlinkGap() {
    var dfrd = new $.Deferred(),
        start = $.now(),
        $progressDot = $('#startUp-initBlinkGap'),
        /** @inner */
        checkFn = function() {
          if (window.PhoneGap) {
            if (window.PhoneGap.available) {
              dfrd.resolve();
            } else {
              $(document).on('deviceready', dfrd.resolve);
            }
          } else if (($.now() - start) > 10 * 1000) {
            warn('waitForBlinkGap(): still no PhoneGap after 10 seconds');
            dfrd.reject();
          } else {
            setTimeout(checkFn, 197);
          }
        };
    /* END: var */
    if (!window.isBlinkGap) {
      log('waitForBlinkGap(): native application not detected');
      $progressDot.remove();
      dfrd.resolve();
      return dfrd.promise();
    }
    log('waitForBlinkGap(): native application detected');
    $progressDot.addClass('working');
    checkFn();
    $.when(dfrd.promise())
    .fail(function() {
          $progressDot.addClass('error');
        })
    .then(function() {
          $progressDot.addClass('success');
        });
    return dfrd.promise();
  }

  /**
   * @return {jQueryPromise}
   */
  function fixWebSQL() {
    var deferred = new $.Deferred(),
    db = null,
    /* @inner */
    increaseQuota_Success = function(quotaIncrease) {
      db = null;
      navigator.notification.alert('Database installed, please restart the App.',
                                   function() {
                                     navigator.gap_database.requestTerminate();
                                   },
                                   'First Run',
                                   'Close App');
      // we do not resolve here, the only way out is to terminate
      log('fixWebSQL(): quota increase: ' + quotaIncrease);
    },
    /* @inner */
    getDBLimits_Success = function(results) {
      var options = {quotaIncrease: String(MyAnswers.device.storageQuota)},
      allocatedSpace = results.allocatedSpace,
      currentQuota = results.currentQuota;
      /* END: var */
      log('fixWebSQL(): allocatedSpace=' + allocatedSpace + ' currentQuota=' + currentQuota);
      if (currentQuota < MyAnswers.device.storageQuota) {
        navigator.gap_database.increaseQuota(increaseQuota_Success, deferred.reject, options);
      } else {
        deferred.resolve();
      }
    };
    /* END: var */
    if (MyAnswers && MyAnswers.device && MyAnswers.device.storageQuota
        && $.type(MyAnswers.device.storageQuota) === 'number'
        && MyAnswers.device.storageQuota > 0) {
      log('fixWebSQL(): requestedQuota=' + MyAnswers.device.storageQuota);
      try {
        db = window.openDatabase(siteVars.answerSpace, '1.0', siteVars.answerSpace, 1024 * 1024);
        navigator.gap_database.getLimits(getDBLimits_Success, deferred.reject, null);
      } catch (error) {
        deferred.reject();
        log(error);
        log('*** Open/Increase quota for database failed');
        throw 'fixWebSQL(): ' + error;
      }
    } else {
      log('fixWebSQL(): nothing to do');
      deferred.resolve();
    }
    return deferred.promise();
  }

  /* *** HELPER FUNCTIONS *** */

  function updateLocalStorage() {
    /*
     * version 0 = MoJOs stored in new format, old siteConfig removed
     */
    var dfrd = new $.Deferred();
    if (MyAnswers.store) {
      $.when(MyAnswers.store.get('storageVersion'))
      .always(function(value) {
        if (!value) {
          $.when(
            MyAnswers.store.set('storageVersion', 0),
            MyAnswers.store.remove('siteConfigMessage'),
            MyAnswers.store.removeKeysRegExp(/^mojoMessage-/)
          ).always(function() {
            dfrd.resolve();
          });
        } else {
          dfrd.resolve();
        }
      });
    } else {
      dfrd.resolve();
    }
    return dfrd.promise();
  }

  /**
   * remove hash / anchor / fragments from a state object destined for History
   */
  function trimHistoryState(state) {
    var index, array, object,
    type = $.type(state);
    /* END: var */
    if (type === 'string' && state.length > 0) {
      index = state.indexOf('#');
      if (index !== -1) {
        state = state.substring(0, index);
      }
    } else if (type === 'array' && state.length > 0) {
      array = [];
      $.each(state, function(index, value) {
        array.push(trimHistoryState(value));
      });
      state = array;
    } else if (type === 'object') {
      object = {};
      $.each(state, function(key, value) {
        object[key] = trimHistoryState(value);
      });
      state = object;
    }
    return state;
  }

  function networkReachableFn(state) {
    state = state.code || state;
    deviceVars.isOnline = state > 0;
    deviceVars.isOnlineCell = state === 1;
    deviceVars.isOnlineWiFi = state === 2;
    log('BlinkGap.networkReachable(): online=' + deviceVars.isOnline + ' cell=' + deviceVars.isOnlineCell + ' wifi=' + deviceVars.isOnlineWiFi);
  }

  /* *** EVENT HANDLERS *** */

  MyAnswers.cacheDfrd = new $.Deferred();
  if (window.applicationCache) {
    $(window.applicationCache).on({
      noupdate: function (event) {
        log('applicationCache: status=' + this.status + ' event=' + event.type);
        MyAnswers.cacheDfrd.resolve();
      },
      cached: function (event) {
        log('applicationCache: status=' + this.status + ' event=' + event.type);
        MyAnswers.cacheDfrd.resolve();
      },
      obsolete: function (event) {
        log('applicationCache: status=' + this.status + ' event=' + event.type);
        MyAnswers.cacheDfrd.resolve();
      },
      updateready: function(event) {
        log('applicationCache: status=' + this.status + ' event=' + event.type);
        log('applicationCache: reloading to use updated resources...');
        window.location.reload();
      },
      error: function(event) {
        log('applicationCache: status=' + this.status + ' event=' + event.type);
        error('Application Cache: ' + this.status);
        MyAnswers.cacheDfrd.resolve();
      }
    });

  } else {
    MyAnswers.cacheDfrd.resolve();
  }

  function onOrientationChange(event) {
    var screenX,
        screenY,
        windowX,
        windowY,
        orientation,
        oldOrientation = MyAnswers.orientation,
        isRotated;

    if ($.inArray('ios', deviceVars.features) !== -1
        && Math.abs(window.orientation || 0) === 90) {
      screenX = window.screen.height;
      screenY = window.screen.width;
    } else {
      screenX = window.screen.width;
      screenY = window.screen.height;
    }
    windowX = window.innerWidth;
    windowY = window.innerHeight;
    orientation = windowX > windowY ? 'landscape' : 'portrait';
    $.extend(MyAnswers, {
      screenX: screenX,
      screenY: screenY,
      windowX: windowX,
      windowY: windowY,
      orientation: orientation
    });
    if (oldOrientation && oldOrientation !== orientation) {
      log('onOrientationChange(): rotated!');
      updateCurrentConfig();
    }
    $window.trigger('scroll');
  }

  function onNetworkChange() {
    var host;
    //    if (window.device && navigator.network) { // TODO: check when this BlinkGap code will actually work (state.code === undefined)
    //      host = siteVars.serverDomain ? siteVars.serverDomain.split(':')[0] : 'blinkm.co';
    //      navigator.network.isReachable(host, networkReachableFn);
    //    } else {
      deviceVars.isOnline = navigator.onLine === true;
      log('onNetworkChange(): online=' + deviceVars.isOnline);
    //    }
  }

  // TODO: a window resize event _may_ cause DOM issues with out transitions
  /*  function onWindowResize(event) {
    $('html').css('min-height', window.innerHeight);
  } */

  function onPendingClick(event) {
    var $button = $(event.target),
        action = $button.data('action'),
        requestUri,
        $box,
        dispatch,
        networkText = 'Check your network connectivity and try again.',
        cancelText = 'Are you sure you wish to discard this pending record?',
        submitAllText = 'Submitting all records may take some time, continue?',
        // variables needed for record-specific actions
        $entry,
        version,
        id,
        idParts,
        interaction,
        form,
        uuid,
        /**
     * @inner
     */
        submitFn = function($entry) {
          var dfrd = new $.Deferred(),
              id = $entry.data('id'),
              idParts = id.split(':'),
              interaction = idParts[0],
              interactionName,
              form = idParts[1],
              uuid = idParts[2];
          /* END: var */
          if (siteVars.config['i' + interaction]) {
            interactionName = siteVars.config['i' + interaction].pertinent.name;
          } else {
            BMP.alert('Error: this record requires an Interaction that not currently available');
            return;
          }
          $button.prop('disabled', true);
          $.when(MyAnswers.pendingStore.get(interaction + ':' + form + ':' + uuid))
      .fail(function() {
                BMP.alert('Error: unable to retrieve this form');
                $button.prop('disabled', false);
              })
      .then(function(json) {
                var formData;
                if (typeof json !== 'string' || json.length === 0) {
                  $button.prop('disabled', false);
                  return;
                }
                if ($.type(json) !== 'object') {
                  json = $.parseJSON(json);
                }
                switch ($.type(json)) {
                  case 'array':
                    formData = json[0];
                    break;
                  case 'object':
                    formData = json;
                    break;
                }
                $entry.addClass('s-working');
                $.when(BlinkForms.submitData(interactionName, form, formData))
        .always(function(response, status, jqxhr) {
                      var swap;
                      if (!jqxhr || $.type(jqxhr.promise) !== 'function') {
                        swap = jqxhr;
                        jqxhr = response;
                        response = swap;
                      }
                      $button.prop('disabled', false);
                      if (jqxhr.status === 200 && response) {
                        if (MyAnswers.store) {
                          clearPendingForm(interaction, form, uuid);
                          $entry.remove();
                        }
                      } else {
                        $entry.toggleClass('s-working s-error');
                      }
                      dfrd.resolve();
                    });
              });
          return dfrd.promise();
        };
    /* END: var */
    if (action === 'submit-all') {
      if (!deviceVars.isOnline) {
        BMP.alert(networkText, { title: 'Forms Queue' });
        return;
      }
      BMP.confirm(submitAllText, { title: 'Forms Queue' })
          .then(function(result) {
            if (result) {
              dispatch = new BlinkDispatch(197);
              $box = $button.closest('.box, .view');
              $box.find('[data-blink="active-form"][data-id]')
                  .each(function(index, element) {
                    dispatch.add(function() {
                      return submitFn($(element));
                    });
                  });
            }
          });

    } else {
      $entry = $button.closest('[data-blink="active-form"]');
      version = $entry.data('version');
      id = $entry.data('id');
      idParts = id.split(':');
      interaction = idParts[0];
      form = idParts[1];
      uuid = idParts[2];
      if (version === 2) {
        if (action === 'clear') {
          BMP.confirm(cancelText, { title: 'Forms Queue' }).then(function(result) {
            if (result) {
              $.when(clearPendingForm(interaction, form, uuid))
                  .then(function() {
                    $entry.remove();
                  });
            }
          })

        } else if (action === 'resume') {
          requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + interaction].pertinent.name + '/?_uuid=' + uuid;
          History.pushState({m: currentMasterCategory, c: currentCategory, i: interaction, 'arguments': {pendingForm: id}}, null, requestUri);

        } else if (action === 'submit') {
          submitFn($entry);

        }
      } else if (version === 1) {
        if (action === 'clear') {
          BMP.confirm(cancelText, { title: 'Forms Queue' }).then(function(result) {
            if (result) {
              $.when(clearPendingFormV1(interaction, uuid))
                  .then(function() {
                    $entry.remove();
                  });
            }
          });

        } else if (action === 'submit') {
          $.when(MyAnswers.pendingV1Store.get(interaction + ':' + uuid))
              .fail(function() {
                BMP.alert('Unable to retrieve record from storage.', { title: 'Forms Queue' });
              })
              .then(function(data) {
                data = $.parseJSON(data);
                submitFormWithRetry(data);
              });
        }
      }
    }
  }

  function onTaskBegun(event) {
    MyAnswers.runningTasks++;
    if ($('#startUp').size() > 0) {return true;}
    if (typeof MyAnswers.activityIndicatorTimer === 'number') {return true;}
    MyAnswers.activityIndicatorTimer = setTimeout(function() {
      clearTimeout(MyAnswers.activityIndicatorTimer);
      MyAnswers.activityIndicatorTimer = null;
      $(MyAnswers.activityIndicator).show();
    }, 1000);
    return true;
  }

  function onTaskComplete(event) {
    if (MyAnswers.runningTasks > 0) {
      MyAnswers.runningTasks--;
    }
    if (MyAnswers.runningTasks <= 0) {
      if (MyAnswers.activityIndicatorTimer !== null) {
        clearTimeout(MyAnswers.activityIndicatorTimer);
      }
      MyAnswers.activityIndicatorTimer = null;
      $(MyAnswers.activityIndicator).hide();
    }
    return true;
  }

  /* *** INITIALISATION FUNCTIONS *** */

  function displayAnswerSpace() {
    var startUp = $('#startUp'),
        $masterCategoriesView = $('#masterCategoriesView'),
        $categoriesView = $('#categoriesView'),
        $keywordListView = $('#keywordListView'),
        token = siteVars.queryParameters._t;
    /* END: var */
    delete siteVars.queryParameters._t;
    if (startUp.size() > 0 && typeof siteVars.config !== 'undefined') {
      if ($.inArray('phone', deviceVars.features) !== -1 || $(window).width() < 768) {
        $('#mainLabel').remove(); //  TODO: fix the main navigation label
      }
      currentConfig = siteVars.config['a' + siteVars.id].pertinent;
      // identifying landing page
      switch (siteVars.config['a' + siteVars.id].pertinent.siteStructure) {
        case 'interactions only':
          $masterCategoriesView.remove();
          $categoriesView.remove();
          break;
        case 'categories':
          $masterCategoriesView.remove();
          $keywordListView.find('.welcomeBox').remove();
          break;
        case 'master categories':
          $categoriesView.find('.welcomeBox').remove();
          $keywordListView.find('.welcomeBox').remove();
          break;
      }
      $('#answerSpacesListView').remove();
      MyAnswers.gotoDefaultScreen();
      $.when(restoreSessionProfile(token))
      .always(function() {
            var interaction = resolveItemName(siteVars.queryParameters.keyword),
                config = siteVars.config['a' + siteVars.id].pertinent,
                requestUri;
            /* END: var */
            delete siteVars.queryParameters.keyword;
            if (interaction && ! $.isEmptyObject(siteVars.queryParameters)) {
              requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + interaction].pertinent.name + '/?' + $.param(siteVars.queryParameters);
              History.pushState({
                i: interaction,
                'arguments': siteVars.queryParameters
              }, null, requestUri);
            } else if (interaction) {
              requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + interaction].pertinent.name + '/?';
              History.pushState({
                i: interaction
              }, null, requestUri);
            } else if (typeof siteVars.queryParameters._c === 'string') {
              requestUri = '/' + siteVars.answerSpace + '/?_c=' + siteVars.queryParameters._c;
              History.pushState({
                c: siteVars.queryParameters._c
              }, null, requestUri);
            } else if (typeof siteVars.queryParameters._m === 'string') {
              requestUri = '/' + siteVars.answerSpace + '/?_m=' + siteVars.queryParameters._m;
              History.pushState({
                m: siteVars.queryParameters._m
              }, null, requestUri);
            }
            delete siteVars.queryParameters;
          });
    }
    startUp.remove();
    $('#content').show();
    setSubmitCachedFormButton();
    processForms();
    if (MyAnswers.device.persistentStorage) {
      MyAnswers.dfrdMoJOs = processMoJOs();
    }
  }

  function loaded() {
    var isPersist = MyAnswers.device.persistentStorage;
    log('loaded():');
    try {
      if (isPersist) {
        MyAnswers.store.set('answerSpace', siteVars.answerSpace);
      }
      $.when(isPersist ? MyAnswers.siteStore.get('config') : true)
      .then(function(data) {
        if (typeof data === 'string') {
          data = $.parseJSON(data);
        }
        if ($.type(data) === 'object') {
          siteVars.config = data;
        }
      }).always(function() {
        $.when(isPersist ? MyAnswers.siteStore.get('map') : true)
        .then(function(data) {
          if (typeof data === 'string') {
            data = $.parseJSON(data);
          }
          if ($.type(data) === 'object') {
            siteVars.map = data;
          }
        })
        .always(function() {
          $.when(requestLoginStatus())
          .always(function() {
            $.when(requestConfig())
            .always(function() {
              if (siteVars.map && siteVars.config) {
                processConfig();
                displayAnswerSpace();

                // hook orientation events
                if (Modernizr.orientation) {
                  $window.on('orientationchange', onOrientationChange);
                }
                $window.on('resize', onOrientationChange);
                onOrientationChange();
              } else {
                $startup.append('error: unable to contact server, insufficient data found in local storage');
              }
            });
          });
        });
      });
      $.when(isPersist ? MyAnswers.store.get('starsProfile') : true)
      .then(function(stars) {
        if ($.type(stars) === 'string') {
          stars = $.parseJSON(stars);
        }
        if ($.type(stars) === 'object') {
          starsProfile = stars;
        }
      });
      $('#startUp-initLoaded').addClass('success');
    } catch (e) {
      log('loaded(): exception:');
      log(e);
      $('#startUp-initLoaded').addClass('error');
      $startup.append('loading error: ' + e);
    }
  }

  function init_main() {
    var storeEngine = null, // pick automatic engine by default
    loadedPromises = [],
    dfrdFixWebSQL,
        userAgent = navigator.userAgent,
        domainWhitelist;
    /* END: var */

    log('init_main(): ');
    siteVars.requestsCounter = 0;

    PictureSourceType.PHOTO_LIBRARY = 0;
    PictureSourceType.CAMERA = 1;
    lastPictureTaken.image = new Hashtable();
    lastPictureTaken.currentName = null;

    $.fx.interval = 27; // default is 13, larger is kinder on devices

    MyAnswers.dispatch = new BlinkDispatch(isBlinkGapDevice() ? 149 : 47);

    MyAnswers.runningTasks = 0; // track the number of tasks in progress

    // to facilitate building regex replacements
    RegExp.quote = function(str) {return str.replace(/([.?*+\^$\[\]\\(){}\-])/g, '\\$1');};

    MyAnswers.activityIndicator = document.getElementById('activityIndicator');
    MyAnswers.activityIndicatorTimer = null;

    MyAnswers.$body.bind('taskBegun', onTaskBegun);
    MyAnswers.$body.bind('taskComplete', onTaskComplete);
    MyAnswers.$body.delegate('a:not([href="#"])', 'click', onLinkClick);
    MyAnswers.$body.delegate('a[href="#"]', 'click', false);
    MyAnswers.$body.on('click', '[data-blink="active-form"] button', function(event) {
      event.preventDefault();
      onPendingClick(event);
      return false;
    });

    if (!_Blink.isPhantomJS) {
      // enable network detection, but not for PhantomJS (it's broken)
      $window.bind('online', onNetworkChange);
      $window.bind('offline', onNetworkChange);
      onNetworkChange(); // $window.trigger('online');
    }

    // pre-configure storage system for BlinkGap if necessary
    if (isBlinkGapDevice()) {
      storeEngine = null; // native application should always use auto-select
      if (navigator.gap_database && $.inArray('websqldatabase', BlinkStorage.prototype.available) !== -1) {
        dfrdFixWebSQL = fixWebSQL();
      } else {
        dfrdFixWebSQL = true; // will count as an instantly resolved Deferred Promise
      }
    } else if (userAgent.indexOf('Android') !== -1) {
      // Android has problems with persistent storage
      storeEngine = 'sessionstorage';
    }

    // pre-configure domain whitelist for BlinkGap if necessary
    if (isBlinkGapDevice() && MyAnswers.device.domainWhitelist
        && window.navigator.whitelistmanage) {
      domainWhitelist = MyAnswers.device.domainWhitelist;
      if ($.type(domainWhitelist) === 'array') {
        log('BlinkGap: replacing domain whitelist...');
        try {
          navigator.whitelistmanage.appendToWhitelist($.noop, $.noop, {
            externalHosts: domainWhitelist
          });
        } catch (e) {
          log('BlinkGap: domain whitelist error...');
          error(e);
        }
        log('BlinkGap: domain whitelist replaced!');
      }
    }

    // wait for Application Cache
    loadedPromises.push(MyAnswers.cacheDfrd.promise());

    // fix the WebSQL quota is necessary and open required persistent stores
    $.when(dfrdFixWebSQL)
    .always(function() {
      if (MyAnswers.device.persistentStorage) {

          try {
            MyAnswers.store = new BlinkStorage(storeEngine, siteVars.answerSpace, 'jstore');
            loadedPromises.push(MyAnswers.store.ready());
            MyAnswers.siteStore = new BlinkStorage(storeEngine, siteVars.answerSpace, 'site');
            loadedPromises.push(MyAnswers.siteStore.ready());
            MyAnswers.pendingStore = new BlinkStorage(null, siteVars.answerSpace, 'pending');
            loadedPromises.push(MyAnswers.pendingStore.ready());
            MyAnswers.pendingV1Store = new BlinkStorage(null, siteVars.answerSpace, 'pendingV1');
            loadedPromises.push(MyAnswers.pendingV1Store.ready());
          } catch (e) {
            $startup.addClass('s-error');
            $('#startUp-initMain').addClass('error');
            if (e.toString) {
              $startup.children('output').text(e.toString());
            }
            $startup.children('article[data-name="persistentfull"]').show();
            return;
          }
      }

      $.whenArray(loadedPromises)
      .fail(function() {
        $('#startUp-initMain').addClass('error');
        throw ('initMain(): unable to initialise device storage');
      })
      .then(function() {
        $.when(updateLocalStorage())
        .always(function() {
          $('#startUp-initMain').addClass('success');
          $('#startUp-initLoaded').addClass('working');
          loaded();
          log('loaded(): returned after call by BlinkStorage');
        });
      });
      log('init_main(): finished...');
    });
  }

  function onBrowserReady() {
    var $startup = $('#startUp');
    log('onBrowserReady: ' + window.location.href);
    try {
      History = window.History;
      // duck-punching some History functions to fix states early
      _pushState = History.pushState;
      History.pushState = function() {
        var args = $.makeArray(arguments);
        if (args.length >= 1) {
          args[0] = trimHistoryState(args[0]);
        }
        if (args.length >= 3) {
          args[2] = trimHistoryState(args[2]);
        }
        _pushState.apply(History, args);
      };
      _replaceState = History.replaceState;
      History.replaceState = function() {
        var args = $.makeArray(arguments);
        if (args.length >= 1) {
          args[0] = trimHistoryState(args[0]);
        }
        if (args.length >= 3) {
          args[2] = trimHistoryState(args[2]);
        }
        _replaceState.apply(History, args);
      };

      log('domain=' + siteVars.serverDomain + ' branch=' + siteVars.serverAppBranch + ' version=' + siteVars.serverAppVersion + ' device=' + deviceVars.device);

      siteVars.serverAppPath = '/_' + siteVars.serverAppBranch + '_/common/' + siteVars.serverAppVersion;
      siteVars.serverDevicePath = '/_' + siteVars.serverAppBranch + '_/' + deviceVars.device + '/' + siteVars.serverAppVersion;
      siteVars.queryParameters = getURLParameters();
      delete siteVars.queryParameters.uid;
      delete siteVars.queryParameters.answerSpace;

      MyAnswers.$html = $('html');
      MyAnswers.$body = MyAnswers.$html.children('body');
      MyAnswers.$document = $(window.document);
      MyAnswers.$window = $window;
      MyAnswers.$footer = MyAnswers.$body.children('footer');

      $window.on('statechange', function(event) {
        var state = History.getState(),
            args = state.data['arguments'];
        // TODO: work out a way to detect Back-navigation so reverse transitions can be used
        try {
          log('History.stateChange: ' + $.param(state.data) + ' ' + state.url);
          if ($.type(siteVars.config) !== 'object' || $.isEmptyObject(currentConfig)) {
            $.noop(); // do we need to do something if we have fired this early?
          } else if (state.data.storage) {
            showPendingView();
          } else if (siteVars.hasLogin && state.data.login) {
            showLoginView();
          } else if (hasInteractions && state.data.i) {
            if ($.isEmptyObject(args) || args.inputs) {
              gotoNextScreen(state.data.i);
            } else {
              showAnswerView(state.data.i, args);
            }
          } else if (hasCategories && state.data.c) {
            showKeywordListView(state.data.c);
          } else if (hasMasterCategories && state.data.m) {
            showCategoriesView(state.data.m);
          } else {
            if (hasMasterCategories) {
              showMasterCategoriesView();
            } else if (hasCategories) {
              showCategoriesView();
            } else if (answerSpaceOneKeyword) {
              gotoNextScreen(siteVars.map.interactions[0]);
            } else {
              showKeywordListView();
            }
          }
        } catch (error) {
          error('Error in onStateChange handler...');
        }
        event.preventDefault();
        return false;
      });

      if (location.href.indexOf('index.php?answerSpace=') !== -1) {
        History.replaceState(null, null, '/' + siteVars.answerSpace + '/');
      }
      if (document.getElementById('loginButton') !== null) {
        // TODO: get hasLogin working directly off new config field
        siteVars.hasLogin = true;
      }

      // TODO: finish work on HTML5 Web Worker support
      /*
       * deviceVars.hasWebWorkers = typeof window.Worker === 'function'; if
       * (deviceVars.hasWebWorkers === true) { MyAnswers.webworker = new
       * Worker(siteVars.serverAppPath + '/webworker.js');
       * MyAnswers.webworker.onmessage = function(event) { switch
       * (event.data.fn) { case 'log': log(event.data.string);
       * break; case 'processXSLT': log('WebWorker: finished
       * processing XSLT'); var target =
       * document.getElementById(event.data.target); insertHTML(target,
       * event.data.html); break; case 'workBegun':
       * MyAnswers.$body.trigger('taskBegun'); break; case 'workComplete':
       * MyAnswers.$body.trigger('taskComplete'); break; } }; }
       */

      $.when(waitForBlinkGap())
      .then(function() {
            if (isBlinkGapDevice() && $.type(onDeviceReady) === 'function') {
              onDeviceReady();
            }
          })
      .always(function() {
            MyAnswers.browserDeferred.resolve();
          });

      $('#startUp-initBrowser').addClass('success');
    } catch (e) {
      log('onBrowserReady: Exception');
      log(e);
      $startup.append('browser error: ' + e);
      $('#startUp-initBrowser').addClass('error');
    }
  }

  MyAnswers.bootPromises = [
    MyAnswers.deviceDeferred.promise(),
    MyAnswers.browserDeferred.promise(),
    MyAnswers.mainDeferred.promise()
  ];
  $.whenArray(MyAnswers.bootPromises).done(function() {
    log('all promises kept, initialising...');
    try {
      $('#startUp-initMain').addClass('working');
      init_main();
      $('#startUp-initDevice').addClass('working');
      init_device();
    } catch (e) {
      log('exception in init_?():');
      log(e);
      $startup.append('initialisation error: ' + e);
    }
    log('User-Agent: ' + window.navigator.userAgent);
    delete MyAnswers.bootPromises;
    delete MyAnswers.deviceDeferred;
    delete MyAnswers.browserDeferred;
    delete MyAnswers.mainDeferred;
  }).fail(function() {
    log('init failed, not all promises kept');
  });

  // *** DOM DOCUMENT READY ***

  $(document).ready(function() {
    var userAgent = navigator.userAgent,
        safariTest;
    /* END: var */

    // check if Safari's Private Browsing is enabled
    if (userAgent.indexOf('Safari') !== -1 && window.localStorage) {
      safariTest = 'SafariTest-' + (Math.random() * Math.pow(10, 16));
      try {
        window.localStorage.setItem(safariTest, safariTest);
        window.localStorage.removeItem(safariTest);
      } catch (e) {
        $startup.addClass('s-error');
        if (e.toString) {
          $startup.children('output').text(e.toString());
        }
        $startup.children('article[data-name="privatesafari"]').show();
        return;
      }
    }

    $('#startUp-loadPolyFills').addClass('working');

    // set default options / headers for $.ajax()
    $.ajaxPrefilter(function(options, original, jqxhr) {
        var url = decodeURI(options.url),
          config = {
            answerSpaceId: siteVars.id,
            answerSpace: siteVars.answerSpace,
            conditions: deviceVars.features
          };
        /*
         * xhr.onprogress = function(e) { var string = 'AJAX progress: ' +
         * phpName; log(string + ' ' + e.position + ' ' +
         * e.total + ' ' + xhr + ' ' + options); }
         */
        if (url.length > 100) {
          url = url.substring(0, 100) + '...';
        }
        jqxhr.setRequestHeader('X-Blink-Config', JSON.stringify(config));
        jqxhr.setRequestHeader('X-Blink-Statistics', $.param({
          'requests': ++siteVars.requestsCounter
        }));
        // prevent jQuery from disabling cache mechanisms
        options.cache = 'true';
        log('AJAX start: ' + url);
    });

    // define linear multi-getScript method
    $.getScripts = function(urls) {
      var dfrd = new $.Deferred();
      if ($.type(urls) !== 'array') {
        dfrd.reject();
      } else if (!urls.length) {
        dfrd.resolve();
      } else {
        $.getCachedScript(urls.shift())
        .fail(dfrd.reject)
        .then(function() {
          $.getScripts(urls)
          .fail(dfrd.reject)
          .then(dfrd.resolve);
        });
      }
      return dfrd.promise();
    };

    $.when(MyAnswers.mainDeferred.promise())
    .then(function() { // load in JSON and XSLT polyfills if necessary
      var dfrdJSON,
          dfrdXPath = new $.Deferred(),
          dfrdXSLT;

      // poly-fill JSON
      if (window.JSON && window.JSON.stringify) {
        dfrdJSON = true;
      } else {
        dfrdJSON = $.getCachedScript(_Blink.cdnp.getURL('json2.min.js'));
      }

      // poly-fill XPath
      if (window.XSLTProcessor && Modernizr.xpath) {
        log('XPath supported natively');
        dfrdXPath.resolve();
      } else if (window.xpathParse) {
        log('XPath supported via AJAXSLT');
        dfrdXPath.resolve();
      } else {
        $.getScripts([
          _Blink.cdnp.getURL('ajaxslt/0.8.1-r61/xmltoken.min.js'),
          _Blink.cdnp.getURL('ajaxslt/0.8.1-r61/util.min.js'),
          _Blink.cdnp.getURL('ajaxslt/0.8.1-r61/dom.min.js'),
          // TODO: figure out how to test if the above scripts are needed
          _Blink.cdnp.getURL('ajaxslt/0.8.1-r61/xpath.min.js')
        ])
        .fail(dfrdXPath.reject)
        .then(dfrdXPath.resolve);
      }

      // poly-fill XSLT, after XPath
      if (window.XSLTProcessor) {
        log('XSLT supported natively');
        dfrdXSLT = true;
      } else if (window.xsltProcess) {
        log('XSLT supported via AJAXSLT');
        dfrdXSLT = true;
      } else {
        dfrdXSLT = dfrdXPath.pipe(function() {
          return $.getCachedScript(_Blink.cdnp.getURL('ajaxslt/0.8.1-r61/xslt.min.js'));
        });
      }

      $.when(dfrdJSON, dfrdXPath.promise(), dfrdXSLT)
      .fail(function() {
        $('#startUp-loadPolyFills').addClass('error');
        $('#startUp').append('<p>error: refresh the application or clear cache and try again</p>');
      })
      .then(function() {
        $('#startUp-loadPolyFills').addClass('success');
        $('#startUp-initBrowser').addClass('working');
        setTimeout(onBrowserReady, window.device ? 2000 : 193);
      });
    });
  });

}(this));

// END APPLICATION INIT

document.getElementById('startUp-loadMain').className = 'working success';
MyAnswers.mainDeferred.resolve();
