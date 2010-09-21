var httpAnswerRequest = false;
var row1, row2;

var hasCategories = false, hasMasterCategories = false, hasVisualCategories = false, answerSpaceOneKeyword = false;

var currentKeyword, currentCategory, currentMasterCategory;

var siteConfig, siteConfigHash;
var answerSpacesList, answerSpacesHash;
var answerSpace;
var backStack;

var webappCache = window.applicationCache;

var lowestTransferRateConst = 1000 / (4800 / 8);
var maxTransactionTimeout = 180 * 1000;
var ajaxQueue = $.manageAjax.create('globalAjaxQueue', { queue: true });
var ajaxQueueMoJO = $.manageAjax.create('mojoAjaxQueue', { queue: true });

function computeTimeout(messageLength) {
  var t = (messageLength * lowestTransferRateConst) + 5000;
  return ((t < maxTransactionTimeout) ? t : maxTransactionTimeout);
}

function updateOrientation()
{
	MyAnswers.log("orientationChanged: " + Orientation.currentOrientation);
	setupForms($('.view:visible'));
}
document.addEventListener('orientationChanged', updateOrientation, false);

// jStore doesn't do this for us, so this function will empty client-side storage
function clearStorage()
{
	var storageType = jStore.activeEngine().flavor;
	Myanswers.log('clearStorage: ' + storageType);
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
			Myanswers.log('unidentified jStore engine');
	}
}

if (typeof(webappCache) != "undefined")
{
  webappCache.addEventListener("updateready", updateCache, false);
  webappCache.addEventListener("error", errorCache, false);
}

function setAnswerSpaceItem(key, value)
{
	if (storageReady)
	  jStore.set(key, value);
}

function getAnswerSpaceItem(key)
{
	return storageReady ? jStore.get(key) : null;
}

function removeAnswerSpaceItem(key)
{
	if (storageReady)
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
	Myanswers.log('populateKeywordList(): category=' +  category + '; hasCategories=' + hasCategories);
	var keywordList = $('#keywordList');
  keywordList.empty();
	var keywordBox = $('#keywordBox');
  keywordBox.empty();
	var width;
	switch (siteConfig.keywords_config)
	{
		case "1col":
			columns = 1;
			width = "100%";
			break;
		case "2col":
			columns = 2;
			width = "50%";
			break;
		case "3col":
			columns = 3;
			width = "33%";
			break;
		case "4col":
			columns = 4;
			width = "25%";
			break;
	}
	var order = hasCategories ? siteConfig.categories[category].keywords : siteConfig.keywords_order;
	var list = siteConfig.keywords;
	var htmlBox = "";
	var htmlList = "";
	for (id in order)
  {
		if (list[order[id]].status != 'active')
			continue;
		if (siteConfig.keywords_config != 'no' && (!hasCategories || siteConfig.categories[category].textKeywords != 'Y') && list[order[id]].image)
		{
			htmlBox += "<a onclick=\"gotoNextScreen('" + order[id] + "')\">";
			htmlBox += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" />";
			htmlBox += "</a>";
		}
		else
		{
			htmlList += "<li onclick=\"gotoNextScreen('" + order[id] + "')\">";
			htmlList += "<div class='label'>" + list[order[id]].name + "</div>";
			htmlList += "<div class='nextArrow'></div>";
			htmlList += "<div class='description'>" + list[order[id]].description + "</div>";
			htmlList += "</li>";
		}
  }
	keywordBox.append(htmlBox);
	keywordList.append(htmlList);
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
	Myanswers.log('populateAnswerSpacesList()');
	var welcome = $('#answerSpacesListView').find('.welcomeBox');
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
		if (answerSpace)
		{
			welcome.html('Please check the address you have entered, or choose from a range of answerSpaces below.');
		}
		else
		{
			welcome.html('Please choose from a range of answerSpaces below.');
		}
	}
	else
	{
		welcome.html('Please check the address you have entered.');
	}
}

// produce XHTML for the master categories view
function populateMasterCategories()
{
	var masterCategoriesBox = $('#masterCategoriesBox');
	masterCategoriesBox.empty();
	var order = siteConfig.master_categories_order;
	var list = siteConfig.master_categories;
	for (id in order)
	{
		var categoryHTML = "";
		categoryHTML += "<a onclick=\"showCategoriesView('" + order[id] + "')\">";
		categoryHTML += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" />";
		categoryHTML += "</a>";
		masterCategoriesBox.append(categoryHTML);
	}
	if (siteConfig.master_categories_config != 'auto')
	{
		var width;
		switch (siteConfig.master_categories_config)
		{
			case "1col":
				columns = 1;
				width = "100%";
				break;
			case "2col":
				columns = 2;
				width = "50%";
				break;
			case "3col":
				columns = 3;
				width = "33%";
				break;
			case "4col":
				columns = 4;
				width = "25%";
				break;
		}
		var images = masterCategoriesBox.find('img');
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
	var categoriesBox = $('#categoriesBox');
	categoriesBox.empty();
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	for (id in order)
	{
		var html = "";
		html += "<a onclick=\"showKeywordListView('" + order[id] + "')\">";
		html += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" />";
		html += "</a>";
		categoriesBox.append(html);
	}
	if (siteConfig.categories_config != 'auto')
	{
		var width, columns;
		switch (siteConfig.categories_config)
		{
			case "1col":
				columns = 1;
				width = "100%";
				break;
			case "2col":
				columns = 2;
				width = "50%";
				break;
			case "3col":
				columns = 3;
				width = "33%";
				break;
			case "4col":
				columns = 4;
				width = "25%";
				break;
		}
		var images = categoriesBox.find('img');
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
  Myanswers.log("updateCache: " + webappCache.status);
  if (webappCache.status != window.applicationCache.IDLE) {
    webappCache.swapCache();
    Myanswers.log("Cache has been updated due to a change found in the manifest");
  } else {
    webappCache.update();
    Myanswers.log("Cache update requested");
  }
}
function errorCache()
{
  Myanswers.log("errorCache: " + webappCache.status);
  Myanswers.log("You're either offline or something has gone horribly wrong.");
}
 
// Function: loaded()
// Called by Window's load event when the web application is ready to start
//
function loaded(row1String, row2String)
{
	Myanswers.log('loaded(): isBrowserOnline? ' + isBrowserOnline());
  var timer = null;
  var requestActive = false;
  row1 = (row1String === '') ? 'white' : row1String;
  row2 = (row2String === '') ? 'white' : row2String;

  if (typeof(webappCache) != 'undefined')
  {
	 switch(webappCache.status)
	 {
		case 0:
		  Myanswers.log("Cache status: Uncached");
		  break;
		case 1:
		  Myanswers.log("Cache status: Idle");
		  break;
		case 2:
		  Myanswers.log("Cache status: Checking");
		  break;
		case 3:
		  Myanswers.log("Cache status: Downloading");
		  break;
		case 4:
		  Myanswers.log("Cache status: Updateready");
		  break;
		case 5:
		  Myanswers.log("Cache status: Obsolete");
		  break;
	 }
  }
		
/*	if (answerSpace)
	{ */
		backStack = new Array();
		if (storageReady)
		{
			if (getAnswerSpaceItem('answerSpace') == 'undefined' || getAnswerSpaceItem('answerSpace') != answerSpace)
				clearStorage();
			setAnswerSpaceItem('answerSpace', answerSpace);
			var message = getAnswerSpaceItem('siteConfigMessage');
			if (typeof(message) != 'undefined' && message != 'undefined')
			{
				siteConfig = message.siteConfig;
				siteConfigHash = message.siteHash;
			}					
		}
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
	Myanswers.log("GetAnswerSpaces transaction: " + answerSpacesUrl + "?" + requestData);
	$.getJSON(answerSpacesUrl, requestData,
		function(data, textstatus) { // readystate == 4
			Myanswers.log("GetAnswerSpaces transaction complete: " + textstatus);
			Myanswers.log(data);
			stopInProgressAnimation();
			if (textstatus != 'success') return;
			if (data.errorMessage)
			{
				Myanswers.log("GetAnswerSpaces error: " + data.errorMessage);
			}
			else
			{
				Myanswers.log("GetAnswerSpaces status: " + data.statusMessage);
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
	if (!isBrowserOnline() && typeof(siteConfig) != 'undefined')
	{
		processSiteConfig();
	}
	else if (isBrowserOnline())
	{
		var requestUrl = siteVars.serverDevicePath + '/util/GetSiteConfig.php';
		var requestData = "answerSpace=" + answerSpace + (typeof(siteConfigHash) == 'string' ? "&sha1=" + siteConfigHash : "");
		ajaxQueue.add({
			url: requestUrl,
			data: requestData,
			dataType: 'json',
			beforeSend: function(xhr) {
				Myanswers.log("GetSiteConfig transaction: " + requestUrl + "?" + requestData);
				startInProgressAnimation();
			},
			error: function(xhr, xhrStatus, error) {
				Myanswers.log('GetSiteConfig complete: ' + xhrStatus + ' ' + error);
				//if (xhrStatus == 'timeout') {}
				if (typeof(siteConfig) != 'undefined')
					processSiteConfig();
			},
			success: function(data, xhrStatus, xhr) {
				Myanswers.log('GetSiteConfig complete: ' + xhrStatus);
				if (data == null || data.errorMessage)
				{
					Myanswers.log("GetSiteConfig error: " + (data ? data.errorMessage : 'null'));
					if (typeof(siteConfig) != 'undefined')
						processSiteConfig();
					else
						window.location = "/demos";
				}
				else
				{
					Myanswers.log("GetSiteConfig status: " + data.statusMessage);
					if (data.statusMessage != "NO UPDATES")
					{
						setAnswerSpaceItem('siteConfigMessage', data);
						siteConfig = data.siteConfig;
						siteConfigHash = data.siteHash;
						//Myanswers.log(data);
					}
					/* else
						Myanswers.log(siteConfig); */
					processSiteConfig();
				}
			},
			complete: function(xhr, xhrStatus) {
				stopInProgressAnimation();
				processMoJOs();
			},
			timeout: computeTimeout(50 * 1024)
		});
	}
	else
	{
		// TODO handle case where not online and no stored siteConfig
	}
}

function processSiteConfig()
{
	hasMasterCategories = siteConfig.master_categories_config != 'no';
	hasVisualCategories = siteConfig.categories_config != 'yes' && siteConfig.categories_config != 'no';
	hasCategories = siteConfig.categories_config != 'no';
	answerSpaceOneKeyword = siteConfig.keywords.length == 1;
	var startUp = $('#startUp');
	if (startUp.size() > 0)
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
		startUp.remove();
		$('#content').removeClass('hidden');
	}
}

function processMoJOs(keyword)
{
	if (deviceVars.disableXSLT === true) return;
	var requestURL = siteVars.serverAppPath + '/util/GetMoJO.php';
	for (m in siteConfig.mojoKeys)
	{
		if (typeof(keyword) == 'string' && keyword != m) continue;
		var message = getAnswerSpaceItem('mojoMessage-' + siteConfig.mojoKeys[m]);
		var mojoHash;
		if (typeof(message) != 'undefined' && message != null)
		{
			mojoHash = message.mojoHash;
		}
		var requestData = 'answerSpace=' + answerSpace + '&key=' + siteConfig.mojoKeys[m] + (typeof(mojoHash) == 'string' ? "&sha1=" + mojoHash : "");
		ajaxQueueMoJO.add({
			url: requestURL,
			data: requestData,
			dataType: 'json',
			beforeSend: function(xhr) {
				Myanswers.log('GetMoJO transaction: ' + requestURL + '?' + requestData);
			},
			error: function(xhr, xhrStatus, error) {
				//if (xhrStatus == 'timeout') {}
			},
			success: function(data, xhrStatus, xhr) {
				if (data == null || data.errorMessage)
				{
					Myanswers.log('GetMoJO error: ' + (data ? data.errorMessage : 'null'));
				}
				else 
				{
					if (data.statusMessage != 'NO UPDATES')
					{
						if (storageReady)
							setAnswerSpaceItem('mojoMessage-' + siteConfig.mojoKeys[m], data);
					}
				}
			},
			complete: function(xhr, xhrStatus) {
				Myanswers.log('GetMoJO transaction complete: ' + xhrStatus);
			},
			timeout: computeTimeout(500 * 1024)
		});
	}
}

function showMasterCategoriesView()
{
  Myanswers.log('showMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
  prepareMasterCategoriesViewForDevice();
  $("#mainLabel").html('Master Categories');
  setCurrentView('masterCategoriesView', false);
}

function goBackToMasterCategoriesView()
{
  Myanswers.log('goBackToMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
  prepareMasterCategoriesViewForDevice();
  $("#mainLabel").html('Master Categories');
  setCurrentView('masterCategoriesView', true);
}

function showCategoriesView(masterCategory)
{
	Myanswers.log('showCategoriesView(): ' + masterCategory);
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
		$("#mainLabel").html(hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
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
  Myanswers.log('goBackToCategoriesView()');
	addBackHistory("goBackToCategoriesView();");
  prepareCategoriesViewForDevice();
  $("#mainLabel").html(hasMasterCategories ? siteConfig.master_categories[currentMasterCategory].name : 'Categories');
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
			$('#answerBox').html(html);
		}
		else
		{
			$('#answerBox').html('<p>The data for this keyword is currently being downloaded to your handset for fast and efficient viewing. This will only occur again if the data is updated remotely.</p><p>Please try again in 30 seconds.</p>');
		}
		setCurrentView("answerView", false, true);
		setupAnswerFeatures();
		$('#mainLabel').html(keyword.name);
		stopInProgressAnimation();
	}
	else if (!isBrowserOnline())
	{
		console('browser offline: using stored data for GetAnswer.php');
		answerItem = getAnswerSpaceItem("answer___" + keywordID);
		$('#answerBox').html(answerItem == undefined ? "<p>No result available while offline.</p>" : answerItem);
		setCurrentView("answerView", false, true);
		setupForms($('#answerView'));
		setupAnswerFeatures();
	}
	else
	{
		var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php';
		var requestData = createParamsAndArgs(keywordID) + (device ? '&_device=' + device : '');
		ajaxQueue.add({
		 type: 'GET',
		 url: answerUrl,
		 data: requestData,
		 beforeSend: function(xmlhttprequest) {
			Myanswers.log("GetAnswer transaction: " + answerUrl + "?" + requestData);
			httpAnswerRequest = xmlhttprequest;
			startInProgressAnimation();
			setSubmitCachedFormButton();
		 },
		 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
			Myanswers.log("GetAnswer failed with error type: " + textstatus);
		 },
		 complete: function(xmlhttprequest, textstatus) { // readystate == 4
			Myanswers.log("GetAnswer transaction complete: " + textstatus);
			var html;
			if (xmlhttprequest.responseText == null)
			{
				Myanswers.log('GetAnswer: no response, using local copy');
				html = getAnswerSpaceItem("answer___" + keywordID);
				html = html == undefined ? "<p>No result available.</p>" : html;
			}
			else
			{
				Myanswers.log('GetAnswer: storing server response');
				html = xmlhttprequest.responseText;
				blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:(.*) -->/);
				if (blinkAnswerMessage != null)
					processBlinkAnswerMessage(blinkAnswerMessage[1]);
				setAnswerSpaceItem("answer___" + keywordID, html);
			}
			$('#answerBox').html(html);
			setSubmitCachedFormButton();
			setCurrentView("answerView", false, true);
			setupForms($('#answerView'));
			setupAnswerFeatures();
			$('#mainLabel').html(keyword.name);
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
	}, 0);
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
  Myanswers.log("gotoNextScreen(" + keywordID + ")");
	if (!siteConfig.keywords[keywordID]) { // in case parameter is name not code
		for (k in siteConfig.keywords)
		{
			if (keywordID == siteConfig.keywords[k].name)
			{
				keywordID = k;
				break;
			}
		}
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
		if (keyword == siteConfig.keywords[k].name)
		{
			var keywordID = k;
			break;
		}
	}
	processMoJOs(keywordID);
	var keywordConfig = siteConfig.keywords[keywordID];
	if (keywordConfig.type == 'xslt' && deviceVars.disableXSLT !== true)
	{
		Myanswers.log('showSecondLevelAnswerView: detected XSLT keyword');
		startInProgressAnimation();
		var xml = getAnswerSpaceItem('mojoMessage-' + keywordConfig.mojo).mojo
		var xslt = keywordConfig.xslt;
		var args = deserialize(arg0);
		for (a in args)
		{
			var regex = new RegExp(RegExp.quote('$' + a), 'g');
			xslt = xslt.replace(regex, args[a]);
		}
		var html = generateMojoAnswer(xml, xslt);
		//document.getElementById('answerBox2').innerHTML = html;
		$('#answerBox2').html(html);
		setCurrentView("answerView2", false, true);
		setupAnswerFeatures();
		//document.getElementById('mainLabel').innerHTML = keywordConfig.name;
		$('#mainLabel').html(keywordConfig.name);
		stopInProgressAnimation();
	}
	else
	{
		var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php'
		var requestData = 'answerSpace=' + answerSpace + "&keyword=" + encodeURIComponent(keyword) + (device ? '&_device=' + device : '') + '&' + arg0;
		ajaxQueue.add({
		 type: 'GET',
		 url: answerUrl,
		 data: requestData,
		 beforeSend: function(xmlhttprequest) {
			Myanswers.log("GetAnswer2 transaction:" + answerUrl + "?" + requestData);
			httpAnswerRequest = xmlhttprequest;
			setSubmitCachedFormButton();
			$('#answerBox2').html("Waiting...");
			startInProgressAnimation();
		 },
		 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
			Myanswers.log("GetAnswer2 failed with error type: " + textstatus);
		 },
		 complete: function(xmlhttprequest, textstatus) { // readystate == 4
			Myanswers.log("GetAnswer2 transaction complete: " + textstatus);
			if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
			{
				var html =  httpAnswerRequest.responseText;
				$('#answerBox2').html(html);
				blinkAnswerMessage = html.match(/<!-- blinkAnswerMessage:(.*) -->/);
				if (blinkAnswerMessage != null)
					processBlinkAnswerMessage(blinkAnswerMessage[1]);
			}
			stopInProgressAnimation();
			setCurrentView('answerView2', false, true);   
			setupAnswerFeatures();
			setupForms($("#answerView2"));
		 }
		});
	}
}

function showKeywordView(keywordID) 
{
	addBackHistory("goBackToKeywordView(\"" + keywordID + "\");");
	var keyword = siteConfig.keywords[keywordID];
	$('#mainLabel').html(keyword.name);
  currentKeyword = keywordID;
  prepareKeywordViewForDevice(answerSpaceOneKeyword, keyword.help.length > 0);
  setSubmitCachedFormButton();
  $('#argsBox').html(keyword.input_config);
	var descriptionBox = $('#descriptionBox');
  if (keyword.description) {
	 descriptionBox.html(keyword.description);
	 descriptionBox.removeClass('hidden');
  } else {
	 descriptionBox.addClass('hidden');
  }
  setCurrentView('keywordView', false, true);
}

function goBackToKeywordView(keywordID)
{
	var keyword = siteConfig.keywords[keywordID];
	$('#mainLabel').html(keyword.name);
  currentKeyword = keywordID;
  prepareKeywordViewForDevice(answerSpaceOneKeyword, keyword.help.length > 0);
  setSubmitCachedFormButton();
  setCurrentView('keywordView', true, true);
}

function showKeywordListView(category)
{
	Myanswers.log('showKeywordListView(): ' + category);
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
		Myanswers.log('category only has one keyword, jumping to that keyword');
		gotoNextScreen(siteConfig.categories[currentCategory].keywords[0]);
		return;
	}
	addBackHistory("goBackToKeywordListView();");
	$('#mainLabel').html(mainLabel);
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
  Myanswers.log('goBackToKeywordListView()');
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
	$('#mainLabel').html(hasCategories ? siteConfig.categories[currentCategory].name : 'Keywords');
  setCurrentView('keywordListView', true);
}

function createParamsAndArgs(keywordID)
{
  var returnValue = "answerSpace=" + answerSpace + "&keyword=" + encodeURIComponent(siteConfig.keywords[keywordID].name);
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
  prepareHelpViewForDevice();
	addBackHistory("showHelpView();");
	var keyword = siteConfig.keywords[currentKeyword];
  $('#mainHeading').html(keyword.name); //**** Here ****
  var helpContents = keyword.help ? keyword.help : "Sorry, no help is available.";
  $('#helpBox').html(helpContents);
	$('#helpTitle').html(keyword.name);
  setCurrentView('helpView', false, true); 
}

function showNewLoginView(isActivating)
{
  prepareNewLoginViewForDevice();
	addBackHistory("showNewLoginView();");
  $('#mainHeading').html("Login");
  var loginUrl = siteVars.serverAppPath + '/util/CreateLogin.php';
	var requestData = 'activating=' + isActivating;
	Myanswers.log("CreateLogin transaction: " + loginUrl + "?" + requestData);
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		data: requestData,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
			$('#newLoginBox').html(data);
			setCurrentView('newLoginView', false, true); 
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
			alert("Error preparing login:" + xmlhttprequest.responseText);
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
			Myanswers.log("CreateLogin transaction complete: " + textstatus);
		}
  });
}

function showActivateLoginView(event)
{
  prepareActivateLoginViewForDevice();
	addBackHistory("showActivateLoginView();");
  $('#mainHeading').html("Login");
  var loginUrl = siteVars.serverAppPath + '/util/ActivateLogin.php'
	Myanswers.log("ActivateLogin transaction: " + loginUrl);
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
			$('#activateLoginBox').html(data);
			setCurrentView('activateLoginView', false, true); 
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
			alert("Error preparing login:" + xmlhttprequest.responseText);
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
			Myanswers.log("ActivateLogin transaction complete: " + textstatus);
		}
  });
}

function showLoginView(event)
{
  prepareLoginViewForDevice();
	addBackHistory("showLoginView();");
  $('#mainHeading').html("Login");
  var loginUrl = siteVars.serverAppPath + '/util/DoLogin.php'
	Myanswers.log("DoLogin transaction: " + loginUrl);
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
			$('#loginBox').html(data);
			setCurrentView('loginView', false, true); 
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
			alert("Error preparing login:" + xmlhttprequest.responseText);
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
			Myanswers.log("DoLogin transaction complete: " + textstatus);
		}
  });
}

function updateLoginBar(){
	if (!isBrowserOnline())
	{
		$('#loginStatus').html('Offline<br />Mode').removeClass('hidden');
		$('#loginButton').addClass('hidden');
	}
	else
	{
		var requestUrl = siteVars.serverAppPath + '/util/GetLogin.php';
		ajaxQueue.add({
			url: requestUrl,
			dataType: 'json',
			beforeSend: function(xhr) {
				Myanswers.log('GetLogin transaction: ' + requestUrl);
				startInProgressAnimation();
			},
			error: function(xhr, xhrStatus, error) {
				//if (xhrStatus == 'timeout') {}
				Myanswers.log('GetLogin transaction complete: ' + xhrStatus + ' ' + error);
			},
			success: function(data, xhrStatus, xhr) {
				Myanswers.log('GetLogin transaction complete: ' + xhrStatus);
				if (data != null)
				{
					if (data.status == "LOGGED IN")
					{
						if (data.html.length > 0)
							$('#loginStatus').html(data.html).removeClass('hidden');
						else
							$('#logoutButton').removeClass('hidden');
						$('#loginButton').addClass('hidden');
					}
					else
					{
						$('#loginStatus, #logoutButton').addClass('hidden');
						$('#loginButton').removeClass('hidden');
					}
				}
			},
			complete: function(xhr, xhrStatus) {
				stopInProgressAnimation();
			},
			timeout: computeTimeout(500)
		});
	}
}

function submitLogin()
{
	startInProgressAnimation();
  var loginUrl = siteVars.serverAppPath + '/util/DoLogin.php'
  var requestData = "action=login&mobile_number=" + document.getElementById('mobile_number').value + "&password=" + document.getElementById('password').value;
	Myanswers.log("iPhoneLogin transaction: " + loginUrl + "?" + requestData);
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		data: requestData,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
			$('#loginBox').html(data);
			setCurrentView('loginView', false, true); 
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
			alert("Error preparing login:" + xmlhttprequest.responseText);
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
			Myanswers.log("iPhoneLogin transaction complete: " + textstatus);
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
	Myanswers.log("iPhoneLogin transaction:" + loginUrl + "?" + requestData);
  ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: loginUrl,
		data: requestData,
		beforeSend: function(xmlhttprequest) {
		},
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
			$('#loginBox').html(data);
			setCurrentView('loginView', false, true); 
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
			alert("Error preparing login:" + xmlhttprequest.responseText);
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
			Myanswers.log("iPhoneLogin transaction complete: " + textstatus);
			getSiteConfig();
			updateLoginBar();
		}
  });
}

function goBackToTopLevelAnswerView(event)
{
	prepareAnswerViewForDevice();
  Myanswers.log('goBackToTopLevelAnswerView()');
  setCurrentView('answerView', true, true);
}

function submitForm() {
	var form = $('.view:visible').find('form').first();
  var str = form.find('input, textarea, select').serialize();
  Myanswers.log("submitForm(2): " + form.attr('action'));
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
  Myanswers.log('headPendingFormData():');
  Myanswers.log("q1[0] => " + q1[0]);
  Myanswers.log("q2[0] => " + q2[0]);
  Myanswers.log("q3[0] => " + q3[0]);
  Myanswers.log("q4[0] => " + q4[0]);
  return [q1[0], decodeURIComponent(q2[0]), decodeURIComponent(q3[0]), decodeURIComponent(q4[0])];
}

function delHeadPendingFormData() {
  var count;
  if ((count = countPendingFormData()) == 0) {
    Myanswers.log("delHeadPendingFormData: count 0, returning");
    return;
  }
  if (count == 1) {
    Myanswers.log("*** Emptying Form Queue");
    removeFormRetryData();
    return;
  }
  Myanswers.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  Myanswers.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
  setAnswerSpaceItem("_pendingFormDataString", 
		     getAnswerSpaceItem("_pendingFormDataString").substring(getAnswerSpaceItem("_pendingFormDataString").indexOf(":") + 1));
  setAnswerSpaceItem("_pendingFormDataArrayAsString", 
		     getAnswerSpaceItem("_pendingFormDataArrayAsString").substring(getAnswerSpaceItem("_pendingFormDataArrayAsString").indexOf(":") + 1));
  Myanswers.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  Myanswers.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
}

function countPendingFormData() {
  if (getAnswerSpaceItem("_pendingFormDataString")) {
    var q1 = getAnswerSpaceItem("_pendingFormDataString").split(":");
    Myanswers.log("countPendingFormData: q1.length = " + q1.length + ";");
    Myanswers.log("countPendingFormData: q1[0] = " + q1[0] + ";");
    Myanswers.log("countPendingFormData: q1[1] = " + q1[1] + ";");
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
	var button = $('.pendingFormButton');
  if (queueCount != 0) {
    Myanswers.log("setSubmitCachedFormButton: Cached items");
		buttonLabel = button.find('.buttonLabel');
		if (buttonLabel.size() > 0)
		{
			buttonLabel.html(queueCount + ' Unsent Forms');
		}
		else
		{
			button.button("option", "label", queueCount + ' Pending');
		}
    button.button("option", "disabled", "false");
	  button.removeAttr("disabled");
		button.removeClass('hidden');
  } else {
    Myanswers.log("setSubmitCachedFormButton: NO Cached items");
		buttonLabel = button.find('.buttonLabel');
    button.button("option", "disabled", "true");
	  button.attr("disabled", "true");
		button.addClass('hidden');
  }
}

function removeFormRetryData() {
    removeAnswerSpaceItem("_pendingFormDataString");  
    removeAnswerSpaceItem("_pendingFormDataArrayAsString");  
    removeAnswerSpaceItem("_pendingFormMethod");  
    removeAnswerSpaceItem("_pendingFormUUID");  
    setSubmitCachedFormButton();
    Myanswers.log("removeFormRetryData: Clearing local storage"); 
}

function checkFormRetryData() {
    Myanswers.log("_pendingFormDataString: " + getAnswerSpaceItem("_pendingFormDataString"));
    Myanswers.log("_pendingFormDataArrayAsString: " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
    return (getAnswerSpaceItem("_pendingFormDataString"));
}

function submitFormWithRetry() {    
  var str;
  var arr;
  var method;
  var uuid;
  var localKeyword;

  if (checkFormRetryData()) {
	 Myanswers.log("submitFormWithRetry(1a): ");
	 var qx = headPendingFormData();
	 Myanswers.log("qx[0] => " + qx[0]);
	 Myanswers.log("qx[1] => " + qx[1]);
	 Myanswers.log("qx[2] => " + qx[2]);
	 Myanswers.log("qx[3] => " + qx[3]);
	 str = qx[0];
	 arr = qx[1].split("/");
	 method = qx[2];
	 uuid = qx[3];
  } else {
	 Myanswers.log("submitFormWithRetry(1b): ");
	 return;
  }

  var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php?';
  if (arr[0] == "..") {
	 answerUrl += "answerSpace=" + answerSpace + "&keyword=" + arr[1] + (device ? '&_device=' + device : '') + (arr[2].length > 1 ? "&" + arr[2].substring(1) : "");
	 localKeyword = arr[1];
  } else {
	 answerUrl += "answerSpace=" + arr[1] + "&keyword=" + arr[2] + (device ? '&_device=' + device : '');
	 localKeyword = arr[2];
  }

  if (method == "get")
  {
	 ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: answerUrl,
		data: "?" + str,
		beforeSend: function(xmlhttprequest) {
		  Myanswers.log("GetAnswer transaction: " + answerUrl + "?" + str);
		  httpAnswerRequest = xmlhttprequest;
		  startInProgressAnimation();
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		  if (textstatus == "timeout")
		  {
			 alert("Form data not submitted, retry when you are in coverage");
			 goBackToKeywordListView();
		  }
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
		  Myanswers.log("GetAnswer transaction complete: " + textstatus);
		  if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
		  {
				delHeadPendingFormData();
				$('#answerBox').html(xmlhttprequest.responseText);
			 setSubmitCachedFormButton();
			 prepareAnswerViewForDevice();
			 setCurrentView('answerView', false, true);
		  }
		  stopInProgressAnimation();
		},
		timeout: 60 * 1000 // 60 seconds
	 });
  }
  else
  {	 
	 Myanswers.log("GetAnswer transaction: " + answerUrl + " data: " + str);
	 startInProgressAnimation();
	 ajaxQueue.add({
		type: "POST",
		url: answerUrl,
		data: str,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		  Myanswers.log("GetAnswer transaction successful");
		  httpAnswerRequest = xmlhttprequest;
		  delHeadPendingFormData();
			$('#answerBox').html(data);
		  stopInProgressAnimation();
		  setSubmitCachedFormButton();
			prepareAnswerViewForDevice();
		  setCurrentView('answerView', false, true);
		},
		timeout: 60 * 1000 // 60 seconds
	 });
  }
}

function submitAction(keyword, action) {
	var form = $('.view:visible').find('form').first();
	var method = form.attr('method');
  var answerUrl = siteVars.serverAppPath + '/util/GetAnswer.php?answerSpace=' + answerSpace + "&keyword=" + keyword + (device ? '&_device=' + device : '');
  var str = form.find('input, textarea, select').serialize();

  if (method == "get")
  {
		str += "&" + action;
	 ajaxQueue.add({
		type: 'GET',
		cache: "false",
		url: answerUrl,
		data: "?" + str,
		beforeSend: function(xmlhttprequest) {
		  Myanswers.log("GetAnswer transaction: " + answerUrl + "?" + str);
		  httpAnswerRequest = xmlhttprequest;
		  startInProgressAnimation();
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		  if (textstatus == "timeout")
		  {
			 alert("Form data not submitted, retry when you are in coverage");
			 goBackToKeywordListView();
		  }
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
		  Myanswers.log("GetAnswer transaction complete: " + textstatus);
		  if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
		  {
				$('#answerBox').html(xmlhttprequest.responseText);
				prepareAnswerViewForDevice();
				setCurrentView('answerView', false, true);
		  }
		  stopInProgressAnimation();
		},
		timeout: 60 * 1000 // 60 seconds
	 });
  }
  else
  {	 
	 Myanswers.log("GetAnswer transaction: " + answerUrl + " data: " + str);
	 answerUrl += "&" + action;
	 startInProgressAnimation();
	 ajaxQueue.add({
		type: "POST",
		url: answerUrl,
		data: str,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		  Myanswers.log("GetAnswer transaction successful");
		  httpAnswerRequest = xmlhttprequest;
			$('#answerBox').html(data);
		  stopInProgressAnimation();
			prepareAnswerViewForDevice();
		  setCurrentView('answerView', false, true);
		},
		timeout: 60 * 1000 // 60 seconds
	 });
  }
}

function setupAnswerFeatures()
{
	if ($('div.googlemap').size() > 0) { // check for items requiring Google features (so far only #map)
		startInProgressAnimation();
		$.getScript('http://www.google.com/jsapi?key=' + googleAPIkey, function(data, textstatus) {
			if ($('div.googlemap').size() > 0) // check for items requiring Google Maps
				google.load('maps', '3', { other_params : 'sensor=true', 'callback' : setupGoogleMaps });
			else
				stopTrackingLocation();
		});
	}
}

function setupGoogleMaps()
{
	$('div.googlemap').each(function(index, element) {
		var mapTarget = $(element);
		if (mapTarget.attr('data-sensor') == true && isLocationAvailable())
			startTrackingLocation();
		var location = new google.maps.LatLng(mapTarget.attr('data-latitude'), mapTarget.attr('data-longitude'));
		var options = {
			zoom: parseInt(mapTarget.attr('data-zoom')),
			center: location,
			mapTypeId: google.maps.MapTypeId[mapTarget.attr('data-type').toUpperCase()]
		};
		var googleMap = new google.maps.Map(element, options);
		google.maps.event.addListener(googleMap, 'tilesloaded', stopInProgressAnimation);
		google.maps.event.addListener(googleMap, 'zoom_changed', startInProgressAnimation);
		google.maps.event.addListener(googleMap, 'maptypeid_changed', startInProgressAnimation);
		google.maps.event.addListener(googleMap, 'projection_changed', startInProgressAnimation);
		if (mapTarget.attr('data-kml') && mapTarget.attr('data-kml').length > 0)
		{
			var kml = new google.maps.KmlLayer(mapTarget.attr('data-kml'), { map: googleMap, preserveViewport: true });
		}
		else if (mapTarget.attr('data-marker').length > 0)
		{
			var marker = new google.maps.Marker({
				position: location,
				map: googleMap,
				icon: mapTarget.attr('data-marker')
			});
			if (mapTarget.attr('data-marker-title').length > 0)
			{
				marker.setTitle(mapTarget.attr('data-marker-title'));
				var markerInfo = new google.maps.InfoWindow();
				google.maps.event.addListener(marker, 'click', function() {
					markerInfo.setContent(marker.getTitle());
					markerInfo.open(googleMap, marker);
				});
			}
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

function isLocationAvailable()
{
	if (typeof(navigator.geolocation) != 'undefined')
		return true;
	else if (typeof(google) != 'undefined' && typeof(google.gears) != 'undefined')
		return google.gears.factory.getPermission(answerSpace, 'See your location marked on maps.');
	return false;
}

var locationTracker, latitude, longitude;
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
	Myanswers.log(message);
	if (typeof(message.loginStatus) == 'string' && typeof(message.loginKeyword) == 'string' && typeof(message.logoutKeyword) == 'string') {
		Myanswers.log('blinkAnswerMessage: loginStatus detected');
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
	if (typeof(xmlString) != 'string' || typeof(xslString) != 'string') return false;
	if (typeof(window.ActiveXObject) == 'function')
	{
		Myanswers.log('generateMojoAnswer: using Internet Explorer method');
		var xml = XML.newDocument().loadXML(xmlString);
		var xsl = XML.newDocument().loadXML(xslString);
		var html = xml.transformNode(xsl);
		return html;
	}
	if (document.implementation && document.implementation.createDocument)
	{
		if (typeof(DOMParser) == 'function')
		{
			Myanswers.log('generateMojoAnswer: using W3C JavaScript method with DOMParser()');
			var xml = (new DOMParser()).parseFromString(xmlString, 'application/xml');
			var xsl = (new DOMParser()).parseFromString(xslString, 'application/xml');
		}
		else
		{
			Myanswers.log('generateMojoAnswer: using W3C JavaScript method with fake AJAX query');
			var url = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlString);
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, false);
			xhr.send(null);
			var xml = xhr.responseXML;
			var url = "data:text/xml;charset=utf-8," + encodeURIComponent(xslString);
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, false);
			xhr.send(null);
			var xsl = xhr.responseXML;
		}
		if (typeof(window.XSLTProcessor) == 'function')
		{
			var xsltProcessor = new XSLTProcessor();
			xsltProcessor.importStylesheet(xsl);
			var html = xsltProcessor.transformToFragment(xml, document);
			return html;
		}
	}
	if (deviceVars.hasWebWorkers === true)
	{
		var message = { };
		message.fn = 'processXSLT';
		message.xml = xmlString;
		message.xsl = xslString;
		message.target = target;
		webworker.postMessage(message);
		return '<p>This keyword is being constructed entirely on your device.</p><p>Please wait...</p>';
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

// to facilitate building regex replacements
RegExp.quote = function(str) { return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1"); };

// HTML5 Web Worker
if (deviceVars.hasWebWorkers === true)
{
	var webworker = new Worker(siteVars.serverAppPath + '/webworker.js');
	webworker.onmessage = function(event) {
		switch (event.data.fn)
		{
			case 'log':
				Myanswers.log(event.data.string);
				break;
			case 'processXSLT':
				Myanswers.log('WebWorker: finished processing XSLT');
				$('#' + event.data.target).html(event.data.html);
				break;
		}
	};
}

