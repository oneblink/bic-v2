var deviceVars = {}, siteVars = {};

// ** extract iOS version number **

deviceVars.majorVersion = navigator.userAgent.match(/ OS (\d+)_/);
deviceVars.majorVersion = typeof(deviceVars.majorVersion) == 'array' ? deviceVars.majorVersion[1] : 3;
deviceVars.minorVersion = navigator.userAgent.match(/ OS \d+_(\d+)/);
deviceVars.minorVersion = typeof(deviceVars.minorVersion) == 'array' ? deviceVars.minorVersion[1] : 1;
deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
deviceVars.engineVersion = typeof(deviceVars.engineVersion) == 'array' ? deviceVars.engineVersion[1] : 525;
// ** device-specific initialisation of variables and flags **

siteVars.serverDomain = location.hostname;
siteVars.serverAppVersion = location.pathname.match(/_R_\/iphone\/(\d+)\//)[1];
siteVars.serverAppPath = 'http://' + siteVars.serverDomain + '/_R_/common/' + siteVars.serverAppVersion;
siteVars.serverDevicePath = 'http://' + siteVars.serverDomain + '/_R_/iphone/' + siteVars.serverAppVersion;
siteVars.answerSpace = location.href.match(/answerSpace=(\w+)/)[1];

deviceVars.device = "iphone";
deviceVars.storageReady = false;
deviceVars.storageAvailable = false;

deviceVars.scrollProperty = (deviceVars.majorVersion >= 4) ? '-webkit-transform' : 'top';
deviceVars.scrollValue = (deviceVars.majorVersion >= 4) ? 'translateY($1px)' : '$1px';
deviceVars.doButtonBorders = deviceVars.engineVersion >= 531;

jStore.error(function(e) {
	console.log('jStore: ' + e);
});
jStore.init(siteVars.answerSpace, { flash: siteVars.serverAppPath + '/jStore.Flash.html', json: siteVars.serverAppPath + '/browser-compat.js' }, jStore.flavors.sql);
jStore.engineReady(function(engine) {
	console.log('jStore using: ' + engine.jri);
	deviceVars.storageReady = engine.isReady;
	loaded();
});
$(window).load(function() {
	for (e in jStore.available)
	{
		if (jStore.available[e])
		{
			deviceVars.storageAvailable = true;
			break;
		}
	}
	if (!deviceVars.storageAvailable)
		loaded();
	$(window).scroll(onScroll);
	$('input').live('blur', function() { $(window).trigger('scroll'); });
	if ($('#loginStatus') > 0)
		siteVars.hasLogin = true;
});

// caching frequently-accessed selectors
var navBoxHeader = $('#navBoxHeader');
var navButtons = $("#homeButton, #backButton");
var helpButton = $('#helpButton');
var pendingFormButton = $('#pendingFormButton');
var welcomeMessage = $('#welcomeMsgArea');
var mainLabel = $('#mainLabel');
var activityIndicator = $('#activityIndicator');
var navBar = $('.navBar');
var activityIndicatorTop = Math.floor($(window).height() / 2);

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
		categoriesView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
		navButtons.removeClass('hidden');
  }
  else
  {
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
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareHelpViewForDevice()
{
	var helpView = $('#helpView');
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareLoginViewForDevice()
{
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareNewLoginViewForDevice()
{
	navBoxHeader.removeClass('hidden');
	navButtons.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareActivateLoginViewForDevice()
{
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
	var select = document.createElement('select');
	$(select).attr('id', 'categoriesList');
	$(select).bind('change', function() {
	 showKeywordListView(this.options[this.selectedIndex].value);
	});
	for (id in order)
	{
		var option = document.createElement('option');
		$(option).attr('value', order[id]);
		if (order[id] == currentCategory)
			$(option).attr('selected', 'true');
		$(option).html(list[order[id]].name);
		$(option).appendTo(select);
	}
	$('#categorySelector').empty().append(select);
	$('#categorySelectorArea').removeClass('hidden');
	//currentCategory = currentCategory ? currentCategory : siteConfig.default_category;
}

function setCurrentView(view, reverseTransition)
{
  console.log('setCurrentView(): ' + view + ' ' + reverseTransition);
	setupParts();
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
		newView.addClass('sliding');
		newView.show('slide', { direction: entranceDirection }, 300, function() {
			newView.removeClass('sliding');
		});
  }
  else
  {
		currentView.addClass('sliding');
		currentView.hide('slide', { direction: exitDirection }, 300, function() {
			currentView.removeClass('sliding');
		});
		newView.addClass('sliding');
		newView.show('slide', { direction: entranceDirection }, 300, function() {
			newView.removeClass('sliding');
		});
  }
	setTimeout(function() {
		window.scrollTo(0, 1);
	}, 0);
	updatePartCSS(navBar, deviceVars.scrollProperty, '0', deviceVars.scrollValue);
	updatePartCSS(activityIndicator, deviceVars.scrollProperty, activityIndicatorTop, deviceVars.scrollValue);
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
		updatePartCSS(navBar, deviceVars.scrollProperty, offset, deviceVars.scrollValue);
	}
	else
	{
		updatePartCSS(navBar, deviceVars.scrollProperty, '0', deviceVars.scrollValue);
	}
	updatePartCSS(activityIndicator, deviceVars.scrollProperty, (activityIndicatorTop + scrollTop), deviceVars.scrollValue);
}

function updatePartCSS(element, property, value, valueFormat)
{
	var formattedValue = (value + '').replace(/(\d+)/, valueFormat);
	element.css(property, formattedValue);
}

function setupParts()
{
	var backButtons = $('.backButton');
	backButtons.each(function(index, element) {
		var thisElement = $(element);
		thisElement.html('<div class="backButtonLeft"></div><div class="buttonLabel">' + thisElement.text() +  '</div><div class="backButtonRight"></div>');
	});
	var roundButtons = $('.roundButton');
	roundButtons.each(function(index, element) {
		var thisElement = $(element);
		thisElement.html('<div class="roundButtonLeft"></div><div class="buttonLabel">' + thisElement.text() +  '</div><div class="roundButtonRight"></div>');
	});
	var squareButtons = $('.squareButton');
	squareButtons.each(function(index, element) {
		var thisElement = $(element);
		thisElement.html('<div class="squareButtonLeft"></div><div class="buttonLabel">' + thisElement.text() +  '</div><div class="squareButtonRight"></div>');
	});
}