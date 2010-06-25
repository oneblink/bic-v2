// caching frequently-accessed selectors
var backButtonHeader = $('#backButtonHeader');
var pendingFormButton = $('#pendingFormButton');
var helpButton = $('#helpButton');

/*
 The purpose of the functions "prepare...ForDevice()" is to establish the
 buttons that can be displayed on the navBar and the function of the buttons
 where they differ.
 The visibility of the leftBox is also controlled at this stage.
*/

function prepareMasterCategoriesViewForDevice()
{
  console.log('prepareMasterCategoriesViewForDevice()');
  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'none');
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
  showWelcomeMessage();
}

function prepareCategoriesViewForDevice()
{
  console.log('prepareCategoriesViewForDevice()');
  backButtonHeader.unbind('click');
  if (hasMasterCategories)
  {
	 backButtonHeader.css('display', 'block');
	 backButtonHeader.click(function(event) {
		goBackToMasterCategoriesView();
	 });
	 hideWelcomeMessage();
  }
  else
  {
	 showWelcomeMessage();
	 backButtonHeader.css('display', 'none');
  }
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
}

function prepareKeywordListViewForDevice(category)
{
  console.log('prepareKeywordListViewForDevice()');
  backButtonHeader.unbind('click');
  if (hasVisualCategories)
  {
		backButtonHeader.css('display', 'block');
		backButtonHeader.click(function(event) {
			goBackToCategoriesView();
		});
  }
  else if (hasMasterCategories)
  {
		backButtonHeader.css('display', 'block');
		backButtonHeader.click(function(event) {
		goBackToMasterCategoriesView();
    });
  }
  else
  {
		backButtonHeader.css('display', 'none');
  }
  if (hasVisualCategories || hasMasterCategories)
  {
		hideWelcomeMessage();
  }
  else
  {
		showWelcomeMessage();
  }
  helpButton.css('display', 'none');
  pendingFormButton.css('display', 'none');
	setTimeout(function() {
		$('#keywordListView').width($('#navBoxHeader').width() - 20);
	}, 0.0 * 1000);
}

function prepareKeywordViewForDevice(showBack, showHelp)
{
  console.log('prepareKeywordViewForDevice(): ' + showBack + ' ' + showHelp);
  backButtonHeader.unbind('click');
  backButtonHeader.css("display", !showBack ? 'block' : 'none');
  backButtonHeader.click(function(event) {
	 goBackToKeywordListView();
  });
  helpButton.css("display", showHelp ? 'block' : 'none');
  pendingFormButton.css('display', 'block');
}

function prepareAnswerViewForDevice()
{
  console.log('prepareAnswerViewForDevice()');
  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'block');
  backButtonHeader.click(function(event) {
	 goBackToKeywordListView(currentCategory);
  });
  helpButton.css('display', 'none');
  pendingFormButton.css('display', 'block');
}

function prepareSecondLevelAnswerViewForDevice()
{
  console.log('prepareSecondLevelAnswerViewForDevice()');
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
  var oldView = $('#oldView');
  var currentView = $('.view:visible');
  oldView.empty();
  oldView.show();
  currentView.contents().clone().appendTo(oldView);
  currentView.hide();
}

function prepareHelpViewForDevice()
{
  console.log('prepareHelpViewForDevice()');
  backButtonHeader.css('display', 'none');
  helpButton.css('display', 'block');
  pendingFormButton.css('display', 'none');
}

function prepareLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'block');
  backButtonHeader.click(function(event) {
	 goBackToKeywordListView();
  });
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
}

function prepareNewLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
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
  backButtonHeader.unbind('click');
  backButtonHeader.css('display', 'block');
  backButtonHeader.click(function(event) {
	 goBackToKeywordListView();
  });
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
}

function stopInProgressAnimation()
{
  $('#activityIndicator').css('display', 'none');
}

function startInProgressAnimation()
{
  $('#activityIndicator').css('display', 'block');
}

function populateTextOnlyCategories(masterCategory)
{
	console.log('populateTextOnlyCategories(): ' + masterCategory);
	$('#leftLabel').html(hasMasterCategories? siteConfig.master_categories[masterCategory].name : 'Categories');
	var leftContent = $('#leftContent');
	leftContent.empty();
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var html = "<ul id='categoriesList'>"
	for (id in order)
	{
		html += "<a onclick=\"showKeywordListView('" + order[id] + "')\">";
		html += "<li id='leftcategory" + order[id] + "'>" + list[order[id]].name + "</li>";
		html += "</a>";
	}
	html += "</ul>";
	leftContent.append(html);
	currentCategory = currentCategory ? currentCategory : siteConfig.default_category;
	$('#leftcategory' + currentCategory).addClass('selected');
}

function setCurrentView(view, reverseTransition)
{
	hideWelcomeMessage();
  console.log('setCurrentView(): ' + view + ' ' + reverseTransition);
  var entranceDirection = (reverseTransition ? 'slidingLeft' : 'slidingRight');
  var exitDirection = (reverseTransition ? 'slidingRight' : 'slidingLeft');
  var startPosition = (reverseTransition ? 'slidLeft' : 'slidRight');
  var currentView = $('#' + $('.view:visible').attr('id'));
  var newView = $('#' + view);
  if (currentView.size() == 0)
  {
	 newView.show();
  }
  else if (currentView.attr('id') == newView.attr('id'))
  {
	 currentView.hide();
	 newView.addClass(startPosition);
	 newView.show();
	 newView.addClass(entranceDirection);
	 setTimeout(function() {
		newView.removeClass(startPosition + ' ' + entranceDirection);
	 }, 0.3 * 1000);
  }
  else
  {
	 currentView.addClass(exitDirection);
	 setTimeout(function() {
		currentView.hide();
		currentView.removeClass(exitDirection);
	 }, 0.3 * 1000);
	 newView.addClass(startPosition);
	 newView.show();
	 newView.addClass(entranceDirection);
	 setTimeout(function() {
		newView.removeClass(startPosition + ' ' + entranceDirection);
	 }, 0.3 * 1000);
  }
  window.scrollTo(0, 0);
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

var welcomeMessage = $('#welcomeMsgArea');
function showWelcomeMessage()
{
	setTimeout(function() {
		$('#welcomeMsgArea').width($('#navBoxHeader').width() - 20);
	}, 0.0 * 1000);
	welcomeMessage.show();
}

function hideWelcomeMessage()
{
	welcomeMessage.hide();
}
