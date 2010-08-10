// caching frequently-accessed selectors
var navBoxHeader = $('#navBoxHeader');
var welcomeMessage = $('#welcomeMsgArea');
var mainLabel = $('#mainLabel');
var activityIndicator = $('#activityIndicator');
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
	$.bbq.removeState();
	categoriesView.find('.welcomeBox').removeClass('hidden');
	navBoxHeader.addClass('hidden');
}

function prepareCategoriesViewForDevice()
{
	var categoriesView = $('#categoriesView');
  if (hasMasterCategories)
  {
		$.bbq.pushState({ m: currentMasterCategory }, 2);
		categoriesView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
  }
  else
  {
		$.bbq.removeState();
		categoriesView.find('.welcomeBox').removeClass('hidden');
		navBoxHeader.addClass('hidden');
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
	}
  else if (hasMasterCategories)
  {
		keywordListView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
		hashState['m'] = currentMasterCategory;
  }
  else
  {
		keywordListView.find('.welcomeBox').removeClass('hidden');
		navBoxHeader.addClass('hidden');
  }
	$.bbq.pushState(hashState, 2);
}

function prepareKeywordViewForDevice(oneKeyword, showHelp)
{
	$.bbq.pushState({ k: currentKeyword }, 2);
	if (oneKeyword)
		navBoxHeader.addClass('hidden');
	else
		navBoxHeader.removeClass('hidden');
	if (showHelp)
		navBoxHeader.find('.helpButton').removeClass('hidden');
	else
		navBoxHeader.find('.helpButton').addClass('hidden');
}

function prepareAnswerViewForDevice()
{
	$.bbq.pushState({ a: currentKeyword }, 2);
	if (answerSpaceOneKeyword)
		navBoxHeader.addClass('hidden');
	else
		navBoxHeader.removeClass('hidden');
}

function prepareSecondLevelAnswerViewForDevice(keyword, arg)
{
	$.bbq.pushState({ a2k: keyword, a2a: arg }, 2);
	navBoxHeader.removeClass('hidden');
  navBoxHeader.find('.helpButton').addClass('hidden');
}

function prepareHelpViewForDevice()
{
	$.bbq.pushState({ h: 'H' });
	var helpView = $('#helpView');
	navBoxHeader.removeClass('hidden');
  helpView.find('#backButton').addClass('hidden');
  helpView.find('#helpButton').removeClass('hidden');
}

function prepareLoginViewForDevice()
{
	$.bbq.pushState({ l: 'L' }, 2);
	navBoxHeader.removeClass('hidden');
  navBoxHeader.find('.helpButton').addClass('hidden');
}

function prepareNewLoginViewForDevice()
{
	$.bbq.pushState({ l: 'N' }, 2);
	navBoxHeader.removeClass('hidden');
  navBoxHeader.find('.helpButton').addClass('hidden');
}

function prepareActivateLoginViewForDevice()
{
	$.bbq.pushState({ l: 'A' }, 2);
	navBoxHeader.removeClass('hidden');
  navBoxHeader.find('.helpButton').addClass('hidden');
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
  var currentView = $('#' + $('#stackLayout > .view:visible').attr('id'));
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
	else if ((newView.find('#keywordBox > a, #categoriesBox > a, #masterCategoriesBox > a').size() > 0)
					 || (currentView.find('#keywordBox > a, #categoriesBox > a, #masterCategoriesBox > a').size() > 0))
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
		currentView.hide('slide', { direction: exitDirection }, 300);
		newView.show('slide', { direction: entranceDirection }, 300);
  }
	setTimeout(function() {
		window.scrollTo(0, 1);
	}, 0);
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

function setupParts()
{
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
	var hashState = event.getState();
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

