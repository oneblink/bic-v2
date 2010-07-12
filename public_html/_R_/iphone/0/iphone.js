// caching frequently-accessed selectors
var navBoxHeader = $('#navBoxHeader');
var pendingFormButton = $('#pendingFormButton');
var welcomeMessage = $('#welcomeMsgArea');
var mainLabel = $('#mainLabel');
var activityIndicator = $('#activityIndicator');
var activityIndicatorTop = $(window).height() / 2;

/*
 The purpose of the functions "prepare...ForDevice()" is to establish the
 buttons that can be displayed on the navBar and the function of the buttons
 where they differ.
 The visibility of the welcome/intro message is also controlled at this stage.
*/

function prepareAnswerSpacesListViewForDevice()
{
  console.log('prepareAnswerSpacesListViewForDevice()');
}

function prepareMasterCategoriesViewForDevice()
{
  console.log('prepareMasterCategoriesViewForDevice()');
}

function prepareCategoriesViewForDevice()
{
  console.log('prepareCategoriesViewForDevice()');
	var categoriesView = $('#categoriesView');
  if (hasMasterCategories)
  {
		categoriesView.find('.welcomeBox').addClass('hidden');
		categoriesView.find('.navBar').removeClass('hidden');
  }
  else
  {
		categoriesView.find('.welcomeBox').removeClass('hidden');
		categoriesView.find('.navBar').addClass('hidden');
  }
}

function prepareKeywordListViewForDevice(category)
{
  console.log('prepareKeywordListViewForDevice():' + (hasVisualCategories ? ' hasVisualCategories' : '')  + (hasMasterCategories ? ' hasMaterCategories' : ''));
	var keywordListView = $('#keywordListView');
	if (hasVisualCategories)
	{
		$('#backToMasterCategories').addClass('hidden');
		$('#backToCategories').removeClass('hidden');
		keywordListView.find('.welcomeBox').addClass('hidden');
		keywordListView.find('.navBar').removeClass('hidden');
	}
  else if (hasMasterCategories)
  {
		$('#backToMasterCategories').removeClass('hidden');
		$('#backToCategories').addClass('hidden');
		keywordListView.find('.welcomeBox').addClass('hidden');
		keywordListView.find('.navBar').removeClass('hidden');
  }
  else
  {
		keywordListView.find('.welcomeBox').removeClass('hidden');
		keywordListView.find('.navBar').addClass('hidden');
  }
}

function prepareKeywordViewForDevice(oneKeyword, showHelp)
{
  console.log('prepareKeywordViewForDevice(): ' + oneKeyword + ' ' + showHelp);
	var keywordView = $('#keywordView');
	if (oneKeyword)
	{
		keywordView.find('.backButton').addClass('hidden');
	}
	else
	{
		keywordView.find('.backButton').removeClass('hidden');
	}
	if (showHelp)
	{
		keywordView.find('.helpButton').removeClass('hidden');
	}
	else
	{
		keywordView.find('.helpButton').addClass('hidden');
	}
}

function prepareAnswerViewForDevice()
{
  console.log('prepareAnswerViewForDevice()');
}

function prepareSecondLevelAnswerViewForDevice()
{
  console.log('prepareSecondLevelAnswerViewForDevice()');
	var answerView = $('#answerView2');
	var backButton = answerView.find('.backButton');
  backButton.unbind('click');
  backButton.removeClass('hidden');
  backButton.click(function(event) {
	 goBackToTopLevelAnswerView();
  });
  answerView.find('.helpButton').addClass('hidden');
  answerView.find('.pendingFormButton').removeClass('hidden');
}

function prepareHelpViewForDevice()
{
  console.log('prepareHelpViewForDevice()');
	var helpView = $('#helpView');
  helpView.find('#backButton').addClass('hidden');
  helpView.find('#helpButton').removeClass('hidden');
  helpView.find('#pendingFormButton').addClass('hidden');
}

function prepareLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
}

function prepareNewLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
  backButtonHeader.unbind('click');
  backButtonHeader.removeClass('hidden');
  backButtonHeader.click(function(event) {
		prepareLoginViewForDevice();
		setCurrentView('loginView', true, true); 
  });
  helpButton.addClass('hidden');
  pendingFormButton.addClass('hidden');
}

function prepareActivateLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
  backButtonHeader.unbind('click');
  backButtonHeader.removeClass('hidden');
  backButtonHeader.click(function(event) {
	 goBackToKeywordListView();
  });
  helpButton.addClass('hidden');
  pendingFormButton.addClass('hidden');
}

function stopInProgressAnimation()
{
	activityIndicator.addClass('hidden');
}

function startInProgressAnimation()
{
  activityIndicator.removeClass('hidden');
}

function populateTextOnlyCategories(masterCategory)
{
	console.log('populateTextOnlyCategories(): ' + masterCategory);
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var html = "<select id='categoriesList' onchange=\"showKeywordListView(this.options[this.selectedIndex].value)\">"
	for (id in order)
	{
		html += "<option value=\"" + order[id] + "\"" + (order[id] == currentCategory ? " selected" : "") + ">" + list[order[id]].name + "</option>";
	}
	html += "</select>";
	$('#categorySelector').html(html);
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
	$('.navBar').css('top', '0px');
	activityIndicator.css('top', activityIndicatorTop);
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

var loginButton = $('#loginButton');
var loginStatus = $('#loginStatus');
function onScroll()
{
	var headerHeight = $('.header').height();
	if (!loginButton.hasClass('hidden'))
		headerHeight += loginButton.height();
	if (!loginStatus.hasClass('hidden'))
		headerHeight += loginStatus.height();
	var scrollTop = $(window).scrollTop();
	var navBars = $('.navBar');
	if (scrollTop > headerHeight)
	{
		var offset = scrollTop - headerHeight - 8;
		navBars.css('top', offset + 'px');
	}
	else
	{
		navBars.css('top', '0px');
	}
	activityIndicator.css('top', activityIndicatorTop + scrollTop);
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
	squareButtons.show();
}
