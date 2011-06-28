var MyAnswers = MyAnswers || {},
	siteVars = siteVars || {},
	deviceVars = deviceVars || {},
	locationTracker, latitude, longitude, webappCache,
	hasCategories = false, hasMasterCategories = false, hasVisualCategories = false, hasInteractions = false, answerSpaceOneKeyword = false,
	currentInteraction, currentCategory, currentMasterCategory, currentConfig = {},
	starsProfile,
	ajaxQueue;

currentConfig.downloadTimeout = 30;
currentConfig.uploadTimeout = 45;
deviceVars.isOnline = true;

function PictureSourceType() {}
function lastPictureTaken () {}

MyAnswers.browserDeferred = new $.Deferred();
MyAnswers.mainDeferred = new $.Deferred();
siteVars.mojos = siteVars.mojos || {};
siteVars.forms = siteVars.forms || {};

// *** BEGIN UTILS ***

(function($, undefined) {
	// duck-punching to make attr() return a map
	var _oldAttr = $.fn.attr;
	$.fn.attr = function() {
		var a, aLength, attributes,	map;
		if (this[0] && arguments.length === 0) {
			map = {};
			attributes = this[0].attributes;
			aLength = attributes.length;
			for (a = 0; a < aLength; a++) {
				map[attributes[a].name.toLowerCase()] = attributes[a].value;
			}
			return map;
		} else {
			return _oldAttr.apply(this, arguments);
		}
	};
	
	// return just the element's HTML tag (no attributes or innerHTML)
	$.fn.tag = function() {
		var tag;
		if (this[0]) {
			tag = this[0].tagName || this[0].nodeName;
			return tag.toLowerCase();
		}
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
}(jQuery));

(function(window, undefined) {
	var History = window.History;
	if (!History.enabled) {return false;}

	// History.pushState({m: masterCategory, c: null}, null, '/' + siteVars.answerSpace + '/?_m=' + masterCategory);
/*
	// duck-punching pushState so that skips adjacent duplicates
	var _pushState = History.pushState;
	History.pushState = function(data, title, url, queue) {
		var state = History.getState();
		if (JSON.stringify(state.data) !== JSON.stringify(data)) {
			log('History.pushState(): caller=' + History.pushState.caller.name, state, arguments);
			_pushState(data, title, url, queue);
		}
	};
*/
	$(window).bind('statechange', function(event) {
		var state = History.getState();
		// TODO: work out a way to detect Back-navigation so reverse transitions can be used
		log('History.stateChange: ' + $.param(state.data) + ' ' + state.url);
		if ($.type(siteVars.config) !== 'object' || $.isEmptyObject(currentConfig)) {
			$.noop(); // do we need to do something if we have fired this early?
		} else if (state.data.storage) {
			showPendingView();
		} else if (siteVars.hasLogin && state.data.login) {
			showLoginView();
		} else if (hasInteractions && state.data.i) {
			if ($.isEmptyObject(state.data.arguments)) {
				gotoNextScreen(state.data.i);
			} else {
				showAnswerView(state.data.i, state.data.arguments);
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
		event.preventDefault();
		return false;
	});
})(this);

(function(window, undefined) {
	var deviceVars = window.deviceVars,
		siteVars = window.siteVars,
		navigator = window.navigator,
		$window = $(window);

	function networkReachableFn(reachability) {
		var state = reachability.code || reachability;
		deviceVars.isOnline = state > 0;
		deviceVars.isOnlineCell = state === 1;
		deviceVars.isOnlineWiFi = state === 2;
		log('BlinkGap.networkReachable(): online=' + deviceVars.isOnline + ' cell='  + deviceVars.isOnlineCell + ' wifi=' + deviceVars.isOnlineWiFi);
		alert('BlinkGap.networkReachable(): online=' + deviceVars.isOnline + ' cell='  + deviceVars.isOnlineCell + ' wifi=' + deviceVars.isOnlineWiFi);
	}

	function onNetworkChange() {
		var host;
		if (navigator.userAgent.indexOf("BlinkGap") !== -1 && typeof navigator.network !== 'undefined') {
			host = siteVars.serverDomain ? siteVars.serverDomain.split(':')[0] : 'blinkm.co';
			navigator.network.isReachable(host, networkReachableFn);
		} else {
			deviceVars.isOnline = navigator.onLine === true;
			log('onNetworkChange(): online=' + deviceVars.isOnline);
		}
	}

	$window.bind('online', onNetworkChange);
	$window.bind('offline', onNetworkChange);
	$window.trigger('online');
}(this));

function hasCSSFixedPosition() {
	var $body = $('body'),
		$div = $('<div id="fixed" />'),
		height = $body[0].style.height, 
		scroll = $body.scrollTop(),
		hasSupport;
	if (!$div[0].getBoundingClientRect) {
		return false;
	}
	$div.css({position: 'fixed', top: '100px'}).html('test');
	$body.append($div);
	$body.css('height', '3000px');
	$body.scrollTop(50);
	$body.css('height', height);
	hasSupport = $div[0].getBoundingClientRect().top === 100;
	$div.remove();
	$body.scrollTop(scroll);
	return hasSupport; 
}

function isCameraPresent() {
	log("isCameraPresent: " + MyAnswers.cameraPresent);
	return MyAnswers.cameraPresent;
}

function triggerScroll(event) {
	$(window).trigger('scroll');
}

function addEvent(obj, evType, fn) { 
	if (obj.addEventListener) { 
		obj.addEventListener(evType, fn, false); 
		return true; 
	} else if (obj.attachEvent) { 
		var r = obj.attachEvent("on"+evType, fn); 
		return r; 
	} else { 
		return false; 
	} 
}

function removeEvent(obj, evType, fn) { 
	if (obj.removeEventListener) {
		obj.removeEventListener(evType, fn, false);
		return true;
	} else if (obj.detachEvent) {
		var r = obj.detachEvent("on"+evType, fn);
		return r;
	} else {
		return false; 
	} 
}

function emptyDOMelement(element)
{
	if ($.type(element) === 'object') {
		while (element.hasChildNodes()) {
			element.removeChild(element.lastChild);
		}
	}
}

function insertHTML(element, html) {
	if ($.type(element) === 'object') {
//		MyAnswers.dispatch.add($.noop); // adding these extra noops in did not help on iPad
		MyAnswers.dispatch.add(function() {$(element).html(html);});
//		MyAnswers.dispatch.add($.noop);
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

function createDOMelement(tag, attr, text) {
	var $element = $('<' + tag + '/>');
	if ($.type(attr) === 'object' && !$.isEmptyObject(attr)) {
		$element.attr(attr);
	}
	if (typeof text === 'string') {
		$element.text(text);
	}
	return $element[0];
}

function changeDOMclass(element, options) { 
	// options is { add: 'class(es)', remove: 'class(es)', toggle: 'class(es)' }
	if ($.type(options) !== 'object') {return;}
	MyAnswers.dispatch.add(function() {
		if (typeof(options.add) === 'string') {
			$(element).addClass(options.add);
		}
		if (typeof(options.remove) === 'string') {
			$(element).removeClass(options.remove);
		}
		if (typeof(options.toggle) === 'string') {
			$(element).toggleClass(options.toggle);
		}
	});
}

//convert 'argument=value&args[0]=value1&args[1]=value2' into '{"argument":"value","args[0]":"value1","args[1]":"value2"}'
function deserialize(argsString) {
	var args = argsString.split('&'),
		a, aLength = args.length,
		result = { },
		terms;
	for (a = 0; a < aLength; a++) {
		terms = args[a].split('=');
		if (terms[0].length > 0) {
			result[decodeURIComponent(terms[0])] = decodeURIComponent(terms[1]);
		}
	}
	return result;
}

function getURLParameters() {
	var queryString = window.location.href.split('?')[1].split('#')[0];
	if (typeof queryString === 'string') {
		var parameters = deserialize(queryString);
		if (typeof parameters.keyword === 'string') {
			parameters.keyword = parameters.keyword.replace('/', '');
		}
		return parameters;
	} else {
		return [];
	}
}

function isAJAXError(status)
{
	switch(status) {
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
	message = $.parseJSON(message);
	if (typeof message.loginStatus === 'string' && typeof message.loginKeyword === 'string' && typeof message.logoutKeyword === 'string') {
		log('blinkAnswerMessage: loginStatus detected');
		if (message.loginStatus === 'LOGGED IN') {
			$('#loginButton').addClass('hidden');
			$('#logoutButton').removeAttr('onclick').unbind('click').removeClass('hidden');
			$('#logoutButton').bind('click', function() {
				gotoNextScreen(message.logoutKeyword);
			});
		} else { // LOGGED OUT
			$('#logoutButton').addClass('hidden');
			$('#loginButton').removeAttr('onclick').unbind('click').removeClass('hidden');
			$('#loginButton').bind('click', function() {
				gotoNextScreen(message.loginKeyword);
			});
		}
	}
	if (typeof message.mojotarget === 'string') {
		if (typeof message.mojoxml === 'string') {
			log('blinkAnswerMessage: populating MoJO: ' + message.mojotarget);
			MyAnswers.store.set('mojoXML:' + message.mojotarget, message.mojoxml);
		} else if (typeof message.mojodelete !== 'undefined') {
			log('blinkAnswerMessage: deleting MoJO: ' + message.mojotarget);
			MyAnswers.store.remove('mojoXML:' + message.mojotarget);
		}
	}
	if (message.startype) {
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
			iLength = message.staroff.length;
			for (i = 0; i < iLength; i++) {
				starsProfile[message.startype][message.staroff[i]] = starsProfile[message.startype][message.staroff[i]] || {};
			}
		}
//		setAnswerSpaceItem('starsProfile', starsProfile); // TODO: correct storage of starsProfile
	}
}

// *** END OF UTILS ***

// *** BEGIN PHONEGAP UTILS ***

function getPicture_Success(imageData) {
	var i;
//	log("getPicture_Success: " + imageData);
  lastPictureTaken.image.put(lastPictureTaken.currentName, imageData);
  for (i in document.forms[0].elements) {
		if (document.forms[0].elements.hasOwnProperty(i)) {
			var thisElement = document.forms[0].elements[i];
			if (thisElement.name) {
				if(thisElement.type && (thisElement.type.toLowerCase() === "radio" || thisElement.type.toLowerCase() === "checkbox") && thisElement.checked === false) {
					$.noop(); // do nothing for unchecked radio or checkbox
				} else {
					if (thisElement.type && (thisElement.type.toLowerCase() === "button") && (lastPictureTaken.image.size() > 0)) {
						if (lastPictureTaken.currentName === thisElement.name) {
							thisElement.style.backgroundColor = "red";
						} 
					}
				}
			}
		}
  }
  log("getpic success " + imageData.length);
}

function getPicture(sourceType) {
	// TODO: feed quality and imageScale values from configuration
//  var options = { quality: siteConfig.imageQuality, imageScale: siteConfig.imageScale };
	var options = {quality: 60, imageScale: 40};
	if (sourceType !== undefined) {
		options.sourceType = sourceType;
	}
	// if no sourceType specified, the default is CAMERA
	navigator.camera.getPicture(getPicture_Success, null, options);
}

function selectCamera(nameStr) {
	log("selectCamera: ");
  lastPictureTaken.currentName = nameStr;
  getPicture(PictureSourceType.CAMERA);
}

function selectLibrary(nameStr) {
	log("selectLibrary: ");
  lastPictureTaken.currentName = nameStr;
  getPicture(PictureSourceType.PHOTO_LIBRARY);
}

// *** END PHONEGAP UTILS ***

// *** BEGIN BLINK UTILS ***

/**
 * @param name
 * @param level "interactions" or "categories" or "masterCategories"
 * @returns numeric identifier, or boolean false if not found
 */
function resolveItemName(name, level) {
	var prefix, list, l, lLength, id;
	level = (typeof level === 'string' && level) || 'interactions';
	prefix = level.substring(0, 1);
	if (typeof name === 'number' && !isNaN(name) && $.type(siteVars.config[prefix + name]) === 'object') {
		return name;
	}
	if (typeof name !== 'string') {return false;}
	name = name.toLowerCase();
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
		var html, xml, xsl;
		if (typeof(xmlString) !== 'string' || typeof(xslString) !== 'string') {dfrd.reject('XSLT failed due to poorly formed XML or XSL.');return;}
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
		if (window.ActiveXObject !== undefined) {
			log('performXSLT(): using Internet Explorer method');
			html = xml.transformNode(xsl);
		} else if (window.XSLTProcessor !== undefined) {
			log('performXSLT(): performing XSLT via XSLTProcessor()');
			var xsltProcessor = new XSLTProcessor();
			xsltProcessor.importStylesheet(xsl);
			html = xsltProcessor.transformToFragment(xml, document);
		} else if (xsltProcess !== undefined) {
			log('performXSLT(): performing XSLT via AJAXSLT library');
			html = xsltProcess(xml, xsl);
		} else {
			html = '<p>Your browser does not support MoJO keywords.</p>'; 
		}
		dfrd.resolve(html);
	});
	return deferred.promise();
}

//test to see if the user it viewing the highest level screen
function isHome() {
	if ($('.view:visible').first().attr('id') === $('.box:not(:empty)').first().parent().attr('id')) {
		return true;
	}
	return false;
}

// perform all steps necessary to populate element with MoJO result
function generateMojoAnswer(keyword, args) {
	log('generateMojoAnswer(): keyword=' + keyword.name);
	var deferred = new $.Deferred(function(dfrd) {
		var type,
			xml,
			xsl = keyword.xsl,
			placeholders = xsl.match(/\$args\[[\w\:][\w\:\-\.]*\]/g),
			p, pLength = placeholders ? placeholders.length : 0,
			value,
			variable, condition,
			d, s, star;
		MyAnswers.dispatch.add($.noop);
		MyAnswers.dispatch.add(function() {
			if (keyword.xml.substr(0,6) === 'stars:') { // use starred items
				type = keyword.xml.split(':')[1];
				for (s in starsProfile[type]) {
					if (starsProfile[type].hasOwnProperty(s)) {
						xml += '<' + type + ' id="' + s + '">';
						for (d in starsProfile[type][s]) {
							if (starsProfile[type][s].hasOwnProperty(d)) {
								xml += '<' + d + '>' + starsProfile[type][s][d] + '</' + d + '>';
							}
						}
						xml += '</' + type + '>';
					}
				}
				xml = '<stars>' + xml + '</stars>';
				$.when(performXSLT(xml, xsl)).done(function(html) {
					dfrd.resolve(html);
				}).fail(function(html) {
					dfrd.resolve(html);
				});
			} else {
				$.when(MyAnswers.store.get('mojoXML:' + keyword.xml)).done(function(xml) {
					for (p = 0; p < pLength; p++) {
						value = typeof args[placeholders[p].substring(1)] === 'string' ? args[placeholders[p].substring(1)] : '';
						xsl = xsl.replace(placeholders[p], value);
					}
					while (xsl.indexOf('blink-stars(') !== -1) {// fix star lists
						condition = '';
						type = xsl.match(/blink-stars\((.+),\W*(\w+)\W*\)/);
						variable = type[1];
						type = type[2];
						if ($.type(starsProfile[type]) === 'object') {
							for (star in starsProfile[type]) {
								if (starsProfile[type].hasOwnProperty(star)) {
									condition += ' or ' + variable + '=\'' + star + '\'';
								}
							}
							condition = condition.substr(4);
						}
						if (condition.length > 0) {
							xsl = xsl.replace(/\(?blink-stars\((.+),\W*(\w+)\W*\)\)?/, '(' + condition + ')');
						} else {
							xsl = xsl.replace(/\(?blink-stars\((.+),\W*(\w+)\W*\)\)?/, '(false())');
						}
						log('generateMojoAnswer(): condition=' + condition);
					}
					if (typeof xml === 'string') {
						$.when(performXSLT(xml, xsl)).done(function(html) {
							dfrd.resolve(html);
						}).fail(function(html) {
							dfrd.resolve(html);
						});
					} else {
						dfrd.resolve('<p>The data for this keyword is currently being downloaded to your handset for fast and efficient viewing. This will only occur again if the data is updated remotely.</p><p>Please try again in 30 seconds.</p>');
					}
				});
			}
		});
	});
	return deferred.promise();
}

function countPendingFormData(callback) {
	// TODO: change countPendingFormData to jQuery Deferred
	$.when(MyAnswers.store.get('_pendingFormDataString')).done(function(value) {
		var q1;
		if (typeof value === 'string') {
			q1 = value.split(':');
			log("countPendingFormData: q1.length = " + q1.length + ";");
			callback(q1.length);
		} else {
			callback(0);
		}
	}).fail(function() {
		callback(0);
	});
}

function setSubmitCachedFormButton() {
	$.when(countPendingForms()).then(function(queueCount) {
		var $table = $('#pendingBox > table'),
			$tbody = $table.children('tbody'),
			$hiddenTr = $tbody.children('tr.hidden'),
			$tr;
		$.when(MyAnswers.pendingStore.keys()).then(function(keys) {
			MyAnswers.dispatch.add(function() {
				var k, kLength = keys.length,
					key, $cells,
					interaction, name;
				$tbody.children('tr:not(.hidden)').remove();
				for (k = 0; k < kLength; k++) {
					key = keys[k].split(':');
					interaction = siteVars.config['i' + key[0]];
					if ($.type(interaction) === 'object') {
						name = interaction.pertinent.displayName || interaction.pertinent.name;
					} else {
						name = '<span class="bForm-error">unavailable</span>';
					}
					$tr = $hiddenTr.clone();
					$tr.data('interaction', key[0]);
					$tr.data('form', key[1]);
					$cells = $tr.children('td');
					$cells.eq(0).text(name);
					$cells.eq(1).text(key[2]);
					$tr.removeClass('hidden');
					$tr.appendTo($tbody);
				}
				if (kLength === 0) {
					$tbody.append('<tr><td colspan="3">No pending forms submissions.</td></tr>');
				}
			});
		});
		var button = document.getElementById('pendingButton');
		MyAnswers.dispatch.add(function() {
			if (queueCount !== 0) {
				log("CachedFormButton: Cached items");
				insertText(button, queueCount + ' Pending');
				$(button).removeClass('hidden');
			} else {
				log("setSubmitCachedFormButton: NO Cached items");
				$(button).addClass('hidden');
			}
		});
		if (typeof setupParts === 'function') {
			MyAnswers.dispatch.add(setupParts);
		}
	});
/*	countPendingFormData(function(queueCount) {
		var button = document.getElementById('pendingButton');
		MyAnswers.dispatch.add(function() {
			if (queueCount !== 0) {
				log("setSubmitCachedFormButton: Cached items");
				insertText(button, queueCount + ' Pending');
				$(button).removeClass('hidden');
			} else {
				log("setSubmitCachedFormButton: NO Cached items");
				$(button).addClass('hidden');
			}
		});
		if (typeof setupParts === 'function') {
			MyAnswers.dispatch.add(setupParts);
		}
	}); */
}

function headPendingFormData(callback) {
	// TODO: change headPendingFormData to jQuery Deferred
	countPendingFormData(function(queueCount) {
		if (queueCount === 0) {
			callback(['', '']);
			return;
		}
		$.when(
			MyAnswers.store.get('_pendingFormDataString'),
			MyAnswers.store.get('_pendingFormDataArrayAsString'),
			MyAnswers.store.get('_pendingFormMethod'),
			MyAnswers.store.get('_pendingFormUUID')
		).done(function(q1, q2, q3, q4) {
			log('headPendingFormData():');
			callback([q1, decodeURIComponent(q2), decodeURIComponent(q3), decodeURIComponent(q4)]);
		}).fail(function() {
			log('headPendingFormData(): error retrieving first pending form');
		});
	});
}

function removeFormRetryData() {
	$.when(
	    MyAnswers.store.remove('_pendingFormDataString'),
	    MyAnswers.store.remove('_pendingFormDataArrayAsString'),
	    MyAnswers.store.remove('_pendingFormMethod'),
	    MyAnswers.store.remove('_pendingFormUUID')
	).done(function() {
	    log('removeFormRetryData(): pending form data purged');
		setSubmitCachedFormButton();
	}).fail(function() {
	    log('removeFormRetryData(): error purging pending form data');
	});
}

function delHeadPendingFormData() {
	function delHeadFormStore(store, key) {
		var deferred = new $.Deferred(function(dfrd) {
			$.when(store.get(key)).done(function(value) {
				value = value.substring(value.indexOf(':') + 1);
				$.when(store.set(key, value)).done(dfrd.resolve);
			});
		});
		return deferred.promise();
	}
	countPendingFormData(function(queueCount) {
		if (queueCount === 0) {
			log("delHeadPendingFormData: count 0, returning");
			return;
		} else if (queueCount === 1) {
			removeFormRetryData();
			return;
		}
		$.when(
			delHeadFormStore(MyAnswers.store, '_pendingFormDataString'),
			delHeadFormStore(MyAnswers.store, '_pendingFormDataArrayAsString'),
			delHeadFormStore(MyAnswers.store, '_pendingFormMethod'),
			delHeadFormStore(MyAnswers.store, '_pendingFormUUID')
		).done(function(string, array, method, uuid) {
			log('delHeadPendingFormData(): head of form queue deleted');
		}).fail(function() {
			log('delHeadPendingFormData(): error retrieving first pending form');
		});
	});
}

function processCachedFormData() {
	$.when(
		MyAnswers.store.get('_pendingFormDataString')
	).done(function(value) {
		if (typeof value === 'string') {
			if (confirm("Submit pending form data \nfrom previous forms?\nNote: Subsequent forms will continue to pend\nuntil you empty the pending list.")) {
				submitFormWithRetry();
			} else {
				if (confirm("Delete pending form data\nfrom previous forms?")) {
					removeFormRetryData();
				}
			}
		}
	});
}

// *** END BLINK UTILS ***

// *** BEGIN EVENT HANDLERS ***

function updateCache()
{
  log("updateCache: " + webappCache.status);
  if (webappCache.status !== window.applicationCache.IDLE) {
    webappCache.swapCache();
    log("Cache has been updated due to a change found in the manifest");
  } else {
    webappCache.update();
    log("Cache update requested");
  }
}

function errorCache()
{
  log("errorCache: " + webappCache.status);
  log("You're either offline or something has gone horribly wrong.");
}

function onPendingClick(event) {
	var $button = $(event.target),
		action = $button.data('action'),
		$tr = $button.closest('tr'),
		$cells = $tr.children('td'),
		interaction = $tr.data('interaction'),
		form = $tr.data('form'),
		uuid = $cells.eq(1).text();
	if (action === 'cancel') {
		clearPendingForm(interaction, form, uuid);
	} else if (action === 'resume') {
		showAnswerView(interaction, {pendingForm: interaction + ':' + form + ':' + uuid});
	}
}

function onTaskBegun(event)
{
	MyAnswers.runningTasks++;
	if ($('#startUp').size() > 0) {return true;}
	if (typeof(MyAnswers.activityIndicatorTimer) === 'number') {return true;}
	MyAnswers.activityIndicatorTimer = setTimeout(function() {
		clearTimeout(MyAnswers.activityIndicatorTimer);
		MyAnswers.activityIndicatorTimer = null;
		$(MyAnswers.activityIndicator).removeClass('hidden');
	}, 1000);
	return true;
}

function onTaskComplete(event)
{
	if (MyAnswers.runningTasks > 0)
	{
		MyAnswers.runningTasks--;
	}
	if (MyAnswers.runningTasks <= 0)
	{
		if (MyAnswers.activityIndicatorTimer !== null)
		{
			clearTimeout(MyAnswers.activityIndicatorTimer);
		}
		MyAnswers.activityIndicatorTimer = null;
		$(MyAnswers.activityIndicator).addClass('hidden');
	}
	return true;
}

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
		for (k in data)	{
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
	log('onLinkClick(): ' + $(this).tagHTML());
	var element = this,
		a, attributes = $(element).attr(),
		args = { },
		id, requestUri;
	if (typeof attributes.href === 'undefined' && typeof attributes.onclick === 'undefined') {
		if (typeof attributes.back !== 'undefined') {
			History.back();
		} else if (typeof attributes.home !== 'undefined') {
			History.pushState(null, null, '/' + siteVars.answerSpace + '/');
		} else if (typeof attributes.login !== 'undefined') {
			History.pushState({ login: true });
		} else if (attributes.interaction || attributes.keyword) {
			if (id = resolveItemName(attributes.interaction || attributes.keyword, 'interactions')) {
				for (a in attributes) {
					if (attributes.hasOwnProperty(a)) {
						if (a.substr(0, 1) === '_') {
							args['args[' + a.substr(1) + ']'] = attributes[a];
						} else if (a.substr(0, 5) !== 'data-') {
							args[a] = attributes[a];
						}
					}
				}
				delete args.interaction;
				delete args.keyword;
				requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?' + $.param(args);
				History.pushState({ m: currentMasterCategory, c: currentCategory, i: id, 'arguments': args}, null, requestUri);
			}
		} else if (typeof attributes.category !== 'undefined') {
			if (id = resolveItemName(attributes.category, 'categories')) {
				requestUri = '/' + siteVars.answerSpace + '/?_c=' + id;
				History.pushState({ m: currentMasterCategory, c: id });
			}
		} else if (typeof attributes.mastercategory !== 'undefined') {
			if (id = resolveItemName(attributes.mastercategory, 'masterCategories')) {
				requestUri = '/' + siteVars.answerSpace + '/?_m=' + id;
				History.pushState({ m: id });
			}
		}
		return false;
	}
	return true;
}

function updateOrientation()
{
	log("orientationChanged: " + Orientation.currentOrientation);
}

// *** END EVENT HANDLERS ***

if (!addEvent(document, "deviceready", onDeviceReady)) {
  alert("Unable to add deviceready handler");
  throw("Unable to add deviceready handler");
}

function updateNavigationButtons() {
	MyAnswers.dispatch.add(function() {
		var $navBars = $('.navBar'),
			$navButtons = $("#homeButton, #backButton"),
			$helpButton = $('#helpButton'),
			helpContents;
		switch($('.view:visible').first().attr('id'))
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
		if (typeof(helpContents) === 'string') {
			$helpButton.removeClass('hidden');
			$helpButton.removeAttr('disabled');
		} else {
			$helpButton.addClass('hidden');
		}
		if (isHome()) {
			$navButtons.addClass('hidden');
			$.when(countPendingForms()).then(function(queueCount) {
				if (siteVars.hasLogin || !$helpButton.hasClass('hidden') || queueCount > 0) {
					$navBars.removeClass('hidden');
				} else {
					$navBars.addClass('hidden');
				}
			});
		} else {
			$navButtons.removeClass('hidden');
			$navButtons.removeAttr('disabled');
			$navBars.removeClass('hidden');
		}
		$('#loginButton, #logoutButton, #pendingButton').removeAttr('disabled');
		setSubmitCachedFormButton();
		MyAnswers.dispatch.add(function() {$(window).trigger('scroll');});
/*		if (typeof MyAnswersSideBar !== 'undefined') {
			MyAnswersSideBar.update();
		} */
	});
}

function initialiseAnswerFeatures($view) {
	log('initialiseAnswerFeatures(): view=' + $view.attr('id'));
	var deferred = new $.Deferred(),
		promises = [];
	MyAnswers.dispatch.add(function() {
		var $inputs = $view.find('input, textarea, select'),
			$form = $view.find('form').first(),
			onGoogleJSLoaded = function(data, textstatus) {
				if ($view.find('div.googlemap').size() > 0) { // check for items requiring Google Maps
					if ($.type(google.maps) !== 'object') {
						google.load('maps', '3', {other_params : 'sensor=true', 'callback' : setupGoogleMaps});
					} else {
						setupGoogleMaps();
					}
				}
			};
		$('body').trigger('taskBegun');
		$inputs.unbind('blur', triggerScroll);
		$inputs.bind('blur', triggerScroll);
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
		if ($view.find('div.googlemap').size() > 0) { // check for items requiring Google features (so far only #map)
			if ($.type(window.google) !== 'object' || $.type(google.load) !== 'function') {
				$.getScript('http://www.google.com/jsapi?key=' + siteVars.googleAPIkey, onGoogleJSLoaded);
			} else {
				onGoogleJSLoaded();
			}
		} else {
			stopTrackingLocation();
		}
		if ($form.length !== 0) {
			if (typeof $form.data('objectName') === 'string' && $form.data('objectName').length > 0) {
				promises.push(BlinkForms.initialiseForm($form));
			} else if (!isCameraPresent()) {
				$form.find('input[onclick*="selectCamera"]').attr('disabled', 'disabled');
			}
		}
	});
	MyAnswers.dispatch.add(function() {
		$.when.apply($, promises).always(function() {
			$('body').trigger('taskComplete');
			deferred.resolve();
		});
	});
	return deferred.promise();
}

function showMasterCategoriesView(reverse)
{
	log('showMasterCategoriesView()');
	$.when(MyAnswersDevice.hideView(reverse)).always(function() {
		populateItemListing('masterCategories');
		setMainLabel('Master Categories');
		MyAnswersDevice.showView($('#masterCategoriesView'), reverse);
	});
}

function goBackToMasterCategoriesView()
{
	log('goBackToMasterCategoriesView()');
	$.when(MyAnswersDevice.hideView(true)).always(function() {
		setMainLabel('Master Categories');
		MyAnswersDevice.showView($('#masterCategoriesView'), true);
	});
}

// run after any change to current*
function updateCurrentConfig() {
	// see: https://developer.mozilla.org/en/JavaScript/Guide/Inheritance_Revisited
	// TODO: need to fold orientation-specific config into this somewhere
	log('updateCurrentConfig(): a=' + siteVars.id + ' mc=' + currentMasterCategory + ' c=' + currentCategory + ' i=' + currentInteraction);
	currentConfig = {};
	$.extend(currentConfig, siteVars.config['a' + siteVars.id].pertinent);
	if (typeof currentMasterCategory !== 'undefined' && currentMasterCategory !== null) {
		$.extend(currentConfig, siteVars.config['m' + currentMasterCategory].pertinent);
	}
	if (typeof currentCategory !== 'undefined' && currentCategory !== null) {
		$.extend(currentConfig, siteVars.config['c' + currentCategory].pertinent);
	}
	if (typeof currentInteraction !== 'undefined' && currentInteraction !== null) {
		$.extend(currentConfig, siteVars.config['i' + currentInteraction].pertinent);
	}
	// perform inherited changes
	MyAnswers.dispatch.add(function() {
		var $banner = $('#bannerBox'),
			$image = $banner.find('img'),
			imageSrc = '/images/' + siteVars.id + '/' + currentConfig.logoBanner; 
		if (typeof currentConfig.logoBanner === 'string') {
			if (imageSrc !== $image.attr('src')) {
				$image.attr('src', imageSrc);
			}
			$banner.removeClass('hidden');
		} else {
			$image.removeAttr('src');
			$banner.addClass('hidden');
		}
	});
	MyAnswers.dispatch.add(function() {
		var $footer = $('#activeContent > footer');
		$footer.text(currentConfig.footer);
	});
	MyAnswers.dispatch.add(function() {
		var style = '',
			$style = $('style[data-setting="styleSheet"]');
		style += currentConfig.styleSheet || '';
		style += currentConfig.interfaceStyle ? 'body, #content, #activeContent { ' + currentConfig.interfaceStyle + ' }\n' : '';
		style += currentConfig.backgroundStyle ? '.box { ' + currentConfig.backgroundStyle + ' }\n' : '';
		style += currentConfig.inputPromptStyle ? '#argsBox { ' + currentConfig.inputPromptStyle + ' }\n' : '';
		style += currentConfig.evenRowStyle ? 'ul.box > li:nth-child(even), tr.even { ' + currentConfig.evenRowStyle + ' }\n' : '';
		style += currentConfig.oddRowStyle ? 'ul.box > li:nth-child(odd), tr.odd { ' + currentConfig.oddRowStyle + ' }\n' : '';
		style += currentConfig.headerStyle ? '#content > header { ' + currentConfig.headerStyle + ' }\n' : '';
		style += currentConfig.footerStyle ? '#activeContent > footer { ' + currentConfig.footerStyle + ' }\n' : '';
		style += currentConfig.masterCategoriesStyle ? '#masterCategoriesBox > .masterCategory { ' + currentConfig.masterCategoriesStyle + ' }\n' : '';
		style += currentConfig.categoriesStyle ? '#categoriesBox > .category { ' + currentConfig.categoriesStyle + ' }\n' : '';
		style += currentConfig.interactionsStyle ? '#keywordBox > .interaction, #keywordList > .interaction { ' + currentConfig.interactionsStyle + ' }\n' : '';
		if (style !== $style.text()) {
			$style.text(style);
		}
	});
}

function onMasterCategoryClick(event) {
	History.pushState({m: $(this).data('id')} , null, '/' + siteVars.answerSpace + '/?_m=' + $(this).data('id'));
}
function onCategoryClick(event) {
	History.pushState({m: $(this).data('masterCategory'), c: $(this).data('id')}, null, '/' + siteVars.answerSpace + '/?_c=' + $(this).data('id'));
}
function onKeywordClick(event) {
	var interaction = siteVars.config['i' + $(this).data('id')].pertinent.name;
	History.pushState({m: $(this).data('masterCategory'), c: $(this).data('category'), i: $(this).data('id')}, null, '/' + siteVars.answerSpace + '/' + interaction + '/');
}
function onHyperlinkClick(event) { window.location.assign($(this).data('hyperlink')); }

function populateItemListing(level) {
	log('populateItemListing(): ' + level);
	var arrangement, display, order, list, $visualBox, $listBox, type,
		name, $item, $label, $description,
		hook = {
			interactions: function($item) {
				var id = $item.attr('data-id');
				if (siteVars.config['i' + id].pertinent.type === 'hyperlink' && siteVars.config['i' + id].pertinent.hyperlink) {
					$item.attr('data-hyperlink', list[order[o]].hyperlink);
					$item.bind('click', onHyperlinkClick);
				} else {
					$item.bind('click', onKeywordClick);
				}
			},
			categories: function($item) {
				var id = $item.attr('data-id');
				if (siteVars.map['c' + id].length === 1) {
					$item.attr('data-category', id);
					$item.attr('data-id', siteVars.map['c' + id][0]);
					hook.interactions($item);
				} else if (siteVars.map['c' + id].length > 0) {
					$item.bind('click', onCategoryClick);
				}
			},
			masterCategories: function($item) {
				var id = $item.attr('data-id');
				if (siteVars.map['m' + id].length === 1) {
					$item.attr('data-master-category', id);
					$item.attr('data-id', siteVars.map['m' + id][0]);
					hook.categories($item);
				} else if (siteVars.map['m' + id].length > 0) {
					$item.bind('click', onMasterCategoryClick);
				}
			}
		},
		o, oLength,
		category, columns, $images,
		itemConfig;
	switch (level) {
		case 'masterCategories':
			arrangement = currentConfig.masterCategoriesArrangement;
			display = currentConfig.masterCategoriesDisplay;
			order = siteVars.map.masterCategories;
			list = order;
			type = 'm';
			$visualBox = $('#masterCategoriesBox');
			$listBox = $('#masterCategoriesList');
			break;
		case 'categories':
			arrangement = currentConfig.categoriesArrangement;
			display = currentConfig.categoriesDisplay;
			order = siteVars.map.categories;
			list = siteVars.map['m' + currentMasterCategory] || order;
			type = 'c';
			$visualBox = $('#categoriesBox');
			$listBox = $('#categoriesList');
			break;
		case 'interactions':
			arrangement = currentConfig.interactionsArrangement;
			display = currentConfig.interactionsDisplay;
			order = siteVars.map.interactions;
			list = siteVars.map['c' + currentCategory] || order;
			type = 'i';
			$visualBox = $('#keywordBox');
			$listBox = $('#keywordList');
			break;
	}
	log('populateItemListing(): '+ arrangement + ' ' + display + ' ' + type + '[' + list.join(',') + ']');
	switch (arrangement) {
		case "list":
			columns = 1;
			break;
		case "2 column":
			columns = 2;
			break;
		case "3 column":
			columns = 3;
			break;
		case "4 column":
			columns = 4;
			break;
	}
	emptyDOMelement($visualBox[0]);
	emptyDOMelement($listBox[0]);
	oLength = order.length;
	MyAnswers.dispatch.add(function() {
		for (o = 0; o < oLength; o++) {
			itemConfig = siteVars.config[type + order[o]];
			if (typeof itemConfig !== 'undefined' && $.inArray(order[o], list) !== -1 && itemConfig.pertinent.display === 'show') {
				name = itemConfig.pertinent.displayName || itemConfig.pertinent.name;
				if (display !== 'text only' && itemConfig.pertinent.icon) {
					$item = $('<img />');
					$item.attr({
						'class': 'v' + columns + 'col',
						'src': '/images/' + siteVars.id + '/' + itemConfig.pertinent.icon,
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
			$visualBox.removeClass('hidden');
		} else {
			$visualBox.addClass('hidden');
		}
	});
	MyAnswers.dispatch.add(function() {
		if ($listBox.children().size() > 0) {
			$listBox.removeClass('hidden');
		} else {
			$listBox.addClass('hidden');
		}
	});
}

function showCategoriesView(masterCategory) {
	log('showCategoriesView(): ' + masterCategory);
	currentInteraction = null;
	currentCategory = null;
	if (hasMasterCategories && masterCategory) {
		currentMasterCategory = masterCategory;
	}
	$.when(MyAnswersDevice.hideView()).always(function() {
		updateCurrentConfig();
		setMainLabel(masterCategory ? siteVars.config['m' + masterCategory].pertinent.name : 'Categories');
		populateItemListing('categories');
		MyAnswersDevice.showView($('#categoriesView'));
	});
}

function goBackToCategoriesView() {
	currentInteraction = null;
	currentCategory = null;
	log('goBackToCategoriesView()');
	$.when(MyAnswersDevice.hideView(true)).always(function() {
		updateCurrentConfig();
		setMainLabel(currentMasterCategory ? siteVars.config['m' + currentMasterCategory].pertinent.name : 'Categories');
		MyAnswersDevice.showView($('#categoriesView'), true);
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
	ajaxQueue.add({
		url: requestUrl,
		data: requestData,
		dataType: 'json',
		complete: function(xhr, xhrStatus) {
			if (isAJAXError(xhrStatus) || xhr.status !== 200)
			{
				alert('Connection error, please try again later. (' + xhrStatus + ' ' + xhr.status + ')');
				deferred.reject();
				return deferred.promise();
			}
			var data = $.parseJSON(xhr.responseText);
			if (data === null)
			{
				log('restoreSessionProfile error: null data');
				alert('Connection error, please try again later. (' + xhrStatus + ' ' + xhr.status + ')');
				deferred.reject();
				return deferred.promise();
			}
			if (typeof(data.errorMessage) !== 'string' && typeof(data.statusMessage) !== 'string')
			{
				log('restoreSessionProfile success: no error messages, data: ' + data);
				if (data.sessionProfile === null) {
					deferred.reject();
					return deferred.promise();
				}
				MyAnswers.store.set('starsProfile', JSON.stringify(data.sessionProfile.stars));
				starsProfile = data.sessionProfile.stars;
			}
			if (typeof(data.errorMessage) === 'string')
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

function displayAnswerSpace() {
	var startUp = $('#startUp'),
		$masterCategoriesView = $('#masterCategoriesView'),
		$categoriesView = $('#categoriesView'),
		$keywordListView = $('#keywordListView'),
		requestUri,
		token = siteVars.queryParameters._t;
	delete siteVars.queryParameters._t;
	if (startUp.size() > 0 && typeof siteVars.config !== 'undefined') {
		currentConfig = siteVars.config['a' + siteVars.id].pertinent;
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
		if (currentConfig.defaultScreen === 'login') {
			History.pushState({ login: true });
		} else if (currentConfig.defaultScreen === 'interaction' && hasInteractions && typeof siteVars.config['i' + currentConfig.defaultInteraction] !== undefined) {
			requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + currentConfig.defaultInteraction].pertinent.name + '/?';
			History.pushState({ i: currentConfig.defaultInteraction }, null, requestUri);
		} else if (currentConfig.defaultScreen === 'category' && hasCategories && typeof siteVars.config['c' + currentConfig.defaultCategory] !== undefined) {
			requestUri = '/' + siteVars.answerSpace + '/?_c=' + currentConfig.defaultCategory;
			History.pushState({ c: currentConfig.defaultCategory }, null, requestUri);
		} else if (currentConfig.defaultScreen === 'master category' && hasMasterCategories && typeof siteVars.config['m' + currentConfig.defaultMasterCategory] !== undefined) {
			requestUri = '/' + siteVars.answerSpace + '/?_m=' + currentConfig.defaultMasterCategory;
			History.pushState({ m: currentConfig.defaultMasterCategory }, null, requestUri);
		} else { // default "home"
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
		$.when(restoreSessionProfile(token))
			.always(function() {
				var interaction = resolveItemName(siteVars.queryParameters.keyword),
					config = siteVars.config['a' + siteVars.id].pertinent;
				delete siteVars.queryParameters.keyword;
				if (interaction && ! $.isEmptyObject(siteVars.queryParameters)) {
					requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + interaction].pertinent.name + '/?' + $.param(siteVars.queryParameters);
					History.pushState({ i: interaction, 'arguments': siteVars.queryParameters }, null, requestUri);
				} else if (interaction) {
					requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + interaction].pertinent.name + '/?';
					History.pushState({ i: interaction }, null, requestUri);
				} else if (typeof(siteVars.queryParameters._c) === 'string') {
					requestUri = '/' + siteVars.answerSpace + '/?_c=' + siteVars.queryParameters._c;
					History.pushState({ m: siteVars.queryParameters._c }, null, requestUri);
				} else if (typeof(siteVars.queryParameters._m) === 'string') {
					requestUri = '/' + siteVars.answerSpace + '/?_m=' + siteVars.queryParameters._m;
					History.pushState({ m: siteVars.queryParameters._m }, null, requestUri);
				}
				delete siteVars.queryParameters;
			});
	}
	startUp.remove();
	$('#content').removeClass('hidden');
}

function processMoJOs(interaction) {
	var deferredFetches = {},
		interactions = interaction ? [ interaction ] : siteVars.map.interactions,
		i, iLength = interactions.length,
		config,
		deferredFn = function(mojo) {
			var deferred = new $.Deferred(function(dfrd) {
				$.when(MyAnswers.store.get('mojoLastChecked:' + mojo)).done(function(value) {
					var requestData = {
							_id: siteVars.id,
							_m: mojo
						};
					value = parseInt(value, 10);
					if (typeof value === 'number' && !isNaN(value)) {
						requestData._lc = value;
					}
					ajaxQueue.add({
						url: siteVars.serverAppPath + '/xhr/GetMoJO.php',
						data: requestData,
						dataType: 'xml',
						complete: function(jqxhr, status) {
							if (jqxhr.status === 200) {
								MyAnswers.store.set('mojoXML:' + mojo, jqxhr.responseText);
//								MyAnswers.store.set('mojoLastUpdated:' + mojo, new Date(jqxhr.getResponseHeader('Last-Modified')).getTime());
							}
							if (jqxhr.status === 200 || jqxhr.status === 304) {
								MyAnswers.store.set('mojoLastChecked:' + mojo, $.now());
							}
						},
						timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500 * 1024))
					});
				});
			});
			return deferred.promise();
		};
	for (i = 0; i < iLength; i++) {
		config = siteVars.config['i' + interactions[i]].pertinent;
		if ($.type(config) === 'object' && config.type === 'xslt') {
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
					deferredFetches[config.xml] = deferredFn(config.xml);
				}
			}
		}
	}
}

function processForms() {
	var validActions = [ 'add', 'delete', 'edit', 'find', 'list', 'search', 'view' ],
		xmlserializer = new XMLSerializer(), // TODO: find a cross-browser way to do this
		id,
		formActionFn = function(index, element) {
			var $action = $(element),
				action = $action.tag(),
				storeKey = 'formXML:' + id + ':' + action,
				$children = $action.children(), c, cLength = $children.length,
				html = '';
			if (validActions.indexOf($action.tag()) !== -1) {
				for (c = 0; c < cLength; c++) {
					html += xmlserializer.serializeToString($children[c]);
				}
				$.when(MyAnswers.store.set(storeKey, html)).fail(function() {
					log('processForms()->formActionFn(): failed storing ' + storeKey);
				});
			}
		},
		formObjectFn = function(index, element) {
			var $formObject = $(element);
			id = $formObject.attr('id');
			$formObject.children().each(formActionFn);
			log('processForms()->formObjectFn(): formXML:' + id);
		};
	ajaxQueue.add({
		url: siteVars.serverAppPath + '/xhr/GetForm.php',
//	dataType: 'xml',
		complete: function(jqxhr, status) {
			var $data;
			if (jqxhr.status === 200 && typeof jqxhr.responseText === 'string') {
				jqxhr.responseText = jqxhr.responseText.substring(jqxhr.responseText.indexOf('<formObjects>'));
				$data = $($.parseXML(jqxhr.responseText));
//				log($data);
				$data.find('formObject').each(formObjectFn);
//			MyAnswers.store.set('formLastUpdated:' + form, new Date(jqxhr.getResponseHeader('Last-Modified')).getTime());
			}
			if (jqxhr.status === 200 || jqxhr.status === 304) {
				MyAnswers.store.set('formLastChecked:' + id, $.now());
			}
		},
		timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500 * 1024))
	});
}

function processConfig(display) {
	var items = [], firstItem;
	log('processConfig(): currentMasterCategory=' + currentMasterCategory + ' currentCategory=' + currentCategory + ' currentInteraction=' + currentInteraction);
	if ($.type(siteVars.config['a' + siteVars.id]) === 'object') {
		switch (siteVars.config['a' + siteVars.id].pertinent.siteStructure) {
			case 'master categories':
				hasMasterCategories = siteVars.map.masterCategories.length > 0;
				if (hasMasterCategories && typeof currentMasterCategory === 'undefined') {
					items = items.concat($.map(siteVars.map.masterCategories, function(element, index) {
						return 'm' + element;
					}));
				}
			case 'categories':
				// TODO: investigate whether this behaviour needs to be more like interactions and/or master categories
				hasCategories = siteVars.map.categories.length > 0;
				if (hasCategories && typeof currentCategory === 'undefined') {
					items = items.concat($.map(siteVars.map.categories, function(element, index) {
						return 'c' + element;
					}));
				}
			case 'interactions only':
				hasInteractions = siteVars.map.interactions.length > 0;
				answerSpaceOneKeyword = siteVars.map.interactions.length === 1;
				if (hasInteractions && typeof currentInteraction === 'undefined') {
					items = items.concat($.map(siteVars.map.interactions, function(element, index) {
						return 'i' + element;
					}));
				}
		}
		if (display === true && siteVars.config && siteVars.map) {
			displayAnswerSpace();
			processMoJOs();
			processForms();
		} else {
			requestConfig(items);
		}
	} else {
		log('requestConfig(): unable to retrieve answerSpace config');
	}
}

function requestConfig(requestData) {
	var now = $.now();
	if ($.type(requestData) === 'array' && requestData.length > 0) {
		log('requestConfig(): [' + requestData.join(',') + ']');
	} else {
		log('requestConfig(): ' + requestData);
		requestData = null;
	}
	ajaxQueue.add({
		url: siteVars.serverAppPath + '/xhr/GetConfig.php',
		type: 'POST',
		data: requestData ? {items: requestData} : null,
		dataType: 'json',
		complete: function(jqxhr, textStatus) {
			var data,
				items,
				type,
				id, ids, i, iLength;
			if (isAJAXError(textStatus) || jqxhr.status !== 200) {
				processConfig(true);
			} else {
				if (typeof siteVars.config === 'undefined') {
					siteVars.config = {};
				}
				ids = ($.type(requestData) === 'array') ? requestData : [ 'a' + siteVars.id ];
				iLength = ids.length;
				data = $.parseJSON(jqxhr.responseText);
				for (i = 0; i < iLength; i++) {
					if (typeof data[ids[i]] !== 'undefined') {
						siteVars.config[ids[i]] = data[ids[i]];
					}
					MyAnswers.siteStore.set('config', JSON.stringify(siteVars.config));
				}
				deviceVars.features = data.deviceFeatures;
				if ($.type(data.map) === 'object') {
					siteVars.map = data.map;
					MyAnswers.siteStore.set('map', JSON.stringify(siteVars.map));
					processConfig();
				} else {
					processConfig(true);
				}
				// TODO: store these in client-side storage somewhere
			}
		},
		timeout: computeTimeout(40 * 1024)
	});
}

if (typeof(webappCache) !== "undefined")
{
  addEvent(webappCache, "updateready", updateCache);
  addEvent(webappCache, "error", errorCache);
}
 
MyAnswers.dumpLocalStorage = function() {
	$.when(MyAnswers.store.keys()).done(function(keys) {
		var k, kLength = keys.length,
			getFn = function(value) {
				value = value.length > 20 ? value.substring(0, 20) + "..." : value;
				log('dumpLocalStorage(): found value: ' + value);
			};
		for (k = 0; k < kLength; k++) {
			log('dumpLocalStorage(): found key: ' + keys[k]);
			$.when(MyAnswers.store.get(keys[k])).done(getFn);
		}
	});
};

function goBackToHome() {
	History.replaceState(null, null, '/' + siteVars.answerSpace + '/');
	stopTrackingLocation();
	$('body').trigger('taskComplete');
	//	getSiteConfig();
}

function gotoStorageView() {
	History.pushState({ storage: true }, null, '/' + siteVars.answerSpace + '/?_storage=true');
}

function showPendingView() {
	$.when(MyAnswersDevice.hideView()).always(function() {
		MyAnswersDevice.showView($('#pendingView'));
	});
}

function createParamsAndArgs(keywordID) {
	var config = siteVars.config['i' + keywordID],
		returnValue = "asn=" + siteVars.answerSpace + "&iact=" + encodeURIComponent(config.pertinent.name),
		args = '',
		argElements = $('#argsBox').find('input, textarea, select');
	if (typeof config === 'undefined' || !config.pertinent.inputPrompt) {return returnValue;}	
	args = '';
	argElements.each(function(index, element) {
		if (this.type && (this.type.toLowerCase() === "radio" || this.type.toLowerCase() === "checkbox") && !this.checked) {
			$.noop(); // do nothing if not checked
		} else if (this.name) {
			args += "&" + this.name + "=" + (this.value ? encodeURIComponent(this.value) : "");
		} else if (this.id && this.id.match(/\d+/g)) {
			args += "&args[" + this.id.match(/\d+/g) + "]=" + (this.value ? encodeURIComponent(this.value) : "");
		}
	});
	if (args.length > 0) {
		returnValue += encodeURI(args);
	} else if (argElements.size() === 1 && this.value) {
		returnValue += "&args=" + encodeURIComponent(this.value);
	}
	return returnValue;
}

function showAnswerView(interaction, argsString, reverse) {
	log('showAnswerView(): interaction=' + interaction + ' args=' + argsString);
	var html, args,
		config, id, i, iLength = siteVars.map.interactions.length,
		$answerView = $('#answerView'),
		$answerBox = $('#answerBox'),
		answerBox = $answerBox[0],
		completeFn = function() {
			$.when(initialiseAnswerFeatures($answerView)).always(function() {
				setMainLabel(config.displayName || config.name);
				MyAnswersDevice.showView($answerView, reverse);
				MyAnswers.dispatch.add(function() {$('body').trigger('taskComplete');});
			});
		};
	interaction = resolveItemName(interaction);
	if (interaction === false) {
		alert('The requested Interaction could not be found.');
		return;
	}
	config = siteVars.config['i' + interaction].pertinent;
	$('body').trigger('taskBegun');
	$.when(MyAnswersDevice.hideView(reverse)).always(function() {
		currentInteraction = interaction;
		updateCurrentConfig();
		processMoJOs(interaction);
		if (typeof argsString === 'string' && argsString.length > 0) {
			args = {};
			$.extend(args, deserialize(decodeURIComponent(argsString)));
		} else if ($.type(argsString) === 'object') {
			args = argsString;
		} else {
			args = {};
		}
		if (config.inputPrompt) {
			$.extend(args, deserialize(createParamsAndArgs(interaction)));
			delete args.answerSpace;
			delete args.interaction;
		}
		if (config.type === 'message') {
			insertHTML(answerBox, config.message);
			completeFn();
		} else if (config.type === 'xslt' && deviceVars.disableXSLT !== true) {
			$.when(generateMojoAnswer(config, args)).done(function(html) {
				insertHTML(answerBox, html);
				completeFn();
			});
		} else if (reverse) {
			$.when(MyAnswers.store.get('answer___' + interaction)).done(function(html) {
				insertHTML(answerBox, html);
				completeFn();
			});
		} else if (config.type === 'form' && config.blinkFormObjectName && config.blinkFormAction) {
			html = $('<form data-object-name="' + config.blinkFormObjectName + '" data-action="' + config.blinkFormAction + '" />');
			html.data(args);
			insertHTML(answerBox, html);
			completeFn();
		} else {
			var answerUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php',
				requestData = {
					asn: siteVars.answerSpace,
					iact: config.name
				},
				fallbackToStorage = function() {
					$.when(MyAnswers.store.get('answer___' + interaction)).done(function(html) {
						if (typeof html === 'undefined') {
							html = '<p>Unable to reach server, and unable to display previously stored content.</p>';
						}
						insertHTML(answerBox, html);
						completeFn();
					});
				};
			if (!$.isEmptyObject(args)) {
				$.extend(requestData, args);
			}
			$.ajax({
				type: 'GET',
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
						MyAnswers.store.set('answer___' + interaction, html);
						insertHTML(answerBox, html);
						completeFn();
					}
				},
				timeout: Math.max(currentConfig.downloadTimeout * 1000, 60 * 1000)
			});
		}
	});
}

function getAnswer(event) {showAnswerView(currentInteraction);}

function gotoNextScreen(keyword, category, masterCategory) {
	var config,
		i, iLength = siteVars.map.interactions.length;
	log("gotoNextScreen(): " + keyword);
	keyword = resolveItemName(keyword);
	if (keyword === false) {
		alert('The requested Interaction could not be found.');
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
	log('showSecondLevelAnswerView(): keyword=' + keyword + ' args=' + arg0);
	showAnswerView(keyword, arg0, reverse);
}

function showKeywordView(keyword) {
	$.when(MyAnswersDevice.hideView()).always(function() {
		var config = siteVars.config['i' + keyword].pertinent,
			argsBox = $('#argsBox')[0],
			descriptionBox = $('#descriptionBox')[0];
		currentInteraction = keyword;
		updateCurrentConfig();
		insertHTML(argsBox, config.inputPrompt);
		if (config.description) {
			insertHTML(descriptionBox, config.description);
			$(descriptionBox).removeClass('hidden');
		} else {
			$(descriptionBox).addClass('hidden');
		}
		MyAnswersDevice.showView($('#keywordView'));
		setMainLabel(config.displayName || config.name);
	});
}

function goBackToKeywordView(keyword) {
	$.when(MyAnswersDevice.hideView(true)).always(function() {
		var config = siteVars.config['i' + keyword].pertinent;
		currentInteraction = keyword;
		updateCurrentConfig();
		MyAnswersDevice.showView($('#keywordView'), true);
		setMainLabel(config.displayName || config.name);
	});
}

function showKeywordListView(category, masterCategory) {
	var mainLabel;
	currentInteraction = null;
	currentCategory = category;
	if (hasMasterCategories && masterCategory) {
		currentMasterCategory = masterCategory;
	}
	log('showKeywordListView(): hasCategories=' + hasCategories + ' currentCategory=' + currentCategory);
	$.when(MyAnswersDevice.hideView()).always(function() {
		updateCurrentConfig();
		if (hasCategories) {
			if (typeof prepareHistorySideBar === 'function') {
				prepareHistorySideBar();
			}
			mainLabel = currentConfig.displayName || currentConfig.name;
		} else {
			mainLabel = 'Interactions';
		}
		populateItemListing('interactions');
		MyAnswersDevice.showView($('#keywordListView'));
		setMainLabel(mainLabel);
	});
}

function goBackToKeywordListView(event) {
	var mainLabel,
		config;
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
	$.when(MyAnswersDevice.hideView(true)).always(function() {
		updateCurrentConfig();
		MyAnswersDevice.showView($('#keywordListView'), true);
		setMainLabel(mainLabel);
	});
}

function showHelpView(event)
{
	var helpContents,
		helpBox = document.getElementById('helpBox');
	$.when(MyAnswersDevice.hideView()).always(function() {
		switch($('.view:visible').first().attr('id'))
		{
			case 'keywordView':
			case 'answerView':
			case 'answerView2':
				if (currentInteraction) {
					helpContents = siteVars.config['i' + currentInteraction].pertinent.help || "Sorry, no guidance has been prepared for this item.";
				}
				break;
			default:
				helpContents = siteVars.config['a' + siteVars.id].pertinent.help || "Sorry, no guidance has been prepared for this item.";
		}
		insertHTML(helpBox, helpContents);
		MyAnswersDevice.showView($('#helpView'));
	});
}

function showNewLoginView(isActivating)
{
	$.when(MyAnswersDevice.hideView()).always(function() {
		var loginUrl = siteVars.serverAppPath + '/util/CreateLogin.php',
			requestData = 'activating=' + isActivating;
		ajaxQueue.add({
			type: 'GET',
			cache: "false",
			url: loginUrl,
			data: requestData,
			complete: function(xhr, textstatus) { // readystate === 4
				var newLoginBox = document.getElementById('newLoginBox');
				if (isAJAXError(textstatus) && xhr.status !== 200)
				{
					insertText(newLoginBox, 'Unable to contact server. (' + textstatus + ' ' + xhr.status + ')');
				}
				else
				{
					insertHTML(newLoginBox, xhr.responseText);
				}
				setMainLabel('New Login');
				MyAnswersDevice.showView($('#newLoginView'));
			},
			timeout: currentConfig.downloadTimeout * 1000
		});
	});
}

function showActivateLoginView(event)
{
	$.when(MyAnswersDevice.hideView()).always(function() {
		var loginUrl = siteVars.serverAppPath + '/util/ActivateLogin.php';
		ajaxQueue.add({
			type: 'GET',
			cache: "false",
			url: loginUrl,
			complete: function(xhr, textstatus) { // readystate === 4
				var activateLoginBox = document.getElementById('activateLoginBox');
				if (isAJAXError(textstatus) && xhr.status !== 200)
				{
					insertText(activateLoginBox, 'Unable to contact server.  (' + textstatus + ' ' + xhr.status + ')');
				}
				else
				{
					insertHTML(activateLoginBox, xhr.responseText);
				}
				setMainLabel('Activate Login');
				MyAnswersDevice.showView($('#activateLoginView'));
			},
			timeout: currentConfig.downloadTimeout * 1000
		});
	});
}

function showLoginView(event)
{
	$.when(MyAnswersDevice.hideView()).always(function() {
		MyAnswersDevice.showView($('#loginView'));
		setMainLabel('Login');
	});
}

function updateLoginButtons() {
	var loginStatus = document.getElementById('loginStatus'),
		loginButton = document.getElementById('loginButton'),
		logoutButton = document.getElementById('logoutButton');
	if (!siteVars.hasLogin) {return;}
	if (MyAnswers.isLoggedIn) {
		if (typeof MyAnswers.loginAccount === 'string' && MyAnswers.loginAccount.length > 0) {
			MyAnswers.dispatch.add(function() {
				var $loginStatus = $(loginStatus);
				$loginStatus.empty();
				$loginStatus.append('logged in as<br />');
				$loginStatus.append('<span class="loginAccount">' + MyAnswers.loginAccount + '</span>');
				$loginStatus.click(submitLogout);
			});
			changeDOMclass(loginStatus, {remove: 'hidden'});
		} else {
			changeDOMclass(logoutButton, {remove: 'hidden'});
		}
		changeDOMclass(loginButton, {add: 'hidden'});
	} else {
		changeDOMclass(loginStatus, {add: 'hidden'});
		changeDOMclass(logoutButton, {add: 'hidden'});
		changeDOMclass(loginButton, {remove: 'hidden'});
	}
	if (currentCategory !== undefined) {
		populateItemListing('interactions');
	}
}

function requestLoginStatus() {
	if (!siteVars.hasLogin) {return;}
	ajaxQueue.add({
		url: siteVars.serverAppPath + '/xhr/GetLogin.php',
		dataType: 'json',
		complete: function(xhr, xhrStatus) {
			if (isAJAXError(xhrStatus) || xhr.status !== 200) {return;}
			var data = $.parseJSON(xhr.responseText);
			if (data) {
				if (data.status === 'LOGGED IN') {
					if (data.account) {
						MyAnswers.loginAccount = data.account;
					}
					MyAnswers.isLoggedIn = true;
				} else {
					MyAnswers.isLoggedIn = false;
					delete MyAnswers.loginAccount;
				}
			}
			updateLoginButtons();
		},
		timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500))
	});
}

function submitLogin()
{
	log('submitLogin();');
	ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: siteVars.serverAppPath + '/xhr/GetLogin.php',
		data: $('#loginView').find('form').serializeArray(),
		complete: function(xhr, textstatus) {
			$('#loginView').find('input[type=password]').val('');
			if (xhr.status === 200) {
				var data = $.parseJSON(xhr.responseText);
				if (data) {
					if (data.status === 'LOGGED IN') {
						if (data.account) {
							MyAnswers.loginAccount = data.account;
						}
						MyAnswers.isLoggedIn = true;
						window.location.reload();
					} else {
						MyAnswers.isLoggedIn = false;
						delete MyAnswers.loginAccount;
					}
				}
				updateLoginButtons();
//				getSiteConfig();
			} else {
				alert('Unable to login:  (' + textstatus + ' ' + xhr.status + ') ' + xhr.responseText);
			}
		},
		timeout: currentConfig.downloadTimeout * 1000
  });
}

function submitLogout(event)
{
	log('submitLogout();');
    if (confirm('Log out?')) {
		ajaxQueue.add({
			type: 'GET',
			cache: "false",
			url: siteVars.serverAppPath + '/xhr/GetLogin.php',
			data: {'_a': 'logout'},
			complete: function(xhr, textstatus) {
				if (xhr.status === 200) {
					var data = $.parseJSON(xhr.responseText);
					if (data) {
						if (data.status === 'LOGGED IN') {
							if (data.account) {
								MyAnswers.loginAccount = data.account;
							}
							MyAnswers.isLoggedIn = true;
						} else {
							MyAnswers.isLoggedIn = false;
							delete MyAnswers.loginAccount;
							window.location.reload();
						}
					}
					updateLoginButtons();
//					getSiteConfig();
					goBackToHome();
				}
			},
			timeout: currentConfig.downloadTimeout * 1000
		});
    }
    return false;
}

function goBackToTopLevelAnswerView(event)
{
	log('goBackToTopLevelAnswerView()');
	$.when(MyAnswersDevice.hideView(true)).always(function() {
		MyAnswersDevice.showView($('#answerView'), true);
	});
}

/**
 * Add a form submission to the queue.
 * @returns {jQueryPromise} number of stored forms
 */
function countPendingForms() {
	var deferred = new $.Deferred();
	$.when(MyAnswers.pendingStore.size()).then(function(size) {
		deferred.resolve(size);
	});
	return deferred.promise();
}

/**
 * Add a form submission to the queue.
 * @param {String} interaction ID
 * @param {String} form name of the form object
 * @param {String} uuid UUID
 * @param {Object} data key=>value pairs to be JSON-encoded
 * @returns {jQueryPromise}
 */
function pushPendingForm(interaction, form, uuid, data) {
	var deferred = new $.Deferred();
	$.when(MyAnswers.pendingStore.set(interaction + ':' + form + ':' + uuid, JSON.stringify(data))).then(function() {
		deferred.resolve();
	}).fail(function() {
		deferred.reject();
	});
	return deferred.promise();
}

/**
 * Remove a form submission from the queue.
 * @param {String} interaction ID
 * @param {String} form name of the form object
 * @param {String} uuid UUID
 * @returns {jQueryPromise}
 */
function clearPendingForm(interaction, form, uuid) {
	var deferred = new $.Deferred();
	$.when(MyAnswers.pendingStore.remove(interaction + ':' + form + ':' + uuid)).then(function() {
		deferred.resolve();
	}).fail(function() {
		deferred.reject();
	}).always(function() {
		setSubmitCachedFormButton();
	});
	return deferred.promise();
}

function queuePendingFormData(str, arrayAsString, method, uuid, callback) {
	// TODO: change queuePendingFormData to jQuery Deferred
	$.when(MyAnswers.store.get('_pendingFormDataString')).done(function(dataString) {
		if (typeof dataString === 'string') {
			log('queuePendingFormData(): existing queue found');
			dataString += ':' + str;
			MyAnswers.store.set('_pendingFormDataString', dataString);
			$.when(MyAnswers.store.get('_pendingFormDataArrayAsString')).done(function(value) {
				value += ':' + encodeURIComponent(arrayAsString);
				MyAnswers.store.set('_pendingFormDataArrayAsString', value);
			});
			$.when(MyAnswers.store.get('_pendingFormMethod')).done(function(value) {
				value += ':' + encodeURIComponent(method);
				MyAnswers.store.set('_pendingFormMethod', value);
			});
			$.when(MyAnswers.store.get('_pendingFormUUID')).done(function(value) {
				value += ':' + encodeURIComponent(uuid);
				MyAnswers.store.set('_pendingFormUUID', value);
			});
		} else {
			log('queuePendingFormData(): no existing queue found');
			$.when(
				MyAnswers.store.set('_pendingFormDataString', str),
				MyAnswers.store.set('_pendingFormDataArrayAsString', encodeURIComponent(arrayAsString)),
				MyAnswers.store.set('_pendingFormMethod', encodeURIComponent(method)),
				MyAnswers.store.set('_pendingFormUUID', encodeURIComponent(uuid))
			).done(callback);
		}
	});
}

function submitFormWithRetry() {    
	var str, arr, method, uuid,
		localKeyword;
	$.when(MyAnswers.store.get('_pendingFormDataString')).done(function(dataString) {
		if (typeof dataString === 'string') {
			headPendingFormData(function(qx) {
				str = qx[0];
				arr = qx[1].split("/");
				method = qx[2];
				uuid = qx[3];
				var answerUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?',
					currentBox = $('.view:visible > .box').first(),
					requestData;
				if (arr[0] === '..') {
					answerUrl += "asn=" + siteVars.answerSpace + "&iact=" + encodeURIComponent(arr[1]) + (arr[2].length > 1 ? "&" + arr[2].substring(1) : "");
					localKeyword = arr[1];
				} else {
					answerUrl += "asn=" + arr[1] + "&iact=" + encodeURIComponent(arr[2]);
					localKeyword = arr[2];
				}
				if (method === 'get') {
					method = 'GET';
					requestData = '&' + str;
				} else {
					method = 'POST';
					requestData = str;
				}
	
				$('body').trigger('taskBegun');
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
							delHeadPendingFormData();
							html = xhr.responseText;
						}
						$.when(MyAnswersDevice.hideView()).always(function() {
							if (currentBox.attr('id').indexOf('answerBox') !== -1) {
								insertHTML(currentBox[0], html);
								$.when(initialiseAnswerFeatures(currentBox)).always(function() {
									currentBox.show('slide', {direction: 'right'}, 300);
									MyAnswersDevice.showView(currentBox.closest('.view'));
								});
							} else {
								var answerBox2 = document.getElementById('answerBox2');
								insertHTML(answerBox2, html);
								$.when(initialiseAnswerFeatures($('#answerView2'))).always(function() {
									MyAnswersDevice.showView($('#answerView2'));
								});
							}
							$('body').trigger('taskComplete');
						});
					},
					timeout: Math.max(currentConfig.uploadTimeout * 1000, computeTimeout(answerUrl.length + requestData.length))
				});
			});
		} else {
			log('submitFormWithRetry(): error: no forms in the queue');
		}
	});
}

function submitForm() {
	var str = '',
		form = $('.view:visible').find('form').first();
	form.find('input, textarea, select').each(function(index, element) {
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
            str += "&" + element.name + "=" + encodeURIComponent(lastPictureTaken.image.get(element.name));
            // log("if: " + str);
          }
        }
        else
        {
          if (element.type && (element.type.toLowerCase() === 'button')) {
            if ((element.value !== "Gallery") && (element.value !== "Camera"))
            { 
              str += "&" + element.name + "=" + element.value;
            }
            else
            {
              str += "&" + element.name + "=";
            }
          }
          else
          {
						str += "&" + element.name + "=" + element.value;
          }
          // log("else: " + str);
        }
      }
    }
  });
  log("lastPictureTaken.image.size() = " + lastPictureTaken.image.size());
  lastPictureTaken.image.clear();

  // var str = $('form').first().find('input, textarea, select').serialize();
  log("submitForm(2): " + document.forms[0].action);
  // log("submitForm(2a): " + str);
  queuePendingFormData(str, document.forms[0].action, document.forms[0].method.toLowerCase(), Math.uuid(), submitFormWithRetry);
  return false;
}

function submitAction(keyword, action) {
	log('submitAction(): keyword=' + keyword + ' action=' + action);
	var currentBox = $('.view:visible > .box'),
		form = currentBox.find('form').first(),
		sessionInput = form.find('input[name=blink_session_data]'),
		formData = (action === 'cancel=Cancel') ? '' : form.find('input, textarea, select').serialize(),
		method = form.attr('method'),
		requestData, requestUrl,
		serializedProfile;
	if (sessionInput.size() === 1 && ! $.isEmptyObject(starsProfile)) {
		serializedProfile = '{"stars":' + JSON.stringify(starsProfile) + '}';
		formData = formData.replace('blink_session_data=', 'blink_session_data=' + encodeURIComponent(serializedProfile));
		method = 'post';
	}
	if (method === 'get') {
		method = 'GET';
		requestUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?asn=' + siteVars.answerSpace + "&iact=" + keyword;
		requestData = '&' + formData + (typeof(action) === 'string' && action.length > 0 ? '&' + action : '');
	} else {
		method = 'POST';
		requestUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?asn=' + siteVars.answerSpace + "&iact=" + keyword + (typeof(action) === 'string' && action.length > 0 ? '&' + action : '');
		requestData = formData;
	}
	$('body').trigger('taskBegun');
	$.ajax({
		type: method,
		cache: 'false',
		url: requestUrl,
		data: requestData,
		complete: function(xhr, textstatus) { // readystate === 4
			$('body').trigger('taskComplete');
			var html;
			if (isAJAXError(textstatus) || xhr.status !== 200) {
				html = 'Unable to contact server.';
			} else {
				html = xhr.responseText;
			}
			var blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:\{.*\} -->/g),
				b, bLength;
			if ($.type(blinkAnswerMessage) === 'array') {
				bLength = blinkAnswerMessage.length;
				for (b = 0; b < bLength; b++) {
					processBlinkAnswerMessage(blinkAnswerMessage[b].substring(24, blinkAnswerMessage[b].length - 4));
				}
			}
			$.when(MyAnswersDevice.hideView()).always(function() {
				if (currentBox.attr('id').indexOf('answerBox') !== -1)
				{
					insertHTML(currentBox[0], html);
					$.when(initialiseAnswerFeatures(currentBox)).always(function() {
						MyAnswersDevice.showView(currentBox.closest('.view'));
					});
				}
				else
				{
					var answerBox2 = document.getElementById('answerBox2');
					insertHTML(answerBox2, html);
					$.when(initialiseAnswerFeatures($('#answerView2'))).always(function() {
						MyAnswersDevice.showView($('#answerView2'));
					});
				}
			});
		},
		timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(requestUrl.length + requestData.length))
	});
	return false;
}

function isLocationAvailable() {
	if (typeof navigator.geolocation !== 'undefined') {
		return true;
	} else if (typeof google  !== 'undefined' && typeof google.gears !== 'undefined') {
		return google.gears.factory.getPermission(siteVars.answerSpace, 'See your location marked on maps.');
	}
	return false;
}

function startTrackingLocation() {
	if (locationTracker === null)
	{
		if (typeof(navigator.geolocation) !== 'undefined')
		{
			locationTracker = navigator.geolocation.watchPosition(function(position) {
				if (latitude !== position.coords.latitude || longitude !== position.coords.longitude)
				{
					latitude = position.coords.latitude;
					longitude = position.coords.longitude;
					log('Location Event: Updated lat=' + latitude + ' long=' + longitude);
					$('body').trigger('locationUpdated');
				}
			}, null, {enableHighAccuracy : true, maximumAge : 600000});
		}
		else if (typeof(google) !== 'undefined' && typeof(google.gears) !== 'undefined')
		{
			locationTracker = google.gears.factory.create('beta.geolocation').watchPosition(function(position) {
				if (latitude !== position.latitude || longitude !== position.longitude)
				{
					latitude = position.latitude;
					longitude = position.longitude;
					log('Location Event: Updated lat=' + latitude + ' long=' + longitude);
					$('body').trigger('locationUpdated');
				}
			}, null, {enableHighAccuracy : true, maximumAge : 600000});
		}
	}
}

function stopTrackingLocation()
{
	if (locationTracker !== null)
	{
		if (typeof(navigator.geolocation) !== 'undefined')
		{
			navigator.geolocation.clearWatch(locationTracker);
		}
		else if (typeof(google) !== 'undefined' && typeof(google.gears) !== 'undefined')
		{
			google.gears.factory.create('beta.geolocation').clearWatch(locationTracker);
		}
		locationTracker = null;
	}
}

function setupGoogleMapsBasic(element, data, map)
{
	log('Google Maps Basic: initialising ' + $.type(data));
	$('body').trigger('taskBegun');
	var location = new google.maps.LatLng(data.latitude, data.longitude);
	var options = {
		zoom: parseInt(data.zoom, 10),
		center: location,
		mapTypeId: google.maps.MapTypeId[data.type.toUpperCase()]
	};
	map.setOptions(options);
	/*
	 * google.maps.event.addListener(map, 'tilesloaded',
	 * stopInProgressAnimation); google.maps.event.addListener(map,
	 * 'zoom_changed', startInProgressAnimation);
	 * google.maps.event.addListener(map, 'maptypeid_changed',
	 * startInProgressAnimation); google.maps.event.addListener(map,
	 * 'projection_changed', startInProgressAnimation);
	 */
	if (typeof(data.kml) === 'string')
	{
		var kml = new google.maps.KmlLayer(data.kml, {map: map, preserveViewport: true});
	}
	else if (typeof(data.marker) === 'string')
	{
		var marker = new google.maps.Marker({
			position: location,
			map: map,
			icon: data.marker
		});
		if (typeof(data['marker-title']) === 'string')
		{
			marker.setTitle(data['marker-title']);
			var markerInfo = new google.maps.InfoWindow();
			google.maps.event.addListener(marker, 'click', function() {
				markerInfo.setContent(marker.getTitle());
				markerInfo.open(map, marker);
			});
		}
	}
	$('body').trigger('taskComplete');
}

function setupGoogleMapsDirections(element, data, map)
{
	log('Google Maps Directions: initialising ' + $.type(data));
	var origin, destination, language, region, geocoder;
	if (typeof(data['origin-address']) === 'string')
	{
		origin = data['origin-address'];
	}
	else if (typeof(data['origin-latitude']) !== 'undefined')
	{
		origin = new google.maps.LatLng(data['origin-latitude'], data['origin-longitude']);
	}
	if (typeof(data['destination-address']) === 'string')
	{
		destination = data['destination-address'];
	}
	else if (typeof(data['destination-latitude']) !== 'undefined')
	{
		destination = new google.maps.LatLng(data['destination-latitude'], data['destination-longitude']);
	}
	if (typeof(data.language) === 'string')
	{
		language = data.language;
	}
	if (typeof(data.region) === 'string')
	{
		region = data.region;
	}
	if (origin === undefined && destination !== undefined)
	{
		log('Google Maps Directions: missing origin, ' + destination);
		if (isLocationAvailable())
		{
			insertText($(element).next('.googledirections')[0], 'Attempting to use your most recent location as the origin.');
			setTimeout(function() {
				data['origin-latitude'] = latitude;
				data['origin-longitude'] = longitude;
				setupGoogleMapsDirections(element, data, map);
			}, 5000);
			return;
		}
		else if (typeof(destination) === 'object')
		{
			insertText($(element).next('.googledirections')[0], 'Missing origin. Only the provided destination is displayed.');
			data.latitude = destination.lat();
			data.longitude = destination.lng();
			setupGoogleMapsBasic(element, data, map);
			return;
		}
		else
		{
			insertText($(element).next('.googledirections')[0], 'Missing origin. Only the provided destination is displayed.');
			geocoder = new google.maps.Geocoder();
			geocoder.geocode({
					address: destination,
					region: region,
					language: language
				}, function(result, status) {
				if (status !== google.maps.GeocoderStatus.OK)
				{
					insertText($(element).next('.googledirections')[0], 'Missing origin and unable to locate the destination.');
				}
				else
				{
					data.zoom = 15;
					data.latitude = result[0].geometry.location.b;
					data.longitude = result[0].geometry.location.c;
					setupGoogleMapsBasic(element, data, map);
				}
			});
			return;
		}
	}
	if (origin !== undefined && destination === undefined)
	{
		log('Google Maps Directions: missing destination ' + origin);
		if (isLocationAvailable())
		{
			insertText($(element).next('.googledirections')[0], 'Attempting to use your most recent location as the destination.');
			setTimeout(function() {
				data['destination-latitude'] = latitude;
				data['destination-longitude'] = longitude;
				setupGoogleMapsDirections(element, data, map);
			}, 5000);
			return;
		}
		else if (typeof(origin) === 'object')
		{
			insertText($(element).next('.googledirections')[0], 'Missing destination. Only the provided origin is displayed.');
			data.latitude = origin.lat();
			data.longitude = origin.lng();
			setupGoogleMapsBasic(element, data, map);
			return;
		}
		else
		{
			insertText($(element).next('.googledirections')[0], 'Missing destination. Only the provided origin is displayed.');
			geocoder = new google.maps.Geocoder();
			geocoder.geocode({ 
					address: origin,
					region: region,
					language: language
				}, function(result, status) {
				if (status !== google.maps.GeocoderStatus.OK)
				{
					insertText($(element).next('.googledirections')[0], 'Missing destination and unable to locate the origin.');
				}
				else
				{
					data.zoom = 15;
					data.latitude = result[0].geometry.location.b;
					data.longitude = result[0].geometry.location.c;
					setupGoogleMapsBasic(element, data, map);
				}
			});
			return;
		}
	}
	log('Google Maps Directions: both origin and destination provided, ' + origin + ', ' + destination);
	$('body').trigger('taskBegun');
	var directionsOptions = {
		origin: origin,
		destination: destination,
		travelMode: google.maps.DirectionsTravelMode[data.travelmode.toUpperCase()],
		avoidHighways: data.avoidhighways,
		avoidTolls: data.avoidtolls,
		region: region
	};
	var mapOptions = {
		mapTypeId: google.maps.MapTypeId[data.type.toUpperCase()]
	};
	map.setOptions(mapOptions);
	var directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);
	directionsDisplay.setPanel($(element).next('.googledirections')[0]);
	var directionsService = new google.maps.DirectionsService();
	directionsService.route(directionsOptions, function(result, status) {
		if (status === google.maps.DirectionsStatus.OK)
		{
			directionsDisplay.setDirections(result);
		}
		else
		{
			insertText($(element).next('.googledirections')[0], 'Unable to provide directions: ' + status);
		}
	});
	$('body').trigger('taskComplete');
}

function setupGoogleMaps()
{
	$('body').trigger('taskBegun');
	$('div.googlemap').each(function(index, element) {
		var googleMap = new google.maps.Map(element);
		var data = $(element).data();
		if (data.sensor === true && isLocationAvailable())
		{
			startTrackingLocation();
		}
		if ($(element).data('map-action') === 'directions')
		{
			setupGoogleMapsDirections(element, data, googleMap);
		}
		else
		{
			setupGoogleMapsBasic(element, data, googleMap);
		}
		if (isLocationAvailable())
		{
			var currentMarker = new google.maps.Marker({
				map: googleMap,
				icon: siteVars.serverAppPath + '/images/location24.png',
				title: 'Your current location'
			});
			if (latitude && longitude)
			{
				currentMarker.setPosition(new google.maps.LatLng(latitude, longitude));
			}
			$('body').bind('locationUpdated', function() {
				currentMarker.setPosition(new google.maps.LatLng(latitude, longitude));
			});
			var currentInfo = new google.maps.InfoWindow();
			google.maps.event.addListener(currentMarker, 'click', function() {
				currentInfo.setContent(currentMarker.getTitle());
				currentInfo.open(googleMap, currentMarker);
			});
		}
	});
	$('body').trigger('taskComplete');
}

MyAnswers.updateLocalStorage = function() {
	/*
	 * version 0 = MoJOs stored in new format, old siteConfig removed
	 */
	var deferred = new $.Deferred(function(dfrd) {
		$.when(MyAnswers.store.get('storageVersion')).done(function(value) {
			if (!value) {
				$.when(
					MyAnswers.store.set('storageVersion', 0),
					MyAnswers.store.remove('siteConfigMessage'),
					MyAnswers.store.removeKeysRegExp(/^mojoMessage-/)
				).done(function() {
					dfrd.resolve();
				});
			} else {
				dfrd.resolve();
			}
		});
	});
	return deferred.promise();
};

// *** BEGIN APPLICATION INIT ***

function onBrowserReady() {
	log("onBrowserReady: " + window.location.href);
	try {
		var uriParts = parse_url(window.location.href),
			splitUrl = uriParts.path.match(/_([RW])_\/(.+)\/(.+)\/index\.php/);
		siteVars.serverAppBranch =  splitUrl[1];
		siteVars.serverAppVersion =  splitUrl[3];
		siteVars.serverDomain = uriParts.host;

		if ($.type(uriParts.port) === 'string' &&
			((uriParts.scheme === 'https' && uriParts.port !== "443") ||
				(uriParts.scheme === 'http' && uriParts.port !== "80"))) {
			siteVars.serverDomain += ':' + uriParts.port;
		}
		siteVars.serverAppPath = '//' + siteVars.serverDomain + '/_' + siteVars.serverAppBranch + '_/common/' + siteVars.serverAppVersion;
		siteVars.serverDevicePath = '//' + siteVars.serverDomain + '/_' + siteVars.serverAppBranch + '_/' + deviceVars.device + '/' + siteVars.serverAppVersion;
		siteVars.queryParameters = getURLParameters();
		siteVars.answerSpace = siteVars.queryParameters.answerSpace;
		delete siteVars.queryParameters.uid;
		delete siteVars.queryParameters.answerSpace;
		MyAnswers.domain = '//' + siteVars.serverDomain + "/";

		if (location.href.indexOf('index.php?answerSpace=') !== -1) {
			History.replaceState(null, null, '/' + siteVars.answerSpace + '/');
		}
		if (document.getElementById('loginButton') !== null) {
			// TODO: get hasLogin working directly off new config field
			siteVars.hasLogin = true;
		}
		
		// 
		// The following variables are initialised here so the JS can be tested
		// within Safari
		//
//		MyAnswers.cameraPresent = false;
//		MyAnswers.multiTasking = false;
		//
		// End of device overriden variables
		//
		
		// HTML5 Web Worker
		/*
		 * deviceVars.hasWebWorkers = typeof(window.Worker) === 'function'; if
		 * (deviceVars.hasWebWorkers === true) { MyAnswers.webworker = new
		 * Worker(siteVars.serverAppPath + '/webworker.js');
		 * MyAnswers.webworker.onmessage = function(event) { switch
		 * (event.data.fn) { case 'log': log(event.data.string);
		 * break; case 'processXSLT': log('WebWorker: finished
		 * processing XSLT'); var target =
		 * document.getElementById(event.data.target); insertHTML(target,
		 * event.data.html); break; case 'workBegun':
		 * $('body').trigger('taskBegun'); break; case 'workComplete':
		 * $('body').trigger('taskComplete'); break; } }; }
		 */
		$(document).ajaxSend(function(event, jqxhr, options) {
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
			log('AJAX start: ' + url);
		});
		$(document).ajaxSuccess(function(event, jqxhr, options) {
			var status = typeof jqxhr === 'undefined' ? null : jqxhr.status,
				readyState = typeof jqxhr === 'undefined' ? 4 : jqxhr.readyState,
				url = decodeURI(options.url);
			if (url.length > 100) {
				url = url.substring(0, 100) + '...';
			} 
			log('AJAX complete: ' + url + ' ' + readyState + ' ' + status);
		});
		MyAnswers.browserDeferred.resolve();
  } catch(e) {
		log("onBrowserReady: Exception");
		log(e);
		MyAnswers.browserDeferred.reject();
	}
}

// Function: loaded()
// Called by Window's load event when the web application is ready to start
//
function loaded() {
	log('loaded():');
	if (typeof webappCache  !== 'undefined') {
		switch(webappCache.status) {
			case 0:
				log("Cache status: Uncached");break;
			case 1:
				log("Cache status: Idle");break;
			case 2:
				log("Cache status: Checking");break;
			case 3:
				log("Cache status: Downloading");break;
			case 4:
				log("Cache status: Updateready");break;
			case 5:
				log("Cache status: Obsolete");break;
		}
	}

	try {
		MyAnswers.store.set('answerSpace', siteVars.answerSpace);
		$.when(MyAnswers.siteStore.get('config')).then(function(data) {
			if (typeof data === 'string') {
				data = $.parseJSON(data);
			}
			if ($.type(data) === 'object') {
				siteVars.config = data;
			}
		}).always(function() {
			$.when(MyAnswers.siteStore.get('map')).then(function(data) {
				if (typeof data === 'string') {
					data = $.parseJSON(data);
				}
				if ($.type(data) === 'object') {
					siteVars.map = data;
				}
			}).always(function() {
				requestLoginStatus();
				requestConfig();
			});
		});
		$.when(MyAnswers.store.get('starsProfile')).done(function(stars) {
			if (typeof stars === 'string') {
				stars = $.parseJSON(stars);
			}
			if ($.type(stars) === 'object') {
				starsProfile = stars;
			} else {
				starsProfile = { };
			}
		});
	} catch(e) {
		log("Exception loaded: ");
		log(e);
	}
}

function init_main() {
	var $body = $('body');
	log("init_main(): ");
	siteVars.id = $body.data('id');
	siteVars.requestsCounter = 0;

	PictureSourceType.PHOTO_LIBRARY = 0;
	PictureSourceType.CAMERA = 1;
  lastPictureTaken.image = new Hashtable();
  lastPictureTaken.currentName = null;

	jQuery.fx.interval = 27; // default is 13, increasing this to be kinder on devices
	
	ajaxQueue = $.manageAjax.create('globalAjaxQueue', {queue: true});
	MyAnswers.dispatch = new BlinkDispatch(47);

	MyAnswers.runningTasks = 0; // track the number of tasks in progress
	
	// to facilitate building regex replacements
	RegExp.quote = function(str) {return str.replace(/([.?*+\^$\[\]\\(){}\-])/g, "\\$1");};

	addEvent(document, 'orientationChanged', updateOrientation);
	
	MyAnswers.store = new BlinkStorage(null, siteVars.answerSpace, 'jstore');
	$.when(MyAnswers.store.ready()).then(function() {
		MyAnswers.siteStore = new BlinkStorage(null, siteVars.answerSpace, 'site');
		$.when(MyAnswers.siteStore.ready()).then(function() {
			MyAnswers.pendingStore = new BlinkStorage(null, siteVars.answerSpace, 'pending');
			$.when(MyAnswers.pendingStore.ready()).then(function() {
		//		MyAnswers.dumpLocalStorage();
				$.when(MyAnswers.updateLocalStorage()).done(function() {
					loaded();
					log('loaded(): returned after call by BlinkStorage');
				});
			});
		});
	});

	MyAnswers.activityIndicator = document.getElementById('activityIndicator');
	MyAnswers.activityIndicatorTimer = null;

	$body.bind('taskBegun', onTaskBegun);
	$body.bind('taskComplete', onTaskComplete);
	$('body').delegate('a', 'click', onLinkClick);
	$('#pendingBox').delegate('button', 'click', onPendingClick);
}

function onBodyLoad() {
  if (navigator.userAgent.indexOf("BlinkGap") === -1) {
    log("onBodyLoad: direct call to onBrowserReady()");
    onBrowserReady();
  } else {
		var bodyLoadedCheck;
		bodyLoadedCheck = setInterval(function() {
			if (MyAnswers.bodyLoaded) {
				clearInterval(bodyLoadedCheck);
				onBrowserReady();
			} else {
				log("Waiting for onload event...");
			}
		}, 1000);
    setTimeout(function() {
      MyAnswers.bodyLoaded = true;
      log("onBodyLoad: set bodyLoaded => true");
    }, 2000);
  }
}
if (!addEvent(window, "load", onBodyLoad)) {
  alert("Unable to add load handler");
  throw("Unable to add load handler");
}

(function(window, undefined) {
	$.when(
		MyAnswers.deviceDeferred.promise(),
		MyAnswers.browserDeferred.promise(),
		MyAnswers.mainDeferred.promise()
	).done(function() {
		log("all promises kept, initialising...");
		try {
			init_device();
			init_main();
		} catch(e) {
			log("onBrowserReady: Exception");
			log(e);
		}
		log("User-Agent: " + navigator.userAgent);
	}).fail(function() {
		log('init failed, not all promises kept');
	});
}(this));

// END APPLICATION INIT

MyAnswers.mainDeferred.resolve();
