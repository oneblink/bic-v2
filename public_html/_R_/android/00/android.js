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
}

function prepareCategoriesViewForDevice()
{
	var categoriesView = $('#categoriesView');
  if (hasMasterCategories)
  {
		categoriesView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
  }
  else
  {
		categoriesView.find('.welcomeBox').removeClass('hidden');
		navBoxHeader.addClass('hidden');
  }
}

function prepareKeywordListViewForDevice(category)
{
	var keywordListView = $('#keywordListView');
	if (hasVisualCategories)
	{
		keywordListView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
	}
  else if (hasMasterCategories)
  {
		keywordListView.find('.welcomeBox').addClass('hidden');
		navBoxHeader.removeClass('hidden');
  }
  else
  {
		keywordListView.find('.welcomeBox').removeClass('hidden');
		navBoxHeader.addClass('hidden');
  }
}

function prepareKeywordViewForDevice(oneKeyword, showHelp)
{
	if (oneKeyword)
	{
		navBoxHeader.addClass('hidden');
	}
	else
	{
		navBoxHeader.removeClass('hidden');
	}
	if (showHelp)
	{
		navBoxHeader.find('.helpButton').removeClass('hidden');
	}
	else
	{
		navBoxHeader.find('.helpButton').addClass('hidden');
	}
}

function prepareAnswerViewForDevice()
{
}

function prepareSecondLevelAnswerViewForDevice()
{
	navBoxHeader.removeClass('hidden');
  navBoxHeader.find('.helpButton').addClass('hidden');
  navBoxHeader.find('.pendingFormButton').removeClass('hidden');
}

function prepareHelpViewForDevice()
{
	var helpView = $('#helpView');
	navBoxHeader.removeClass('hidden');
  helpView.find('#backButton').addClass('hidden');
  helpView.find('#helpButton').removeClass('hidden');
  helpView.find('#pendingFormButton').addClass('hidden');
}

function prepareLoginViewForDevice()
{
	navBoxHeader.removeClass('hidden');
}

function prepareNewLoginViewForDevice()
{
	navBoxHeader.removeClass('hidden');
  navBoxHeader.find('.helpButton').addClass('hidden');
  navBoxHeader.find('.pendingFormButton').addClass('hidden');
}

function prepareActivateLoginViewForDevice()
{
	navBoxHeader.removeClass('hidden');
  navBoxHeader.find('.helpButton').addClass('hidden');
  navBoxHeader.find('.pendingFormButton').addClass('hidden');
}

function stopInProgressAnimation()
{
	//activityIndicator.addClass('hidden');
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
		scrollToY(0);
	}, 0);
	//updatePartCSS(activityIndicator, scrollProperty, activityIndicatorTop, scrollValue);
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

function scrollToY(y)
{
			var ms = 350; // number of milliseconds
			var top = parseFloat(content[0].style.top);
			var currentTop = (top < 0) ? -(top) : top;
			var chunks = (currentTop / 100);
			var totalTime = (ms * chunks);
			totalTime = (totalTime > 500) ? 500 : totalTime;
			//content[0].style.webkitTransition = "top " + totalTime + "ms cubic-bezier(0.1, 0.25, 0.1, 1.0)";
			content[0].style.webkitTransition = "top " + totalTime + "ms linear";
			content[0].style.top = y + "px";
			setTimeout(function() {
				content[0].style.webkitTransition = "none";
			}, totalTime);
}

function initScroll(event)
{
	event = event.originalEvent;
	startTime = event.timeStamp;
	startY = event.touches[0].clientY;
	content.focus();
	content.blur();
}

function performScroll(event)
{
	event = event.originalEvent;
	var posY = event.touches[0].pageY;
	oldY = oldY || posY;
	if (!content[0].style.top) {
		content[0].style.top = 0 + "px";
	}
	var value;
	var boundary = (container[0].offsetHeight - content[0].offsetHeight);
	if (posY > oldY) {
		value = parseFloat(content[0].style.top) + (posY - oldY);
		if (value <= 0) {
			content[0].style.top = value + "px";
		} else {
			content[0].style.top = (value * 0.9) + "px";
		}
	} else if (posY < oldY) {
		value = parseFloat(content[0].style.top) - (oldY - posY);
		if (value >= boundary) {
			content[0].style.top = value + "px";
		}
	}
	oldY = posY;
	event.preventDefault();
}

function endScroll(event)
{
	event = event.originalEvent;
	endY = event.changedTouches[0].clientY;
	endTime = event.timeStamp;
	var posY = parseFloat(content[0].style.top);
	if (posY > 0) {
		scrollToY(0);
	} else {
		var distance = startY - endY;
		var time = endTime - startTime;
		var speed = Math.abs(distance / time);
		var y = parseFloat(content[0].style.top) - (distance * speed);
		if ((time < 600) && distance > 50) {
			y = y + (y * 0.2);
		}
		var boundary = (container[0].offsetHeight - content[0].offsetHeight);
		y = (y <= boundary) ? boundary : (y > 0) ? 0 : y;
		scrollToY(y);
	}
	delete oldY;
	console.log("container:" + container[0].offsetHeight + " content:" + content[0].offsetHeight);
	console.log("startY:" + startY + " endY:" + endY + " y:" + y);
}

var loginButton = $('#loginButton');
function onScroll()
{
	var headerBottom = $('.header').height() + loginButton.height() + $('#loginStatus').height();
	var scrollTop = $(window).scrollTop();
	if (scrollTop > headerBottom)
	{
		var offset = scrollTop - headerBottom - (loginButton.size() > 0 ? 8 : 0);
		updatePartCSS(navBar, scrollProperty, offset, scrollValue);
	}
	else
	{
		updatePartCSS(navBar, scrollProperty, '0', scrollValue);
	}
	updatePartCSS(activityIndicator, scrollProperty, (activityIndicatorTop + scrollTop), scrollValue);
}

function updatePartCSS(element, property, value, valueFormat)
{
	var formattedValue = (value + '').replace(/(\d+)/, valueFormat);
	element.css(property, formattedValue);
}

function setupParts()
{
}