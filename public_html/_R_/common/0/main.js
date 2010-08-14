var httpAnswerRequest = false;
var row1, row2;

var hasCategories = false, hasMasterCategories = false, hasVisualCategories = false, answerSpaceOneKeyword = false;

var currentKeyword, currentCategory, currentMasterCategory;
var textOnlyLeftList = false;

var siteConfig, siteConfigHash;
var answerSpacesList, answerSpacesHash;
var answerSpace;
var backStack;

var webappCache = window.applicationCache;

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

function setAnswerSpaceItem(key, value) {
	if (storageReady)
	  $.fn.setStore(key, value);
}

function getAnswerSpaceItem(key) {
	return storageReady ? $.fn.getStore(key) : null;
}

function removeAnswerSpaceItem(key) {
	if (storageReady)
	  $.fn.removeStore(key);
}
 
// produce the HTML for the list and insert it into #keywordList
function populateKeywordList(category) {
	console.log('populateKeywordList(): category=' +  category + '; hasCategories=' + hasCategories);
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
		if (siteConfig.keywords_config != 'no' && (!hasCategories || siteConfig.categories[category].textKeywords != 'Y') && list[order[id]].image)
		{
			htmlBox += "<a onclick=\"gotoNextScreen('" + order[id] + "')\">";
			htmlBox += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" />";
			htmlBox += "</a>";
		}
		else
		{
			htmlList += "<a onclick=\"gotoNextScreen('" + order[id] + "')\"><li style=\"background-color:" + (id % 2 ? row2 : row1) + ";\">";
			htmlList += "<div class='label'>" + list[order[id]].name + "</div>";
			htmlList += "<div class='nextArrow'></div>";
			htmlList += "<div class='description'>" + list[order[id]].description + "</div>";
			htmlList += "</li></a>";
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
	console.log('populateAnswerSpacesList()');
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
function loaded(row1String, row2String)
{
	console.log('loaded(): initialising');
  var timer = null;
  var requestActive = false;
  row1 = (row1String === '') ? 'white' : row1String;
  row2 = (row2String === '') ? 'white' : row2String;

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
  if (!navigator.onLine) {
	 console.log('loaded(): no network connection');
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
	/* }
	else
	{
		getAnswerSpacesList();
	}*/
}

// called from body element when device is rotated
// updates the viewport tag with the correct width
function updateOrientation()
{
  /*var isPortrait = true;
  switch(window.orientation)
  {
	 case -90:
	 case 90:
		isPortrait = false;
		break;
  }
  metatags = document.getElementsByTagName("meta");
  for (i in metatags)
  {
	 var name = metatags[i].getAttribute("name");
	 var content = metatags[i].getAttribute("content");
	 if (metatags[i].getAttribute("name") == "viewport")
	 {
		var viewportstring
		if (isPortrait)
		{
		  viewportstring = metatags[i].getAttribute("content").replace("width=device-height", "width=device-width");
		}
		else
		{
		  viewportstring = metatags[i].getAttribute("content").replace("width=device-width", "width=device-height");
		}
		metatags[i].setAttribute("content", viewportstring);
	 }
  }*/
}


function getAnswerSpacesList()
{
	startInProgressAnimation();
	var answerSpacesUrl = "../../common/0/util/GetAnswerSpaces.php";
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
	startInProgressAnimation();
	var categoriesUrl = "util/GetSiteConfig.php";
	var requestData = "answerSpace=" + answerSpace + (typeof(siteConfigHash) == 'string' ? "&sha1=" + siteConfigHash : "");
	console.log("GetSiteConfig transaction: " + categoriesUrl + "?" + requestData);
	$.getJSON(categoriesUrl, requestData,
		function(data, textstatus) { // readystate == 4
			console.log("GetSiteConfig transaction complete: " + textstatus);
			console.log(data);
			stopInProgressAnimation();
			if (textstatus != 'success') return;
/*			if (data.errorMessage && data.errorMessage == "NOT FOUND")
			{
				console.log("GetSiteConfig error: " + data.errorMessage);
				//getAnswerSpacesList();
			}
			else */
			if (data.errorMessage)
			{
				console.log("GetSiteConfig error: " + data.errorMessage);
				window.location = "/demos";
			}
			else
			{
				console.log("GetSiteConfig status: " + data.statusMessage);
				if (data.statusMessage != "NO UPDATES")
				{
					if (storageReady)
						jStore.set('siteConfigMessage', JSON.stringify(data));
					siteConfig = data.siteConfig;
					siteConfigHash = data.siteHash;
				}
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
				updateLoginBar();
			}
		});
}

function showMasterCategoriesView()
{
  console.log('showMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
  prepareMasterCategoriesViewForDevice();
  $("#mainLabel").html('Master Categories');
  setCurrentView('masterCategoriesView', false);
}

function goBackToMasterCategoriesView()
{
  console.log('goBackToMasterCategoriesView()');
	addBackHistory("goBackToMasterCategoriesView();");
  prepareMasterCategoriesViewForDevice();
  $("#mainLabel").html('Master Categories');
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
  console.log('goBackToCategoriesView()');
	addBackHistory("goBackToCategoriesView();");
  prepareCategoriesViewForDevice();
  $("#mainLabel").html(hasMasterCategories ? siteConfig.master_categories[currentMasterCategory].name : 'Categories');
  setCurrentView('categoriesView', true);
}

function addBackHistory(item)
{
	if (backStack.indexOf(item) == -1)
		backStack.push(item);
	console.log(backStack);
}

function goBack()
{
	backStack.pop();
	if (backStack.length >= 1)
		eval(backStack[backStack.length-1]);
	else
		goBackToHome();
	console.log(backStack);
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
	var keyword = siteConfig.keywords[keywordID];
  
  var answerUrl = '../../common/0/util/GetAnswer.php';
  var requestData = createParamsAndArgs(keywordID) + (device ? '&_device=' + device : '');
  $.ajax({
	 type: 'GET',
	 url: answerUrl,
	 data: requestData,
	 beforeSend: function(xmlhttprequest) {
		console.log("GetAnswer transaction: " + answerUrl + "?" + requestData);
		httpAnswerRequest = xmlhttprequest;
		startInProgressAnimation();
		setSubmitCachedFormButton();
		$('#mainLabel').html(keyword.name);
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		console.log("GetAnswer failed with error type: " + textstatus);
		if (textstatus == "timeout")
		{
		  answerItem = getAnswerSpaceItem(getAnswerSpaceItem("_currentCategory") + "___" + rowIndex);
		  $('#answerBox').html(answerItem == undefined ? "No result available" : answerItem);
		}
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("GetAnswer transaction complete: " + textstatus);
		if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
		{
		  var html =  httpAnswerRequest.responseText;
		  setAnswerSpaceItem(getAnswerSpaceItem("_currentCategory") + "___" + keywordID, html);
		  $('#answerBox').html(html);
		  setSubmitCachedFormButton();
		}
		setupForms($('#answerView'));
		setCurrentView("answerView", false, true);
		stopInProgressAnimation();
	 },
	 timeout: 30 * 1000 // 30 seconds
  });
}

function setupForms(view)
{
	var hasHiddenColumns = false;
	setTimeout(function() {
		startInProgressAnimation();
		// correct input elements that are too large in forms
		var form = view.find('form');
		var totalWidth = form.width();
		var firstColumnWidth = form.find('td').first().width();
		var targetWidth = totalWidth - firstColumnWidth - 32;
		form.find('td, select, input, textarea').each(function(index, element) {
			if ($(element).width() > targetWidth)
				$(element).width(targetWidth);
		});
		// correct result tables that are too wide
		var results = view.find('table.results');
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
  console.log("gotoNextScreen(" + keywordID + ")");
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
  prepareSecondLevelAnswerViewForDevice(keyword, arg0);
	addBackHistory("showSecondLevelAnswerView(\"" + keyword + "\", \"" + arg0 + "\", true);");
  
  var answerUrl = '../../common/0/util/GetAnswer.php'
  var requestData = 'answerSpace=' + answerSpace + "&keyword=" + encodeURIComponent(keyword) + (device ? '&_device=' + device : '') + '&' + arg0;
  $.ajax({
	 type: 'GET',
	 url: answerUrl,
	 data: requestData,
	 beforeSend: function(xmlhttprequest) {
		console.log("GetAnswer2 transaction:" + answerUrl + "?" + requestData);
		httpAnswerRequest = xmlhttprequest;
		setSubmitCachedFormButton();
		$('#answerBox2').html("Waiting...");
		startInProgressAnimation();
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		console.log("GetAnswer2 failed with error type: " + textstatus);
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("GetAnswer2 transaction complete: " + textstatus);
		if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
		{
		  var html =  httpAnswerRequest.responseText;
      $('#answerBox2').html(html);
			setupForms($("#answerView2"));
		}
		stopInProgressAnimation();
	 }
  });
  setCurrentView('answerView2', false, true);   
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
  var loginUrl = '../../common/0/util/CreateLogin.php';
	var requestData = 'activating=' + isActivating;
	console.log("CreateLogin transaction: " + loginUrl + "?" + requestData);
  $.ajax({
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
			console.log("CreateLogin transaction complete: " + textstatus);
		}
  });
}

function showActivateLoginView(event)
{
  prepareActivateLoginViewForDevice();
	addBackHistory("showActivateLoginView();");
  $('#mainHeading').html("Login");
  var loginUrl = '../../common/0/util/ActivateLogin.php'
	console.log("ActivateLogin transaction: " + loginUrl);
  $.ajax({
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
			console.log("ActivateLogin transaction complete: " + textstatus);
		}
  });
}

function showLoginView(event)
{
  prepareLoginViewForDevice();
	addBackHistory("showLoginView();");
  $('#mainHeading').html("Login");
  var loginUrl = '../../common/0/util/DoLogin.php'
	console.log("DoLogin transaction: " + loginUrl);
  $.ajax({
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
			console.log("DoLogin transaction complete: " + textstatus);
		}
  });
}

function updateLoginBar(){
	startInProgressAnimation();
  var loginUrl = "../../common/0/util/GetLogin.php";
	console.log("GetLogin transaction: " + loginUrl);
  $.getJSON(loginUrl,
		function(data, textstatus) { // readystate == 4
			stopInProgressAnimation();
			if (textstatus != 'success')
			{
				alert("Error preparing login:" + xmlhttprequest.responseText);
				return;
			}
			if (data.status == "LOGGED IN")
			{
				$('#loginStatus').html(data.html).removeClass('hidden');
				$('#loginButton').addClass('hidden');
			}
			else
			{
				$('#loginStatus').addClass('hidden');
				$('#loginButton').removeClass('hidden');
			}
	 });
}

function submitLogin()
{
	startInProgressAnimation();
  var loginUrl = '../../common/0/util/DoLogin.php'
  var requestData = "action=login&mobile_number=" + document.getElementById('mobile_number').value + "&password=" + document.getElementById('password').value;
	console.log("iPhoneLogin transaction: " + loginUrl + "?" + requestData);
  $.ajax({
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
			console.log("iPhoneLogin transaction complete: " + textstatus);
			stopInProgressAnimation();
			getSiteConfig();
		}
  });
}

function submitLogout()
{
  var loginUrl = '../../common/0/util/DoLogin.php'
  var requestData = 'action=logout';
	console.log("iPhoneLogin transaction:" + loginUrl + "?" + requestData);
  $.ajax({
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
			console.log("iPhoneLogin transaction complete: " + textstatus);
			getSiteConfig();
		}
  });
}

function goBackToTopLevelAnswerView(event)
{
	prepareAnswerViewForDevice();
  console.log('goBackToTopLevelAnswerView()');
  setCurrentView('answerView', true, true);
}

var newKeyword = "";
function passLocation(keyword) {
   // Get location no more than 10 minutes old. 600000 ms = 10 minutes.
   newKeyword = keyword;
   //alert("hi");
   navigator.geolocation.getCurrentPosition(showLocation, showError, {enableHighAccuracy:true,maximumAge:600000});
}

function showError(error) {
   alert(error.code + ' ' + error.message);
}

function showLocation(position) {
   showSecondLevelAnswerView(newKeyword, position.coords.latitude + ',' + position.coords.longitude);
}

function showLocationX(position) {
   alert('<p>Latitude: ' + position.coords.latitude + '</p>' 
   + '<p>Longitude: ' + position.coords.longitude + '</p>' 
   + '<p>Accuracy: ' + position.coords.accuracy + '</p>' 
   + '<p>Altitude: ' + position.coords.altitude + '</p>' 
   + '<p>Altitude accuracy: ' + position.coords.altitudeAccuracy + '</p>' 
   + '<p>Speed: ' + position.coords.speed + '</p>' 
   + '<p>Heading: ' + position.coords.heading + '</p>');
}

function submitForm() {
  var str = $('form').first().find('input, textarea, select').serialize();
  console.log("submitForm(2): " + document.forms[0].action);
  queuePendingFormData(str, document.forms[0].action, document.forms[0].method.toLowerCase(), Math.uuid());
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
	var button = $('.pendingFormButton');
  if (queueCount != 0) {
    console.log("setSubmitCachedFormButton: Cached items");
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
    console.log("setSubmitCachedFormButton: NO Cached items");
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

  var answerUrl = '../../common/0/util/GetAnswer.php?';
  if (arr[0] == "..") {
	 answerUrl += "answerSpace=" + answerSpace + "&keyword=" + arr[1] + (device ? '&_device=' + device : '') + (arr[2].length > 1 ? "&" + arr[2].substring(1) : "");
	 localKeyword = arr[1];
  } else {
	 answerUrl += "answerSpace=" + arr[1] + "&keyword=" + arr[2] + (device ? '&_device=' + device : '');
	 localKeyword = arr[2];
  }

  if (method == "get")
  {
	 $.ajax({
		type: 'GET',
		cache: "false",
		url: answerUrl,
		data: "?" + str,
		beforeSend: function(xmlhttprequest) {
		  console.log("GetAnswer transaction: " + answerUrl + "?" + str);
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
		  console.log("GetAnswer transaction complete: " + textstatus);
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
	 console.log("GetAnswer transaction: " + answerUrl + " data: " + str);
	 startInProgressAnimation();
	 $.ajax({
		type: "POST",
		url: answerUrl,
		data: str,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		  console.log("GetAnswer transaction successful");
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
  var str = form.find('input, textarea, select').serialize();
	var method = form.attr('method');
  var answerUrl = '../../common/0/util/GetAnswer.php?answerSpace=' + answerSpace + "&keyword=" + keyword + (device ? '&_device=' + device : '') + "&" + action;

  if (method == "get")
  {
	 $.ajax({
		type: 'GET',
		cache: "false",
		url: answerUrl,
		data: "?" + str,
		beforeSend: function(xmlhttprequest) {
		  console.log("GetAnswer transaction: " + answerUrl + "?" + str);
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
		  console.log("GetAnswer transaction complete: " + textstatus);
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
	 console.log("GetAnswer transaction: " + answerUrl + " data: " + str);
	 startInProgressAnimation();
	 $.ajax({
		type: "POST",
		url: answerUrl,
		data: str,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		  console.log("GetAnswer transaction successful");
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

