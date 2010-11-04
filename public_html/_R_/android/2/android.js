var navBoxHeader;
var navButtons;
var helpButton;
var welcomeMessage;
var mainLabel;
var hashStack;

// ** device-specific initialisation of variables and flags **

function init_device()
{
	MyAnswers.log('init_device()');
	deviceVars.majorVersion = navigator.userAgent.match(/Android (\d+)./);
	deviceVars.majorVersion = deviceVars.majorVersion !== null ? deviceVars.majorVersion[1] : 1;
	deviceVars.minorVersion = navigator.userAgent.match(/Android \d+\.(\d+)/);
	deviceVars.minorVersion = deviceVars.minorVersion !== null ? deviceVars.minorVersion[1] : 5;
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = deviceVars.engineVersion !== null ? deviceVars.engineVersion[1] : 525;
	deviceVars.scrollProperty = '-webkit-transform';
	deviceVars.scrollValue = 'translateY($1px)';
	if (deviceVars.engineVersion >= 529 || typeof(window.onhashchange) === 'object')
		MyAnswers.log('onHashChange registration: ', addEvent(window, 'hashchange', onHashChange));

	if (typeof(deviceVars.device) === 'undefined')
		deviceVars.device = "android";
	
	hashStack = new Array();
//	deviceVars.disableXSLT = true;

	deviceVars.headerHeight = $('header').height();
	deviceVars.progressDialogTop = Math.floor(screen.height / 2);

//	document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
//	iscroll = new iScroll('activeContent', { bounce: true, hScrollbar: false, fadeScrollbar: false, checkDOMChanges: false });

	// caching frequently-accessed selectors
	navBoxHeader = $('#navBoxHeader');
	navButtons = $("#homeButton, #backButton");
	helpButton = $('#helpButton');
	welcomeMessage = $('#welcomeMsgArea');
	mainLabel = $('#mainLabel');
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
	try {
  MyAnswers.log("Device Ready");
  //MyAnswers.log("URL to Load: " + window.Settings.LoadURL);
  MyAnswers.log("Device: " + window.device.platform);
  //MyAnswers.log("Camera Present: " + window.device.camerapresent);
  //MyAnswers.log("Multitasking: " + window.device.multitasking);
  //MyAnswers.cameraPresent = window.device.camerapresent;
  //MyAnswers.loadURL = window.Settings.LoadURL;
  siteVars.serverDomain = MyAnswers.loadURL.match(/:\/\/(.[^/]+)/)[1];
  MyAnswers.domain = "http://" + siteVars.serverDomain + "/";
  MyAnswers.log("Domain: " + MyAnswers.domain);
  //MyAnswers.multiTasking = window.device.multitasking;
  //siteVars.serverAppVersion = window.Settings.codeVersion;
  siteVars.serverAppPath = MyAnswers.loadURL + 'common/' + siteVars.serverAppVersion + '/';
  //siteVars.answerSpace = window.Settings.answerSpace;
  MyAnswers.log("siteVars.answerSpace: " + siteVars.answerSpace);
  siteVars.serverDevicePath = MyAnswers.loadURL + 'android/' + siteVars.serverAppVersion + '/';
  MyAnswers.log("MyAnswers.loadURL: " + MyAnswers.loadURL);
  deviceVars.deviceFileName = '/android.js';
  deviceVars.device = "android_pg";
  //if (window.device.platform.search(/iphone/i) != -1) {
  //  deviceVars.device = "iphone_pg";
  //  siteVars.serverDevicePath = MyAnswers.loadURL + 'iphone/' + siteVars.serverAppVersion + '/';
  //  deviceVars.deviceFileName = '/iphone.js';
  //} else {
  //  deviceVars.device = "ipad_pg";
  //  siteVars.serverDevicePath = MyAnswers.loadURL + 'ipad/' + siteVars.serverAppVersion + '/';
  //  deviceVars.deviceFileName = '/ipad.js';
  //}
  MyAnswers.log("AppDevicePath: " + siteVars.serverDevicePath);
  MyAnswers.log("AppPath: " + siteVars.serverAppPath);
  } catch(e) {
		MyAnswers.log("onDeviceReady exception: ");
		MyAnswers.log(e);
	}
}

/*
 The purpose of the functions "prepare...ForDevice()" is to establish the
 buttons that can be displayed on the navBar and the function of the buttons
 where they differ.
 The visibility of the welcome/intro message is also controlled at this stage.
*/

function prepareAnswerSpacesListViewForDevice()
{
}

function prepareMasterCategoriesViewForDevice()
{
	$.bbq.removeState();
	var categoriesView = $('#categoriesView');
	categoriesView.find('.welcomeBox').removeClass('hidden');
	if (siteVars.hasLogin)
	{
		navBoxHeader.removeClass('hidden');
		navButtons.addClass('hidden');
	}
	else
		navBoxHeader.addClass('hidden');
	if (typeof(siteConfig.help) != 'string')
		helpButton.addClass('hidden');
	else
	{
		helpButton.removeClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
}

function prepareCategoriesViewForDevice()
{
	var categoriesView = $('#categoriesView');
  if (hasMasterCategories)
  {
		$.bbq.pushState({ m: currentMasterCategory }, 2);
		categoriesView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
		navButtons.removeClass('hidden');
  }
  else
  {
		$.bbq.removeState();
		navButtons.addClass('hidden');
		categoriesView.find('.welcomeBox').removeClass('hidden');
		if (siteVars.hasLogin)
		{
			navBoxHeader.removeClass('hidden');
		}
		else
			navBoxHeader.addClass('hidden');
  }
	if (typeof(siteConfig.help) != 'string')
		helpButton.addClass('hidden');
	else
	{
		helpButton.removeClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
}

function prepareKeywordListViewForDevice(category)
{
	var keywordListView = $('#keywordListView');
	var hashState = {};
	if (hasCategories)
		hashState['c'] = currentCategory;
	if (hasVisualCategories)
	{
		keywordListView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
		navButtons.removeClass('hidden');
	}
  else if (hasMasterCategories)
  {
		keywordListView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
		navButtons.removeClass('hidden');
		hashState['m'] = currentMasterCategory;
  }
  else
  {
		keywordListView.find('.welcomeBox').removeClass('hidden');
		if (siteVars.hasLogin)
		{
			navButtons.addClass('hidden');
			navBoxHeader.removeClass('hidden');
		}
		else
			navBoxHeader.addClass('hidden');
  }
	$.bbq.pushState(hashState, 2);
	if (typeof(siteConfig.help) != 'string')
		helpButton.addClass('hidden');
	else
	{
		helpButton.removeClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
}

function prepareKeywordViewForDevice(oneKeyword, showHelp)
{
	$.bbq.pushState({ k: currentKeyword }, 2);
	if (oneKeyword && !siteVars.hasLogin)
		navBoxHeader.addClass('hidden');
	else
	{
		navButtons.removeClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
	if (showHelp)
	{
		helpButton.removeClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
	else
		helpButton.addClass('hidden');
}

function prepareAnswerViewForDevice()
{
	$.bbq.pushState({ a: currentKeyword }, 2);
	if (answerSpaceOneKeyword && !siteVars.hasLogin)
		navBoxHeader.addClass('hidden');
	else
	{
		navButtons.removeClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
	if (typeof(siteConfig.keywords[currentKeyword].help) == 'string')
	{
		helpButton.removeClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
	else
	{
		helpButton.addClass('hidden');
	}
}

function prepareSecondLevelAnswerViewForDevice(keyword, arg)
{
	$.bbq.pushState({ a2k: keyword, a2a: arg }, 2);
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareHelpViewForDevice()
{
	$.bbq.pushState({ h: 'H' });
	var helpView = $('#helpView');
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareLoginViewForDevice()
{
	$.bbq.pushState({ l: 'L' }, 2);
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareNewLoginViewForDevice()
{
	$.bbq.pushState({ l: 'N' }, 2);
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareActivateLoginViewForDevice()
{
	$.bbq.pushState({ l: 'A' }, 2);
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function populateTextOnlyCategories(masterCategory)
{
	MyAnswers.log('populateTextOnlyCategories(): ' + masterCategory);
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var select = document.createElement('select');
	select.setAttribute('id', 'categoriesList');
	for (id in order)
	{
		if (list[order[id]].status != 'active')
			continue;
		var option = document.createElement('option');
		option.setAttribute('value', order[id]);
		if (order[id] == currentCategory)
			option.setAttribute('selected', 'true');
		option.appendChild(document.createTextNode(list[order[id]].name));
		select.appendChild(option);
	}
	var categorySelector = document.getElementById('categorySelector');
	emptyDOMelement(categorySelector);
	categorySelector.appendChild(select);
	$('#categorySelectorArea').removeClass('hidden');
	select.addEventListener('change', function() {
	 showKeywordListView(this.options[this.selectedIndex].value);
	}, true);
}

function setCurrentView(view, reverseTransition)
{
  MyAnswers.log('setCurrentView(): ' + view + ' ' + reverseTransition);
	var entranceDirection = (reverseTransition ? 'left' : 'right');
	var endPosition = (reverseTransition ? 'right' : 'left');
	var startPosition = (reverseTransition ? 'left' : 'right');
	var currentView = $('.view:visible');
	var newView = $('#' + view);

	runListWithDelay([hideLocationBar,
										(function() {
											if (currentView.size() > 0) return true;
											newView.show();
											return false;
										}),
										(function() {
											if (currentView.attr('id') !== newView.attr('id')) return true;
											MyAnswers.log("setCurrentView(): current === new");
											runListWithDelay([
													(function() { newView.addClass('slidefrom' + startPosition); return true; }),
												],
												25,
												function() { 
													runListWithDelay([
															(function() { newView.removeClass('slidefrom' + startPosition); return true; })
														],
														350,
														$.noop)
												});
											return false;
										}),
										(function() {
											MyAnswers.log("setCurrentView(): " + currentView.attr('id') + "!==" + newView.attr('id'));
											runListWithDelay([
													(function() { currentView.addClass('slideto' + endPosition); return true; }),
												],
												25,
												function() {
													runListWithDelay([
															(function() { currentView.hide(); return true; }),
															(function() { currentView.removeClass('slideto' + endPosition); return true; }),
														],
														350,
														$.noop)
												});
											runListWithDelay([
													(function() { newView.addClass('slidefrom' + startPosition); return true; }),
													(function() { newView.show(); return true; }),
												],
												25,
												function() {
													runListWithDelay([
															(function() { newView.removeClass('slidefrom' + startPosition); return true; }),
														],
														350,
														$.noop)
												});
											return false;
										})],
										25,
										function() {
											runListWithDelay([
													(function() { onScroll(); return true; }),
													(function() { setupForms(newView); return true; }),
												],
												25,
												$.noop)
										});
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

function onScroll()
{
	var headerBottom = $('.header').height();
	var scrollTop = $(window).scrollTop();
	if (scrollTop > headerBottom)
	{
		var offset = scrollTop - headerBottom;
		updatePartCSS(navBoxHeader, deviceVars.scrollProperty, offset, deviceVars.scrollValue);
	}
	else
	{
		updatePartCSS(navBoxHeader, deviceVars.scrollProperty, '0', deviceVars.scrollValue);
	}
	updatePartCSS($(MyAnswers.activityIndicator), deviceVars.scrollProperty, (deviceVars.progressDialogTop + scrollTop), deviceVars.scrollValue);
}

function updatePartCSS(element, property, value, valueFormat)
{
	var formattedValue = (value + '').replace(/(\d+)/, valueFormat);
	element.css(property, formattedValue);
}

function showUnreadBulletins()
{
	var bulletins = $.jStore.get('bulletins') || new Array();
	$('#bulletins').find('.bulletin').each(function(index, element) {
		var bulletin = $(element);
		var name = bulletin.attr('id');
		if (bulletins.indexOf(name) == -1)
			bulletin.show('slide', 300).removeClass('hidden');
	});
}

function dismissBulletin()
{
	var bulletin = $(this);
	bulletin.hide('slide', 300);
	var name = bulletin.attr('id');
	var bulletins = $.jStore.get('bulletins') || new Array();
	if (typeof(bulletins) == 'string')
		bulletins = JSON.parse(bulletins);
	bulletins.push(name);
	$.jStore.set('bulletins', JSON.stringify(bulletins));
	return false;
}

function onHashChange(event)
{
	var hashState = $.bbq.getState();
	var hashString = JSON.stringify(hashState);
	if (location.hash.length > 1 && hashStack.indexOf(hashString) == -1)
		hashStack.push(hashString);
	else if (hashStack.length == 0 || location.hash.length <= 1)
		goBackToHome();
	else if (hashStack[hashStack.length - 2] == hashString)
	{
		hashStack.pop();
		goBack()
	}
}

/*
 using jQuery BBQ, courtesy of Ben Alman
 storing state in the hash
 m = current master category
 c = current category
 k = current keyword
 a = current answer
 a2k = keyword for second level answer
 a2a = argument for second level answer
 l = Activate | New | Login
 h = Help
*/

function hideLocationBar() { window.scrollTo(0, 1); return true; }

(function() {
  var timer = setInterval(function() {
		if (typeof(MyAnswers.device_Loaded) != 'undefined') {
			try {
				MyAnswers.device_Loaded = true;
				clearInterval(timer);
			} catch(e) {
				MyAnswers.log("***** Unable to set: MyAnswers.device_Loaded => true");
			}
		}
  }, 100);
})();
