// caching frequently-accessed selectors
var navBoxHeader = $('#navBoxHeader');
var backButtonHeader = $('#backButtonHeader');
var backButtonHeaderFn;
var pendingFormButton = $('#pendingFormButton');
var helpButton = $('#helpButton');
var welcomeMessage = $('#welcomeMsgArea');
var mainLabel = $('#mainLabel');

/*
 The purpose of the functions "prepare...ForDevice()" is to establish the
 buttons that can be displayed on the navBar and the function of the buttons
 where they differ.
 The visibility of the welcome/intro message is also controlled at this stage.
*/

function prepareMasterCategoriesViewForDevice()
{
  console.log('prepareMasterCategoriesViewForDevice()');
/*  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'none');
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none'); */
	hideNavBoxHeader();
  showWelcomeMessage();
}

function prepareCategoriesViewForDevice()
{
  console.log('prepareCategoriesViewForDevice()');
  if (hasMasterCategories)
  {
	  backButtonHeader.unbind('click', backButtonHeaderFn);
		backButtonHeaderFn = function(event) {
			goBackToMasterCategoriesView();
		};
		backButtonHeader.bind('click', backButtonHeaderFn);
		backButtonHeader.show();
		hideWelcomeMessage();
		showNavBoxHeader();
  }
  else
  {
		hideNavBoxHeader();
		showWelcomeMessage();
		//backButtonHeader.css('display', 'none');
  }
  //helpButton.css("display", 'none');
  //pendingFormButton.css('display', 'none');
}

function prepareKeywordListViewForDevice(category)
{
  console.log('prepareKeywordListViewForDevice():' + (hasVisualCategories ? ' hasVisualCategories' : '')  + (hasMasterCategories ? ' hasMaterCategories' : ''));
  if (hasVisualCategories || hasMasterCategories)
  {
	  backButtonHeader.unbind('click', backButtonHeaderFn);
		backButtonHeaderFn = hasMasterCategories ? goBackToMasterCategoriesView : goBackToCategoriesView;
		backButtonHeader.bind('click', backButtonHeaderFn);
		backButtonHeader.show();
	  helpButton.hide();
		pendingFormButton.hide();
		hideWelcomeMessage();
		showNavBoxHeader();
  }
  else
  {
		hideNavBoxHeader();
		showWelcomeMessage();
  }
}

function prepareKeywordViewForDevice(oneKeyword, showHelp)
{
  console.log('prepareKeywordViewForDevice(): ' + oneKeyword + ' ' + showHelp);
	hideWelcomeMessage();
	if (!oneKeyword)
	{
	  backButtonHeader.unbind('click', backButtonHeaderFn);
		backButtonHeaderFn = function(event) {
		 goBackToKeywordListView();
		};
		backButtonHeader.bind('click', backButtonHeaderFn);
		backButtonHeader.show();
	}
	else
	{
		backButtonHeader.hide();
	}
	if (showHelp)
	{
		helpButton.show();
	}
	else
	{
		helpButton.hide();
	}
  pendingFormButton.show();
	showNavBoxHeader();
}

function prepareAnswerViewForDevice()
{
  console.log('prepareAnswerViewForDevice()');
	hideWelcomeMessage();
  backButtonHeader.unbind('click', backButtonHeaderFn);
  backButtonHeaderFn = function(event) {
	 goBackToKeywordListView(currentCategory);
  };
	backButtonHeader.bind('click', backButtonHeaderFn);
  backButtonHeader.show();
  helpButton.hide();
  pendingFormButton.show();
	showNavBoxHeader();
}

function prepareSecondLevelAnswerViewForDevice()
{
  console.log('prepareSecondLevelAnswerViewForDevice()');
	hideWelcomeMessage();
  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'block');
  backButtonHeader.click(function(event) {
	 goBackToTopLevelAnswerView();
  });
  helpButton.css('display', 'none');
  pendingFormButton.css('display', 'block');
}

function prepareOldViewForDevice()
{
  console.log('prepareOldViewForDevice()');
	hideWelcomeMessage();
  var oldView = $('#oldView');
  var currentView = $('#stackLayout > .view:visible');
  oldView.empty();
  oldView.show();
  currentView.contents().clone().appendTo(oldView);
  currentView.hide();
}

function prepareHelpViewForDevice()
{
  console.log('prepareHelpViewForDevice()');
	hideWelcomeMessage();
  backButtonHeader.css('display', 'none');
  helpButton.css('display', 'block');
  pendingFormButton.css('display', 'none');
}

function prepareLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
	hideWelcomeMessage();
	hideNavBoxHeader();
}

function prepareNewLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
	hideWelcomeMessage();
  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'block');
  backButtonHeader.click(function(event) {
		prepareLoginViewForDevice();
		setCurrentView('loginView', true, true); 
  });
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
}

function prepareActivateLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
	hideWelcomeMessage();
  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'block');
  backButtonHeader.click(function(event) {
	 goBackToKeywordListView();
  });
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
}

var activityIndicator = $('#activityIndicator');
function stopInProgressAnimation()
{
  activityIndicator.hide();
	activityIndicator.removeClass('animating');
}

function startInProgressAnimation()
{
	activityIndicator.show();
  activityIndicator.addClass('animating');
}

function populateTextOnlyCategories(masterCategory)
{
	console.log('populateTextOnlyCategories(): ' + masterCategory);
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var html = "<select id='categoriesList' onchange=\"showKeywordListView(this.options[this.selectedIndex].value)\">"
	for (id in order)
	{
		html += "<option value=\"" + order[id] + "\">" + list[order[id]].name + "</option>";
	}
	html += "</select>";
	$('#categorySelector').html(html);
	currentCategory = currentCategory ? currentCategory : siteConfig.default_category;
}

function setCurrentView(view, reverseTransition)
{
  console.log('setCurrentView(): ' + view + ' ' + reverseTransition);
	setupParts();
  var entranceDirection = (reverseTransition ? 'left' : 'right');
  var exitDirection = (reverseTransition ? 'right' : 'left');
  var startPosition = (reverseTransition ? 'left' : 'right');
  var currentView = $('#' + $('#stackLayout > .view:visible').attr('id'));
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
  window.scrollTo(0, 0);
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

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
	squareButtons.show();
}

function showWelcomeMessage()
{
	welcomeMessage.filter(':hidden').addClass('sliding').show('slide', { direction: 'left' }, 300, function() {
		welcomeMessage.removeClass('sliding');
	});
}

function hideWelcomeMessage()
{
	welcomeMessage.filter(':visible').addClass('sliding').hide('slide', { direction: 'right' }, 300, function() {
		welcomeMessage.removeClass('sliding');
	});
}

function showNavBoxHeader()
{
	navBoxHeader.filter(':hidden').addClass('sliding').show('slide', { direction: 'left' }, 300, function() {
		navBoxHeader.removeClass('sliding');
	});
}

function hideNavBoxHeader()
{
	navBoxHeader.filter(':visible').addClass('sliding').hide('slide', { direction: 'right' }, 300, function() {
		navBoxHeader.removeClass('sliding');
	});
}
