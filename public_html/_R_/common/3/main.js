var MyAnswers = MyAnswers || {},
	siteVars = siteVars || {},
	deviceVars = deviceVars || {},
	locationTracker, latitude, longitude, webappCache,
	hasCategories, hasMasterCategories, hasVisualCategories, answerSpaceOneKeyword,
	currentKeyword, currentCategory, currentMasterCategory,
	siteConfig, siteConfigHash, starsProfile,
	backStack,
	lowestTransferRateConst, maxTransactionTimeout,
	ajaxQueue, ajaxQueueMoJO;

function PictureSourceType() {}
function lastPictureTaken () {}

// *** BEGIN UTILS ***

MyAnswers.log = function() {
	if (typeof debug !== 'undefined') { debug.log.apply(debug, arguments); }
	else if (typeof console !== 'undefined') { console.log.apply(console, arguments); }
};

function isCameraPresent() {
	MyAnswers.log("isCameraPresent: " + window.device.camerapresent);
	return MyAnswers.cameraPresent;
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

function computeTimeout(messageLength) {
  var t = (messageLength * lowestTransferRateConst) + 15000;
  return ((t < maxTransactionTimeout) ? t : maxTransactionTimeout);
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
		MyAnswers.dispatch.add(function() { $(element).html(html); });
	}
}

function insertText(element, text) {
	if ($.type(element) === 'object' && typeof text === 'string') {
		MyAnswers.dispatch.add(function() { $(element).text(text); });
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
	if ($.type(options) !== 'object') { return; }
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

function populateDataTags(element, data) {
	var d;
	if ($.type(element) !== 'object') { return; }
	for (d in data) {
		if (data.hasOwnProperty(d)) {
			element.setAttribute('data-' + d, data[d]);
		}
	}
}

function parseXMLElements(xmlString)
{
	var xml;
	if (typeof(window.DOMParser) === 'function' || typeof(window.DOMParser) === 'object')
	{
		var domParser = new DOMParser();
		xml = domParser.parseFromString(xmlString, 'application/xml');
	}
	else if (typeof(xmlParse) === 'function')
	{
		xml = xmlParse(xmlString);
	}
	else
	{
		var url = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlString);
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, false);
		xhr.send(null);
		xml = xhr.responseXML;
	}
	return xml;
}

function processBlinkAnswerMessage(message) {
	message = $.parseJSON(message);
	MyAnswers.log(message);
	if (typeof message.loginStatus === 'string' && typeof message.loginKeyword === 'string' && typeof message.logoutKeyword === 'string') {
		MyAnswers.log('blinkAnswerMessage: loginStatus detected');
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
}

var DOMDispatch = function() {
	this._queue = []; // array to be treated as a FIFO
	this._timeout = null; // use to allow only 1 timeout simultaneously
	this._interval = 25; // time between dispatching tasks
	this._isPaused = false;
	this._intervalFn = function() {
		if (this._isPaused) { return; }
		this._timeout = setTimeout(function() {
			$(window.document).trigger('DOMDispatch-nextItem');
		}, this._interval);
	};
	this._pop = function(event) {
		var dispatch = event.data.dispatch;
		clearTimeout(dispatch._timeout);
		dispatch._timeout = null;
		var item = dispatch._queue.shift();
		if (typeof(item) === 'function') {
			item();
		} else {
			MyAnswers.log('DOMDispatch:' + item);
		}
		if (dispatch._queue.length > 0) {
			dispatch._intervalFn();
		}
	};
	$(window.document).bind('DOMDispatch-nextItem', { dispatch: this }, this._pop);
	return this;
};
DOMDispatch.prototype.add = function(item) {
	this._queue.push(item);
	if (this._timeout === null) {
		this._intervalFn();
	}
};
DOMDispatch.prototype.pause = function(caller) {
	clearTimeout(this._timeout);
	this._timeout = null;
	this._isPaused = true;
};
DOMDispatch.prototype.resume = function(caller) {
	this._isPaused = false;
	if (this._queue.length > 0) {
		this._intervalFn();
	}
};

//take 2 plain XML strings, then transform the first using the second (XSL)
//insert the result into element
function performXSLT(xmlString, xslString, element)
{
	MyAnswers.log('performXSLT(): target=' + $(element).attr('id'));
	var html, xml, xsl;
	if (typeof(xmlString) !== 'string' || typeof(xslString) !== 'string') { return false; }
	/*
	 * if (deviceVars.hasWebWorkers === true) {
	 * MyAnswers.log('performXSLT(): enlisting Web Worker to perform
	 * XSLT'); var message = { }; message.fn = 'processXSLT'; message.xml =
	 * xmlString; message.xsl = xslString; message.target = target;
	 * MyAnswers.webworker.postMessage(message); return '<p>This keyword is
	 * being constructed entirely on your device.</p><p>Please wait...</p>'; }
	 */
	if (window.ActiveXObject !== undefined) {
		MyAnswers.log('performXSLT(): using Internet Explorer method');
		xml = XML.newDocument().loadXML(xmlString);
		xsl = XML.newDocument().loadXML(xslString);
		html = xml.transformNode(xsl);
	} else if (window.XSLTProcessor !== undefined) {
		MyAnswers.log('performXSLT(): performing XSLT via XSLTProcessor()');
		xml = parseXMLElements(xmlString);
		xsl = parseXMLElements(xslString);
		var xsltProcessor = new XSLTProcessor();
		xsltProcessor.importStylesheet(xsl);
		html = xsltProcessor.transformToFragment(xml, document);
	} else if (xsltProcess !== undefined) {
		MyAnswers.log('performXSLT(): performing XSLT via AJAXSLT library');
		xml = parseXMLElements(xmlString);
		xsl = parseXMLElements(xslString);
		html = xsltProcess(xml, xsl);
	} else {
		html = '<p>Your browser does not support MoJO keywords.</p>'; 
	}
	insertHTML(element, html);
}

// *** END OF UTILS ***

// *** BEGIN PHONEGAP UTILS ***

function getPicture_Success(imageData) {
	var i;
//	MyAnswers.log("getPicture_Success: " + imageData);
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
  MyAnswers.log("getpic success " + imageData.length);
}

function getPicture(sourceType) {
  var options = { quality: siteConfig.imageQuality, imageScale: siteConfig.imageScale };
  if (sourceType !== undefined)
  {
    options.sourceType = sourceType;
  }
  // if no sourceType specified, the default is CAMERA
  navigator.camera.getPicture(getPicture_Success, null, options);
}

function selectCamera(nameStr) {
	MyAnswers.log("selectCamera: ");
  lastPictureTaken.currentName = nameStr;
  getPicture(PictureSourceType.CAMERA);
}

function selectLibrary(nameStr) {
	MyAnswers.log("selectLibrary: ");
  lastPictureTaken.currentName = nameStr;
  getPicture(PictureSourceType.PHOTO_LIBRARY);
}

// *** END PHONEGAP UTILS ***

// *** BEGIN BLINK UTILS ***

//test to see if the user it viewing the highest level screen
function isHome() {
	if ($('.view:visible').first().attr('id') === $('.box:not(:empty)').first().parent().attr('id')) {
		return true;
	}
	return false;
}

// take a keywordConfig object (from siteConfig)
// perform all steps necessary to populate element with MoJO result
function generateMojoAnswer(keyword, args, element) {
	MyAnswers.log('generateMojoAnswer(): keyword=' + keyword.name);
	MyAnswers.store.get('mojoMessage-' + keyword.mojo, function(key, mojoMessage) {
		var type,
			xml,
			xsl = keyword.xslt,
			placeholders = xsl.match(/\$args\[[\w\:][\w\:\-\.]*\]/g),
			p, pLength = placeholders.length,
			value,
			variable, condition,
			d, s, star;
		if ($.type(mojoMessage) === 'string') {
			mojoMessage = $.parseJSON(mojoMessage);
		}
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
			MyAnswers.log('generateMojoAnswer(): condition=' + condition);
		}
		if (keyword.mojo.substr(0,6) === 'stars:') { // use starred items
			type = keyword.mojo.split(':')[1];
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
			performXSLT(xml, xsl, element);
		}
		else if ($.type(mojoMessage) === 'object')
		{
			$('body').trigger('taskBegun');			
			xml = mojoMessage.mojo;
			performXSLT(xml, xsl, element);
			$('body').trigger('taskComplete');
		}
		else
		{
			html = '<p>The data for this keyword is currently being downloaded to your handset for fast and efficient viewing. This will only occur again if the data is updated remotely.</p><p>Please try again in 30 seconds.</p>';
			insertHTML(element, html);
		}
	});
}

function countPendingFormData(callback) {
	MyAnswers.store.get('_pendingFormDataString', function(key, value) {
		var q1;
		if (typeof value === 'string') {
			q1 = value.split(':');
			MyAnswers.log("countPendingFormData: q1.length = " + q1.length + ";");
			callback(q1.length);
		} else {
			callback(0);
		}
	});
}

function setSubmitCachedFormButton() {
	countPendingFormData(function(queueCount) {
		var button = document.getElementById('pendingButton');
		MyAnswers.dispatch.add(function() {
			if (queueCount !== 0) {
				MyAnswers.log("setSubmitCachedFormButton: Cached items");
				insertText(button, queueCount + ' Pending');
				$(button).removeClass('hidden');
			} else {
				MyAnswers.log("setSubmitCachedFormButton: NO Cached items");
				$(button).addClass('hidden');
			}
		});
		if (typeof setupParts === 'function') {
			MyAnswers.dispatch.add(setupParts);
		}
	});
}

function headPendingFormData(callback) {
	countPendingFormData(function(queueCount) {
		if (queueCount === 0) {
			callback(['', '']);
			return;
		}
		MyAnswers.store.get('_pendingFormDataString', function(key, dataString) {
			MyAnswers.store.get('_pendingFormDataArrayAsString', function(key, dataArray) {
				MyAnswers.store.get('_pendingFormMethod', function(key, method) {
					MyAnswers.store.get('_pendingFormUUID', function(key, uuid) {
						var q1 = dataString.split(':')[0],
							q2 = dataArray.split(':')[0],
							q3 = method.split(':')[0],
							q4 = uuid.split(':')[0];
						MyAnswers.log('headPendingFormData():');
						callback([q1, decodeURIComponent(q2), decodeURIComponent(q3), decodeURIComponent(q4)]);
					});
				});
			});
		});
	});
}

function removeFormRetryData() {
    MyAnswers.store.remove('_pendingFormDataString');  
    MyAnswers.store.remove('_pendingFormDataArrayAsString');  
    MyAnswers.store.remove('_pendingFormMethod');  
    MyAnswers.store.remove('_pendingFormUUID');  
    MyAnswers.log("removeFormRetryData: Clearing local storage"); 
	setSubmitCachedFormButton();
}

function delHeadPendingFormData() {
	countPendingFormData(function(queueCount) {
		if (queueCount === 0) {
			MyAnswers.log("delHeadPendingFormData: count 0, returning");
			return;
		} else if (queueCount === 1) {
			removeFormRetryData();
			return;
		}
		MyAnswers.store.get('_pendingFormDataString', function(key, dataString) {
			dataString = dataString.substring(dataString.indexOf(':') + 1);
			MyAnswers.store.set('_pendingFormDataString', dataString);
			MyAnswers.store.get('_pendingFormDataArrayAsString', function(key, dataArray) {
				dataArray = dataArray.substring(dataArray.indexOf(':') + 1);
				MyAnswers.store.set('_pendingFormDataArrayAsString', dataArray, function() {
					setSubmitCachedFormButton();
				});
			});
		});
	});
}

function processCachedFormData() {
	MyAnswers.store.get('_pendingFormDataString', function(key, dataString) {
		if (typeof dataString === 'string') {
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
  MyAnswers.log("updateCache: " + webappCache.status);
  if (webappCache.status !== window.applicationCache.IDLE) {
    webappCache.swapCache();
    MyAnswers.log("Cache has been updated due to a change found in the manifest");
  } else {
    webappCache.update();
    MyAnswers.log("Cache update requested");
  }
}

function errorCache()
{
  MyAnswers.log("errorCache: " + webappCache.status);
  MyAnswers.log("You're either offline or something has gone horribly wrong.");
}

function onTaskBegun(event)
{
	MyAnswers.runningTasks++;
	if ($('#startUp').size() > 0) { return true; }
	if (typeof(MyAnswers.activityIndicatorTimer) === 'number') { return true; }
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

function onAnswerDownloaded(event, view)
{
	MyAnswers.log('onAnswerDownloaded(): view=' + view);
	var onGoogleJSLoaded = function(data, textstatus) {
		if ($('div.googlemap').size() > 0) { // check for items requiring Google Maps
			if ($.type(google.maps) !== 'object') {
				google.load('maps', '3', { other_params : 'sensor=true', 'callback' : setupGoogleMaps });
			} else {
				setupGoogleMaps();
			}
		}
	};
	MyAnswers.dispatch.add(function() {
		$('body').trigger('taskBegun');
		if ($('#' + view).find('div.googlemap').size() > 0) { // check for items requiring Google features (so far only #map)
			if ($.type(window.google) !== 'object' || $.type(google.load) !== 'function') {
				$.getScript('http://www.google.com/jsapi?key=' + siteConfig.googleAPIkey, onGoogleJSLoaded);
			} else {
				onGoogleJSLoaded();
			}
		} else {
			stopTrackingLocation();
		}
		$('body').trigger('taskComplete');
	});
}

function onLinkClick(event)
{
	MyAnswers.log('onLinkClick(): ', this);
	var element = this,
		attributes = element.attributes,
		a, aLength = attributes.length,
		first = null,
		args = { };
	for (a = 0; a < aLength; a++) {
		if (first === null) {
			first = attributes[a];
		} else if (attributes[a].name.substr(0, 1) === '_') {
			args['args[' + attributes[a].name.substr(1) + ']'] = attributes[a].value;
		}
	}
	if (first.name === 'keyword') {
		if ($.isEmptyObject(args)) {
			gotoNextScreen(first.value);
		} else {
			showSecondLevelAnswerView(first.value, $.param(args));
		}
		return false;
	}
	return true;
}

function onTransitionComplete(event, view)
{
	var $view = $('#' + view),
		$inputs = $view.find('input, textarea, select');
	if (typeof onScroll === 'function') {
		$inputs.unbind('blur', onScroll);
		$inputs.bind('blur', onScroll);
	}
	$view.find('.blink-starrable').each(function(index, element) {
		var div = document.createElement('div');
		var data = $(element).data();
		populateDataTags(div, data);
		addEvent(div, 'click', onStarClick);
		if ($.type(starsProfile[$(element).data('type')]) !== 'object' || $.type(starsProfile[$(element).data('type')][$(element).data('id')]) !== 'object')
		{
			div.setAttribute('class', 'blink-starrable blink-star-off');
		}
		else
		{
			div.setAttribute('class', 'blink-starrable blink-star-on');
		}
		$(element).replaceWith(div);
	});
	$view.find('a').bind('click', onLinkClick);
}

function onSiteBootComplete(event)
{
	MyAnswers.log('onSiteBootComplete():');
	var keyword = siteVars.queryParameters.keyword;
	delete siteVars.queryParameters.keyword;
	if (typeof(keyword) === 'string' && ! $.isEmptyObject(siteVars.queryParameters)) {
		showSecondLevelAnswerView(keyword, $.param(siteVars.queryParameters));
	} else if (typeof(keyword) === 'string') {
		gotoNextScreen(keyword);
	} else if (typeof(siteVars.queryParameters.category) === 'string') {
		showKeywordListView(siteVars.queryParameters.category);
	} else if (typeof(siteVars.queryParameters.master_category) === 'string') {
		showCategoriesView(siteVars.queryParameters.master_category);
	} else if (typeof siteConfig.webClip === 'string' && typeof google !== 'undefined' && typeof google.bookmarkbubble !== 'undefined') {
		setTimeout(function() {
			var bookmarkBubble = new google.bookmarkbubble.Bubble();
			bookmarkBubble.hasHashParameter = function() { return false; };
			bookmarkBubble.setHashParameter = $.noop;
			bookmarkBubble.getViewportHeight = function() {	return window.innerHeight; };
			bookmarkBubble.getViewportScrollY = function() { return window.pageYOffset;	};
			bookmarkBubble.registerScrollHandler = function(handler) { addEvent(window, 'scroll', handler); };
			bookmarkBubble.deregisterScrollHandler = function(handler) { window.removeEventListener('scroll', handler, false); };
			bookmarkBubble.showIfAllowed();
		}, 1000);
	}
	delete siteVars.queryParameters;
}

function updateOrientation()
{
	MyAnswers.log("orientationChanged: " + Orientation.currentOrientation);
}

// *** END EVENT HANDLERS ***

if (!addEvent(document, "deviceready", onDeviceReady)) {
  alert("Unable to add deviceready handler");
  throw("Unable to add deviceready handler");
}

function addBackHistory(item)
{
	MyAnswers.log("addBackHistory(): " + item);
	if ($.inArray(item, backStack) === -1) { backStack.push(item); }
}

function updateNavigationButtons() {
	MyAnswers.dispatch.add(function() {
		var $navBoxHeader = $('#navBoxHeader'),
			$navButtons = $("#homeButton, #backButton"),
			$helpButton = $('#helpButton'),
			helpContents;
		switch($('.view:visible').first().attr('id'))
		{
			case 'keywordView':
			case 'answerView':
			case 'answerView2':				
				helpContents = siteConfig.keywords[currentKeyword].help;
				break;
			case 'helpView':
				helpContents = null;
				break;
			default:
				helpContents = siteConfig.help;
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
			countPendingFormData(function(queueCount) {
				if (siteVars.hasLogin || !$helpButton.hasClass('hidden') || queueCount > 0) {
					$navBoxHeader.removeClass('hidden');
				} else {
					$navBoxHeader.addClass('hidden');
				}
			});
		} else {
			$navButtons.removeClass('hidden');
			$navButtons.removeAttr('disabled');
			$navBoxHeader.removeClass('hidden');
		}
		$('#loginButton, #logoutButton, #pendingButton').removeAttr('disabled');
		setSubmitCachedFormButton();
		MyAnswers.dispatch.add(function() { $(window).trigger('scroll'); });
	});
}

function showMasterCategoriesView()
{
	MyAnswers.log('showMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
	MyAnswersDevice.hideView();
	populateItemListing('masterCategories');
	setMainLabel('Master Categories');
	MyAnswersDevice.showView($('#masterCategoriesView'));
}

function goBackToMasterCategoriesView()
{
	MyAnswers.log('goBackToMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
	MyAnswersDevice.hideView(true);
	setMainLabel('Master Categories');
	MyAnswersDevice.showView($('#masterCategoriesView'), true);
}

function populateItemListing(level) {
	MyAnswers.log('populateItemListing(): ' + level);
	var arrangement, display, order, list, $visualBox, $listBox, type,
		onMasterCategoryClick = function(event) { showCategoriesView($(this).data('id')); },
		onCategoryClick = function(event) { showKeywordListView($(this).data('id')); },
		onKeywordClick = function(event) { gotoNextScreen($(this).data('id')); },
		onHyperlinkClick = function(event) { window.location.assign($(this).data('hyperlink')); },
		hookInteraction = function() {
			if (siteVars.config['i' + $item.data('id')].pertinent.type === 'hyperlink' && siteVars.config['i' + $item.data('id')].pertinent.hyperlink) {
				$item.data('hyperlink', list[order[o]].hyperlink);
				$item.bind('click', onHyperlinkClick);
			} else {
				$item.bind('click', onKeywordClick);
			}
		},
		hookCategory = function() {
			if (siteVars.map['c' + $item.data('id')].length === 1) {
				$item.data('id', siteVars.map['c' + $item.data('id')][0]);
				hookInteraction();
			} else {
				$item.bind('click', onCategoryClick);
			}
		},
		hookMasterCategory = function() {
			if (siteVars.map['m' + $item.data('id')].length === 1) {
				$item.data('id', siteVars.map['m' + $item.data('id')][0]);
				hookCategory();
			} else {
				$item.bind('click', onMasterCategoryClick);
			}
		},
		o, oLength,
		name, $item, $label, $description,
		category, columns, $images,
		itemConfig;
	switch (level) {
		case 'masterCategories':
			config = siteConfig.master_categories_config;
			order = siteConfig.master_categories_order;
			list = siteConfig.master_categories;
			$visualBox = $('#masterCategoriesBox');
			$listBox = $('#masterCategoriesList');
			break;
		case 'categories':
			arrangement = siteVars.config['a' + siteVars.id].pertinent.categoriesArrangement;
			display = siteVars.config['a' + siteVars.id].pertinent.categoriesDisplay;
			order = siteVars.map.categories;
			list = currentMasterCategory ? siteVars.map['m' + currentMasterCategory] : order;
			type = 'c';
			$visualBox = $('#categoriesBox');
			$listBox = $('#categoriesList');
			break;
		case 'interactions':
			arrangement = siteVars.config['a' + siteVars.id].pertinent.interactionsArrangement;
			display = siteVars.config['a' + siteVars.id].pertinent.interactionsDisplay;
			order = siteVars.map.interactions;
			list = currentCategory ? siteVars.map['c' + currentCategory] : order;
			type = 'i';
			$visualBox = $('#keywordBox');
			$listBox = $('#keywordList');
			break;
	}
	MyAnswers.log('populateItemListing(): '+ arrangement + ' ' + display + ' ' + type + '[' + list.join(',') + ']');
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
			if (typeof itemConfig !== 'undefined' && $.inArray(order[o], list) !== -1 && (itemConfig.pertinent.status === 'active' || itemConfig.pertinent.status === 'disabled')) {
				name = itemConfig.pertinent.displayName ? itemConfig.pertinent.displayName : itemConfig.pertinent.name;
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
				$item.data('id', order[o]);
				if (level === 'interactions') {
					hookInteraction();
				} else if (level === 'categories') {
					hookCategory();
				} else if (level === 'masterCategories') {
					hookMasterCategory();
				}
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
	MyAnswers.log('showCategoriesView(): ' + masterCategory);
	currentMasterCategory = masterCategory;
	if (masterCategory && siteConfig.master_categories[masterCategory])
	{
		var masterConfig = siteConfig.master_categories[masterCategory];
		if ($.type(siteConfig.default_category) === 'number' && $.type(masterConfig.categories[siteConfig.default_category]) === 'object')
		{
			currentCategory = siteConfig.default_category;
		}
		else
		{
			currentCategory = masterConfig.categories[0];
		}
	}
	else
	{
		currentCategory = siteConfig.default_category ? siteConfig.default_category : siteConfig.categories_order[0] ;
	}
	addBackHistory("goBackToCategoriesView();");
	if (hasCategories)
	{
		MyAnswersDevice.hideView();
		setMainLabel(hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
		populateItemListing('categories');
		MyAnswersDevice.showView($('#categoriesView'));
	}
	else
	{
		populateTextOnlyCategories(masterCategory);
		showKeywordListView();
	}
}

function goBackToCategoriesView()
{
	MyAnswers.log('goBackToCategoriesView()');
	addBackHistory("goBackToCategoriesView();");
	MyAnswersDevice.hideView(true);
	setMainLabel(hasMasterCategories ? siteConfig.master_categories[currentMasterCategory].name : 'Categories');
	MyAnswersDevice.showView($('#categoriesView'), true);
}

function restoreSessionProfile(token)
{
	MyAnswers.log('restoreSessionProfile():');
	var requestUrl = siteVars.serverAppPath + '/util/GetSession.php';
	var requestData = '_as=' + siteVars.answerSpace + '&_t=' + token;
	ajaxQueue.add({
		url: requestUrl,
		data: requestData,
		dataType: 'json',
		complete: function(xhr, xhrStatus) {
			if (isAJAXError(xhrStatus) || xhr.status !== 200)
			{
				alert('Connection error, please try again later.');
				return;
			}
			var data = $.parseJSON(xhr.responseText);
			if (data === null)
			{
				MyAnswers.log('GetSiteConfig error: null siteConfig');
				alert('Connection error, please try again later.');
				return;
			}
			if (typeof(data.errorMessage) !== 'string' && typeof(data.statusMessage) !== 'string')
			{
				MyAnswers.log('GetSession success: no error messages, data: ' + data);
				if (data.sessionProfile === null) { return; }
				MyAnswers.store.set('starsProfile', JSON.stringify(data.sessionProfile.stars));
				starsProfile = data.sessionProfile.stars;
			}
			if (typeof(data.errorMessage) === 'string')
			{
				MyAnswers.log('GetSiteConfig error: ' + data.errorMessage);
			}
			setTimeout(function() {
				$('body').trigger('siteBootComplete');
			}, 100);
		},
		timeout: computeTimeout(10 * 1024)
	});
}


function displayAnswerSpace()
{
	var startUp = $('#startUp');
	if (startUp.size() > 0 && typeof siteVars.config !== 'undefined') {
		if (answerSpaceOneKeyword) {
			showKeywordView(0);
		} else if (hasMasterCategories) {
			showMasterCategoriesView();
		} else if (hasCategories) {
			showCategoriesView();
		} else {
			showKeywordListView();
		}
		var token = siteVars.queryParameters._t;
		delete siteVars.queryParameters._t;
		if (typeof(token) === 'string') { restoreSessionProfile(token); }
		else { $('body').trigger('siteBootComplete'); }
	}
	startUp.remove();
	$('#content').removeClass('hidden');
}

function processMoJOs(keyword)
{
	MyAnswers.log('processMoJOs(): keyword=' + keyword);
	if (deviceVars.disableXSLT === true) { return; }
	var requestURL = siteVars.serverAppPath + '/util/GetMoJO.php',
		requestData,
		fetchedMoJOs = { },
		m, mojoName, mojoHash,
		ajaxComplete = function(xhr, xhrStatus, xhrOptions) {
			if (!isAJAXError(xhrStatus) && xhr.status === 200) {
				var data = $.parseJSON(xhr.responseText);
				if (data === null) {
					MyAnswers.log('GetSiteConfig error: null siteConfig');
				} else if (data.errorMessage) {
					MyAnswers.log('GetMoJO error: ' + xhrOptions.mojoName + ' ' + data.errorMessage);
				} else {
					if (data.statusMessage !== 'NO UPDATES' && deviceVars.storageReady) {
						MyAnswers.store.set('mojoMessage-' + xhrOptions.mojoName, xhr.responseText);
					}
				}
			}
		},
		getCallback = function(key, message) {
			if (typeof message  === 'string') {
				message = $.parseJSON(message);
			}
			if ($.type(message) === 'object') {
				mojoHash = message.mojoHash;
			}
			requestData = 'answerSpace=' + siteVars.answerSpace + '&key=' + mojoName + (typeof(mojoHash) === 'string' ? "&sha1=" + mojoHash : "");
			ajaxQueueMoJO.add({
				url: requestURL,
				data: requestData,
				dataType: 'json',
				mojoName: mojoName,
				complete: ajaxComplete,
				timeout: computeTimeout(500 * 1024)
			});
			fetchedMoJOs[mojoName] = true;
		};
	for (m in siteConfig.mojoKeys) {
		if (siteConfig.mojoKeys.hasOwnProperty(m)) {
			mojoName = siteConfig.mojoKeys[m];
			if (keyword !== undefined && keyword !== m) {
				$.noop();
			} else if (mojoName.substr(0,6) === 'stars:' || fetchedMoJOs[mojoName] === true) {
				$.noop();
			} else {
				MyAnswers.store.get('mojoMessage-' + mojoName, getCallback);
			}
		}
	}
}

function processConfig() {
	MyAnswers.log('processConfig(): currentMasterCategory=' + currentMasterCategory + ' currentCategory=' + currentCategory + ' currentInteraction=' + currentKeyword);
	if ($.type(siteVars.config['a' + siteVars.id]) === 'object') {
		hasMasterCategories = siteVars.config['a' + siteVars.id].pertinent.siteStructure === 'master categories' && siteVars.map.masterCategories.length > 0;
		hasCategories = (hasMasterCategories || siteVars.config['a' + siteVars.id].pertinent.siteStructure === 'categories') && siteVars.map.categories.length > 0;
		answerSpaceOneKeyword = siteVars.map.interactions.length === 1;
		if (siteVars.config['a' + siteVars.id].pertinent.siteStructure === 'categories' &&
				currentMasterCategory !== null &&
				$.type(siteVars.config['c' + siteVars.map.categories[0]]) === 'object') {
			currentMasterCategory = null;
			displayAnswerSpace();
			processMoJOs();
		}
	} else {
		MyAnswers.log('requestConfig(): unable to retrieve answerSpace config');
	}
}

function requestConfig(requestData) {
	if ($.type(requestData._id) === 'array') {
		MyAnswers.log('requestConfig(): ' + requestData._t + '[' + requestData._id.join(',') + ']');
	} else {
		MyAnswers.log('requestConfig(): ' + requestData._t + '[' + requestData._id + ']');
	}
	if ($.type(deviceVars.features) === 'array' && deviceVars.features.length > 0) {
		requestData._f = deviceVars.features;
	}
	ajaxQueue.add({
		url: siteVars.serverAppPath + '/xhr/GetConfig.php',
		data: requestData,
		dataType: 'json',
		complete: function(xhr, xhrStatus) {
			var data,
				items,
				type,
				id, ids, i, iLength;
			if (isAJAXError(xhrStatus) || xhr.status !== 200) {
				$.noop();
			} else {
				if (typeof siteVars.config === 'undefined') {
					siteVars.config = {};
				}
				if ($.type(requestData._id) === 'array') {
					ids = requestData._id;
				} else {
					ids = [ requestData._id ];
				}
				iLength = ids.length;
				data = $.parseJSON(xhr.responseText);
				for (i = 0; i < iLength; i++) {
					id = requestData._t + ids[i];
					if (typeof data[id] === 'undefined') {
						MyAnswers.log('no config for ' + id);
						continue;
					}
					siteVars.config[id] = data[id].config;
					deviceVars.features = data.deviceFeatures;
					if (requestData._t === 'a') {
						siteVars.map = data.map;
						if (siteVars.config[id].pertinent.defaultScreen === 'login') {
							$.noop(); // TODO: fix behaviour for default to login
						} else if (siteVars.config[id].pertinent.defaultScreen === 'interaction') {
							$.noop(); // TODO: fix behaviour for default to interaction
						} else if (siteVars.config[id].pertinent.defaultScreen === 'category') {
							$.noop(); // TODO: fix behaviour for default to category
						} else if (siteVars.config[id].pertinent.defaultScreen === 'master category') {
							$.noop(); // TODO: fix behaviour for default to master category
						} else {
							if (siteVars.config[id].pertinent.siteStructure === 'categories') {
								items = siteVars.map.categories;
								type = 'c';
							}
							requestConfig({ _id: items, _t: type });
						}
					}
				}
				if (requestData._t === 'c') {
					$.each(siteVars.map.categories, function(i, v) {
						if (typeof items === 'undefined') {
							items = siteVars.map['c' + v];
						} else {
							items = items.concat(siteVars.map['c' + v]);
						}
					});
					requestConfig({ _id: items, _t: 'i' });
				}
				// TODO: store these in client-side storage somewhere
			}
			processConfig();
		},
		timeout: computeTimeout(40 * 1024)
	});
}

function getSiteConfig() {
	MyAnswers.log("getSiteConfig(): typeof(siteConfig) => " + $.type(siteConfig));
	var requestUrl = siteVars.serverAppPath + '/util/GetSiteConfig.php',
		requestData = 'device=' + deviceVars.device + '&answerSpace=' + siteVars.answerSpace + (typeof siteConfigHash === 'string' ? "&sha1=" + siteConfigHash : ""),
		fallbackToStorage = function(string) {
			if (typeof siteConfig !== 'undefined') {
				processSiteConfig();
			} else {
				alert(string);
				window.location = '/demos';
			}
		};
	ajaxQueue.add({
		url: requestUrl,
		data: requestData,
		dataType: 'json',
		complete: function(xhr, xhrStatus) {
			if (isAJAXError(xhrStatus) || xhr.status !== 200) {
				fallbackToStorage('Content unreachable, please try later.');
				return;
			}
			/*
			 * possible values of errorMessage: 'No answerSpace specified.'
			 * 'Could not connect to the database.' 'Error performing
			 * answerSpace query: ' ... 'NOT LOGGED IN' 'Error performing master
			 * categories query: ' ... 'Error performing categories query: ' ...
			 * 'Error performing keywords query: ' ...
			 * 
			 * possible values of statusMessage: 'NO KEYWORDS' 'NO UPDATES'
			 */
			var data = $.parseJSON(xhr.responseText);
			if (data === null) {
				MyAnswers.log('GetSiteConfig error: null siteConfig');
				fallbackToStorage('Content unreachable, please try again later.');
				return;
			}
			if (typeof data.errorMessage !== 'string' && typeof data.statusMessage !== 'string') {
				MyAnswers.log('GetSiteConfig success: no status or error messages' + ' ' + $.type(data));
				MyAnswers.store.set('siteConfigMessage', xhr.responseText);
				siteConfig = data.siteConfig;
				siteConfigHash = data.siteHash;
				//processSiteConfig();
				MyAnswers.store.get('siteConfigMessage', function(key, value) {
					MyAnswers.log('post-store siteConfig type: ' + $.type(value));
				});
				return;
			}
			if (typeof data.statusMessage === 'string') {
				switch (data.statusMessage) {
					case 'NO UPDATES':
						MyAnswers.log("GetSiteConfig status: " + data.statusMessage + ' ' + $.type(siteConfig));
						break;
					case 'NO KEYWORDS':
						MyAnswers.store.set('siteConfigMessage', xhr.responseText);
						siteConfig = data.siteConfig;
						siteConfigHash = data.siteHash;
						MyAnswers.log("GetSiteConfig status: " + data.statusMessage + ' ' + $.type(data));
						break;
				}
				//processSiteConfig();
				return;
			}
			if (typeof data.errorMessage === 'string') {
				MyAnswers.log('GetSiteConfig error: ' + data.errorMessage);
				switch (data.errorMessage) {
					case 'NOT LOGGED IN':
						alert('This answerSpace requires users to log in.');
						displayAnswerSpace();
						break;
					case 'NO MATCHING ANSWERSPACE':
					case 'ANSWERSPACE UNSPECIFIED':
						fallbackToStorage('Please check the name of the answerSpace and try again.');
						break;
					default:
						fallbackToStorage('Content unreachable, please try again later.');
						break;
				}
				return;
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
 
function dumpStorage(store) {
	var getCallback = function(key, value) {
			value = value.length > 20 ? value.substring(0, 20) + "..." : value;
			MyAnswers.log('dumpStorage(): key=' + key + '; value=' + value);
		},
		keysCallback = function(keys) {
			var k, kLength = keys.length;
			for (k = 0; k < kLength; k++) {
				store.get(keys[k], getCallback);
			}
		}; 
	store.keys(keysCallback);
}

function goBackToHome()
{
	if (MyAnswers.hasHashChange) {
		MyAnswers.log('onHashChange de-registration: ', removeEvent(window, 'hashchange', onHashChange));
	}
	backStack = [];
	hashStack = [];
	if (hasMasterCategories) { goBackToMasterCategoriesView(); }
	else if (hasVisualCategories) { goBackToCategoriesView(); }
	else { goBackToKeywordListView(); }
	stopTrackingLocation();
	$('body').trigger('taskComplete');
	getSiteConfig();
	if (MyAnswers.hasHashChange) {
		MyAnswers.log('onHashChange registration: ', addEvent(window, 'hashchange', onHashChange));
	}
}

function goBack()
{
	if (MyAnswers.hasHashChange) {
		MyAnswers.log('onHashChange de-registration: ', removeEvent(window, 'hashchange', onHashChange));
	}
	backStack.pop();
	if (backStack.length >= 1) { eval(backStack[backStack.length-1]); }
	else { goBackToHome(); }
	stopTrackingLocation();
	if (MyAnswers.hasHashChange) {
		MyAnswers.log('onHashChange registration: ', addEvent(window, 'hashchange', onHashChange));
	}
}

function createParamsAndArgs(keywordID) {
	var returnValue = "answerSpace=" + siteVars.answerSpace + "&keyword=" + encodeURIComponent(siteConfig.keywords[keywordID].name),
		args = "",
		argElements = $('#argsBox').find('input, textarea, select');
	if (!siteConfig.keywords[keywordID].input_config) { return returnValue; }
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

function showAnswerView(keyword, argsString, reverse)
{
	MyAnswers.log('showAnswerView(): keyword=' + keyword + ' args=' + argsString);
	var keywordID, keywordConfig, html, args, k,
		answerBox = document.getElementById('answerBox'),
		completeFn = function() {
			MyAnswersDevice.showView($('#answerView'), reverse);
			MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', ['answerView']); }); 
			setMainLabel(keyword.name);
			MyAnswers.dispatch.add(function() { $('body').trigger('taskComplete'); });
		};
	if ($.type(siteConfig.keywords[keyword]) === 'object') {
		keywordID = keyword;
	} else {
		keyword = decodeURIComponent(keyword);
		for (k in siteConfig.keywords) {
			if (siteConfig.keywords.hasOwnProperty(k)) {
				if (keyword.toUpperCase() === siteConfig.keywords[k].name.toUpperCase()) {
					keywordID = k;
					break;
				}
			}
		}
	}
	if (keywordID === null || $.type(siteConfig.keywords[keywordID]) !== 'object') { return; }
	MyAnswersDevice.hideView(reverse);
	$('body').trigger('taskBegun');			
	addBackHistory("showAnswerView(\"" + keyword + "\", \"" + (argsString || '') + "\", true);");
	currentKeyword = keywordID;
	processMoJOs(keywordID);
	keywordConfig = siteConfig.keywords[keywordID];
	if (typeof argsString === 'string' && argsString.length > 0) {
		args = deserialize(decodeURIComponent(argsString));
	} else {
		args = deserialize(createParamsAndArgs(keywordID), args);
		delete args.answerSpace;
		delete args.keyword;
	}
	if (keywordConfig.type === 'xslt' && deviceVars.disableXSLT !== true) {
		generateMojoAnswer(keywordConfig, args, answerBox);
		completeFn();
	} else if (reverse) {
		MyAnswers.store.get('answer___' + keywordID, function(key, html) {
			insertHTML(answerBox, html);
			completeFn();
		});
	} else {
		var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php',
			requestData = 'answerSpace=' + siteVars.answerSpace + "&keyword=" + encodeURIComponent(keywordConfig.name) + '&_device=' + deviceVars.device,
			fallbackToStorage = function() {
				MyAnswers.store.get('answer___' + keywordID, function(key, html) {
					if (typeof html === 'undefined') {
						html = '<p>Unable to reach server, and unable to display previously stored content.</p>';
					}
					insertHTML(answerBox, html);
					completeFn();
				});
			};
		if (!$.isEmptyObject(args)) {
			requestData += '&' + $.param(args);
		}
		ajaxQueue.add({
			type: 'GET',
			url: answerUrl,
			data: requestData,
			complete: function(xhr, textstatus) { // readystate === 4
				if (isAJAXError(textstatus) || xhr.status !== 200) { fallbackToStorage(); }
				else {
					MyAnswers.log('GetAnswer: storing server response');
					html = xhr.responseText;
					var blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:(.*) -->/);
					if (blinkAnswerMessage !== null) {
						processBlinkAnswerMessage(blinkAnswerMessage[1]);
					}
					MyAnswers.store.set('answer___' + keywordID, html);
				}
				insertHTML(answerBox, html);
				completeFn();
			},
			timeout: 30 * 1000 // 30 seconds
		});
	}
}

function getAnswer(event) { showAnswerView(currentKeyword); }

function gotoNextScreen(keywordID) {
	var k;
	MyAnswers.log("gotoNextScreen(" + keywordID + ")");
	if (!siteConfig.keywords[keywordID]) { // in case parameter is name not code
		for (k in siteConfig.keywords) {
			if (siteConfig.keywords.hasOwnProperty(k)) {
				if (keywordID.toUpperCase() === siteConfig.keywords[k].name.toUpperCase()) {
					keywordID = k;
					break;
				}
			}
		}
	}
	if (!siteConfig.keywords[keywordID]) {
		alert('Unable to locate keyword. It may be missing or protected.');
		return;
	}
	if (siteConfig.keywords[keywordID].input_config) {
		showKeywordView(keywordID);
	} else {
		showAnswerView(keywordID);
	}
}

function showSecondLevelAnswerView(keyword, arg0, reverse) {
	MyAnswers.log('showSecondLevelAnswerView(): keyword=' + keyword + ' args=' + arg0);
	showAnswerView(keyword, arg0, reverse);
}

function showKeywordView(keywordID) 
{
	addBackHistory("goBackToKeywordView(\"" + keywordID + "\");");
	MyAnswersDevice.hideView();
	var keyword = siteConfig.keywords[keywordID],
		argsBox = document.getElementById('argsBox'),
		descriptionBox = document.getElementById(descriptionBox);
	currentKeyword = keywordID;
	insertHTML(argsBox, keyword.input_config);
	if (keyword.description) {
		insertHTML(descriptionBox, keyword.description);
		$(descriptionBox).removeClass('hidden');
	} else {
		$(descriptionBox).addClass('hidden');
	}
	MyAnswersDevice.showView($('#keywordView'));
	setMainLabel(keyword.name);
}

function goBackToKeywordView(keywordID)
{
	MyAnswersDevice.hideView(true);
	var keyword = siteConfig.keywords[keywordID];
	currentKeyword = keywordID;
	MyAnswersDevice.showView($('#keywordView'), true);
	setMainLabel(keyword.name);
}

function showKeywordListView(category) {
	var mainLabel;
	currentCategory = category;
	MyAnswers.log('showKeywordListView(): hasCategories=' + hasCategories + ' currentCategory=' + currentCategory);
	if (hasCategories) {
		if (typeof prepareHistorySideBar === 'function') {
			prepareHistorySideBar();
		}
		mainLabel = siteConfig.categories[category].name;
	} else if (hasMasterCategories && currentMasterCategory) {
		mainLabel = siteConfig.master_categories[currentMasterCategory].name;
	} else {
		mainLabel = "Keywords";
	}
/*	if (hasCategories && !hasVisualCategories) {
		populateTextOnlyCategories(currentMasterCategory);
	} */
	addBackHistory("goBackToKeywordListView();");
	MyAnswersDevice.hideView();
	populateItemListing('interactions');
	MyAnswersDevice.showView($('#keywordListView'));
	setMainLabel(mainLabel);
}

function goBackToKeywordListView(event)
{
  // MyAnswers.log('goBackToKeywordListView()');
  if (answerSpaceOneKeyword) {
		showKeywordView(0);
		return;
  }
  if (hasMasterCategories && currentMasterCategory === null)
  {
		goBackToMasterCategoriesView();
		return;
  }
  if (hasVisualCategories && currentCategory === null)
  {
		goBackToCategoriesView(hasMasterCategories ? currentCategory : null);
		return;
  }
	MyAnswersDevice.hideView(true);
	MyAnswersDevice.showView($('#keywordListView'), true);
	setMainLabel(hasCategories ? siteConfig.categories[currentCategory].name : 'Keywords');
}

function showHelpView(event)
{
	var helpContents,
		helpBox = document.getElementById('helpBox');
	addBackHistory("showHelpView();");
	MyAnswersDevice.hideView();
	switch($('.view:visible').first().attr('id'))
	{
		case 'keywordView':
		case 'answerView':
		case 'answerView2':
			helpContents = siteConfig.keywords[currentKeyword].help || "Sorry, no guidance has been prepared for this item.";
			break;
		default:
			helpContents = siteConfig.help || "Sorry, no guidance has been prepared for this item.";
	}
	insertHTML(helpBox, helpContents);
	MyAnswersDevice.showView($('#helpView'));
}

function showNewLoginView(isActivating)
{
	addBackHistory("showNewLoginView();");
	MyAnswersDevice.hideView();
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
				insertText(newLoginBox, 'Unable to contact server.');
			}
			else
			{
				insertHTML(newLoginBox, xhr.responseText);
			}
			MyAnswersDevice.showView($('#newLoginView'));
			setMainLabel('New Login');
		}
  });
}

function showActivateLoginView(event)
{
	addBackHistory("showActivateLoginView();");
	MyAnswersDevice.hideView();
	var loginUrl = siteVars.serverAppPath + '/util/ActivateLogin.php';
	ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		complete: function(xhr, textstatus) { // readystate === 4
			var activateLoginBox = document.getElementById('activateLoginBox');
			if (isAJAXError(textstatus) && xhr.status !== 200)
			{
				insertText(activateLoginBox, 'Unable to contact server.');
			}
			else
			{
				insertHTML(activateLoginBox, xhr.responseText);
			}
			MyAnswersDevice.showView($('#activateLoginView'));
			setMainLabel('Activate Login');
		}
  });
}

function showLoginView(event)
{
	addBackHistory("showLoginView();");
	MyAnswersDevice.hideView();
	MyAnswersDevice.showView($('#loginView'));
	setMainLabel('Login');
}

function updateLoginButtons() {
	var loginStatus = document.getElementById('loginStatus'),
		loginButton = document.getElementById('loginButton'),
		logoutButton = document.getElementById('logoutButton');
	if (!siteVars.hasLogin) { return; }
	if (MyAnswers.isLoggedIn) {
		if (typeof MyAnswers.loginAccount === 'string' && MyAnswers.loginAccount.length > 0) {
			MyAnswers.dispatch.add(function() {
				var $loginStatus = $(loginStatus);
				$loginStatus.empty();
				$loginStatus.append('<p>logged in as</p>');
				$loginStatus.append('<p class="loginAccount">' + MyAnswers.loginAccount + '</p>');
				$loginStatus.click(submitLogout);
			});
			changeDOMclass(loginStatus, { remove: 'hidden' });
		} else {
			changeDOMclass(logoutButton, { remove: 'hidden' });
		}
		changeDOMclass(loginButton, { add: 'hidden' });
	} else {
		changeDOMclass(loginStatus, { add: 'hidden' });
		changeDOMclass(logoutButton, { add: 'hidden' });
		changeDOMclass(loginButton, { remove: 'hidden' });
	}
	if (currentCategory !== undefined) {
		populateItemListing('interactions');
	}
}

function requestLoginStatus() {
	if (!siteVars.hasLogin) { return; }
	ajaxQueue.add({
		url: siteVars.serverAppPath + '/util/GetLogin.php',
		dataType: 'json',
		complete: function(xhr, xhrStatus) {
			if (isAJAXError(xhrStatus) || xhr.status !== 200) { return; }
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
		timeout: computeTimeout(500)
	});
}

function submitLogin()
{
	MyAnswers.log('submitLogin();');
	ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: siteVars.serverAppPath + '/util/GetLogin.php',
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
					} else {
						MyAnswers.isLoggedIn = false;
						delete MyAnswers.loginAccount;
					}
				}
				updateLoginButtons();
				getSiteConfig();
				goBack();
			} else {
				alert('Unable to login: ' + xhr.responseText);
			}
		}
  });
}

function submitLogout(event)
{
	MyAnswers.log('submitLogout();');
    if (confirm('Log out?')) {
		ajaxQueue.add({
			type: 'GET',
			cache: "false",
			url: siteVars.serverAppPath + '/util/GetLogin.php',
			data: { '_a': 'logout' },
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
						}
					}
					updateLoginButtons();
					getSiteConfig();
					goBackToHome();
				}
			}
		});
    }
    return false;
}

function goBackToTopLevelAnswerView(event)
{
	MyAnswers.log('goBackToTopLevelAnswerView()');
	MyAnswersDevice.hideView(true);
	MyAnswersDevice.showView($('#answerView'), true);
}

function queuePendingFormData(str, arrayAsString, method, uuid, callback) {
	MyAnswers.store.get('_pendingFormDataString', function(key, dataString) {
		if (typeof dataString === 'string') {
			dataString += ':' + str;
			MyAnswers.store.set('_pendingFormDataString', dataString);
			MyAnswers.store.get('_pendingFormDataArrayAsString', function(key, dataArray) {
				dataArray += ':' + encodeURIComponent(arrayAsString);
				MyAnswers.store.set('_pendingFormDataArrayAsString', dataArray);
			});
			MyAnswers.store.get('_pendingFormMethod', function(key, dataMethod) {
				dataMethod += ':' + encodeURIComponent(method);
				MyAnswers.store.set('_pendingFormMethod', dataMethod);
			});
			MyAnswers.store.get('_pendingFormUUID', function(key, dataUUID) {
				dataUUID += ':' + encodeURIComponent(uuid);
				MyAnswers.store.set('_pendingFormUUID', dataUUID);
			});
		} else {
			MyAnswers.store.set('_pendingFormDataString', str, function() {
				MyAnswers.store.set('_pendingFormDataArrayAsString', encodeURIComponent(arrayAsString), function() {
					MyAnswers.store.set('_pendingFormMethod', encodeURIComponent(method), function() {
						MyAnswers.store.set('_pendingFormUUID', encodeURIComponent(uuid), function() {
							callback();
						});
					});
				});
			});
		}
	});
}

function submitFormWithRetry() {    
	var str, arr, method, uuid,
		localKeyword;
	MyAnswers.store.get('_pendingFormDataString', function(key, dataString) {
		if (typeof dataString === 'string') {
			headPendingFormData(function(qx) {
				str = qx[0];
				arr = qx[1].split("/");
				method = qx[2];
				uuid = qx[3];
				var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php?',
					currentBox = $('.view:visible > .box').first(),
					requestData;
				if (arr[0] === '..') {
					answerUrl += "answerSpace=" + siteVars.answerSpace + "&keyword=" + encodeURIComponent(arr[1]) + '&_device=' + deviceVars.device + (arr[2].length > 1 ? "&" + arr[2].substring(1) : "");
					localKeyword = arr[1];
				} else {
					answerUrl += "answerSpace=" + arr[1] + "&keyword=" + encodeURIComponent(arr[2]) + '&_device=' + deviceVars.device;
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
				ajaxQueue.add({
					type: method,
					cache: 'false',
					url: answerUrl,
					data: requestData,
					complete: function(xhr, textstatus) { // readystate === 4
						var html;
						if (isAJAXError(textstatus) || xhr.status !== 200) {
							html = 'Unable to contact server. Your submission has been stored for future attempts.';
						} else {
							delHeadPendingFormData();
							html = xhr.responseText;
						}
						MyAnswersDevice.hideView();
						if (currentBox.attr('id').indexOf('answerBox') !== -1) {
							insertHTML(currentBox[0], html);
							currentBox.show('slide', { direction: 'right'}, 300);
							MyAnswersDevice.showView(currentBox.closest('.view'));
							if (currentBox.attr('id') === 'answerBox') {
								MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', ['answerBox']); });
							} else if (currentBox.attr('id') === 'answerBox2') {
								MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', ['answerBox2']); });
							} else {
								// potentially unnecessary to have this here
								MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', [currentBox.parent().attr('id')]); });
							}
						} else {
							var answerBox2 = document.getElementById('answerBox2');
							addBackHistory("");
							insertHTML(answerBox2, html);
							MyAnswersDevice.showView($('#answerView2'));
							MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', ['answerView2']); });
						}
						$('body').trigger('taskComplete');
					},
					timeout: computeTimeout(answerUrl.length + requestData.length)
				});
			});
		} else {
			MyAnswers.log('submitFormWithRetry(): error: no forms in the queue');
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
            // MyAnswers.log("if: " + str);
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
          // MyAnswers.log("else: " + str);
        }
      }
    }
  });
  MyAnswers.log("lastPictureTaken.image.size() = " + lastPictureTaken.image.size());
  lastPictureTaken.image.clear();

  // var str = $('form').first().find('input, textarea, select').serialize();
  MyAnswers.log("submitForm(2): " + document.forms[0].action);
  // MyAnswers.log("submitForm(2a): " + str);
  queuePendingFormData(str, document.forms[0].action, document.forms[0].method.toLowerCase(), Math.uuid(), submitFormWithRetry);
}

function submitAction(keyword, action) {
	MyAnswers.log('submitAction(): keyword=' + keyword + ' action=' + action);
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
		requestUrl = siteVars.serverAppPath + '/util/GetAnswer.php?answerSpace=' + siteVars.answerSpace + "&keyword=" + keyword + '&_device=' + deviceVars.device;
		requestData = '&' + formData + (typeof(action) === 'string' && action.length > 0 ? '&' + action : '');
	} else {
		method = 'POST';
		requestUrl = siteVars.serverAppPath + '/util/GetAnswer.php?answerSpace=' + siteVars.answerSpace + "&keyword=" + keyword + '&_device=' + deviceVars.device + (typeof(action) === 'string' && action.length > 0 ? '&' + action : '');
		requestData = formData;
	}
	$('body').trigger('taskBegun');
	ajaxQueue.add({
		type: method,
		cache: 'false',
		url: requestUrl,
		data: requestData,
		complete: function(xhr, textstatus) { // readystate === 4
			$('body').trigger('taskComplete');
			var html;
			if (isAJAXError(textstatus) || xhr.status !== 200)
			{
				html = 'Unable to contact server.';
			}
			else
			{
				html = xhr.responseText;
			}
			MyAnswersDevice.hideView();
			if (currentBox.attr('id').indexOf('answerBox') !== -1)
			{
				insertHTML(currentBox[0], html);
				MyAnswersDevice.showView(currentBox.closest('.view'));
				if (currentBox.attr('id') === 'answerBox')
				{
					MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', ['answerBox']); });
				}
				else if (currentBox.attr('id') === 'answerBox2')
				{
					MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', ['answerBox2']); });
				}
				else
				{
					// potentially unnecessary to have this here
					MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', [currentBox.parent().attr('id')]); });
				}
			}
			else
			{
				var answerBox2 = document.getElementById('answerBox2');
				addBackHistory("");
				insertHTML(answerBox2, html);
				MyAnswersDevice.showView($('#answerView2'));
				MyAnswers.dispatch.add(function() { $('body').trigger('answerDownloaded', ['answerView2']); });
			}
		},
		timeout: computeTimeout(requestUrl.length + requestData.length)
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
			navigator.geolocation.watchPosition(function(position) {
				if (latitude !== position.coords.latitude || longitude !== position.coords.longitude)
				{
					latitude = position.coords.latitude;
					longitude = position.coords.longitude;
					MyAnswers.log('Location Event: Updated lat=' + latitude + ' long=' + longitude);
					$('body').trigger('locationUpdated');
				}
			}, null, { enableHighAccuracy : true, maximumAge : 600000 });
		}
		else if (typeof(google) !== 'undefined' && typeof(google.gears) !== 'undefined')
		{
			google.gears.factory.create('beta.geolocation').watchPosition(function(position) {
				if (latitude !== position.latitude || longitude !== position.longitude)
				{
					latitude = position.latitude;
					longitude = position.longitude;
					MyAnswers.log('Location Event: Updated lat=' + latitude + ' long=' + longitude);
					$('body').trigger('locationUpdated');
				}
			}, null, { enableHighAccuracy : true, maximumAge : 600000 });
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
	MyAnswers.log('Google Maps Basic: initialising ' + $.type(data));
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
		var kml = new google.maps.KmlLayer(data.kml, { map: map, preserveViewport: true });
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
	MyAnswers.log('Google Maps Directions: initialising ' + $.type(data));
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
		MyAnswers.log('Google Maps Directions: missing origin, ' + destination);
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
		MyAnswers.log('Google Maps Directions: missing destination ' + origin);
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
	MyAnswers.log('Google Maps Directions: both origin and destination provided, ' + origin + ', ' + destination);
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

// *** BEGIN APPLICATION INIT ***

function onBrowserReady() {
  MyAnswers.log("onBrowserReady: " + window.location);
  try {
		var uriParts = parse_url(window.location);
		var splitUrl = uriParts.path.match(/_([RW])_\/(.+)\/(.+)\/index\.php/);
		siteVars.serverAppBranch =  splitUrl[1];
		siteVars.serverAppVersion =  splitUrl[3];
		siteVars.serverDomain = uriParts.host;
		siteVars.serverAppPath = '//' + siteVars.serverDomain + '/_' + siteVars.serverAppBranch + '_/common/' + siteVars.serverAppVersion;
		siteVars.serverDevicePath = '//' + siteVars.serverDomain + '/_' + siteVars.serverAppBranch + '_/' + deviceVars.device + '/' + siteVars.serverAppVersion;
		siteVars.queryParameters = getURLParameters();
		siteVars.answerSpace = siteVars.queryParameters.answerSpace;
		delete siteVars.queryParameters.uid;
		delete siteVars.queryParameters.answerSpace;
		MyAnswers.domain = '//' + siteVars.serverDomain + "/";
		
		if (document.getElementById('loginButton') !== null)
		{
			siteVars.hasLogin = true;
		}
	
		// 
		// The following variables are initialised here so the JS can be tested
		// within Safari
		//
		MyAnswers.cameraPresent = false;
		MyAnswers.multiTasking = false;
		//
		// End of device overriden variables
		//
		
		// HTML5 Web Worker
		/*
		 * deviceVars.hasWebWorkers = typeof(window.Worker) === 'function'; if
		 * (deviceVars.hasWebWorkers === true) { MyAnswers.webworker = new
		 * Worker(siteVars.serverAppPath + '/webworker.js');
		 * MyAnswers.webworker.onmessage = function(event) { switch
		 * (event.data.fn) { case 'log': MyAnswers.log(event.data.string);
		 * break; case 'processXSLT': MyAnswers.log('WebWorker: finished
		 * processing XSLT'); var target =
		 * document.getElementById(event.data.target); insertHTML(target,
		 * event.data.html); break; case 'workBegun':
		 * $('body').trigger('taskBegun'); break; case 'workComplete':
		 * $('body').trigger('taskComplete'); break; } }; }
		 */
		$(document).ajaxSend(function(event, xhr, options) {
				/*
				 * xhr.onprogress = function(e) { var string = 'AJAX progress: ' +
				 * phpName; MyAnswers.log(string + ' ' + e.position + ' ' +
				 * e.total + ' ' + xhr + ' ' + options); }
				 */
				MyAnswers.log('AJAX start: ' + options.url);
		});
		$(document).ajaxSuccess(function(event, xhr, options) {
				var status = typeof(xhr) === 'undefined' ? null : xhr.status,
					readyState = typeof(xhr) === 'undefined' ? 4 : xhr.readyState;
				MyAnswers.log('AJAX complete: ' + options.url + ' ' + readyState + ' ' + status);
		});
/*
 * $(document).ajaxError(function(event, xhr, options, error) {
 * MyAnswers.log('AJAX error: ' + options.url + ' ' + xhr + ' ' + options + ' ' +
 * error); });
 */
		MyAnswers.browserReady_Loaded = true;
  } catch(e) {
		MyAnswers.log("onBrowserReady: Exception");
		MyAnswers.log(e);
	}
}

// Function: loaded()
// Called by Window's load event when the web application is ready to start
//
function loaded() {
	MyAnswers.log('loaded():');
	if (typeof webappCache  !== 'undefined') {
		switch(webappCache.status) {
			case 0:
				MyAnswers.log("Cache status: Uncached"); break;
			case 1:
				MyAnswers.log("Cache status: Idle"); break;
			case 2:
				MyAnswers.log("Cache status: Checking"); break;
			case 3:
				MyAnswers.log("Cache status: Downloading"); break;
			case 4:
				MyAnswers.log("Cache status: Updateready"); break;
			case 5:
				MyAnswers.log("Cache status: Obsolete"); break;
		}
	}

	try {
		backStack = [];
		MyAnswers.store.set('answerSpace', siteVars.answerSpace);
		MyAnswers.store.get('siteConfigMessage', function(key, message) {
			if (typeof message === 'string') {
				message = $.parseJSON(message);
			}
			if ($.type(message) === 'object') {
				siteConfig = message.siteConfig;
				siteConfigHash = message.siteHash;
			}
//			getSiteConfig();
			requestLoginStatus();
			requestConfig({ _id: siteVars.id, _t: 'a' });
		});
		MyAnswers.store.get('starsProfile', function(key, stars) {
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
		MyAnswers.log("Exception loaded: ");
		MyAnswers.log(e);
	}
}

function init_main() {
	MyAnswers.log("init_main(): ");
	
	siteVars.id = $('body').data('id');

	hasCategories = false;
	hasMasterCategories = false;
	hasVisualCategories = false;
	answerSpaceOneKeyword = false;

	PictureSourceType.PHOTO_LIBRARY = 0;
	PictureSourceType.CAMERA = 1;
  lastPictureTaken.image = new Hashtable();
  lastPictureTaken.currentName = null;

	jQuery.fx.interval = 25; // default is 13, increasing this to be kinder on devices
	
	lowestTransferRateConst = 1000 / (4800 / 8);
	maxTransactionTimeout = 180 * 1000;
	ajaxQueue = $.manageAjax.create('globalAjaxQueue', { queue: true });
	ajaxQueueMoJO = $.manageAjax.create('mojoAjaxQueue', { queue: true });
	MyAnswers.dispatch = new DOMDispatch();

	MyAnswers.runningTasks = 0; // track the number of tasks in progress
	
	// TODO: JSLint doesn't like the regular expression below ??? unescaped & [ -
	// to facilitate building regex replacements
	RegExp.quote = function(str) { return str.replace(/([.?*+\^$\[\]\\(){}\-])/g, "\\$1"); };

	addEvent(document, 'orientationChanged', updateOrientation);
	if (typeof onScroll === 'function') {
		$(window).bind('scroll', onScroll);
		$(window).trigger('scroll');
	}

	if (typeof window.openDatabase !== 'undefined') {
		MyAnswers.log('MyAnswersStorage(): websqldatabase ' + siteVars.answerSpace + ' jstore');
		MyAnswers.store = new MyAnswersStorage('websqldatabase', siteVars.answerSpace, 'jstore');
	} else if (typeof window.localStorage !== 'undefined') {
		MyAnswers.log('MyAnswersStorage(): localstorage ' + siteVars.answerSpace + ' jstore');
		MyAnswers.store = new MyAnswersStorage('localstorage', siteVars.answerSpace, 'jstore');
	} else if (typeof window.sessionStorage !== 'undefined') {
		MyAnswers.log('MyAnswersStorage(): sessionstorage ' + siteVars.answerSpace + ' jstore');
		MyAnswers.store = new MyAnswersStorage('sessionstorage', siteVars.answerSpace, 'jstore');
	} else {
		MyAnswers.log('MyAnswersStorage: no compatible local storage mechanism available');
		MyAnswers.log('MyAnswersStorage(): memory ' + siteVars.answerSpace + ' jstore');
		MyAnswers.store = new MyAnswersStorage('memory', siteVars.answerSpace, 'jstore');
	}
	
	MyAnswers.store.ready(function() {
//		dumpStorage(MyAnswers.store);
		loaded();
		MyAnswers.log('loaded(): returned after call by MyAnswersStorage');
	});

	MyAnswers.activityIndicator = document.getElementById('activityIndicator');
	MyAnswers.activityIndicatorTimer = null;

	$('body').bind('answerDownloaded', onAnswerDownloaded);
	$('body').bind('transitionComplete', onTransitionComplete);
	$('body').bind('taskBegun', onTaskBegun);
	$('body').bind('taskComplete', onTaskComplete);
	$('body').bind('siteBootComplete', onSiteBootComplete);
}

function onBodyLoad() {
  if (navigator.userAgent.search("Safari") > 0) {
    MyAnswers.log("onBodyLoad: direct call to onBrowserReady()");
    onBrowserReady();
  } else {
		var bodyLoadedCheck = setInterval(function() {
			if (MyAnswers.bodyLoaded) {
				clearInterval(bodyLoadedCheck);
				onBrowserReady();
			} else {
				MyAnswers.log("Waiting for onload event...");
			}
		}, 1000);
    setTimeout(function() {
      MyAnswers.bodyLoaded = true;
      MyAnswers.log("onBodyLoad: set bodyLoaded => true");
    }, 2000);
  }
}
if (!addEvent(window, "load", onBodyLoad)) {
  alert("Unable to add load handler");
  throw("Unable to add load handler");
}

(function(window, document, undefined) {
	var waitJSLoaded = setInterval(function() {
		if (MyAnswers.main_Loaded && MyAnswers.device_Loaded && MyAnswers.browserReady_Loaded) {
			clearInterval(waitJSLoaded);
			MyAnswers.log("onBrowserReady: running JS init");
			try {
				init_device();
				init_main();
			} catch(e) {
				MyAnswers.log("onBrowserReady: Exception");
				MyAnswers.log(e);
			}
			MyAnswers.log("User-Agent: " + navigator.userAgent);
		}
	}, 500);
}(window, window.document));

// END APPLICATION INIT

MyAnswers.main_Loaded = true;
