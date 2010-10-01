var deviceVars = {}, siteVars = {}, hashStack = new Array();

// ** device-specific initialisation of variables and flags **

siteVars.serverDomain = location.hostname;
siteVars.serverAppVersion = location.pathname.match(/_R_\/android\/(\d+)\//)[1];
siteVars.serverAppPath = 'http://' + siteVars.serverDomain + '/_R_/common/' + siteVars.serverAppVersion;
siteVars.serverDevicePath = 'http://' + siteVars.serverDomain + '/_R_/android/' + siteVars.serverAppVersion;
siteVars.answerSpace = location.href.match(/answerSpace=(\w+)/)[1];
siteVars.keywordInit = location.href.match(/keyword=(\w+)/);
siteVars.keywordInit = siteVars.keywordInit != null ? siteVars.keywordInit[1] : null;

deviceVars.device = "android";
deviceVars.storageReady = false;
deviceVars.storageAvailable = false;

deviceVars.scrollProperty = '-webkit-transform';
deviceVars.scrollValue = 'translateY($1px)';
deviceVars.hasWebWorkers = window.Worker != undefined;
deviceVars.disableXSLT = true;

jStore.error(function(e) { console.log('jStore: ' + e); });
jStore.init(siteVars.answerSpace, { flash: siteVars.serverAppPath + '/jStore.Flash.html', json: siteVars.serverAppPath + '/browser-compat.js' }, typeof(google) != 'undefined' && typeof(google.gears) != 'undefined' ? jStore.flavors.gears : jStore.flavors.sql);
jStore.engineReady(function(engine) {
	console.log('jStore using: ' + engine.jri);
	deviceVars.storageReady = engine.isReady;
	launchWebApplication();
});
$(document).ready(function() {
	deviceVars.majorVersion = navigator.userAgent.match(/Android (\d+)./);
	deviceVars.majorVersion = typeof(deviceVars.majorVersion) == 'array' ? deviceVars.majorVersion[1] : 1;
	deviceVars.minorVersion = navigator.userAgent.match(/Android \d+.(\d+)/);
	deviceVars.minorVersion = typeof(deviceVars.minorVersion) == 'array' ? deviceVars.minorVersion[1] : 5;
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = typeof(deviceVars.engineVersion) == 'array' ? deviceVars.engineVersion[1] : 525;
	deviceVars.progressDialogTop = Math.floor(screen.height / 2);
	if (deviceVars.engineVersion >= 529)
		window.addEventListener('hashchange', onHashChange, false);
	for (e in jStore.available)
	{
		if (jStore.available[e])
		{
			deviceVars.storageAvailable = true;
			break;
		}
	}
	window.addEventListener('scroll', onScroll, false);
	$('input, textarea, select').live('blur', function() { $(window).trigger('scroll'); });
	if ($('#loginStatus') > 0)
		siteVars.hasLogin = true;
//	$('.bulletin').bind('click', dismissBulletin);
	setTimeout(function() {
		deviceVars.headerHeight = $('header').height();
		console.log(deviceVars);
//		$('#stackLayout').css('padding-top', deviceVars.headerHeight + 'px');
	}, 300);
//	document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
//	iscroll = new iScroll('activeContent', { bounce: true, hScrollbar: false, fadeScrollbar: false, checkDOMChanges: false });
	deviceVars.documentReady = true;
	launchWebApplication();
});

function launchWebApplication()
{
	if (deviceVars.documentReady != true)
	{
		return;
	}
	if (deviceVars.storageAvailable == true)
	{
		if (deviceVars.storageReady != true)
			return;
	}
	loaded();
}

// caching frequently-accessed selectors
var navBoxHeader = $('#navBoxHeader');
var navButtons = $("#homeButton, #backButton");
var helpButton = $('#helpButton');
var welcomeMessage = $('#welcomeMsgArea');
var mainLabel = $('#mainLabel');
var activityIndicator = $('#activityIndicator');

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

function stopInProgressAnimation()
{
	activityIndicator.addClass('hidden');
}

function startInProgressAnimation()
{
	if ($('#startUp').size() <= 0)
	  activityIndicator.removeClass('hidden');
}

function populateTextOnlyCategories(masterCategory)
{
	console.log('populateTextOnlyCategories(): ' + masterCategory);
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var selectHTML = '<select id="categoriesList" onchange="showKeywordListView(this.options[this.selectedIndex].value);">';
	for (id in order)
	{
		selectHTML += '<option value="' + order[id] + '"' + (order[id] == currentCategory ? ' selected="true">' : '>') + list[order[id]].name + '</option>';
	}
	selectHTML += '</option>';
	var categorySelector = document.getElementById('categorySelector');
	$(categorySelector).empty();
	categorySelector.innerHTML = selectHTML;
	$('#categorySelectorArea').removeClass('hidden');
}

function setCurrentView(view, reverseTransition)
{
  console.log('setCurrentView(): ' + view + ' ' + reverseTransition);
  setTimeout(function() {
		window.scrollTo(0, 1);
		var entranceDirection = (reverseTransition ? 'left' : 'right');
		var exitDirection = (reverseTransition ? 'right' : 'left');
		var startPosition = (reverseTransition ? 'left' : 'right');
		var currentView = $('.view:visible');
		var newView = $('#' + view);
		if (currentView.size() == 0)
		{
			newView.show();
		}
		else if (currentView.attr('id') == newView.attr('id'))
		{
			newView.hide();
			newView.show('slide', { direction: entranceDirection }, 300);
		}
		else if ((newView.find('#keywordBox, #categoriesBox, #masterCategoriesBox').children().size() > 0)
						 || (currentView.find('#keywordBox, #categoriesBox, #masterCategoriesBox').children().size() > 0))
		{
			var zoomEntrance = reverseTransition ? 'zoomingin' : 'zoomingout';
			var zoomExit = reverseTransition ? 'zoomingout' : 'zoomingin';
			currentView.addClass('animating old');
			currentView.addClass(zoomExit);
			newView.addClass(zoomEntrance);
			newView.addClass('animating new');
			newView.removeClass(zoomEntrance);
			newView.show();
			setTimeout(function() {
				currentView.hide();
				currentView.removeClass('animating old ' + zoomExit);
				newView.removeClass('animating new');
			}, 300);
		}
		else
		{
			currentView.addClass('animating old');
			newView.addClass('animating new');
			currentView.hide('slide', { direction: exitDirection }, 300);
			newView.show('slide', { direction: entranceDirection }, 300);
			setTimeout(function() {
				currentView.removeClass('animating old ' + zoomExit);
				newView.removeClass('animating new');
			}, 300);
		}
  }, 0);
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
	updatePartCSS(activityIndicator, deviceVars.scrollProperty, (deviceVars.progressDialogTop + scrollTop), deviceVars.scrollValue);
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

