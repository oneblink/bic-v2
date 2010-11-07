var httpAnswerRequest;

var locationTracker, latitude, longitude;

var hasCategories, hasMasterCategories, hasVisualCategories, answerSpaceOneKeyword;

var currentKeyword, currentCategory, currentMasterCategory;

var siteConfig, siteConfigHash;
var starsProfile;
var answerSpacesList, answerSpacesHash;
var backStack;

var webappCache;

var lowestTransferRateConst, maxTransactionTimeout;
var ajaxQueue, ajaxQueueMoJO;

if ($.type(window.console) === 'undefined')
{
	if ($.type(window.debug) === 'object' && $.type(window.debug.log) === 'function')
		console = debug;
	else
	{
		console = { };
		console.log = function(string) { };
	}
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

if (!addEvent(document, "deviceready", onDeviceReady)) {
  alert("Unable to add deviceready handler");
  throw("Unable to add deviceready handler");
}
if (!addEvent(window, "load", onBodyLoad)) {
  alert("Unable to add load handler");
  throw("Unable to add load handler");
}

(function() {
  var waitJSLoaded = setInterval(function() {
    if (MyAnswers.main_Loaded && MyAnswers.device_Loaded && MyAnswers.browserReady_Loaded) {
      clearInterval(waitJSLoaded);
      console.log("onBrowserReady: running JS init");
      try {
      	init_device();
        init_main();
      } catch(e) {
        console.log("onBrowserReady: Exception");
        console.log(e);
      }
      try {
				window.addEventListener('scroll', onScroll, false);
				$('input, textarea, select').live('blur', function() { $(window).trigger('scroll'); });
				$(window).trigger('scroll');
      } catch(e) {
        console.log("Unable to set onScroll: " + e);
      }
      console.log("User Agent: " + navigator.userAgent);
	  }
  }, 500);
})();

function onBodyLoad() {
  if (navigator.userAgent.search("Safari") > 0) {
    console.log("onBodyLoad: direct call to onBrowserReady()");
    onBrowserReady();
  } else {
		var bodyLoadedCheck = setInterval(function() {
			if (MyAnswers.bodyLoaded) {
				clearInterval(bodyLoadedCheck);
				onBrowserReady();
			} else {
				console.log("Waiting for onload event...");
			}
		}, 1000);
    setTimeout(function() {
      MyAnswers.bodyLoaded = true;
      console.log("onBodyLoad: set bodyLoaded => true");
    }, 2000);
  }
}

function onBrowserReady() {
  console.log("onBrowserReady: " + window.location);
  var stringToParse = window.location + "";
  splitUrl = stringToParse.match(/:\/\/(.[^/]+)\/_R_\/(.[^/]+)\/([^/]+)\/.+answerSpace=(.+)/);
  MyAnswers.loadURL = 'http://' + splitUrl[1] + '/_R_/';
  siteVars.serverAppVersion =  splitUrl[3];
	siteVars.serverDomain = location.hostname;
	siteVars.serverAppPath = 'http://' + siteVars.serverDomain + '/_R_/common/' + siteVars.serverAppVersion;
	siteVars.serverDevicePath = 'http://' + siteVars.serverDomain + '/_R_/' + deviceVars.device + '/' + siteVars.serverAppVersion;
	siteVars.queryParameters = getURLParameters();
	siteVars.answerSpace = siteVars.queryParameters.answerSpace;
	delete siteVars.queryParameters.uid;
	delete siteVars.queryParameters.answerSpace;
  MyAnswers.domain = "http://" + siteVars.serverDomain + "/";
  
  if (document.getElementById('loginButton') !== null)
  	siteVars.hasLogin = true;

  // 
  // The following variables are initialised here so the JS can be tested within Safari
  //
  MyAnswers.cameraPresent = false;
  MyAnswers.multiTasking = false;
  //
  // End of device overriden variables
  //
  
	// HTML5 Web Worker
	deviceVars.hasWebWorkers = typeof(window.Worker) === 'function'; 
	if (deviceVars.hasWebWorkers === true)
	{
		MyAnswers.webworker = new Worker(siteVars.serverAppPath + '/webworker.js');
		MyAnswers.webworker.onmessage = function(event) {
			switch (event.data.fn)
			{
				case 'log':
					console.log(event.data.string);
					break;
				case 'processXSLT':
					console.log('WebWorker: finished processing XSLT');
					var target = document.getElementById(event.data.target);
					insertHTML(target, event.data.html);
					break;
				case 'workBegun':
					startInProgressAnimation();
					break;
				case 'workComplete':
					stopInProgressAnimation();
					break;
			}
		};
	}
	$(document).ajaxSend(function(event, xhr, options) {
			var phpName = options.url.match(/\/(\w+.php)\??/);
			if (phpName != null)
					phpName = phpName[1];
			xhr.onprogress = function(e) {
					var string = 'AJAX progress: ' + phpName;
					console.log(string, e.position, e.total, xhr, options);
			}
	});
	
	$(document).ajaxSuccess(function(event, xhr, options) {
			var string = 'AJAX complete: ';
			var phpName = options.url.match(/\/(\w+.php)\??/);
			if (phpName != null)
					string += phpName[1];
			var status = typeof(xhr) === 'undefined' ? null : xhr.status;
			var readyState = typeof(xhr) === 'undefined' ? 4 : xhr.readyState;
			console.log(string, readyState, status, xhr, options);
	});
	
	$(document).ajaxError(function(event, xhr, options, error) {
			var phpName = options.url.match(/\/(\w+.php)\??/);
			if (phpName != null)
					phpName = phpName[1];
			console.log('AJAX error: ' + phpName, xhr, options, error);
	});
	MyAnswers.browserReady_Loaded = true;
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
  console.log("Device Ready");
  console.log("URL to Load: " + window.Settings.LoadURL);
  console.log("Device: " + window.device.platform);
  console.log("Camera Present: " + window.device.camerapresent);
  console.log("Multitasking: " + window.device.multitasking);
  MyAnswers.cameraPresent = window.device.camerapresent;
  MyAnswers.loadURL = window.Settings.LoadURL;
  siteVars.serverDomain = MyAnswers.loadURL.match(/:\/\/(.[^/]+)/)[1];
  MyAnswers.domain = "http://" + siteVars.serverDomain + "/";
  console.log("Domain: " + MyAnswers.domain);
  MyAnswers.multiTasking = window.device.multitasking;
  siteVars.serverAppVersion = window.Settings.codeVersion;
  siteVars.serverAppPath = MyAnswers.loadURL + 'common/' + siteVars.serverAppVersion + '/';
  siteVars.answerSpace = window.Settings.answerSpace;
  if (window.device.platform.search(/iphone/i) != -1) {
    deviceVars.device = "iphone_pg";
    siteVars.serverDevicePath = MyAnswers.loadURL + 'iphone/' + siteVars.serverAppVersion + '/';
    deviceVars.deviceFileName = '/iphone.js';
  } else {
    deviceVars.device = "ipad_pg";
    siteVars.serverDevicePath = MyAnswers.loadURL + 'ipad/' + siteVars.serverAppVersion + '/';
    deviceVars.deviceFileName = '/ipad.js';
  }
  console.log("AppDevicePath: " + siteVars.serverDevicePath);
  console.log("AppPath: " + siteVars.serverAppPath);
}

function init_main(){
	console.log("init_main: ");
	httpAnswerRequest = false;

	hasCategories = false;
	hasMasterCategories = false;
	hasVisualCategories = false;
	answerSpaceOneKeyword = false;

	jQuery.fx.interval = 25; // default is 13, increasing this to be kinder on devices
	
	lowestTransferRateConst = 1000 / (4800 / 8);
	maxTransactionTimeout = 180 * 1000;
	ajaxQueue = $.manageAjax.create('globalAjaxQueue', { queue: true });
	ajaxQueueMoJO = $.manageAjax.create('mojoAjaxQueue', { queue: true });

	// to facilitate building regex replacements
	RegExp.quote = function(str) { return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1"); };

	document.addEventListener('orientationChanged', updateOrientation, false);
		
	$('body').bind('answerDownloaded', onAnswerDownloaded);

	//dumpLocalStorage();
//
// Do fiddle faddle to get jStore initialised
//
	jStore.init(siteVars.answerSpace, {});
	jStore.error(function(e) { console.log('jStore: ' + e); });

	deviceVars.storageReady = false;
  var storageEngineCheck = setInterval(function() {
    console.log("jStore: storageEngineCheck");
    if (deviceVars.storageReady === true) {
      console.log('jStore storageReady: ' + deviceVars.storageReady);
      setTimeout(function() { 
        try {
          console.log("jStore storageReady: running loaded()", jStore.activeEngine().jri);
          loaded(); 
          console.log("jStore storageReady: loaded() returned");
        } catch(e) {
          console.log("jStore storageReady exception: ");
          console.log(e);
        }
      }, 1000);
      clearInterval(storageEngineCheck);
    }
    deviceVars.storageReady = jStore.activeEngine().isReady;
  }, 100);	
  
  MyAnswers.activityIndicator = document.getElementById('activityIndicator');
  MyAnswers.activityIndicatorTimer = null;
}

function computeTimeout(messageLength) {
  var t = (messageLength * lowestTransferRateConst) + 5000;
  return ((t < maxTransactionTimeout) ? t : maxTransactionTimeout);
}

function updateOrientation()
{
	MyAnswers.log("orientationChanged: " + Orientation.currentOrientation);
	setupForms($('.view:visible'));
}

// jStore doesn't do this for us, so this function will empty client-side storage
function clearStorage()
{
	var storageType = jStore.activeEngine().flavor;
	console.log('clearStorage: ' + storageType);
	switch (storageType)
	{
		case 'jstore-html5-sql':
			jStore.activeEngine().database.transaction(function (database) {
				database.executeSql('TRUNCATE TABLE jstore');
			});
			break;
		case 'jstore-html5-local':
			window.localStorage.clear();
			break;
		case 'jstore-flash':
			break;
		case 'jstore-msie':
			break;
		case 'jstore-google-gears':
			break;
		default:
			console.log('unidentified jStore engine');
	}
}

if (typeof(webappCache) != "undefined")
{
  webappCache.addEventListener("updateready", updateCache, false);
  webappCache.addEventListener("error", errorCache, false);
}

function setAnswerSpaceItem(key, value)
{
	if (deviceVars.storageReady)
	  jStore.set(key, value);
}

function getAnswerSpaceItem(key)
{
	return deviceVars.storageReady ? jStore.get(key) : null;
}

function removeAnswerSpaceItem(key)
{
	if (deviceVars.storageReady)
	  jStore.remove(key);
}

function isBrowserOnline()
{
	if (typeof(navigator.onLine) != 'undefined')
		return navigator.onLine;
	else
		return true;
}

// produce the HTML for the list and insert it into #keywordList
function populateKeywordList(category) {
	console.log('populateKeywordList(): category=' +  category + '; hasCategories=' + hasCategories);
	var width;
	switch (siteConfig.keywords_config)
	{
		case "1col":
			columns = 1;
			break;
		case "2col":
			columns = 2;
			break;
		case "3col":
			columns = 3;
			break;
		case "4col":
			columns = 4;
			break;
	}
	var order = hasCategories ? siteConfig.categories[category].keywords : siteConfig.keywords_order;
	var list = siteConfig.keywords;
	var keywordList = document.getElementById('keywordList');
	var keywordBox = document.getElementById('keywordBox');
	emptyDOMelement(keywordList);
	emptyDOMelement(keywordBox);
	for (id in order)
  {
		if (list[order[id]].status != 'active')
			continue;
		if (siteConfig.keywords_config != 'no' && (!hasCategories || siteConfig.categories[category].textKeywords != 'Y') && list[order[id]].image)
		{
			var image = document.createElement('img');
			image.setAttribute('class', 'v' + siteConfig.keywords_config);
			image.setAttribute('data-id', order[id]);
			image.setAttribute('src', list[order[id]].image);
			image.setAttribute('alt', list[order[id]].name);
			keywordBox.appendChild(image);
			image.addEventListener('click', function() {
				gotoNextScreen(this.getAttribute('data-id'));
			});
		}
		else
		{
			var item = document.createElement('li');
			item.setAttribute('data-id', order[id]);
			var label = document.createElement('div');
			label.setAttribute('class', 'label');
			insertText(label, list[order[id]].name);
			item.appendChild(label);
			//htmlList += "<div class='nextArrow'></div>";
			if (typeof(list[order[id]].description) == 'string')
			{
				var description = document.createElement('div');
				description.setAttribute('class', 'description');
				insertText(description, list[order[id]].description);
				item.appendChild(description);
			}
			keywordList.appendChild(item);
			item.addEventListener('click', function() {
				gotoNextScreen(this.getAttribute('data-id'));
			});
		}
  }
	keywordList = $(keywordList);
	keywordBox = $(keywordBox);
	if (keywordBox.children().size() > 0)
	{
		var images = keywordBox.find('img');
		images.width(width);
		switch (siteConfig.keywords_config)
		{
			case "1col":
				images.first().addClass('roundedTopLeft roundedTopRight');
				images.last().addClass('roundedBottomLeft roundedBottomRight');
				break;
			default:
				images.first().addClass('roundedTopLeft');
				if (images.size() >= columns)
				{
					images.eq(columns - 1).addClass('roundedTopRight');
				}
				if (images.size() % columns == 0)
				{
					images.eq(0 - columns).addClass('roundedBottomLeft');
					images.last().addClass('roundedBottomRight');
				}
		}
		keywordBox.removeClass('hidden');
	}
	else
	{
		keywordBox.addClass('hidden');
	}
	if (keywordList.children().size() > 0)
	{
		keywordList.removeClass('hidden');
	}
	else
	{
		keywordList.addClass('hidden');
	}
}

function populateAnswerSpacesList() {
	console.log('populateAnswerSpacesList()');
	var welcome = document.getElementById('answerSpacesListView').getElementById('welcomeBox');
	var listBox = $('#answerSpacesList');
  listBox.empty();
	var width;
	var list = answerSpacesList.answerSpaces;
	for (a in list)
  {
		var html = "<a href=\"/" + list[a].name + "\"><li>";
		html += list[a].icon ? "<img src=\"" + list[a].icon + "\" alt=\"" + list[a].title + "\" />" : "";
		html += "<div class='label'" + (!list[a].icon ? "style=\"width:90%\"" : "") + ">" + list[a].title + "</div>";
		html += "<div class='description'>" + list[a].name + "</div>";
		html += "</li></a>";
		listBox.append(html);
  }
	if (listBox.children().size() > 0)
	{
		listBox.removeClass('hidden');
		if (siteVars.answerSpace)
		{
			insertText(welcome, 'Please check the address you have entered, or choose from a range of answerSpaces below.');
		}
		else
		{
			insertText(welcome, 'Please choose from a range of answerSpaces below.');
		}
	}
	else
	{
		insertText(welcome, 'Please check the address you have entered.');
	}
}

// produce XHTML for the master categories view
function populateMasterCategories()
{
	console.log('populateMasterCategories()');
	var order = siteConfig.master_categories_order;
	var list = siteConfig.master_categories;
	var masterCategoriesBox = document.getElementById('masterCategoriesBox');
	emptyDOMelement(masterCategoriesBox);
	for (id in order)
	{
		if (list[order[id]].status != 'active')
			continue;
		var image = document.createElement('img');
		image.setAttribute('class', 'v' + siteConfig.master_categories_config);
		image.setAttribute('data-id', order[id]);
		image.setAttribute('src', list[order[id]].image);
		image.setAttribute('alt', list[order[id]].name);
		masterCategoriesBox.appendChild(image);
		image.addEventListener('click', function() {
			showCategoriesView(this.getAttribute('data-id'));
		});
	}
	if (siteConfig.master_categories_config != 'auto')
	{
		var width;
		switch (siteConfig.master_categories_config)
		{
			case "1col":
				columns = 1;
				break;
			case "2col":
				columns = 2;
				break;
			case "3col":
				columns = 3;
				break;
			case "4col":
				columns = 4;
				break;
		}
		var images = $(masterCategoriesBox).find('img');
		images.width(width);
		switch (siteConfig.master_categories_config)
		{
			case "1col":
				images.first().addClass('roundedTopLeft roundedTopRight');
				images.last().addClass('roundedBottomLeft roundedBottomRight');
				break;
			default:
				images.first().addClass('roundedTopLeft');
				if (images.size() >= columns)
				{
					images.eq(columns - 1).addClass('roundedTopRight');
				}
				if (images.size() % columns == 0)
				{
					images.eq(0 - columns).addClass('roundedBottomLeft');
					images.last().addClass('roundedBottomRight');
				}
		}
	}
}

// produce XHTML for the visual categories view
function populateVisualCategories(masterCategory)
{
	console.log('populateVisualCategories()');
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var categoriesBox = document.getElementById('categoriesBox');
	emptyDOMelement(categoriesBox);
	for (id in order)
	{
		if (list[order[id]].status != 'active')
			continue;
		var image = document.createElement('img');
		image.setAttribute('class', 'v' + siteConfig.categories_config);
		image.setAttribute('data-id', order[id]);
		image.setAttribute('src', list[order[id]].image);
		image.setAttribute('alt', list[order[id]].name);
		categoriesBox.appendChild(image);
		image.addEventListener('click', function() {
			showKeywordListView(this.getAttribute('data-id'));
		});
	}
	if (siteConfig.categories_config != 'auto')
	{
		var width, columns;
		switch (siteConfig.categories_config)
		{
			case "1col":
				columns = 1;
				break;
			case "2col":
				columns = 2;
				break;
			case "3col":
				columns = 3;
				break;
			case "4col":
				columns = 4;
				break;
		}
		var images = $(categoriesBox).find('img');
		images.width(width);
		switch (siteConfig.categories_config)
		{
			case "1col":
				images.first().addClass('roundedTopLeft roundedTopRight');
				images.last().addClass('roundedBottomLeft roundedBottomRight');
				break;
			default:
				images.first().addClass('roundedTopLeft');
				if (images.size() >= columns)
				{
					images.eq(columns - 1).addClass('roundedTopRight');
				}
				if (images.size() % columns == 0)
				{
					images.eq(0 - columns).addClass('roundedBottomLeft');
					images.last().addClass('roundedBottomRight');
				}
		}
	}
}

function updateCache()
{
  console.log("updateCache: " + webappCache.status);
  if (webappCache.status != window.applicationCache.IDLE) {
    webappCache.swapCache();
    console.log("Cache has been updated due to a change found in the manifest");
  } else {
    webappCache.update();
    console.log("Cache update requested");
  }
}
function errorCache()
{
  console.log("errorCache: " + webappCache.status);
  console.log("You're either offline or something has gone horribly wrong.");
}
 
// Function: loaded()
// Called by Window's load event when the web application is ready to start
//
function loaded()
{
	console.log('loaded(): isBrowserOnline? ' + isBrowserOnline());
  var timer = null;
  var requestActive = false;

  if (typeof(webappCache) != 'undefined')
  {
	 switch(webappCache.status)
	 {
		case 0:
		  console.log("Cache status: Uncached");
		  break;
		case 1:
		  console.log("Cache status: Idle");
		  break;
		case 2:
		  console.log("Cache status: Checking");
		  break;
		case 3:
		  console.log("Cache status: Downloading");
		  break;
		case 4:
		  console.log("Cache status: Updateready");
		  break;
		case 5:
		  console.log("Cache status: Obsolete");
		  break;
	 }
  }
		
/*	if (siteVars.answerSpace)
	{ */
		backStack = new Array();
		if (getAnswerSpaceItem('answerSpace') == 'undefined' || getAnswerSpaceItem('answerSpace') != siteVars.answerSpace)
			clearStorage();
		setAnswerSpaceItem('answerSpace', siteVars.answerSpace);
		var message = getAnswerSpaceItem('siteConfigMessage');
		if (typeof(message) === 'string')
			message = JSON.parse(message);
		if (typeof(message) === 'object')
		{
			siteConfig = message.siteConfig;
			siteConfigHash = message.siteHash;
		}
		starsProfile = getAnswerSpaceItem('starsProfile');
		if (typeof(starsProfile) === 'string')
			starsProfile = JSON.parse(starsProfile);
		if (typeof(starsProfile) !== 'object')
			starsProfile = { };
		setSubmitCachedFormButton();
		getSiteConfig();
		updateLoginBar();
	/* }
	else
	{
		getAnswerSpacesList();
	}*/
}

function getAnswerSpacesList()
{
	startInProgressAnimation();
	var answerSpacesUrl = siteVars.serverAppPath + '/util/GetAnswerSpaces.php';
	var requestData = answerSpacesHash ? "sha1=" + answerSpacesHash : "";
	console.log("GetAnswerSpaces transaction: " + answerSpacesUrl + "?" + requestData);
	$.getJSON(answerSpacesUrl, requestData,
		function(data, textstatus) { // readystate == 4
			console.log("GetAnswerSpaces transaction complete: " + textstatus);
			console.log(data);
			stopInProgressAnimation();
			if (textstatus != 'success') return;
			if (data.errorMessage)
			{
				console.log("GetAnswerSpaces error: " + data.errorMessage);
			}
			else
			{
				console.log("GetAnswerSpaces status: " + data.statusMessage);
				if (!data.statusMessage || data.statusMessage != "NO UPDATES")
				{
					answerSpacesHash = data.listHash;
					answerSpacesList = data.list;
				}
				var startUp = $('#startUp');
				if (startUp.size() > 0)
				{
					populateAnswerSpacesList();
					showAnswerSpacesListView();
					startUp.remove();
					$('#content').removeClass('hidden');
				}
			}
		});
}

function getSiteConfig()
{
	var fallbackToStorage = function(string) {
		console.log('siteConfig type: ' + typeof(siteConfig));
		if (typeof(siteConfig) != 'undefined')
			processSiteConfig();
		else
		{
			alert(string);
			window.location = '/demos';
		}
	};
	var requestUrl = siteVars.serverAppPath + '/util/GetSiteConfig.php';
	var requestData = 'device=' + deviceVars.device + '&answerSpace=' + siteVars.answerSpace + (typeof(siteConfigHash) == 'string' ? "&sha1=" + siteConfigHash : "");
	ajaxQueue.add({
		url: requestUrl,
		data: requestData,
		dataType: 'json',
		beforeSend: function(xhr) {
			console.log("GetSiteConfig transaction: " + requestUrl + "?" + requestData);
		},
		complete: function(xhr, xhrStatus) {
			if (isAJAXError(xhrStatus) || xhr.status !== 200)
			{
				fallbackToStorage('Content unreachable, please try later.');
				return;
			}
			/*	possible values of errorMessage:
			 *	'No answerSpace specified.'
			 *	'Could not connect to the database.'
			 *	'Error performing answerSpace query: ' ...
			 *	'NOT LOGGED IN'
			 *	'Error performing master categories query: ' ...
			 *	'Error performing categories query: ' ...
			 *	'Error performing keywords query: ' ...
			 *	
			 *	possible values of statusMessage:
			 *	'NO KEYWORDS'
			 *	'NO UPDATES'
			 */
			var data = JSON.parse(xhr.responseText);
			if (data === null)
			{
				console.log('GetSiteConfig error: null siteConfig');
				fallbackToStorage('Content unreachable, please try again later.');
				return;
			}
			if (typeof(data.errorMessage) !== 'string' && typeof(data.statusMessage) !== 'string')
			{
				console.log('GetSiteConfig success: no status or error messages', data);
				setAnswerSpaceItem('siteConfigMessage', data);
				siteConfig = data.siteConfig;
				siteConfigHash = data.siteHash;
				processSiteConfig();
				console.log('post-store siteConfig type:' + typeof(getAnswerSpaceItem('siteConfigMessage')));
				return;
			}
			if (typeof(data.statusMessage) === 'string')
			{
				switch (data.statusMessage)
				{
					case 'NO UPDATES':
						console.log("GetSiteConfig status: " + data.statusMessage, siteConfig);
						break;
					case 'NO KEYWORDS':
						console.log("GetSiteConfig status: " + data.statusMessage, data);
						break;
				}
				processSiteConfig();
				return;
			}
			if (typeof(data.errorMessage) === 'string')
			{
				console.log('GetSiteConfig error: ' + data.errorMessage);
				switch (data.errorMessage)
				{
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

function processSiteConfig()
{
	console.log('processSiteConfig():');
	hasMasterCategories = siteConfig.master_categories_config != 'no';
	hasVisualCategories = siteConfig.categories_config != 'yes' && siteConfig.categories_config != 'no';
	hasCategories = siteConfig.categories_config != 'no';
	answerSpaceOneKeyword = siteConfig.keywords.length == 1;
	displayAnswerSpace();
	processMoJOs();
}

function displayAnswerSpace()
{
	var startUp = $('#startUp');
	if (startUp.size() > 0 && typeof(siteConfig) != 'undefined')
	{
		if (answerSpaceOneKeyword)
		{
			showKeywordView(0);
		}
		else if (hasMasterCategories)
		{
			populateMasterCategories();
			showMasterCategoriesView();
		}
		else if (hasVisualCategories)
		{
			populateVisualCategories(currentMasterCategory);
			showCategoriesView();
		}
		else if (hasCategories)
		{
			currentCategory = siteConfig.default_category ? siteConfig.default_category : siteConfig.categories_order[0] ;
			showKeywordListView(currentCategory);
		}
		else
		{
			showKeywordListView();
		}
		var keyword = siteVars.queryParameters.keyword;
		delete siteVars.queryParameters.keyword;
		if (typeof(keyword) === 'string' && siteVars.queryParameters != {})
			showSecondLevelAnswerView(keyword, $.param(siteVars.queryParameters));
		else if (typeof(keyword) === 'string')
			gotoNextScreen(keyword);
		else if (typeof(siteVars.queryParameters.category) === 'string')
			showKeywordListView(siteVars.queryParameters.category);
		else if (typeof(siteVars.queryParameters.master_category) === 'string')
			showCategoriesView(siteVars.queryParameters.master_category);
		delete siteVars.queryParameters;
		if (typeof(siteConfig.webClip) === 'string' && typeof(google) !== 'undefined' && typeof(google.bookmarkbubble) !== 'undefined') {
			setTimeout(function() {
				var bookmarkBubble = new google.bookmarkbubble.Bubble();
				bookmarkBubble.hasHashParameter = function() { return false; };
				bookmarkBubble.setHashParameter = $.noop;
				bookmarkBubble.getViewportHeight = function() {	return window.innerHeight; };
				bookmarkBubble.getViewportScrollY = function() { return window.pageYOffset;	};
				bookmarkBubble.registerScrollHandler = function(handler) { window.addEventListener('scroll', handler, false); };
				bookmarkBubble.deregisterScrollHandler = function(handler) { window.removeEventListener('scroll', handler, false); };
				bookmarkBubble.showIfAllowed();
			}, 1000);
		}
	}
	startUp.remove();
	$('#content').removeClass('hidden');
}

function processMoJOs(keyword)
{
	console.log('processMoJOs(): keyword=' + keyword + ' caller=' + processMoJOs.caller.name);
	if (deviceVars.disableXSLT === true) return;
	var requestURL = siteVars.serverAppPath + '/util/GetMoJO.php';
	var fetchedMoJOs = { };
	for (m in siteConfig.mojoKeys)
	{
		var mojoName = siteConfig.mojoKeys[m];
		if (keyword !== undefined && keyword !== m) continue;
		if (fetchedMoJOs[mojoName] === true) continue;
		var message = getAnswerSpaceItem('mojoMessage-' + mojoName);
		var mojoHash;
		if (typeof(message) !== 'undefined' && message != null)
		{
			mojoHash = message.mojoHash;
		}
		var requestData = 'answerSpace=' + siteVars.answerSpace + '&key=' + mojoName + (typeof(mojoHash) === 'string' ? "&sha1=" + mojoHash : "");
		ajaxQueueMoJO.add({
			url: requestURL,
			data: requestData,
			dataType: 'json',
			mojoName: mojoName,
			beforeSend: function(xhr) {
				console.log('GetMoJO transaction: ' + requestURL + '?' + requestData);
			},
			complete: function(xhr, xhrStatus, xhrOptions) {
				if (!isAJAXError(xhrStatus) && xhr.status === 200)
				{
					var data = JSON.parse(xhr.responseText);
					if (data === null)
					{
						console.log('GetSiteConfig error: null siteConfig');
					}
					else if (data.errorMessage)
					{
						console.log('GetMoJO error: ' + data.errorMessage);
					}
					else 
					{
						if (data.statusMessage !== 'NO UPDATES' && deviceVars.storageReady)
							setAnswerSpaceItem('mojoMessage-' + xhrOptions.mojoName, data);
					}
				}
			},
			timeout: computeTimeout(500 * 1024)
		});
		fetchedMoJOs[mojoName] = true;
	}
}

function showMasterCategoriesView()
{
  console.log('showMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
  prepareMasterCategoriesViewForDevice();
  setMainLabel('Master Categories');
  setCurrentView('masterCategoriesView', false);
}

function goBackToMasterCategoriesView()
{
  console.log('goBackToMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
  prepareMasterCategoriesViewForDevice();
  setMainLabel('Master Categories');
  setCurrentView('masterCategoriesView', true);
}

function showCategoriesView(masterCategory)
{
	console.log('showCategoriesView(): ' + masterCategory);
	if (masterCategory && siteConfig.master_categories[masterCategory])
	{
		currentMasterCategory = masterCategory;
		var masterConfig = siteConfig.master_categories[masterCategory];
		if (masterConfig.categories.search(siteConfig.default_category))
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
  prepareCategoriesViewForDevice();
	if (hasVisualCategories)
	{
		setMainLabel(hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
		populateVisualCategories(masterCategory);
		setCurrentView('categoriesView', false);
	}
	else
	{
		populateTextOnlyCategories(masterCategory);
		populateKeywordList(currentCategory);
		showKeywordListView();
	}
}

function goBackToCategoriesView()
{
  console.log('goBackToCategoriesView()');
	addBackHistory("goBackToCategoriesView();");
  prepareCategoriesViewForDevice();
	setMainLabel(hasMasterCategories ? siteConfig.master_categories[currentMasterCategory].name : 'Categories');
  setCurrentView('categoriesView', true);
}

function addBackHistory(item)
{
	if (backStack.indexOf(item) == -1)
		backStack.push(item);
}

function goBack()
{
	backStack.pop();
	if (backStack.length >= 1)
		eval(backStack[backStack.length-1]);
	else
		goBackToHome();
	stopTrackingLocation();
	if (isHome())
	{
		getSiteConfig();
	}
}

// test to see if the user it viewing the highest level screen
function isHome()
{
	if ($('.view:visible').first().attr('id') == $('.box:not(:empty)').first().parent().attr('id'))
		return true;
	return false;
}

function getAnswer(event)
{
  showAnswerView(currentKeyword);
}

function showAnswerView(keywordID)
{
	addBackHistory("goBackToTopLevelAnswerView();");
	currentKeyword = keywordID;
  prepareAnswerViewForDevice();
	processMoJOs(keywordID);
	var answerBox = document.getElementById('answerBox');
	var mainLabel = document.getElementById('mainLabel');
	var keyword = siteConfig.keywords[keywordID];
	if (keyword.type == 'xslt' && deviceVars.disableXSLT !== true)
	{
		startInProgressAnimation();
		var mojoMessage = getAnswerSpaceItem('mojoMessage-' + keyword.mojo);
		if (typeof(mojoMessage) != 'undefined' && mojoMessage != 'undefined')
		{
			var args = deserialize(createParamsAndArgs(keywordID));
			delete args.answerSpace;
			delete args.keyword;
			
			var xml = getAnswerSpaceItem('mojoMessage-' + keyword.mojo).mojo
			var xslt = keyword.xslt;
			for (a in args)
			{
				var regex = new RegExp(RegExp.quote('$' + a), 'g');
				xslt = xslt.replace(regex, args[a]);
			}
			var html = generateMojoAnswer(xml, xslt, 'answerBox');
			insertHTML(answerBox, html);
			stopInProgressAnimation();
		}
		else
		{
			emptyDOMelement(answerBox);
			var paragraph1 = document.createElement('p');
			insertText(paragraph1, 'The data for this keyword is currently being downloaded to your handset for fast and efficient viewing. This will only occur again if the data is updated remotely.');
			var paragraph2 = document.createElement('p');
			insertText(paragraph2, 'Please try again in 30 seconds.');
			answerBox.appendChild(paragraph1);
			answerBox.appendChild(paragraph2);
		}
		setCurrentView("answerView", false, true);
		$('body').trigger('answerDownloaded', ['answerView']);
		setMainLabel(keyword.name);
	}
	else
	{
		var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php';
		var requestData = createParamsAndArgs(keywordID) + '&_device=' + deviceVars.device;
		var html;
		var fallbackToStorage = function() {
			html = getAnswerSpaceItem("answer___" + keywordID);
			if (html == undefined)
				html = '<p>Unable to reach server, and unable to display previously stored content.</p>';
		};
		ajaxQueue.add({
		 type: 'GET',
		 url: answerUrl,
		 data: requestData,
		 beforeSend: function(xhr) {
			console.log("GetAnswer transaction: " + answerUrl + "?" + requestData);
			httpAnswerRequest = xhr;
			startInProgressAnimation();
			setSubmitCachedFormButton();
		 },
		 complete: function(xhr, textstatus) { // readystate == 4
		 	if (isAJAXError(textstatus) || xhr.status !== 200)
		 		fallbackToStorage();
		 	else
		 	{
				console.log('GetAnswer: storing server response');
				html = xhr.responseText;
				blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:(.*) -->/);
				if (blinkAnswerMessage != null)
					processBlinkAnswerMessage(blinkAnswerMessage[1]);
				setAnswerSpaceItem("answer___" + keywordID, html);
			}
			insertHTML(answerBox, html);
			setSubmitCachedFormButton();
			setCurrentView("answerView", false, true);
			setupForms($('#answerView'));
			$('body').trigger('answerDownloaded', ['answerView']);
			setMainLabel(keyword.name);
			stopInProgressAnimation();
		 },
		 timeout: 30 * 1000 // 30 seconds
		});
	}
}

function setupForms(view)
{
	var hasHiddenColumns = false;
	setTimeout(function() {
		startInProgressAnimation();
		// correct input elements that are too large in forms
		var form = view.find('form');
		var totalWidth = form.width();
		var firstColumnWidth = $('.bForm-input').first().siblings().first().width();
		var targetWidth = totalWidth - firstColumnWidth - 32;
		form.find('td, select, input, textarea').each(function(index, element) {
			if ($(element).width() > targetWidth)
				$(element).width(targetWidth);
		});
		// correct result tables that are too wide
		var results = view.find('.bForm-results');
		results.find('.hidden').removeClass('hidden');
		var columns = results.find('tr').first().find('td, th').size();
		var attempts = 5;
		while (results.width() > view.width() && columns >= 2 && attempts > 0) {
			results.find('td:nth-child(' + columns + '), th:nth-child(' + columns + ')').addClass('hidden');
			hasHiddenColumns = true;
			columns--;
			attempts--;
		}
		stopInProgressAnimation();
	}, 300);
	setTimeout(function() {
		if (hasHiddenColumns)
			if (window.orientation == -90 || window.orientation == 90)
			{
				alert('One or more columns has been hidden to fit this display.');
			}
			else
			{
				alert('Rotating your device may allow more columns to be displayed.');
			}
	}, 600);
}

function gotoNextScreen(keywordID)
{
  console.log("gotoNextScreen(" + keywordID + ")");
	if (!siteConfig.keywords[keywordID]) { // in case parameter is name not code
		for (k in siteConfig.keywords)
		{
			if (keywordID.toUpperCase() == siteConfig.keywords[k].name.toUpperCase())
			{
				keywordID = k;
				break;
			}
		}
	}
	if (!siteConfig.keywords[keywordID])
	{
		alert('Unable to locate keyword. It may be missing or protected.');
		return;
	}
  if (siteConfig.keywords[keywordID].input_config)
  {
		showKeywordView(keywordID);
  }
  else
  {
		showAnswerView(keywordID);
  }
}

function showSecondLevelAnswerView(keyword, arg0, reverse)
{
	keyword = decodeURIComponent(keyword);
	arg0 = decodeURIComponent(arg0);
  prepareSecondLevelAnswerViewForDevice(keyword, arg0);
	addBackHistory("showSecondLevelAnswerView(\"" + keyword + "\", \"" + arg0 + "\", true);");
	for (k in siteConfig.keywords)
	{
		if (keyword.toUpperCase() == siteConfig.keywords[k].name.toUpperCase())
		{
			var keywordID = k;
			break;
		}
	}
	processMoJOs(keywordID);
	var answerBox2 = document.getElementById('answerBox2');
	var mainLabel = document.getElementById('mainLabel');
	var keywordConfig = siteConfig.keywords[keywordID];
	if (keywordConfig.type == 'xslt' && deviceVars.disableXSLT !== true)
	{
		console.log('showSecondLevelAnswerView: detected XSLT keyword');
		startInProgressAnimation();
		var xml = getAnswerSpaceItem('mojoMessage-' + keywordConfig.mojo).mojo
		var xslt = keywordConfig.xslt;
		var args = deserialize(arg0);
		for (a in args)
		{
			var regex = new RegExp(RegExp.quote('$' + a), 'g');
			xslt = xslt.replace(regex, args[a]);
		}
		var html = generateMojoAnswer(xml, xslt, 'answerBox2');
		insertHTML(answerBox2, html);
		setCurrentView("answerView2", false, true);
		$('body').trigger('answerDownloaded', ['answerView2']);
		setMainLabel(keywordConfig.name);
		stopInProgressAnimation();
	}
	else
	{
		var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php'
		var requestData = 'answerSpace=' + siteVars.answerSpace + "&keyword=" + encodeURIComponent(keyword) + '&_device=' + deviceVars.device + '&' + arg0;
		var html;
		var fallbackToStorage = function() {
			html = getAnswerSpaceItem("answer___" + keywordID);
			if (html == undefined)
				html = '<p>Unable to reach server, and unable to display previously stored content.</p>';
		};
		ajaxQueue.add({
			type: 'GET',
			url: answerUrl,
			data: requestData,
			beforeSend: function(xhr) {
				console.log("GetAnswer2 transaction:" + answerUrl + "?" + requestData);
				httpAnswerRequest = xhr;
				setSubmitCachedFormButton();
				insertText(answerBox2, 'Waiting...');
				startInProgressAnimation();
			},
			complete: function(xhr, textstatus) { // readystate == 4
				if (isAJAXError(textstatus) || xhr.status !== 200)
					fallbackToStorage();
				else
				{
					html =  xhr.responseText;
					blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:(.*) -->/);
					if (blinkAnswerMessage != null)
						processBlinkAnswerMessage(blinkAnswerMessage[1]);
				}
				insertHTML(answerBox2, html);
				setCurrentView('answerView2', false, true);   
				$('body').trigger('answerDownloaded', ['answerView2']);
				setupForms($("#answerView2"));
				stopInProgressAnimation();
			}
		});
	}
}

function showKeywordView(keywordID) 
{
	addBackHistory("goBackToKeywordView(\"" + keywordID + "\");");
	var keyword = siteConfig.keywords[keywordID];
	setMainLabel(keyword.name);
  currentKeyword = keywordID;
  prepareKeywordViewForDevice(answerSpaceOneKeyword, typeof(keyword.help) == 'string');
  setSubmitCachedFormButton();
  var argsBox = document.getElementById('argsBox');
  insertHTML(argsBox, keyword.input_config);
	var descriptionBox = document.getElementById(descriptionBox);
  if (keyword.description) {
		insertHTML(descriptionBox, keyword.description);
		$(descriptionBox).removeClass('hidden');
  } else {
		$(descriptionBox).addClass('hidden');
  }
  setCurrentView('keywordView', false, true);
}

function goBackToKeywordView(keywordID)
{
	var keyword = siteConfig.keywords[keywordID];
	setMainLabel(keyword.name);
  currentKeyword = keywordID;
  prepareKeywordViewForDevice(answerSpaceOneKeyword, typeof(keyword.help) == 'string');
  setSubmitCachedFormButton();
  setCurrentView('keywordView', true, true);
}

function showKeywordListView(category)
{
	console.log('showKeywordListView(): ' + category);
	currentCategory = category;
	var mainLabel;
	if (hasCategories)
	{
		mainLabel = siteConfig.categories[category].name;
	}
	else if (hasMasterCategories && currentMasterCategory)
	{
		mainLabel = siteConfig.master_categories[currentMasterCategory].name;
	}
	else
	{
		mainLabel = "Keywords";
	}
	if (hasCategories && !hasVisualCategories)
	{
		populateTextOnlyCategories(currentMasterCategory);
	}
	if ((hasCategories && siteConfig.categories[currentCategory].keywords.length == 1)
			|| (!hasCategories && siteConfig.keywords.length == 1)) {
		console.log('category only has one keyword, jumping to that keyword');
		gotoNextScreen(siteConfig.categories[currentCategory].keywords[0]);
		return;
	}
	addBackHistory("goBackToKeywordListView();");
	setMainLabel(mainLabel);
  prepareKeywordListViewForDevice(category);
	populateKeywordList(category);
  setCurrentView('keywordListView', false);
}

function showAnswerSpacesListView()
{
	prepareAnswerSpacesListViewForDevice();
	setCurrentView('answerSpacesListView', false);
}

function goBackToHome()
{
	backStack = new Array();
	hashStack = new Array();
	if (hasMasterCategories)
		goBackToMasterCategoriesView();
	else if (hasVisualCategories)
		goBackToCategoriesView();
	else
		goBackToKeywordListView();
	stopTrackingLocation();
	getSiteConfig();
}

function goBackToKeywordListView(event)
{
  console.log('goBackToKeywordListView()');
  if (answerSpaceOneKeyword) {
	 showKeywordView(0);
	 return;
  }
  if (hasMasterCategories && currentMasterCategory == '')
  {
	 goBackToMasterCategoriesView();
	 return
  }
  if (hasVisualCategories && currentCategory == '')
  {
	 goBackToCategoriesView(hasMasterCategories ? currentCategory : '');
	 return;
  }
  prepareKeywordListViewForDevice();
  setSubmitCachedFormButton();
	setMainLabel(hasCategories ? siteConfig.categories[currentCategory].name : 'Keywords');
  setCurrentView('keywordListView', true);
}

function createParamsAndArgs(keywordID)
{
  var returnValue = "answerSpace=" + siteVars.answerSpace + "&keyword=" + encodeURIComponent(siteConfig.keywords[keywordID].name);
  var args = "";
  var argElements = $('#argsBox').find('input, textarea, select');
  argElements.each(function(index, element) {
	if (this.type && (this.type.toLowerCase() == "radio" || this.type.toLowerCase() == "checkbox") && !this.checked)
	 {
		// do nothing for unchecked radio or checkbox
	 }
	 else if (this.name)
	 {
		args += "&" + this.name + "=" + (this.value ? encodeURIComponent(this.value) : "");
	 }
	 else if (this.id && this.id.match(/\d+/g))
	 {
		args += "&args[" + this.id.match(/\d+/g) + "]=" + (this.value ? encodeURIComponent(this.value) : "");
	 }
  });
  if (args.length > 0)
  {
	 returnValue += encodeURI(args);
  }
	else if (argElements.size() == 1 && this.value)
	{
		returnValue += "&args=" + encodeURIComponent(this.value);
	}
  return returnValue;
}

function showHelpView(event)
{
	switch($('.view:visible').attr('id'))
	{
		case 'keywordView':
		case 'answerView':
		case 'answerView2':
			var keyword = siteConfig.keywords[currentKeyword];
		  setMainLabel(keyword.name);
		  var helpContents = keyword.help ? keyword.help : "Sorry, no guidance has been prepared for this item.";
			break;
		default:
			var helpContents = siteConfig.help ? siteConfig.help : "Sorry, no guidance has been prepared for this item.";
	}
	prepareHelpViewForDevice();
	addBackHistory("showHelpView();");
	var helpBox = document.getElementById('helpBox');
	insertHTML(helpBox, helpContents);
  setCurrentView('helpView', false, true); 
}

function showNewLoginView(isActivating)
{
  prepareNewLoginViewForDevice();
	addBackHistory("showNewLoginView();");
  setMainLabel('New Login');
  var loginUrl = siteVars.serverAppPath + '/util/CreateLogin.php';
	var requestData = 'activating=' + isActivating;
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		data: requestData,
		beforeSend: function(xhr) {
			console.log("CreateLogin transaction: " + loginUrl + "?" + requestData);
		},
		complete: function(xhr, textstatus) { // readystate == 4
			var newLoginBox = document.getElementById('newLoginBox');
			if (isAJAXError(textstatus) && xhr.status !== 200)
				insertText(newLoginBox, 'Unable to contact server.');
			else
				insertHTML(newLoginBox, xhr.responseText);
			setCurrentView('newLoginView', false, true); 
		}
  });
}

function showActivateLoginView(event)
{
  prepareActivateLoginViewForDevice();
	addBackHistory("showActivateLoginView();");
  setMainLabel('Activate Login');
  var loginUrl = siteVars.serverAppPath + '/util/ActivateLogin.php'
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		beforeSend: function(xhr) {
			console.log("ActivateLogin transaction: " + loginUrl);
		},
		complete: function(xhr, textstatus) { // readystate == 4
			var activateLoginBox = document.getElementById('activateLoginBox');
			if (isAJAXError(textstatus) && xhr.status !== 200)
				insertText(activateLoginBox, 'Unable to contact server.');
			else
				insertHTML(activateLoginBox, xhr.responseText);
			setCurrentView('activateLoginView', false, true); 
		}
  });
}

function showLoginView(event)
{
  prepareLoginViewForDevice();
	addBackHistory("showLoginView();");
  setMainLabel('Login');
  var loginUrl = siteVars.serverAppPath + '/util/DoLogin.php'
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		beforeSend: function(xhr) {
			console.log("DoLogin transaction: " + loginUrl);
		},
		complete: function(xhr, textstatus) { // readystate == 4
			var loginBox = document.getElementById('loginBox');
			if (isAJAXError(textstatus) || xhr.status !== 200)
				insertText(loginBox, 'Unable to contact server.');
			else
				insertHTML(loginBox, xhr.responseText);
			setCurrentView('loginView', false, true); 
		}
  });
}

function updateLoginBar(){
	var loginStatus = document.getElementById('loginStatus');
	var requestUrl = siteVars.serverAppPath + '/util/GetLogin.php';
	ajaxQueue.add({
		url: requestUrl,
		dataType: 'json',
		beforeSend: function(xhr) {
			console.log('GetLogin transaction: ' + requestUrl);
			startInProgressAnimation();
		},
		complete: function(xhr, xhrStatus) {
			stopInProgressAnimation();
			if (isAJAXError(xhrStatus) || xhr.status !== 200) return;
			var data = JSON.parse(xhr.responseText);
			if (data != null)
			{
				if (data.status == "LOGGED IN")
				{
					if (data.html.length > 0)
					{
						insertHTML(loginStatus, data.html);
						$(loginStatus).removeClass('hidden');
					}
					else
						$('#logoutButton').removeClass('hidden');
					$('#loginButton').addClass('hidden');
				}
				else
				{
					$('#loginStatus, #logoutButton').addClass('hidden');
					$('#loginButton').removeClass('hidden');
				}
				populateKeywordList(currentCategory);
			}
		},
		timeout: computeTimeout(500)
	});
}

function submitLogin()
{
	var loginUrl = siteVars.serverAppPath + '/util/DoLogin.php'
  var requestData = "action=login&mobile_number=" + document.getElementById('mobile_number').value + "&password=" + document.getElementById('password').value;
	console.log("iPhoneLogin transaction: " + loginUrl + "?" + requestData);
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		data: requestData,
		beforeSend: function(xhr) {
			startInProgressAnimation();
		},
		complete: function(xhr, textstatus) { // readystate == 4
			var loginBox = document.getElementById('loginBox');
			stopInProgressAnimation();
			if (isAJAXError(textstatus) || xhr.status !== 200)
				insertText(loginBox, 'Unable to contact server.');
			else
				insertHTML(loginBox, xhr.responseText);
			setCurrentView('loginView', false, true); 
			stopInProgressAnimation();
			getSiteConfig();
			updateLoginBar();
		}
  });
}

function submitLogout()
{
  var loginUrl = siteVars.serverAppPath + '/util/DoLogin.php'
  var requestData = 'action=logout';
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		data: requestData,
		beforeSend: function(xhr) {
			console.log("iPhoneLogin transaction:" + loginUrl + "?" + requestData);
		},
		complete: function(xhr, textstatus) { // readystate == 4
			console.log("iPhoneLogin transaction complete: " + textstatus);
			var loginBox = document.getElementById('loginBox');
			if (isAJAXError(textstatus) || xhr.status !== 200)
				insertText(loginBox, 'Unable to contact server.');
			else
				insertHTML(loginBox, xhr.responseText);
			setCurrentView('loginView', false, true); 
			getSiteConfig();
			updateLoginBar();
		}
  });
}

function goBackToTopLevelAnswerView(event)
{
	prepareAnswerViewForDevice();
  console.log('goBackToTopLevelAnswerView()');
  setCurrentView('answerView', true, true);
}

function submitForm() {
	var form = $('.view:visible').find('form').first();
  var str = form.find('input, textarea, select').serialize();
  console.log("submitForm(2): " + form.attr('action'));
  queuePendingFormData(str, form.attr('action'), form.attr('method').toLowerCase(), Math.uuid());
  submitFormWithRetry();
}

function queuePendingFormData(str, arrayAsString, method, uuid) {
  if (getAnswerSpaceItem("_pendingFormDataString")) {
    setAnswerSpaceItem("_pendingFormDataString", getAnswerSpaceItem("_pendingFormDataString") + ":" + str);
    setAnswerSpaceItem("_pendingFormDataArrayAsString", getAnswerSpaceItem("_pendingFormDataArrayAsString") + ":" + encodeURIComponent(arrayAsString));
    setAnswerSpaceItem("_pendingFormMethod", getAnswerSpaceItem("_pendingFormMethod") + ":" + encodeURIComponent(method));
    setAnswerSpaceItem("_pendingFormUUID", getAnswerSpaceItem("_pendingFormUUID") + ":" + encodeURIComponent(uuid));
  } else {
    setAnswerSpaceItem("_pendingFormDataString", str);
    setAnswerSpaceItem("_pendingFormDataArrayAsString", encodeURIComponent(arrayAsString));
    setAnswerSpaceItem("_pendingFormMethod", encodeURIComponent(method));
    setAnswerSpaceItem("_pendingFormUUID", encodeURIComponent(uuid));
  }
}

function headPendingFormData() {
  if (countPendingFormData() == 0) {
    return ["", ""];
  }
  var q1 = getAnswerSpaceItem("_pendingFormDataString").split(":");
  var q2 = getAnswerSpaceItem("_pendingFormDataArrayAsString").split(":");
  var q3 = getAnswerSpaceItem("_pendingFormMethod").split(":");
  var q4 = getAnswerSpaceItem("_pendingFormUUID").split(":");
  console.log('headPendingFormData():');
  console.log("q1[0] => " + q1[0]);
  console.log("q2[0] => " + q2[0]);
  console.log("q3[0] => " + q3[0]);
  console.log("q4[0] => " + q4[0]);
  return [q1[0], decodeURIComponent(q2[0]), decodeURIComponent(q3[0]), decodeURIComponent(q4[0])];
}

function delHeadPendingFormData() {
  var count;
  if ((count = countPendingFormData()) == 0) {
    console.log("delHeadPendingFormData: count 0, returning");
    return;
  }
  if (count == 1) {
    console.log("*** Emptying Form Queue");
    removeFormRetryData();
    return;
  }
  console.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  console.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
  setAnswerSpaceItem("_pendingFormDataString", 
		     getAnswerSpaceItem("_pendingFormDataString").substring(getAnswerSpaceItem("_pendingFormDataString").indexOf(":") + 1));
  setAnswerSpaceItem("_pendingFormDataArrayAsString", 
		     getAnswerSpaceItem("_pendingFormDataArrayAsString").substring(getAnswerSpaceItem("_pendingFormDataArrayAsString").indexOf(":") + 1));
  console.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  console.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
}

function countPendingFormData() {
  if (getAnswerSpaceItem("_pendingFormDataString")) {
    var q1 = getAnswerSpaceItem("_pendingFormDataString").split(":");
    console.log("countPendingFormData: q1.length = " + q1.length + ";");
    console.log("countPendingFormData: q1[0] = " + q1[0] + ";");
    console.log("countPendingFormData: q1[1] = " + q1[1] + ";");
    return q1.length;
  } else {
    return 0;
  }
}

function processCachedFormData() {
  if (checkFormRetryData()) {
    if (confirm("Submit pending form data \nfrom previous forms?\nNote: Subsequent forms will continue to pend\nuntil you empty the pending list.")) {
      submitFormWithRetry();
    } else {
      if (confirm("Delete pending form data\nfrom previous forms?")) {
		  removeFormRetryData();
      }
    }
  }
}

function setSubmitCachedFormButton() {
  var queueCount = countPendingFormData();
	var button = document.getElementById('pendingButton');
  if (queueCount != 0) {
    console.log("setSubmitCachedFormButton: Cached items");
		insertText(button, queueCount + ' Pending');
		$(button).removeClass('hidden');
  } else {
    console.log("setSubmitCachedFormButton: NO Cached items");
		$(button).addClass('hidden');
  }
  if (typeof(setupParts) == 'function')
  {
		setTimeout(function() {
			setupParts();
		}, 50);
	}
}

function removeFormRetryData() {
    removeAnswerSpaceItem("_pendingFormDataString");  
    removeAnswerSpaceItem("_pendingFormDataArrayAsString");  
    removeAnswerSpaceItem("_pendingFormMethod");  
    removeAnswerSpaceItem("_pendingFormUUID");  
    setSubmitCachedFormButton();
    console.log("removeFormRetryData: Clearing local storage"); 
}

function checkFormRetryData() {
    console.log("_pendingFormDataString: " + getAnswerSpaceItem("_pendingFormDataString"));
    console.log("_pendingFormDataArrayAsString: " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
    return (getAnswerSpaceItem("_pendingFormDataString"));
}

function submitFormWithRetry() {    
  var str;
  var arr;
  var method;
  var uuid;
  var localKeyword;

  if (checkFormRetryData()) {
	 console.log("submitFormWithRetry(1a): ");
	 var qx = headPendingFormData();
	 console.log("qx[0] => " + qx[0]);
	 console.log("qx[1] => " + qx[1]);
	 console.log("qx[2] => " + qx[2]);
	 console.log("qx[3] => " + qx[3]);
	 str = qx[0];
	 arr = qx[1].split("/");
	 method = qx[2];
	 uuid = qx[3];
  } else {
	 console.log("submitFormWithRetry(1b): ");
	 return;
  }

  var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php?';
  if (arr[0] == "..") {
	 answerUrl += "answerSpace=" + siteVars.answerSpace + "&keyword=" + encodeURIComponent(arr[1]) + '&_device=' + deviceVars.device + (arr[2].length > 1 ? "&" + arr[2].substring(1) : "");
	 localKeyword = arr[1];
  } else {
	 answerUrl += "answerSpace=" + arr[1] + "&keyword=" + encodeURIComponent(arr[2]) + '&_device=' + deviceVars.device;
	 localKeyword = arr[2];
  }

	var currentBox = $('.view:visible > .box');
	var requestData;
	if (method == 'get')
	{
		method = 'GET';
		requestData = '&' + str;
	}
	else
	{
		method = 'POST'
		requestData = str;
	}

	ajaxQueue.add({
		type: method,
		cache: 'false',
		url: answerUrl,
		data: requestData,
		beforeSend: function(xhr) {
			console.log("GetAnswer transaction: " + answerUrl + "?" + requestData);
			httpAnswerRequest = xhr;
			startInProgressAnimation();
		},
		complete: function(xhr, textstatus) { // readystate == 4
			var html;
			if (isAJAXError(textstatus) || xhr.status !== 200)
				html = 'Unable to contact server. Your submission has been stored for future attempts.';
			else
			{
				delHeadPendingFormData();
				html = xhr.responseText;
			}
			if (currentBox.attr('id').indexOf('answerBox') !== -1)
			{
				currentBox.hide('slide', { direction: 'left'}, 300, function() {
					insertHTML(currentBox[0], html);
					currentBox.show('slide', { direction: 'right'}, 300);
					window.scrollTo(0, 1);
				});
				setTimeout(function() {
					onScroll();
				}, 350);
			}
			else
			{
				prepareSecondLevelAnswerViewForDevice();
				addBackHistory("");
				insertHTML(answerBox2, html);
				setCurrentView('answerView2', false, true);   
			}
			setSubmitCachedFormButton();
			stopInProgressAnimation();
		},
		timeout: computeTimeout(answerUrl.length + requestData.length)
	});
}

function submitAction(keyword, action) {
	var currentBox = $('.view:visible > .box');
	var form = currentBox.find('form').first();
	var formData = (action == 'cancel=Cancel') ? '' : form.find('input, textarea, select').serialize();
	var method = form.attr('method');

	var requestData, requestUrl;
	if (method == 'get')
	{
		method = 'GET';
		requestUrl = siteVars.serverAppPath + '/util/GetAnswer.php?answerSpace=' + siteVars.answerSpace + "&keyword=" + keyword + '&_device=' + deviceVars.device;
		requestData = '&' + formData + '&' + action;
	}
	else
	{
		method = 'POST'
		requestUrl = siteVars.serverAppPath + '/util/GetAnswer.php?answerSpace=' + siteVars.answerSpace + "&keyword=" + keyword + '&_device=' + deviceVars.device + "&" + action;
		requestData = formData;
	}

	ajaxQueue.add({
		type: method,
		cache: 'false',
		url: requestUrl,
		data: requestData,
		beforeSend: function(xhr) {
			console.log("GetAnswer transaction: " + requestUrl + "?" + requestData);
			httpAnswerRequest = xhr;
			startInProgressAnimation();
		},
		complete: function(xhr, textstatus) { // readystate == 4
			stopInProgressAnimation();
			var html;
			if (isAJAXError(textstatus) || xhr.status !== 200)
				html = 'Unable to contact server.';
			else
				html = xhr.responseText;
			if (currentBox.attr('id').indexOf('answerBox') !== -1)
			{
				currentBox.hide('slide', { direction: 'left'}, 300, function() {
					insertHTML(currentBox[0], html);
					currentBox.show('slide', { direction: 'right'}, 300);
					window.scrollTo(0, 1);
				});
				setTimeout(function() {
					onScroll();
					$('body').trigger('answerDownloaded', [$(currentBox).parent().attr('id')]);
				}, 350);
			}
			else
			{
				prepareSecondLevelAnswerViewForDevice();
				addBackHistory("");
				insertHTML(answerBox2, html);
				setCurrentView('answerView2', false, true);   
				$('body').trigger('answerDownloaded', ['answerView2']);
			}
		},
		timeout: computeTimeout(requestUrl.length + requestData.length)
	});
}

function onAnswerDownloaded(event, view)
{
	setTimeout(function() {
		if ($('#' + view).find('div.googlemap').size() > 0) { // check for items requiring Google features (so far only #map)
			startInProgressAnimation();
			$.getScript('http://www.google.com/jsapi?key=' + siteConfig.googleAPIkey, function(data, textstatus) {
				if ($('div.googlemap').size() > 0) // check for items requiring Google Maps
					google.load('maps', '3', { other_params : 'sensor=true', 'callback' : setupGoogleMaps });
				else
					stopTrackingLocation();
			});
		}
		$('#' + view + ' .blink-starrable').each(function(index, element) {
			var div = document.createElement('div');
			var data = extractDataTags(element);
			populateDataTags(div, data);
			div.addEventListener('click', onStarClick);
			if ($.type(starsProfile[$(element).data('type')]) !== 'object' || $.type(starsProfile[$(element).data('type')][$(element).data('id')]) !== 'object')
				div.setAttribute('class', 'blink-starrable blink-star-off');
			else
				div.setAttribute('class', 'blink-starrable blink-star-on');
			$(element).replaceWith(div);
		});
	}, 350);
}

function onStarClick(event)
{
	var id = $(this).data('id');
	var type = $(this).data('type');
	var data = extractDataTags(this);
	delete data.id;
	delete data.type;
	if ($(this).hasClass('blink-star-on'))
	{
		$(this).addClass('blink-star-off');
		$(this).removeClass('blink-star-on');
		delete starsProfile[type][id];
		if (starsProfile[type] == { })
			delete starsProfile[type];
	}
	else if ($(this).hasClass('blink-star-off'))
	{
		$(this).addClass('blink-star-on');
		$(this).removeClass('blink-star-off');
		if ($.type(starsProfile[type]) !== 'object')
			starsProfile[type] = { };
		starsProfile[type][id] = data;
	}
	setAnswerSpaceItem('starsProfile', starsProfile);
}

function setupGoogleMaps()
{
	$('div.googlemap').each(function(index, element) {
		var googleMap = new google.maps.Map(element);
		var data = extractDataTags(element);
		var mapTarget = $(element);
		if (data.sensor === true && isLocationAvailable())
			startTrackingLocation();
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
				currentMarker.setPosition(new google.maps.LatLng(latitude, longitude));
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
}

function setupGoogleMapsDirections(element, data, map)
{
	console.log('Google Maps Directions: initialising', data);
	var origin, destination, language, region;
	if (typeof(data['origin-address']) === 'string')
		origin = data['origin-address'];
	else if (typeof(data['origin-latitude']) !== 'undefined')
		origin = new google.maps.LatLng(data['origin-latitude'], data['origin-longitude']);
	if (typeof(data['destination-address']) === 'string')
		destination = data['destination-address'];
	else if (typeof(data['destination-latitude']) !== 'undefined')
		destination = new google.maps.LatLng(data['destination-latitude'], data['destination-longitude']);
	if (typeof(data['language']) === 'string')
		language = data['language'];
	if (typeof(data['region']) === 'string')
		region = data['region'];
	if (origin === undefined && destination !== undefined)
	{
		console.log('Google Maps Directions: missing origin', destination);
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
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({
					address: destination,
					region: region,
					language: language
				}, function(result, status) {
				if (status != google.maps.GeocoderStatus.OK)
					insertText($(element).next('.googledirections')[0], 'Missing origin and unable to locate the destination.');
				else
					data.zoom = 15;
					data.latitude = result[0].geometry.location.b;
					data.longitude = result[0].geometry.location.c;
					setupGoogleMapsBasic(element, data, map);
			});
			return;
		}
	}
	if (origin !== undefined && destination === undefined)
	{
		console.log('Google Maps Directions: missing destination', origin);
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
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({ 
					address: origin,
					region: region,
					language: language
				}, function(result, status) {
				if (status != google.maps.GeocoderStatus.OK)
					insertText($(element).next('.googledirections')[0], 'Missing destination and unable to locate the origin.');
				else
					data.zoom = 15;
					data.latitude = result[0].geometry.location.b;
					data.longitude = result[0].geometry.location.c;
					setupGoogleMapsBasic(element, data, map);
			});
			return;
		}
	}
	console.log('Google Maps Directions: both origin and destination provided', origin, destination);
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
		if (status == google.maps.DirectionsStatus.OK)
			directionsDisplay.setDirections(result);
		else
			insertText($(element).next('.googledirections')[0], 'Unable to provide directions: ' + status);
	});
	stopInProgressAnimation();
}

function setupGoogleMapsBasic(element, data, map)
{
	console.log('Google Maps Basic: initialising', data);
	var location = new google.maps.LatLng(data.latitude, data.longitude);
	var options = {
		zoom: parseInt(data.zoom),
		center: location,
		mapTypeId: google.maps.MapTypeId[data.type.toUpperCase()]
	};
	map.setOptions(options);
	google.maps.event.addListener(map, 'tilesloaded', stopInProgressAnimation);
	google.maps.event.addListener(map, 'zoom_changed', startInProgressAnimation);
	google.maps.event.addListener(map, 'maptypeid_changed', startInProgressAnimation);
	google.maps.event.addListener(map, 'projection_changed', startInProgressAnimation);
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
}

function isLocationAvailable()
{
	if (typeof(navigator.geolocation) != 'undefined')
		return true;
	else if (typeof(google) != 'undefined' && typeof(google.gears) != 'undefined')
		return google.gears.factory.getPermission(siteVars.answerSpace, 'See your location marked on maps.');
	return false;
}

function startTrackingLocation()
{
	if (locationTracker == null)
	{
		if (typeof(navigator.geolocation) != 'undefined')
		{
			navigator.geolocation.watchPosition(function(position) {
				if (latitude != position.coords.latitude || longitude != position.coords.longitude)
				{
					latitude = position.coords.latitude;
					longitude = position.coords.longitude;
					console.log('Location Event: Updated', latitude, longitude);
					$('body').trigger('locationUpdated');
				}
			}, null, { enableHighAccuracy : true, maximumAge : 600000 });
		}
		else if (typeof(google) != 'undefined' && typeof(google.gears) != 'undefined')
		{
			google.gears.factory.create('beta.geolocation').watchPosition(function(position) {
				if (latitude != position.latitude || longitude != position.longitude)
				{
					latitude = position.latitude;
					longitude = position.longitude;
					console.log('Location Event: Updated', latitude, longitude);
					$('body').trigger('locationUpdated');
				}
			}, null, { enableHighAccuracy : true, maximumAge : 600000 });
		}
	}
}

function stopTrackingLocation()
{
	if (locationTracker != null)
	{
		if (typeof(navigator.geolocation) != 'undefined')
		{
			navigator.geolocation.clearWatch(locationTracker);
		}
		else if (typeof(google) != 'undefined' && typeof(google.gears) != 'undefined')
		{
			google.gears.factory.create('beta.geolocation').clearWatch(locationTracker);
		}
		locationTracker = null;
	}
}

function processBlinkAnswerMessage(message)
{
	message = JSON.parse(message);
	console.log(message);
	if (typeof(message.loginStatus) == 'string' && typeof(message.loginKeyword) == 'string' && typeof(message.logoutKeyword) == 'string') {
		console.log('blinkAnswerMessage: loginStatus detected');
		if (message.loginStatus == "LOGGED IN") {
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

// take 2 plain strings, process them into XML, then transform the first using the second (XSL)
function generateMojoAnswer(xmlString, xslString, target)
{
	console.log('generateMojoAnswer(): target=' + target + ' caller=' + generateMojoAnswer.caller.name);
	if (typeof(xmlString) != 'string' || typeof(xslString) != 'string') return false;
	if (xslString.indexOf('blink-stars(') !== -1) // check for star list
	{
		var type = xslString.match(/blink-stars\((.+),\W*(\w+)\W*\)/);
		var variable = type[1];
		type = type[2];
		var condition = '';
		if ($.type(starsProfile[type]) === 'object')
		{
			for (star in starsProfile[type])
			{
				condition += ' or ' + variable + '=\'' + star + '\'';
			}
			condition = condition.substr(4);
			if (condition.length > 0)
				xslString = xslString.replace(/\(?blink-stars\((.+),\W*(\w+)\W*\)\)?/, '(' + condition + ')');
		}
		console.log('generateMojoAnswer(): condition=' + condition);
	}
	if (deviceVars.hasWebWorkers === true)
	{
		console.log('generateMojoAnswer: enlisting Web Worker to perform XSLT');
		var message = { };
		message.fn = 'processXSLT';
		message.xml = xmlString;
		message.xsl = xslString;
		message.target = target;
		MyAnswers.webworker.postMessage(message);
		return '<p>This keyword is being constructed entirely on your device.</p><p>Please wait...</p>';
	}
	if (window.ActiveXObject != undefined)
	{
		console.log('generateMojoAnswer: using Internet Explorer method');
		var xml = XML.newDocument().loadXML(xmlString);
		var xsl = XML.newDocument().loadXML(xslString);
		var html = xml.transformNode(xsl);
		return html;
	}
	var xml = parseXMLElements(xmlString);
	var xsl = parseXMLElements(xslString);
	if (window.XSLTProcessor != undefined)
	{
		console.log('generateMojoAnswer: performing XSLT via XSLTProcessor()');
		var xsltProcessor = new XSLTProcessor();
		xsltProcessor.importStylesheet(xsl);
		var html = xsltProcessor.transformToFragment(xml, document);
		return html;
	}
	if (xsltProcess != undefined)
	{
		console.log('generateMojoAnswer: performing XSLT via AJAXSLT library');
		var html = xsltProcess(xml, xsl);
		return html;
	}
	return '<p>Your browser does not support MoJO keywords.</p>';
}

// convert 'argument=value&args[0]=value1&args[1]=value2' into '{"argument":"value","args[0]":"value1","args[1]":"value2"}'
function deserialize(argsString)
{
	var arguments = argsString.split('&');
	var result = { };
	for (a in arguments)
	{
		terms = arguments[a].split('=');
		if (terms[0].length > 0)
			result[decodeURIComponent(terms[0])] = decodeURIComponent(terms[1]);
	}
	return result;
}

function emptyDOMelement(element)
{
	if ($.type(element) === 'object')
		while (element.hasChildNodes()) 
			element.removeChild(element.lastChild);
}

function setMainLabel(label)
{
	var mainLabel = document.getElementById('mainLabel');
	insertText(mainLabel, label);
}

function insertHTML(element, html)
{
	if ($.type(element) === 'object')
	{
		emptyDOMelement(element);
		$(element).append(html);
	}
}

function insertText(element, text)
{
	if ($.type(element) === 'object')
	{
		emptyDOMelement(element);
		element.appendChild(document.createTextNode(text));
	}
}

function getURLParameters()
{
	var queryString = location.href.split('?')[1].split('#')[0];
//	var queryString = location.href.match(/\?(.*)\#?/);
	if (typeof(queryString) === 'string')
	{
		var parameters = deserialize(queryString);
		if (typeof(parameters.keyword) == 'string')
			parameters.keyword = parameters.keyword.replace('/', '');
		return parameters;
	}
	else
		return [];
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

function extractDataTags(element)
{
	var attributes = element.attributes;
	var data = { };
	for (a in attributes)
	{
		var tag = attributes.item(a).name;
		var value = attributes.item(a).value;
		if (value === '')
			value = null;
		else if (value === 'true')
			value = true;
		else if (value === 'false')
			value = false;
		var tagParts = tag.split('-');
		if (tagParts[0] === 'data')
			data[tag.replace('data-', '')] = value;
	}
	return data;
}

function populateDataTags(element, data)
{
	if ($.type(element) !== 'object') return null;
	for (d in data)
	{
		element.setAttribute('data-' + d, data[d]);
	}
}

function stopInProgressAnimation()
{
	clearTimeout(MyAnswers.activityIndicatorTimer);
	$(MyAnswers.activityIndicator).addClass('hidden');
}

function startInProgressAnimation()
{
	if ($('#startUp').size() > 0) return;
	if (MyAnswers.activityIndicatorTimer !== null)
		clearTimeout(MyAnswers.activityIndicatorTimer);
	MyAnswers.activityIndicatorTimer = setTimeout(function() {
		clearTimeout(MyAnswers.activityIndicatorTimer);
		$(MyAnswers.activityIndicator).removeClass('hidden');
	}, 1000);
}

function parseXMLElements(xmlString)
{
	var xml;
	if (typeof(window.DOMParser) === 'function' || typeof(window.DOMParser) === 'object')
	{
		var domParser = new DOMParser();
		xml = domParser.parseFromString(xmlString, 'application/xml');
		console.log('string parsed to XML using W3C DOMParser()', xml);
	}
	else if (typeof(xmlParse) === 'function')
	{
		xml = xmlParse(xmlString);
		console.log('string parsed to XML using AJAXSLT library', xml);
	}
	else
	{
		var url = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlString);
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, false);
		xhr.send(null);
		xml = xhr.responseXML;
		console.log('string parsed to XML using fake AJAX query', xml);
	}
	return xml;
}

function runListWithDelay(taskList, delay, callback) {
	var ttt = taskList.concat();
	if (typeof(callback) !== 'function')
		throw("runListWithDelay: callback not a function");
	setTimeout(function() {
		var tt = ttt.shift();
		var result;
		try {
			result = tt.apply(null, null);
		} catch(e) {
			MyAnswers.log("runListWithDelay: Exception");
			MyAnswers.log(e);
			MyAnswers.log(tt);
		}
		//MyAnswers.log("runListWithDelay: " + result + "[" + delay +"]");
		if (ttt.length > 0 && result) {
			setTimeout(arguments.callee, delay);
		} else {
			callback();
		}
	}, delay);
}

MyAnswers.main_Loaded = true;
