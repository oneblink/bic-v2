function init_device()
{
	MyAnswers.log('init_device()');
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = deviceVars.engineVersion !== null ? deviceVars.engineVersion[1] : 525;
	deviceVars.useCSS3animations = deviceVars.engineVersion >= 532; // iOS 4 doesn't uglify forms
	deviceVars.scrollProperty = deviceVars.engineVersion >= 532 ? '-webkit-transform' : 'top';
	deviceVars.scrollValue = deviceVars.engineVersion >= 532 ? 'translateY($1px)' : '$1px';
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
  MyAnswers.log("Device Ready");
  MyAnswers.log("URL to Load: " + window.Settings.LoadURL);
  MyAnswers.log("Device: " + window.device.platform);
  MyAnswers.log("Camera Present: " + window.device.camerapresent);
  MyAnswers.log("Multitasking: " + window.device.multitasking);
  MyAnswers.cameraPresent = window.device.camerapresent;
  MyAnswers.loadURL = window.Settings.LoadURL;
  siteVars.serverDomain = MyAnswers.loadURL.match(/:\/\/(.[^\/]+)/)[1];
  MyAnswers.domain = "//" + siteVars.serverDomain + "/";
  MyAnswers.log("Domain: " + MyAnswers.domain);
  MyAnswers.multiTasking = window.device.multitasking;
  siteVars.serverAppVersion = window.Settings.codeVersion;
  siteVars.serverAppPath = MyAnswers.loadURL + 'common/' + siteVars.serverAppVersion + '/';
  siteVars.answerSpace = window.Settings.answerSpace;
	siteVars.serverDevicePath = MyAnswers.loadURL + 'ipad/' + siteVars.serverAppVersion + '/';
	deviceVars.deviceFileName = '/ipad.js';
  MyAnswers.log("AppDevicePath: " + siteVars.serverDevicePath);
  MyAnswers.log("AppPath: " + siteVars.serverAppPath);
}

/*
 The purpose of the functions "prepare...ForDevice()" is to establish the
 buttons that can be displayed on the navBar and the function of the buttons
 where they differ.
 The visibility of the leftBox is also controlled at this stage.
*/

function populateTextOnlyCategories(masterCategory)
{
	MyAnswers.log('populateTextOnlyCategories(): ' + masterCategory);
	$('#leftLabel').html(hasMasterCategories? siteConfig.master_categories[masterCategory].name : 'Categories');
	var leftContent = $('#leftContent');
	leftContent.empty();
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var html = "<ul id='categoriesList'>";
	for (id in order)
	{
		if (list[order[id]].status !== 'active' || list[order[id]].keywords.length === 0) { continue; }
		html += "<a onclick=\"showKeywordListView('" + order[id] + "')\">";
		html += "<li id='leftcategory" + order[id] + "'>" + list[order[id]].name + "</li>";
		html += "</a>";
	}
	html += "</ul>";
	leftContent.append(html);
	currentCategory = currentCategory ? currentCategory : siteConfig.default_category;
}

(function(global, undefined) {
	var MyAnswersDevice = function() {
		var MyAnswersDevice = function() {};
		MyAnswersDevice.processSiteConfig = function() {
			$('#answerSpacesListView').remove();
			if (!hasMasterCategories) {
				$('#masterCategoriesView').remove();
			}
			if (!hasVisualCategories) {
				$('#categoriesView').remove();
			}
		};
		MyAnswersDevice.hideView = function(reverseTransition) {
			MyAnswers.dispatch.add(function() {
				var entranceDirection = (reverseTransition ? 'left' : 'right'),
					endPosition = (reverseTransition ? 'right' : 'left'),
					startPosition = (reverseTransition ? 'left' : 'right'),
					$view = $('.view:visible'),
					$navBoxHeader = $('#navBoxHeader');
				if ($view.size() < 1) { return; }
				MyAnswers.dispatch.pause('hideView');
				$navBoxHeader.find('button').attr('disabled', 'disabled');
				$view.addClass('animating');
				setTimeout(function() {
					$view.addClass('slid' + endPosition);
				}, 0);
				setTimeout(function() {
					$view.hide();
					$view.removeClass('animating slid' + endPosition);
					MyAnswers.dispatch.resume('hideView');
				}, 350);
			});
		};
		MyAnswersDevice.showView = function($view, reverseTransition) {
			MyAnswers.dispatch.add(function() {
				var entranceDirection = (reverseTransition ? 'left' : 'right'),
					endPosition = (reverseTransition ? 'right' : 'left'),
					startPosition = (reverseTransition ? 'left' : 'right'),
					viewId = $view.attr('id');
				MyAnswers.dispatch.pause('showView');
				$view.hide();
				$view.addClass('slid' + startPosition);
				$view.show();
				setTimeout(function() {
					$view.addClass('animating');
					$view.removeClass('slid' + startPosition);
				}, 0);
				setTimeout(function() {
					$view.removeClass('animating');
					$('body').trigger('transitionComplete', [ $view.attr('id') ]);
					MyAnswers.dispatch.resume('showView');
					updateNavigationButtons();
				}, 350);
				if (isHome()) {
					hideLeftBox();
				} else if (viewId === 'categoriesView') {
					MyAnswers.dispatch.add(function() {
						populateLeftBoxWithMasterCategories();
						showLeftBox();
					});
				} else if (viewId === 'keywordListView') {
					MyAnswers.dispatch.add(function() {
						populateLeftBoxWithCategories(currentMasterCategory);
						showLeftBox();
					});
				}
			});
		};
		return MyAnswersDevice;
	};
	global.MyAnswersDevice = new MyAnswersDevice();
})((function() { return this || (1,eval)('this'); })());

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

function prepareHistorySideBar() {
	MyAnswers.dispatch.add(function() {
		var leftContent = $('#leftContent');
		leftContent.find('.selected').removeClass('selected');
		$('#leftcategory' + currentCategory).addClass('selected');
		$('#leftmaster' + currentMasterCategory).addClass('selected');
	});
}

function showLeftBox()
{
	if (!$('#leftBox').hasClass('leftShown'))
	{
		MyAnswers.log('showLeftBox()');
		$('#stackLayout').addClass('leftShown');
		$('#leftBox').addClass('leftShown');
		prepareHistorySideBar();
	}
}

function hideLeftBox()
{
	if ($('#leftBox').hasClass('leftShown'))
	{
		MyAnswers.log('hideLeftBox()');
		$('#stackLayout').removeClass('leftShown');
		$('#leftBox').removeClass('leftShown');
	}
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

function populateLeftBoxWithMasterCategories()
{
	MyAnswers.log('populateLeftBoxWithMasterCategories()');
	var leftContent = $('#leftContent');
	var alreadyDone = $('#leftLabel').html() == 'Master Categories';
	if (!alreadyDone)
	{
		var order = siteConfig.master_categories_order;
		var list = siteConfig.master_categories;
		if (siteConfig.sidebar_config === 'textonly')
		{
			leftContent.empty();
			var html = "<ul>";
			for (id in order) {
				if (list[order[id]].status !== 'active' || list[order[id]].categories.length === 0) { continue; }
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
	}
	$('#leftLabel').html('Master Categories');
}

function populateLeftBoxWithCategories(masterCategory)
{
	MyAnswers.log('populateLeftBoxWithCategories()');
	var leftContent = $('#leftContent');
	var alreadyDone = $('#leftLabel').html() == (hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
	if (!alreadyDone)
	{
		if (siteConfig.sidebar_config === 'textonly')
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
	}
	$('#leftLabel').html(hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
}

(function() {
  var timer = setInterval(function() {
		if (typeof(MyAnswers.device_Loaded) != 'undefined') {
			try {
				MyAnswers.device_Loaded = true;
				clearInterval(timer);
			} catch(e) {
				MyAnswers.log("***** Unable to set: MyAnswers.device_Loaded => true");
			}
		}
  }, 100);
})();
