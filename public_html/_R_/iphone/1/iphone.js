var navBoxHeader, navBar;
var navButtons;
var helpButton;
var pendingFormButton, pendingFormButtonTop;
var welcomeMessage;
var mainLabel;
var activityIndicator, activityIndicatorTop;

function init_device()
{
	console.log('init_device()');
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = deviceVars.engineVersion != null ? deviceVars.engineVersion[1] : 525;
	deviceVars.useCSS3animations = deviceVars.engineVersion >= 532; // iOS 4 doesn't uglify forms
	deviceVars.useCSS3buttons = deviceVars.engineVersion >= 531; // iOS 3.2 understand border-image
	deviceVars.scrollProperty = deviceVars.engineVersion >= 532 ? '-webkit-transform' : 'top';
	deviceVars.scrollValue = deviceVars.engineVersion >= 532 ? 'translateY($1px)' : '$1px';

	deviceVars.device = "iphone";
	
	// caching frequently-accessed selectors
	navBoxHeader = $('#navBoxHeader');
	navButtons = $("#homeButton, #backButton");
	helpButton = $('#helpButton');
	pendingFormButton = $('#pendingButton');
	welcomeMessage = $('#welcomeMsgArea');
	mainLabel = $('#mainLabel');
	activityIndicator = $('#activityIndicator');
	navBar = $('.navBar');
	activityIndicatorTop = Math.floor($(window).height() / 2);
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
	select.setAttribute('id', 'categoriesList');
	for (id in order)
	{
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
  console.log('setCurrentView(): ' + view + ' ' + reverseTransition);
	setTimeout(function() {
		setupParts();
		window.scrollTo(0, 1);
		var entranceDirection = (reverseTransition ? 'left' : 'right');
		var endPosition = (reverseTransition ? 'right' : 'left');
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
			newView.addClass('slid' + startPosition);
			newView.show();
			setTimeout(function() {
				newView.addClass('animating');
				newView.removeClass('slid' + startPosition)
			}, 0);
			setTimeout(function() {
				newView.removeClass('animating');
			}, 300);
		}
		else
		{
			newView.hide();
			newView.addClass('slid' + startPosition);
			currentView.addClass('animating');
			newView.show();
			newView.addClass('animating');
			setTimeout(function() {
				newView.removeClass('slid' + startPosition)
				currentView.addClass('slid' + endPosition)
			}, 0);
			setTimeout(function() {
				newView.removeClass('animating');
				currentView.hide();
				currentView.removeClass('animating slid' + endPosition);
			}, 300);
		}
		setTimeout(function() {
			onScroll();
		}, 350);
	}, 0);
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

function onScroll()
{
	var headerBottom = $('.header').height();
	var scrollTop = window.scrollY;
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
	if (deviceVars.useCSS3buttons === false)
	{
		$('.backButton').each(function(index, element) {
			var thisElement = $(element);
			insertHTML(element, '<div class="backButtonLeft"></div><div class="buttonLabel">' + thisElement.text() +  '</div><div class="backButtonRight"></div>');
		});
		$('.roundButton').each(function(index, element) {
			var thisElement = $(element);
			insertHTML(element, '<div class="roundButtonLeft"></div><div class="buttonLabel">' + thisElement.text() +  '</div><div class="roundButtonRight"></div>');
		});
		$('.squareButton').each(function(index, element) {
			var thisElement = $(element);
			insertHTML(element, '<div class="squareButtonLeft"></div><div class="buttonLabel">' + thisElement.text() +  '</div><div class="squareButtonRight"></div>');
		});
	}
}

(function() {
  var timer = setInterval(function() {
		if (typeof(MyAnswers.device_Loaded) != 'undefined') {
			try {
				MyAnswers.device_Loaded = true;
				clearInterval(timer);
			} catch(e) {
				console.log("***** Unable to set: MyAnswers.device_Loaded => true");
			}
		}
  }, 100);
})();
