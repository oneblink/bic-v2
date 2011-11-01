var MyAnswers = MyAnswers || {},
	siteVars = siteVars || {},
	deviceVars = deviceVars || {},
	locationTracker, latitude, longitude, webappCache,
	hasCategories = false, hasMasterCategories = false, hasVisualCategories = false, hasInteractions = false, answerSpaceOneKeyword = false,
	currentInteraction, currentCategory, currentMasterCategory, currentConfig = {},
	starsProfile = {},
	ajaxQueue;

document.getElementById('startUp-loadMain').className = 'working';

currentConfig.downloadTimeout = 30;
currentConfig.uploadTimeout = 45;
deviceVars.isOnline = true;

function PictureSourceType() {}
function lastPictureTaken () {}

MyAnswers.mainDeferred = new $.Deferred();
MyAnswers.browserDeferred = new $.Deferred();
MyAnswers.formsDeferred = new $.Deferred();
MyAnswers.dfrdMoJOs = null; // processMoJOs() promise
siteVars.mojos = siteVars.mojos || {};
siteVars.forms = siteVars.forms || {};

MyAnswers.isLoggedIn = false;
MyAnswers.isCustomLogin = false;
MyAnswers.isEmptySpace = false; // empty except for loginUseInteractions

// *** BEGIN UTILS ***

function isCameraPresent() {
	if (typeof window.device === 'undefined') {
		return false;
	}
	return window.device.camerapresent;
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
		queryString;
	if (href.indexOf('?') === -1) {
		return [];
	}
	queryString = href.match(/\?([^#]*)#?.*$/)[1];
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

// TODO: deprecate this function
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
	var options = {quality: currentConfig.imageCaptureQuality, imageScale: currentConfig.imageCaptureScale};
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
	name = name.replace(/\+/g, ' ').toLowerCase();
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
		if (typeof(xmlString) !== 'string' || typeof(xslString) !== 'string') {
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
		if (typeof window.xsltProcess !== 'undefined') {
			log('performXSLT(): performing XSLT via AJAXSLT library');
			html = xsltProcess(xml, xsl);
		} else if (window.XSLTProcessor !== undefined) {
			log('performXSLT(): performing XSLT via XSLTProcessor()');
			var xsltProcessor = new XSLTProcessor();
			xsltProcessor.importStylesheet(xsl);
			html = xsltProcessor.transformToFragment(xml, document);
		} else {
			html = '<p>Your browser does not support MoJO keywords.</p>'; 
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

// perform all steps necessary to populate element with MoJO result
function generateMojoAnswer(args) {
	log('generateMojoAnswer(): currentConfig=' + currentConfig.name);
	var deferred = new $.Deferred(),
		type,
		xml,
		xsl = currentConfig.xsl,
		placeholders, p, pLength,
		value,
		variable, condition,
		starDetailFn = function(d, detail) {
			xml += '<' + d + '>' + detail + '</' + d + '>';
		},
		conditionStarFn = function(star, details) {
			condition += ' or ' + variable + '=\'' + star + '\'';
		};
	if ($.type(xsl) !== 'string' || xsl.length === 0) {
		deferred.reject('<p>Error: this Interaction does not have any XSL to transform.</p>');
		return deferred.promise();
	}
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
	if ($.type(currentConfig.xml) !== 'string' || currentConfig.xml.length === 0) {
		$.when(performXSLT('<xml />', xsl)).done(function(html) {
			deferred.resolve(html);
		}).fail(function(html) {
			deferred.resolve(html);
		});
		return deferred.promise();
	}
	MyAnswers.dispatch.add(function() {
		if (currentConfig.mojoType === 'stars' || currentConfig.xml.substr(0,6) === 'stars:') { // use starred items
			type = currentConfig.xml.replace(/^stars:/, '');
			xml = '';
			if ($.type(starsProfile[type]) !== 'object') {
				xml = '<stars></stars>';
			} else {
				$.each(starsProfile[type], function(s, details) {
					xml += '<' + type + ' id="' + s + '">';
					$.each(details, starDetailFn);
					xml += '</' + type + '>';
				});
				xml = '<stars>' + xml + '</stars>';
			}
			$.when(performXSLT(xml, xsl)).done(function(html) {
				deferred.resolve(html);
			}).fail(function(html) {
				deferred.resolve(html);
			});
		} else {
			$.when(MyAnswers.store.get('mojoXML:' + currentConfig.xml)).always(function(xml) {
				var general = '<p>The data used to contruct this page is not currently stored on your device.</p>',
					hosted = '<p>Please try again in 30 seconds.</p>';
				while (xsl.indexOf('blink-stars(') !== -1) {// fix star lists
					condition = '';
					type = xsl.match(/blink-stars\(([@\w]+),\W*(\w+)\W*\)/);
					variable = type[1];
					type = type[2];
					if ($.type(starsProfile[type]) === 'object') {
						$.each(starsProfile[type], conditionStarFn);
						condition = condition.substr(4);
					}
					if (condition.length > 0) {
						xsl = xsl.replace(/\(?blink-stars\(([@\w]+),\W*(\w+)\W*\)\)?/, '(' + condition + ')');
					} else {
						xsl = xsl.replace(/\(?blink-stars\(([@\w]+),\W*(\w+)\W*\)\)?/, '(false())');
					}
					log('generateMojoAnswer(): condition=' + condition);
				}
				if (typeof xml === 'string') {
					$.when(performXSLT(xml, xsl)).done(function(html) {
						deferred.resolve(html);
					}).fail(function(html) {
						deferred.resolve(html);
					});
				} else if (currentConfig.mojoType === 'server-hosted') {
					deferred.reject(general + hosted);
				} else {
					deferred.reject(general);
				}
			});
		}
	});
	return deferred.promise();
}

function setSubmitCachedFormButton() {
	var $button = $('#pendingButton'),
		$box = $('#pendingBox'),
		$section = $box.children('[data-blink-form-version=2]'),
		$sectionV1 = $box.children('[data-blink-form-version=1]'),
		$noMessage = $box.children('.bForm-noPending'),
		count = 0,
		promises = [];
	$.when(MyAnswers.pendingStore.keys(), MyAnswers.pendingV1Store.keys())
		.then(function(keys, keysV1) {
			var count = keys.length + keysV1.length,
				buttonText = count + ' Pending',
				keysFn = function(index, key, $section) {
					var version = $section.data('blinkFormVersion'),
						$template = $section.children('.template[hidden]'),
						$entry = $template.clone(),
						keyParts = key.split(':'),
						interaction = siteVars.config['i' + keyParts[0]],
						name = interaction ? (interaction.pertinent.displayName || interaction.pertinent.name) : '* unknown *',
						form = keyParts[1],
						uuid = keyParts[2],
						$summary;
					$entry.children('h3').text(name);
					$entry.children('pre.uuid').text(uuid);
					// TODO: populate summary "list" fields in the <dl />
					if (version === 2) {
						$.when(MyAnswers.pendingStore.get(key))
							.then(function(json) {
								if (typeof json !== 'string' || json.length === 0) {
									return;
								} else if ($.type(json) !== 'object') {
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
						$entry.removeAttr('hidden').removeClass('template');
					});
				};
			log("setSubmitCachedFormButton(): " + buttonText);
			MyAnswers.dispatch.add(function() {
				if (count !== 0) {
					insertText($button[0], buttonText);
					$noMessage.addClass('hidden');
					$button.removeClass('hidden');
				} else {
					$noMessage.removeClass('hidden');
					$button.addClass('hidden');
				}
			});
			MyAnswers.dispatch.add(function() {
			$section.children('.bForm-pending:not(.template)').remove();
				if (keys.length > 0) {
					$.each(keys, function(index, key) {
						keysFn(index, key, $section);
					});
					$section.prop('hidden', false);
				} else {
					$section.prop('hidden', true);
				}
			});
			MyAnswers.dispatch.add(function() {
				$sectionV1.children('.bForm-pending:not(.template)').remove();
				if (keysV1.length > 0) {
					$.each(keysV1, function(index, key) {
						keysFn(index, key, $sectionV1);
					});
					$sectionV1.prop('hidden', false);
				} else {
					$sectionV1.prop('hidden', true);
				}
			});
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
	var $element = $(this),
		a, attributes = $element.attr(),
		args = { },
		id, requestUri;
	if (typeof attributes.href === 'undefined' && typeof attributes.onclick === 'undefined') {
		if (typeof attributes.back !== 'undefined') {
			History.back();
		} else if (typeof attributes.home !== 'undefined') {
			History.pushState(null, null, '/' + siteVars.answerSpace + '/');
		} else if (typeof attributes.login !== 'undefined') {
			History.pushState({login: true});
		} else if (attributes.interaction || attributes.keyword) {
			id = resolveItemName(attributes.interaction || attributes.keyword, 'interactions');
			if (id) {
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
				delete args.style;
				if (attributes['data-submit-stars-type']) {
					args._submitStarsType = $element.data('submitStarsType');
					args._submitStarsPost = $element.data('submitStarsPost') || 'stars';
				}
				requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?' + $.param(args);
				History.pushState({m: currentMasterCategory, c: currentCategory, i: id, 'arguments': args}, null, requestUri);
			}
		} else if (typeof attributes.category !== 'undefined') {
			id = resolveItemName(attributes.category, 'categories');
			if (id) {
				requestUri = '/' + siteVars.answerSpace + '/?_c=' + id;
				History.pushState({m: currentMasterCategory, c: id});
			}
		} else if (typeof attributes.mastercategory !== 'undefined') {
			id = resolveItemName(attributes.mastercategory, 'masterCategories');
			if (id) {
				requestUri = '/' + siteVars.answerSpace + '/?_m=' + id;
				History.pushState({m: id});
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

// *** PENDING QUEUE HELPERS ***

/**
 * Count the number of stored submissions for both BlinkForms v1 and v2.
 * @returns {jQueryPromise} number of stored forms
 */
function countPendingForms() {
	var deferred = new $.Deferred();
	$.when(MyAnswers.pendingStore.size()).then(function(size) {
		$.when(MyAnswers.pendingV1Store.size()).then(function(sizeV1) {
			deferred.resolve(size + sizeV1);
		});
	});
	return deferred.promise();
}

/**
 * Add a BlinkForms v2 submission to the queue.
 * @param {String} interaction ID
 * @param {String} form name of the form object
 * @param {String} uuid UUID
 * @param {Object} data key=>value pairs to be JSON-encoded
 * @param {Object} summary key=>value pairs to be JSON-encoded
 * @returns {jQueryPromise}
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
 * @param {String} interaction ID
 * @param {String} form name of the form object
 * @param {String} uuid UUID
 * @returns {jQueryPromise}
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
 * @param {String} interaction ID
 * @param {String} form name of the form object
 * @param {String} uuid UUID
 * @param {Object} data key=>value pairs to be JSON-encoded
 * @returns {jQueryPromise}
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
 * @param {String} interaction ID
 * @param {String} form name of the form object
 * @param {String} uuid UUID
 * @returns {jQueryPromise}
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
		if (isHome() || MyAnswers.isEmptySpace || MyAnswers.isLoginOnly) {
			$navButtons.addClass('hidden');
			$.when(countPendingForms()).then(function(queueCount) {
				if (siteVars.hasLogin || !$helpButton.hasClass('hidden') || queueCount > 0) {
					$navBars.removeClass('hidden');
				} else {
					$navBars.addClass('hidden');
				}
			});
			if(MyAnswers.dfrdMoJOs.isResolved()) {
				processMoJOs();
			}
		} else {
			$navButtons.removeClass('hidden');
			$navButtons.removeAttr('disabled');
			$navBars.removeClass('hidden');
		}
		$('#loginButton, #logoutButton, #pendingButton').removeAttr('disabled');
		MyAnswers.dispatch.add(function() {$(window).trigger('scroll');});
		if (MyAnswers.sideBar) {
			MyAnswers.sideBar.update();
		}
	});
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
					MyAnswers.$body.trigger('locationUpdated');
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
					MyAnswers.$body.trigger('locationUpdated');
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
	MyAnswers.$body.trigger('taskBegun');
	var location = new google.maps.LatLng(data.latitude, data.longitude);
	var options = {
		zoom: parseInt(data.zoom, 10),
		center: location,
		mapTypeId: google.maps.MapTypeId[data.type.toUpperCase()]
	};
	map.setOptions(options);
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
		if (typeof(data.markerTitle) === 'string')
		{
			marker.setTitle(data.markerTitle);
			var markerInfo = new google.maps.InfoWindow();
			google.maps.event.addListener(marker, 'click', function() {
				markerInfo.setContent(marker.getTitle());
				markerInfo.open(map, marker);
			});
		}
	}
	MyAnswers.$body.trigger('taskComplete');
}

function setupGoogleMapsDirections(element, data, map)
{
	log('Google Maps Directions: initialising ' + $.type(data));
	var origin, destination, language, region, geocoder;
	if (typeof(data.originAddress) === 'string')
	{
		origin = data.originAddress;
	}
	else if (typeof(data.originLatitude) !== 'undefined')
	{
		origin = new google.maps.LatLng(data.originLatitude, data.originLongitude);
	}
	if (typeof(data.destinationAddress) === 'string')
	{
		destination = data.destinationAddress;
	}
	else if (typeof(data.destinationLatitude) !== 'undefined')
	{
		destination = new google.maps.LatLng(data.destinationLatitude, data.destinationLongitude);
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
				data.originLatitude = latitude;
				data.originLongitude = longitude;
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
				data.destinationLatitude = latitude;
				data.destinationLongitude = longitude;
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
	MyAnswers.$body.trigger('taskBegun');
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
	MyAnswers.$body.trigger('taskComplete');
}

function setupGoogleMaps()
{
	MyAnswers.$body.trigger('taskBegun');
	$('div.googlemap').each(function(index, element) {
		var googleMap = new google.maps.Map(element);
		var data = $(element).data();
/*		if (data.sensor === true && isLocationAvailable())
		{
			startTrackingLocation();
		} */
		if ($(element).data('mapAction') === 'directions')
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
			MyAnswers.$body.bind('locationUpdated', function() {
				currentMarker.setPosition(new google.maps.LatLng(latitude, longitude));
			});
			var currentInfo = new google.maps.InfoWindow();
			google.maps.event.addListener(currentMarker, 'click', function() {
				currentInfo.setContent(currentMarker.getTitle());
				currentInfo.open(googleMap, currentMarker);
			});
		}
	});
	MyAnswers.$body.trigger('taskComplete');
}

function initialiseAnswerFeatures($view, afterPost) {
	log('initialiseAnswerFeatures(): view=' + $view.attr('id'));
	var deferred = new $.Deferred(),
		promises = [],
		oldLoginStatus,
		current = $.type(currentInteraction) === 'string' ? currentInteraction : String(currentInteraction),
		prompt = $.type(currentConfig.loginPromptInteraction) === 'string' ? currentConfig.loginPromptInteraction : String(currentConfig.loginPromptInteraction);
	// loginUseInteractions
	if (afterPost && currentConfig.loginAccess && currentConfig.loginUseInteractions && prompt === current) {
		oldLoginStatus = MyAnswers.isLoggedIn;
		$.when(requestLoginStatus()).always(function() {
			if (MyAnswers.isLoggedIn !== oldLoginStatus) {
				window.location.reload();
			}
		});
	}
	// END: loginUseInteractions
	MyAnswers.dispatch.add(function() {
		var $inputs = $view.find('input, textarea, select'),
			$form = $view.find('form').first(),
			isGoogleJSLoaded = typeof window.google !== 'undefined' && typeof google.maps !== 'undefined';
		MyAnswers.$body.trigger('taskBegun');
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
			if (isGoogleJSLoaded) {
				setTimeout(setupGoogleMaps, 1000);
			} else {
				$.getScript('//maps.googleapis.com/maps/api/js?v=3&sensor=true&callback=setupGoogleMaps')
					.fail(function() {
						throw('unable to download Google Maps JavaScript library');
					});
			}
		} else {
			stopTrackingLocation();
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
		});
	});
	return deferred.promise();
}

// run after any change to current*
function updateCurrentConfig() {
	var $footer = MyAnswers.$body.children('footer');
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
	if ($footer.html() !== currentConfig.footer) {
		MyAnswers.dispatch.add(function() {
			$footer.html(currentConfig.footer);
		});
	}
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
		if (style !== $style.text()) {
			$style.text(style);
		}
	});
}

(function(window, undefined) {
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
		window.location.assign($(this).data('hyperlink'));
	}

	MyAnswers.populateItemListing = function(level, $view) {
		var arrangement, display, order, list, $visualBox, $listBox, type,
			name, $item, $label, $description,
			hook = {},
			o, oLength,
			category, columns, $images,
			itemConfig;
		hook.interactions = function($item) {
			var id = $item.attr('data-id');
			if (siteVars.config['i' + id].pertinent.type === 'hyperlink' && siteVars.config['i' + id].pertinent.hyperlink) {
				$item.attr('data-hyperlink', siteVars.config['i' + id].pertinent.hyperlink);
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
		oLength = order.length;
		MyAnswers.dispatch.add(function() {
			for (o = 0; o < oLength; o++) {
				itemConfig = siteVars.config[type + order[o]];
				if (typeof itemConfig !== 'undefined' && $.inArray(order[o], list) !== -1 && itemConfig.pertinent.display !== 'hide') {
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
				$visualBox.appendTo($view);
			}
		});
		MyAnswers.dispatch.add(function() {
			if ($listBox.children().size() > 0) {
				$listBox.appendTo($view);
			}
		});
	};
	
}(this));

(function(window, undefined) {
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
		} else if (hasMasterCategories && currentMasterCategory) {
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
	$.when(MyAnswersDevice.hideView(reverse)).always(function() {
		MyAnswers.populateItemListing('masterCategories', $view);
		updateCurrentConfig();
		setMainLabel('Master Categories');
		MyAnswersDevice.showView($view, reverse);
	});
}

function goBackToMasterCategoriesView() {
	log('goBackToMasterCategoriesView()');
	$.when(MyAnswersDevice.hideView(true)).always(function() {
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
	$.when(MyAnswersDevice.hideView()).always(function() {
		updateCurrentConfig();
		setMainLabel(masterCategory ? siteVars.config['m' + masterCategory].pertinent.name : 'Categories');
		MyAnswers.populateItemListing('categories', $view);
		MyAnswersDevice.showView($view);
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
		if ($.inArray('phone', deviceVars.features) !== -1 || $(window).width() < 768) {
			$('#mainLabel').remove(); //  TODO: fix the main navigation label
		}
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
		if (currentConfig.defaultScreen === 'login' || MyAnswers.isLoginOnly) {
			History.pushState({login: true});
		} else if (currentConfig.defaultScreen === 'interaction' && hasInteractions && typeof siteVars.config['i' + currentConfig.defaultInteraction] !== undefined) {
			requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + currentConfig.defaultInteraction].pertinent.name + '/?';
			History.pushState({i: currentConfig.defaultInteraction}, null, requestUri);
		} else if (currentConfig.defaultScreen === 'category' && hasCategories && typeof siteVars.config['c' + currentConfig.defaultCategory] !== undefined) {
			requestUri = '/' + siteVars.answerSpace + '/?_c=' + currentConfig.defaultCategory;
			History.pushState({c: currentConfig.defaultCategory}, null, requestUri);
		} else if (currentConfig.defaultScreen === 'master category' && hasMasterCategories && typeof siteVars.config['m' + currentConfig.defaultMasterCategory] !== undefined) {
			requestUri = '/' + siteVars.answerSpace + '/?_m=' + currentConfig.defaultMasterCategory;
			History.pushState({m: currentConfig.defaultMasterCategory}, null, requestUri);
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
					History.pushState({i: interaction, 'arguments': siteVars.queryParameters}, null, requestUri);
				} else if (interaction) {
					requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + interaction].pertinent.name + '/?';
					History.pushState({i: interaction}, null, requestUri);
				} else if (typeof(siteVars.queryParameters._c) === 'string') {
					requestUri = '/' + siteVars.answerSpace + '/?_c=' + siteVars.queryParameters._c;
					History.pushState({c: siteVars.queryParameters._c}, null, requestUri);
				} else if (typeof(siteVars.queryParameters._m) === 'string') {
					requestUri = '/' + siteVars.answerSpace + '/?_m=' + siteVars.queryParameters._m;
					History.pushState({m: siteVars.queryParameters._m}, null, requestUri);
				}
				delete siteVars.queryParameters;
			});
	}
	startUp.remove();
	$('#content').removeClass('hidden');
	setSubmitCachedFormButton();
	processForms();
	MyAnswers.dfrdMoJOs = processMoJOs();
}

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
			ajaxQueue.add({
				url: siteVars.serverAppPath + '/xhr/GetMoJO.php',
				data: requestData,
				dataType: 'xml',
				complete: function(jqxhr, status) {
					if (jqxhr.status === 200) {
						$.when(MyAnswers.store.set('mojoXML:' + mojo, jqxhr.responseText))
							.fail(deferred.reject)
							.then(deferred.resolve);
//								MyAnswers.store.set('mojoLastUpdated:' + mojo, new Date(jqxhr.getResponseHeader('Last-Modified')).getTime());
					} else if (jqxhr.status === 304) {
						deferred.resolve();
					} else {
						deferred.reject();
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
	interactions = interaction ? [ interaction ] : siteVars.map.interactions,
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

function processForms() {
	var ajaxDeferred = new $.Deferred(),
	libraryDeferred = new $.Deferred(),
	validActions = [ 'add', 'delete', 'edit', 'find', 'list', 'search', 'view' ],
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
	/* END: var */
	// load HTML5 WebForms poly-fill
	$.getScript(siteVars.serverAppPath + '/BlinkForms2.js')
	.always(function() {
			setTimeout(function() {
				if (window.BlinkForms && window.BlinkFormObject && window.BlinkFormElement) {
					log('$.getScript: success: ' + siteVars.serverAppPath + '/BlinkForms2.js');
					libraryDeferred.resolve();
				} else {
					log('$.getScript: error: ' + siteVars.serverAppPath + '/BlinkForms2.js');
					libraryDeferred.reject();
				}
			}, 197);
		});
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
	//			MyAnswers.store.set('formLastUpdated:' + form, new Date(jqxhr.getResponseHeader('Last-Modified')).getTime());
				}
				if (jqxhr.status === 200 || jqxhr.status === 304) {
					MyAnswers.store.set('formLastChecked:' + id, $.now());
					ajaxDeferred.resolve();
				} else {
					ajaxDeferred.reject();
				}
			},
			timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500 * 1024))
		});
	} else {
		ajaxDeferred.resolve();
	}
	$.when(ajaxDeferred.promise(), libraryDeferred.promise())
	.fail(MyAnswers.formsDeferred.reject)
	.then(MyAnswers.formsDeferred.resolve);
}

function processConfig(display) {
	var siteStructure,
	config;
	/* END: var */
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
		if (config.loginAccess && !MyAnswers.isLoggedIn){
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
	dfrd = new $.Deferred();
	/* END: var */
	if (!deviceVars.isOnline) {
		dfrd.reject();
		return dfrd.promise();
	}
	$.ajax({
		url: siteVars.serverAppPath + '/xhr/GetConfig.php',
		type: 'POST',
		dataType: 'json',
		timeout: computeTimeout(40 * 1024),
		complete: function(jqxhr, status) {
			var data,
			items = ['a' + siteVars.id],
			siteStructure;
			/* END: var */
			if (jqxhr.status === 200) {
				data = $.parseJSON(jqxhr.responseText);
				if ($.type(data.map) === 'object') {
					siteVars.map = data.map;
					MyAnswers.siteStore.set('map', JSON.stringify(siteVars.map));
				}
				if ($.type(data['a' + siteVars.id]) === 'object') {
					siteStructure = data['a' + siteVars.id].pertinent.siteStructure;
				}
				if (siteVars.map) {
					if (siteStructure === 'master categories' && siteVars.map.masterCategories.length > 0) {
						items = items.concat($.map(siteVars.map.masterCategories, function(element, index) {
							return 'm' + element;
						}));
					}
					if (siteStructure !== 'interactions only' && siteVars.map.categories.length > 0) { // masterCategories or categories
						items = items.concat($.map(siteVars.map.categories, function(element, index) {
							return 'c' + element;
						}));
					}
					if (siteVars.map.interactions.length > 0) {
						items = items.concat($.map(siteVars.map.interactions, function(element, index) {
							return 'i' + element;
						}));
					}
				}
			}
			if ($.type(siteVars.config) !== 'object' || items.length > 0) {
				siteVars.config = {};
			}
			$.each(items, function(index, id) {
				if ($.type(data[id]) === 'object') {
					siteVars.config[id] = data[id];
				}
			});
			MyAnswers.siteStore.set('config', JSON.stringify(siteVars.config));
			deviceVars.features = data.deviceFeatures;
			if (jqxhr.status === 200 || jqxhr.status === 304 || jqxhr.status === 0) {
				dfrd.resolve();
			} else {
				dfrd.reject();
			}
		}
	});
	return dfrd.promise();
}

function prepareConfig() {
	var dfrd = new $.Deferred();
	$.when(requestLoginStatus())
	.always(function() {
		$.when(requestConfig())
		.always(function() {
			if (siteVars.map && siteVars.config) {
				processConfig();
				displayAnswerSpace();
			} else {
				$startup.append('error: unable to contact server, insufficient data found in local storage');
			}
		});
	});
	return dfrd.promise();
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
	MyAnswers.$body.trigger('taskComplete');
	//	getSiteConfig();
}

function gotoStorageView() {
	History.pushState({storage: true}, null, '/' + siteVars.answerSpace + '/?_storage=true');
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
		$answerView = $('#answerView'),
		$answerBox = $('#answerBox'),
		answerBox = $answerBox[0],
		completeFn = function() {
			$.when(initialiseAnswerFeatures($answerView)).always(function() {
				setMainLabel(currentConfig.displayName || currentConfig.name);
				MyAnswersDevice.showView($answerView, reverse);
				MyAnswers.dispatch.add(function() {MyAnswers.$body.trigger('taskComplete');});
			});
		};
	interaction = resolveItemName(interaction);
	if (interaction === false) {
		alert('The requested Interaction could not be found.');
		return;
	}
	MyAnswers.$body.trigger('taskBegun');
	$.when(MyAnswersDevice.hideView(reverse)).always(function() {
		currentInteraction = interaction;
		updateCurrentConfig();
		if (typeof currentConfig.xml === 'string' && currentConfig.xml.substring(0, 6) !== 'stars:') {
			if (currentConfig.mojoType === 'server-hosted' && MyAnswers.dfrdMoJOs.isResolved()) {
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
		if (currentConfig.type === 'message') {
			insertHTML(answerBox, currentConfig.message);
			completeFn();
		} else if (currentConfig.type === 'xslt' && deviceVars.disableXSLT !== true) {
			$.when(MyAnswers.dfrdMoJOs)
			.always(function() {
				$.when(generateMojoAnswer(args))
				.always(function(html) {
					insertHTML(answerBox, html);
					completeFn();
				});
			});
		} else if (reverse) {
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
				html = $('<form data-object-name="' + currentConfig.blinkFormObjectName + '" data-action="' + currentConfig.blinkFormAction + '" />');
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
				$.when(MyAnswers.store.get('answer___' + interaction)).done(function(html) {
					if (typeof html === 'undefined') {
						html = '<p>Unable to reach server, and unable to display previously stored content.</p>';
					}
					insertHTML(answerBox, html);
					completeFn();
				});
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
					requestData._submitStarsType = [ requestData._submitStarsType ];
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
	var id = resolveItemName(keyword, 'interactions'),
		requestUri;
	log('showSecondLevelAnswerView(): keyword=' + keyword + ' args=' + arg0);
	if (id) {
		requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?' + arg0;
		History.pushState({m: currentMasterCategory, c: currentCategory, i: id, 'arguments': deserialize(arg0)}, null, requestUri);
	}
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
	var mainLabel,
		$view = $('#keywordListView');
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
		MyAnswers.populateItemListing('interactions', $view);
		MyAnswersDevice.showView($view);
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

function showLoginView(event) {
	var id,
		requestUri;
	if (!currentConfig.loginAccess) {
		return false;
	}
	if (MyAnswers.isCustomLogin) {
		id = resolveItemName(currentConfig.loginPromptInteraction, 'interactions');
		if (!id) {
			alert('error: interaction used for login prompt is inaccessible or misconfigured');
			return false;
		}
		requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?';
		History.pushState({m: null, c: null, i: id}, null, requestUri);
		return false;
	}
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
				$loginStatus.bind('click', submitLogout);
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
		MyAnswers.populateItemListing('interactions', $('#keywordListView'));
	}
}

function requestLoginStatus() {
	var deferred = new $.Deferred();
	if (!siteVars.hasLogin || !deviceVars.isOnline) {
		deferred.reject();
		return deferred.promise(); 
	}
	ajaxQueue.add({
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
			deferred.resolve();
		},
		timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(500))
	});
	return deferred.promise();
}

function submitLogin() {
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

function submitLogout(event) {
	var id, requestUri;
	log('submitLogout();');
	if (!currentConfig.loginAccess) {
		return false;
	}
	if (currentConfig.loginUseInteractions) {
		id = resolveItemName(currentConfig.loginPromptInteraction, 'interactions');
		if (!id) {
			alert('error: interaction used for login prompt is inaccessible or misconfigured');
			return false;
		}
		requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + id].pertinent.name + '/?';
		History.pushState({m: null, c: null, i: id}, null, requestUri);
		return false;
	}
	if (confirm('Log out?')) {
		ajaxQueue.add({
			type: 'GET',
			cache: "false",
			url: siteVars.serverAppPath + '/xhr/GetLogin.php',
			data: {
				'_a': 'logout'
			},
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

function submitFormWithRetry(data) {
	var str, arr, method, uuid,
		localKeyword;
	if ($.type(data) === 'object') {
		str = data.data;
		arr = data.action.split("/");
		method = data.method;
		uuid = data.uuid;
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
					clearPendingFormV1(data.interaction, uuid);
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
		uuid = Math.uuid();
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
            str += "&" + element.name + "=" + encodeURIComponent(lastPictureTaken.image.get(element.name));
            // log("if: " + str);
          }
        }
        else
        {
          if (element.type && (element.type.toLowerCase() === 'button')) {
            if ((element.value !== "Gallery") && (element.value !== "Camera"))
            { 
              str += "&" + element.name + "=" + encodeURIComponent(element.value);
            }
            else
            {
              str += "&" + element.name + "=";
            }
          }
          else
          {
						str += "&" + element.name + "=" + encodeURIComponent(element.value);
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
	$.when(pushPendingFormV1(currentInteraction, uuid, {
			data: str,
			'action': action,
			'method': $.type(method) === 'string' ? method.toUpperCase() : 'post',
			'uuid': uuid,
			interaction: currentInteraction
		}))
		.fail(function() {
			alert('Error: unable to feed submission through queue.');
		})
		.then(submitFormWithRetry);
	// queuePendingFormData(str, document.forms[0].action, document.forms[0].method.toLowerCase(), Math.uuid(), submitFormWithRetry);
  return false;
}

function submitAction(keyword, action) {
	log('submitAction(): keyword=' + keyword + ' action=' + action);
	var $view = $('.view:visible,'),
		currentBox = $view.children('.box'),
		form = currentBox.find('form').first(),
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
		requestUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?asn=' + siteVars.answerSpace + "&iact=" + keyword;
		requestData = '&' + formData + (typeof(action) === 'string' && action.length > 0 ? '&' + action : '');
	} else {
		method = 'POST';
		requestUrl = siteVars.serverAppPath + '/xhr/GetAnswer.php?asn=' + siteVars.answerSpace + "&iact=" + keyword + (typeof(action) === 'string' && action.length > 0 ? '&' + action : '');
		requestData = formData;
	}
	MyAnswers.$body.trigger('taskBegun');
	$.ajax({
		type: method,
		cache: 'false',
		url: requestUrl,
		data: requestData,
		complete: function(xhr, textstatus) { // readystate === 4
			MyAnswers.$body.trigger('taskComplete');
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
					$.when(initialiseAnswerFeatures(currentBox, true)).always(function() {
						MyAnswersDevice.showView(currentBox.closest('.view'));
					});
				}
				else
				{
					var answerBox2 = document.getElementById('answerBox2');
					insertHTML(answerBox2, html);
					$.when(initialiseAnswerFeatures($('#answerView2'), true)).always(function() {
						MyAnswersDevice.showView($('#answerView2'));
					});
				}
			});
		},
		timeout: Math.max(currentConfig.downloadTimeout * 1000, computeTimeout(requestUrl.length + requestData.length))
	});
	return false;
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

/* moving non-public functions into a closure for safety */
(function(window, undefined) {
	var document = window.document,
		siteVars = window.siteVars,
		deviceVars = window.deviceVars,
		MyAnswers = window.MyAnswers,
		$ = window.jQuery,
		$startup = $('#startUp'),
		navigator = window.navigator,
		$window = $(window),
		History, _pushState, _replaceState; // defined in onBrowserReady

/* *** BLINKGAP FUNCTIONS *** */
	
	/**
	 * @returns {jQueryPromise}
	 */
	function fixWebSQL() {
		var deferred = new $.Deferred(),
		db = null,
		/* @inner */
		increaseQuota_Success = function(quotaIncrease) {
			db = null;
			navigator.notification.alert("Database installed, please restart the App.", 
																	 function() {
																		 navigator.gap_database.requestTerminate();
																	 }, 
																	 "First Run", 
																	 "Close App");
			deferred.resolve();                                                                                                                       
			log("fixWebSQL(): quota increase: " + quotaIncrease);
		},
		/* @inner */
		getDBLimits_Success = function(results) {
			var options = { quotaIncrease: String(MyAnswers.device.storageQuota) },
			allocatedSpace = results.allocatedSpace,
			currentQuota = results.currentQuota;
			/* END: var */
			log("fixWebSQL(): allocatedSpace=" + allocatedSpace + ' currentQuota=' + currentQuota);
			if (currentQuota < MyAnswers.device.storageQuota) {
				navigator.gap_database.increaseQuota(increaseQuota_Success, null, options);
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
				db = openDatabase(siteVars.answerSpace, '1.0', siteVars.answerSpace, 1024 * 1024);
				navigator.gap_database.getLimits(getDBLimits_Success, null, null);
			} catch(error) {
				deferred.reject();
				log(error);
				log("*** Open/Increase quota for database failed");
				throw 'fixWebSQL(): ' + error;
			}
		} else {
			log('fixWebSQL(): nothing to do');
			deferred.resolve();
		}
		return deferred.promise();
	}

/* *** HELPER FUNCTIONS *** */

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
		log('BlinkGap.networkReachable(): online=' + deviceVars.isOnline + ' cell='  + deviceVars.isOnlineCell + ' wifi=' + deviceVars.isOnlineWiFi);
	}

/* *** EVENT HANDLERS *** */

	function onNetworkChange() {
		var host;
//		if (window.device && navigator.network) { // TODO: check when this BlinkGap code will actually work (state.code === undefined)
//			host = siteVars.serverDomain ? siteVars.serverDomain.split(':')[0] : 'blinkm.co';
//			navigator.network.isReachable(host, networkReachableFn);
//		} else {
			deviceVars.isOnline = navigator.onLine === true;
			log('onNetworkChange(): online=' + deviceVars.isOnline);
//		}
	}

// TODO: a window resize event _may_ cause DOM issues with out transitions
/*	function onWindowResize(event) {
		$('html').css('min-height', window.innerHeight);
	} */

	function onPendingClick(event) {
		var $button = $(event.target),
			action = $button.data('action'),
			$entry = $button.closest('.bForm-pending'),
			$section = $entry.closest('section'),
			version = $section.data('blinkFormVersion'),
			interaction = $entry.data('interaction'),
			form = $entry.data('form'),
			uuid = $entry.children('pre.uuid').text(),
			requestUri,
			cancelText = 'Are you sure you wish to discard this pending record?';
		if (version === 2) {
			if (action === 'cancel' && confirm(cancelText)) {
				clearPendingForm(interaction, form, uuid);
			} else if (action === 'resume') {
				requestUri = '/' + siteVars.answerSpace + '/' + siteVars.config['i' + interaction].pertinent.name + '/?_uuid=' + uuid;
				History.pushState({m: currentMasterCategory, c: currentCategory, i: interaction, 'arguments': {pendingForm: interaction + ':' + form + ':' + uuid}}, null, requestUri);
			}
		} else if (version === 1) {
			if (action === 'cancel' && confirm(cancelText)) {
				clearPendingFormV1(interaction, uuid);
			} else if (action === 'submit') {
				$.when(MyAnswers.pendingV1Store.get(interaction + ':' + uuid))
					.fail(function() {
						alert('Error: unable to retrieve this form.');
					})
					.then(function(data) {
						data = $.parseJSON(data);
						submitFormWithRetry(data);
					});
			}
		}
	}

	function onTaskBegun(event) {
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

	function onTaskComplete(event) {
		if (MyAnswers.runningTasks > 0) {
			MyAnswers.runningTasks--;
		}
		if (MyAnswers.runningTasks <= 0) {
			if (MyAnswers.activityIndicatorTimer !== null) {
				clearTimeout(MyAnswers.activityIndicatorTimer);
			}
			MyAnswers.activityIndicatorTimer = null;
			$(MyAnswers.activityIndicator).addClass('hidden');
		}
		return true;
	}

/* *** INITIALISATION FUNCTIONS *** */

	function loaded() {
		log('loaded():');
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
				})
				.always(prepareConfig);
			});
			$.when(MyAnswers.store.get('starsProfile')).then(function(stars) {
				if ($.type(stars) === 'string') {
					stars = $.parseJSON(stars);
				}
				if ($.type(stars) === 'object') {
					starsProfile = stars;
				}
			});
			$('#startUp-initLoaded').addClass('success');
		} catch(e) {
			log("loaded(): exception:");
			log(e);
			$('#startUp-initLoaded').addClass('error');
			$startup.append('loading error: ' + e);
		}
	}

	function init_main() {
		var storeEngine = null, // pick automatic engine by default
		loadedPromises = [],
		dfrdFixWebSQL;
		/* END: var */
		log("init_main(): ");
		siteVars.requestsCounter = 0;

		PictureSourceType.PHOTO_LIBRARY = 0;
		PictureSourceType.CAMERA = 1;
		lastPictureTaken.image = new Hashtable();
		lastPictureTaken.currentName = null;

		$.fx.interval = 27; // default is 13, increasing this to be kinder on devices
		
		log('Modernizr.positionfixed = ' + Modernizr.positionfixed);

		ajaxQueue = $.manageAjax.create('globalAjaxQueue', {queue: true});
		MyAnswers.dispatch = new BlinkDispatch(siteVars.serverAppBranch === 'W' ? 149 : 47);

		MyAnswers.runningTasks = 0; // track the number of tasks in progress

		// to facilitate building regex replacements
		RegExp.quote = function(str) {return str.replace(/([.?*+\^$\[\]\\(){}\-])/g, "\\$1");};
		
		addEvent(document, 'orientationChanged', updateOrientation);
//		MyAnswers.$window.bind('resize', onWindowResize);
//		MyAnswers.$window.trigger('resize');

		MyAnswers.activityIndicator = document.getElementById('activityIndicator');
		MyAnswers.activityIndicatorTimer = null;

		MyAnswers.$body.bind('taskBegun', onTaskBegun);
		MyAnswers.$body.bind('taskComplete', onTaskComplete);
		MyAnswers.$body.delegate('a:not([href="#"])', 'click', onLinkClick);
		MyAnswers.$body.delegate('a[href="#"]', 'click', false);
		$('#pendingBox').delegate('button', 'click', onPendingClick);

		$window.bind('online', onNetworkChange);
		$window.bind('offline', onNetworkChange);
		onNetworkChange(); // $window.trigger('online');

		if (siteVars.serverAppBranch === 'W') {
			storeEngine = null; // native application should always use auto-select
		} else if (navigator.userAgent.indexOf('Android') !== -1) {
			// Android has problems with persistent storage
			storeEngine = 'sessionstorage';
		}

		if (navigator.gap_database && $.inArray('websqldatabase', BlinkStorage.prototype.available) !== -1) {
			dfrdFixWebSQL = fixWebSQL();
		} else {
			dfrdFixWebSQL = true; // will count as an instantly resolved Deferred Promise
		}
		
		$.when(dfrdFixWebSQL)
		.always(function() {
			MyAnswers.store = new BlinkStorage(storeEngine, siteVars.answerSpace, 'jstore');
			loadedPromises.push(MyAnswers.store.ready());
			MyAnswers.siteStore = new BlinkStorage(storeEngine, siteVars.answerSpace, 'site');
			loadedPromises.push(MyAnswers.siteStore.ready());
			MyAnswers.pendingStore = new BlinkStorage(null, siteVars.answerSpace, 'pending');
			loadedPromises.push(MyAnswers.pendingStore.ready());
			MyAnswers.pendingV1Store = new BlinkStorage(null, siteVars.answerSpace, 'pendingV1');
			loadedPromises.push(MyAnswers.pendingV1Store.ready());
		});

		$.whenArray(loadedPromises)
		.fail(function() {
			$('#startUp-initMain').addClass('error');
			throw('initMain(): unable to initialise device storage');
		})
		.then(function() {
			$.when(MyAnswers.updateLocalStorage()).done(function() {
				$('#startUp-initMain').addClass('success');
				$('#startUp-initLoaded').addClass('working');
				loaded();
				log('loaded(): returned after call by BlinkStorage');
			});
		});
	}
	
	function onBrowserReady() {
		var $startup = $('#startUp');
		log("onBrowserReady: " + window.location.href);
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

			siteVars.serverAppPath = '//' + siteVars.serverDomain + '/_' + siteVars.serverAppBranch + '_/common/' + siteVars.serverAppVersion;
			siteVars.serverDevicePath = '//' + siteVars.serverDomain + '/_' + siteVars.serverAppBranch + '_/' + deviceVars.device + '/' + siteVars.serverAppVersion;
			siteVars.queryParameters = getURLParameters();
			siteVars.answerSpace = siteVars.queryParameters.answerSpace;
			delete siteVars.queryParameters.uid;
			delete siteVars.queryParameters.answerSpace;

			MyAnswers.$body = $('body');
			MyAnswers.$document = $(window.document);
			MyAnswers.$window = $(window);

			History.Adapter.bind(window, 'statechange', function(event) {
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
					// TODO: inputs=true should always force the prompt to display
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

			if (!History.enabled) {
				warn('History.JS is in emulation mode');
			}

			if (location.href.indexOf('index.php?answerSpace=') !== -1) {
				History.replaceState(null, null, '/' + siteVars.answerSpace + '/');
			}
			if (document.getElementById('loginButton') !== null) {
				// TODO: get hasLogin working directly off new config field
				siteVars.hasLogin = true;
			}

			// TODO: finish work on HTML5 Web Worker support
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
			 * MyAnswers.$body.trigger('taskBegun'); break; case 'workComplete':
			 * MyAnswers.$body.trigger('taskComplete'); break; } }; }
			 */

			if (siteVars.serverAppBranch === 'W') {
				MyAnswers.blinkgapDeferred = new $.Deferred();
				$('#startUp-initBlinkGap').addClass('working');
				if (window.device && window.device.ready) {
					onDeviceReady();
				} else {
					if (!addEvent(document, "deviceready", onDeviceReady)) {
						alert("Unable to add deviceready handler");
						throw("Unable to add deviceready handler");
					}
				}
				$.when(MyAnswers.blinkgapDeferred.promise())
					.done(function() {
						delete MyAnswers.blinkgapDeferred;
						MyAnswers.browserDeferred.resolve();
					});
			} else {
				MyAnswers.browserDeferred.resolve();
			}
			$('#startUp-initBrowser').addClass('success');
		} catch(e) {
			log("onBrowserReady: Exception");
			log(e);
			$startup.append('browser error: ' + e);
			MyAnswers.browserDeferred.reject();
			$('#startUp-initBrowser').addClass('error');
		}
	}	

	MyAnswers.bootPromises = [
		MyAnswers.deviceDeferred.promise(),
		MyAnswers.browserDeferred.promise(),
		MyAnswers.mainDeferred.promise()
	];
	$.whenArray(MyAnswers.bootPromises).done(function() {
		log("all promises kept, initialising...");
		try {
			$('#startUp-initMain').addClass('working');
			init_main();
			$('#startUp-initDevice').addClass('working');
			init_device();
		} catch(e) {
			log('exception in init_?():');
			log(e);
			$startup.append('initialisation error: ' + e);
		}
		log("User-Agent: " + window.navigator.userAgent);
		delete MyAnswers.bootPromises;
		delete MyAnswers.deviceDeferred;
		delete MyAnswers.browserDeferred;
		delete MyAnswers.mainDeferred;
	}).fail(function() {
		log('init failed, not all promises kept');
	});

	// load in JSON and XSLT polyfills if necessary
	$(document).ready(function() {
		$('#startUp-loadPolyFills').addClass('working');
		
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
		
		$.when(MyAnswers.mainDeferred.promise()).then(function() {
			Modernizr.load([{
				test: window.JSON,
				nope: '/_c_/json2.min.js'
			}, {
				test: window.XSLTProcessor && Modernizr.xpath,
				nope: [
					'/_c_/ajaxslt/0.8.1-r61/xmltoken.min.js',
					'/_c_/ajaxslt/0.8.1-r61/util.min.js',
					'/_c_/ajaxslt/0.8.1-r61/dom.min.js',
					// TODO: figure out how to test if the above scripts are needed
					'/_c_/ajaxslt/0.8.1-r61/xpath.min.js'
				],
				complete: function() {
					log('Modernizr.load(): XPath supported ' + (Modernizr.xpath ? 'natively' : 'via AJAXSLT'));
				}
			}, {
				test: window.XSLTProcessor,
				nope: '/_c_/ajaxslt/0.8.1-r61/xslt.min.js',
				complete: function() {
					log('Modernizr.load(): XSLT supported ' + (window.XSLTProcessor ? 'natively' : 'via AJAXSLT'));
				}
			}, {
				test: Modernizr.history && !(/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i).test(navigator.userAgent), // need HTML4 support on pre-4.3 iOS
				yep: '/_c_/historyjs/history-1.7.1-r2.html5.min.js',
				nope: '/_c_/historyjs/history-1.7.1-r2.min.js',
				callback: function(url, result) {
					log('Modernizr.load(): History.JS loaded for ' + (result ? 'HTML5' : 'HTML4+5'));
				}
			}, {
				complete: function() {
					$('#startUp-loadPolyFills').addClass('success');
					$('#startUp-initBrowser').addClass('working');
					setTimeout(onBrowserReady, window.device ? 2000 : 193);
				}
			}]);
		});
	});

}(this));

// END APPLICATION INIT

document.getElementById('startUp-loadMain').className = 'working success';
MyAnswers.mainDeferred.resolve();
