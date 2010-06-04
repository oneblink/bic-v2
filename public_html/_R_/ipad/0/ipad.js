/*
 The purpose of the functions "prepare...ForDevice()" is to establish the
 buttons that can be displayed on the navBar and the function of the buttons
 where they differ.
 The visibility of the leftBox is also controlled at this stage.
*/

function prepareMasterCategoriesViewForDevice()
{
  console.log('prepareMasterCategoriesViewForDevice()');
  $('#backButtonHeader').unbind('click');
  $('#backButtonHeader').css('display', 'none');
  $('#helpButton').css("display", 'none');
  $('#pendingFormButton').css('display', 'none');
  hideLeftBox();
}

function prepareCategoriesViewForDevice()
{
  console.log('prepareCategoriesViewForDevice()');
  $('#backButtonHeader').unbind('click');
  if (hasMasterCategories)
  {
	 $('#backButtonHeader').css('display', 'block');
	 $('#backButtonHeader').click(function(event) {
		goBackToMasterCategoriesView();
	 });
	 populateLeftBoxWithMasterCategories();
	 showLeftBox();
  }
  else
  {
	 hideLeftBox();
	 $('#backButtonHeader').css('display', 'none');
  }
  $('#helpButton').css("display", 'none');
  $('#pendingFormButton').css('display', 'none');
}

function prepareKeywordListViewForDevice()
{
  console.log('prepareKeywordListViewForDevice()');
  $('#backButtonHeader').unbind('click');
  if (hasVisualCategories)
  {
	 $('#backButtonHeader').css('display', 'block');
	 $('#backButtonHeader').click(function(event) {
		goBackToCategoriesView();
    });
  }
  else if (hasMasterCategories)
  {
	 $('#backButtonHeader').css('display', 'block');
	 $('#backButtonHeader').click(function(event) {
		goBackToMasterCategoriesView();
    });
  }
  else
  {
	 $('#backButtonHeader').css('display', 'none');
  }
  if (hasCategories)
  {
	 populateLeftBoxWithCategories();
	 showLeftBox();
  }
  else if (hasMasterCategories)
  {
	 populateLeftBoxWithMasterCategories();
	 showLeftBox();
  }
  $('#helpButton').css('display', 'none');
  $('#pendingFormButton').css('display', 'none');
}

function prepareKeywordViewForDevice(showBack, showHelp)
{
  console.log('prepareKeywordViewForDevice(): ' + showBack + ' ' + showHelp);
  $('#backButtonHeader').unbind('click');
  $('#backButtonHeader').css("display", !showBack ? 'block' : 'none');
  $('#backButtonHeader').click(function(event) {
	 goBackToKeywordListView();
  });
  $('#helpButton').css("display", showHelp ? 'block' : 'none');
  $('#pendingFormButton').css('display', 'block');
}

function prepareAnswerViewForDevice()
{
  console.log('prepareAnswerViewForDevice()');
  $('#backButtonHeader').unbind('click');
  $('#backButtonHeader').css('display', 'block');
  $('#backButtonHeader').click(function(event) {
	 goBackToKeywordListView();
  });
  $('#helpButton').css('display', 'none');
  $('#pendingFormButton').css('display', 'block');
}

function prepareSecondLevelAnswerViewForDevice()
{
  console.log('prepareSecondLevelAnswerViewForDevice()');
  $('#backButtonHeader').unbind('click');
  $('#backButtonHeader').css('display', 'block');
  $('#backButtonHeader').click(function(event) {
	 goBackToTopLevelAnswerView();
  });
  $('#helpButton').css('display', 'none');
  $('#pendingFormButton').css('display', 'block');
}

function prepareOldViewForDevice()
{
  console.log('prepareOldViewForDevice()');
  var oldView = $('#oldView');
  var currentView = $('.view:visible');
  $(oldView).empty();
  $(oldView).show();
  $(currentView).contents().clone().appendTo(oldView);
  $(currentView).hide();
}

function prepareHelpViewForDevice()
{
  console.log('prepareHelpViewForDevice()');
  $('#backButtonHeader').css('display', 'none');
  $('#helpButton').css('display', 'block');
  $('#pendingFormButton').css('display', 'none');
}

function prepareLoginViewForDevice()
{
  console.log('prepareLoginViewForDevice()');
  $('#backButtonHeader').unbind('click');
  $('#backButtonHeader').css('display', 'block');
  $('#backButtonHeader').click(function(event) {
	 goBackToKeywordListView();
  });
  $('#helpButton').css("display", 'none');
  $('#pendingFormButton').css('display', 'none');
}

function stopInProgressAnimation()
{
  $('#activityIndicator').css('display', 'none');
}

function startInProgressAnimation()
{
  $('#activityIndicator').css('display', 'block');
}

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

function showRightBox(heading)
{
  console.log('showRightBox(heading)');
  $('#rightLabel').html(heading);
  $('#stackLayout').addClass('rightShown');
  $('#rightBox').addClass('rightShown');
}

function hideRightBox()
{
  console.log('hideRightBox()');
  $('#leftBox').hide('fast');
  $('#stackLayout').removeClass('rightShown');
  $('#rightBox').removeClass('rightShown');
}

function populateLeftBoxWithMasterCategories()
{
  if (hasMasterCategories)
  {
	 console.log('populateLeftBoxWithMasterCategories()');
	 $('#leftLabel').html('Master Categories');
	 $('#leftContent').empty();
	 $('#masterCategoriesView').children().clone().appendTo('#leftContent');
	 $('#leftContent img').removeAttr('style');
  }
}

function populateLeftBoxWithCategories()
{
  console.log('populateLeftBoxWithCategories()');
  $('#leftLabel').html('Categories');
  if (hasVisualCategories && leftListStyle == 'auto')
  {
	 // visual categories in the sidebar
	 $('#leftContent').empty();
	 $('#categoriesView').children().clone().appendTo('#leftContent');
	 $('#leftContent img').removeAttr('style');
  }
  else
  {
	 $('#leftContent').html(textonlyLeftList);
	 $('#leftContent .selected').removeClass('selected');
	 $('#leftContent li[title=' + currentCategory + ']').addClass('selected');
  }
}

function setCurrentView(view, reverseTransition)
{
  console.log('setCurrentView(): ' + view + ' ' + reverseTransition);
  $('.view').width($(window).width() - ($('#leftBox').hasClass('leftShown') ? $('#leftBox').width() - 1 : 0) - 60);
  var entranceDirection = (reverseTransition ? 'slidingLeft' : 'slidingRight');
  var exitDirection = (reverseTransition ? 'slidingRight' : 'slidingLeft');
  var startPosition = (reverseTransition ? 'slidLeft' : 'slidRight');
  var currentView = '#' + $('.view:visible').attr('id');
  var newView = '#' + view;
  if ($(currentView).size() == 0)
  {
	 $(newView).show();
  }
  else if (currentView == newView)
  {
	 $(currentView).hide();
	 $(newView).addClass(startPosition);
	 $(newView).show();
	 $(newView).addClass(entranceDirection);
	 setTimeout(function() {
		$(newView).removeClass(startPosition + ' ' + entranceDirection);
	 }, 0.3 * 1000);
  }
  else
  {
	 $(currentView).addClass(exitDirection);
	 setTimeout(function() {
		$(currentView).hide();
		$(currentView).removeClass(exitDirection);
	 }, 0.3 * 1000);
	 $(newView).addClass(startPosition);
	 $(newView).show();
	 $(newView).addClass(entranceDirection);
	 setTimeout(function() {
		$(newView).removeClass(startPosition + ' ' + entranceDirection);
	 }, 0.3 * 1000);
  }
  $(".clicked").removeClass("clicked");
  window.scrollTo(0, 0);
}

function setupParts()
{
  console.log('setupParts()');
  $(".backButton, .roundButton, .squareButton").unbind('mousedown');
  $(".backButton, .roundButton, .squareButton").mousedown(function(event) {
	 $(this).addClass("clicked");
  });
  $(".backButton, .roundButton, .squareButton").unbind('mouseup');
  $(".backButton, .roundButton, .squareButton").mouseup(function(event) {
	 $(this).removeClass("clicked");
  });
}

function setupForms()
{
  // strip our formatting produced by scrape.php for css
  $("form").find("input, textarea").each(function(index, element) {
	 if ($(this).attr('style'))
	 {
		$(this).attr('style', $(this).attr('style').replace('width:180px;', ''));
		$(this).attr('style', $(this).attr('style').replace('height:70px;', ''));
	 }
  });
    // make textareas just a little larger than default
  $("form").find("input, textarea").attr('rows', '3');
  // theme the submit button
  $('form input[type=button]').addClass('roundButton');
}