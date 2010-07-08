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

function prepareAnswerSpacesListViewForDevice()
{
  console.log('prepareAnswerSpacesListViewForDevice()');
  backButtonHeader.css('display', 'none');
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
  hideLeftBox();
	$('#mainLabel').html('answerSpaces');
}

function prepareMasterCategoriesViewForDevice()
{
  console.log('prepareMasterCategoriesViewForDevice()');
  backButtonHeader.css('display', 'none');
  helpButton.css("display", 'none');
  pendingFormButton.css('display', 'none');
  hideLeftBox();
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
	 populateLeftBoxWithMasterCategories();
	 showLeftBox();
  }
  else
  {
	 hideLeftBox();
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
  if (hasCategories)
  {
		populateLeftBoxWithCategories(currentMasterCategory);
		showLeftBox();
  }
  else if (hasMasterCategories)
  {
		populateLeftBoxWithMasterCategories();
		showLeftBox();
  }
  helpButton.css('display', 'none');
  pendingFormButton.css('display', 'none');
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

var activityIndicator = $('#activityIndicator');
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
  console.log('setCurrentView(): ' + view + ' ' + reverseTransition);
  var entranceDirection = (reverseTransition ? 'left' : 'right');
  var exitDirection = (reverseTransition ? 'right' : 'left');
  var startPosition = (reverseTransition ? 'left' : 'right');
  var currentView = $('#' + $('.view:visible').attr('id'));
  var newView = $('#' + view);
  if (currentView.size() == 0)
  {
/*		newView.show('slide', { direction: entranceDirection }, 300, function() {
			newView.removeClass('sliding');
		}); */
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

function showLeftBox()
{
  if (!$('#leftBox').hasClass('leftShown'))
  {
	 console.log('showLeftBox()');
	 $('#stackLayout').addClass('leftShown');
	 $('#leftBox').addClass('leftShown');
  }
}

function hideLeftBox()
{
  if ($('#leftBox').hasClass('leftShown'))
  {
	 console.log('hideLeftBox()');
	 $('#stackLayout').removeClass('leftShown');
	 $('#leftBox').removeClass('leftShown');
  }
}

function populateLeftBoxWithMasterCategories()
{
	console.log('populateLeftBoxWithMasterCategories()');
	var leftContent = $('#leftContent');
	var alreadyDone = $('#leftLabel').html() == 'Master Categories';
	if (alreadyDone)
	{
		leftContent.find('.selected').removeClass('selected');
		var selected = $('#leftmaster' + currentMasterCategory);
		selected.addClass('selected');
		selected.addClass('animating hidden');
		setTimeout(function() {
			$('#leftmaster' + currentMasterCategory).removeClass('hidden');
		}, 0.2 * 1000);
		setTimeout(function() {
			$('#leftmaster' + currentMasterCategory).removeClass('animating');
		}, 0.4 * 1000);
	}
	else
	{
		var order = siteConfig.master_categories_order;
		var list = siteConfig.master_categories;
		if (textOnlyLeftList)
		{
			leftContent.empty();
			var html = "<ul>"
			for (id in order)
			{
				html += "<a onclick=\"showCategoriesView('" + order[id] + "')\">";
				html += "<li id='leftmaster" + order[id] + "'>" + list[order[id]].name + "</li>";
				html += "</a>";
			}
			html += "</ul>";
			leftContent.append(html);
		}
		else
		{
			hideLeftBoxContents(function() {
				leftContent.hide();
				var html = "";
				for (id in order)
				{
					html += "<a onclick=\"showCategoriesView('" + order[id] + "')\">";
					html += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" id=\"leftmaster" + order[id] + "\" />";
					html += "</a>";
				}
				leftContent.append(html);
				leftContent.find('img').removeAttr('style');
				showLeftBoxContents();
			});
		}
		leftContent.find('.selected').removeClass('selected');
		$('#leftmaster' + currentMasterCategory).addClass('selected');
	}
	$('#leftLabel').html('Master Categories');
}

function populateLeftBoxWithCategories(masterCategory)
{
	console.log('populateLeftBoxWithCategories()');
	var leftContent = $('#leftContent');
	var alreadyDone = $('#leftLabel').html() == (hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
	if (alreadyDone)
	{
		leftContent.find('.selected').removeClass('selected');
		var selected = $('#leftcategory' + currentCategory);
		selected.addClass('selected');
		selected.addClass('animating hidden');
		setTimeout(function() {
			$('#leftcategory' + currentCategory).removeClass('hidden');
		}, 0.2 * 1000);
		setTimeout(function() {
			$('#leftcategory' + currentCategory).removeClass('animating');
		}, 0.4 * 1000);
	}
	else
	{
		if (textOnlyLeftList)
		{
			populateTextOnlyCategories(masterCategory);
		}
		else
		{
			hideLeftBoxContents(function() {
				leftContent.hide();
				var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
				var list = siteConfig.categories;
				var html = "";
				for (id in order)
				{
					html += "<a onclick=\"showKeywordListView('" + order[id] + "')\">";
					html += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" id=\"leftcategory" + order[id] + "\" />";
					html += "</a>";
				}
				leftContent.append(html);
				leftContent.find('img').removeAttr('style');
				showLeftBoxContents();
			});
		}
		leftContent.find('.selected').removeClass('selected');
		$('#leftcategory' + currentCategory).addClass('selected');
	}
	$('#leftLabel').html(hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
}

function hideLeftBoxContents(callback)
{
	var contents = $('#leftContent img');
	contents.addClass('animating');
	contents.addClass('hidden');
	setTimeout(function() {
		$('#leftContent').empty();
		callback();
	}, 0.2 * 1000);
}

function showLeftBoxContents(callback)
{
	var images = $('#leftContent img');
	var leftContent = $('#leftContent');
	images.addClass('hidden');
	leftContent.show();
	images.addClass('animating');
	images.show();
	images.removeClass('hidden');
	setTimeout(function() {
		images.removeClass('animating');
	}, 0.2 * 1000);
}
