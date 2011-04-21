var activityIndicatorTop, navBar, hashStack;

function onHashChange(event) {
	var hashState = $.bbq.getState(),
		hashString = JSON.stringify(hashState);
	if (location.hash.length > 1 && hashStack.indexOf(hashString) === -1) {
		hashStack.push(hashString);
	} else if (hashStack.length === 0 || location.hash.length <= 1) {
		goBackToHome();
	} else if (hashStack[hashStack.length - 2] === hashString) {
		hashStack.pop();
		goBack();
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

// ** device-specific initialisation of variables and flags **

function init_device()
{
	MyAnswers.log('init_device()');
	deviceVars.majorVersion = navigator.userAgent.match(/Android (\d+)./);
	deviceVars.majorVersion = deviceVars.majorVersion !== null ? deviceVars.majorVersion[1] : 1;
	deviceVars.minorVersion = navigator.userAgent.match(/Android \d+\.(\d+)/);
	deviceVars.minorVersion = deviceVars.minorVersion !== null ? deviceVars.minorVersion[1] : 5;
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = deviceVars.engineVersion !== null ? deviceVars.engineVersion[1] : 525;
	deviceVars.scrollProperty = '-webkit-transform';
	deviceVars.scrollValue = 'translateY($1px)';
	if (deviceVars.engineVersion >= 529 || typeof(window.onhashchange) === 'object') {
		MyAnswers.hasHashChange = true;
		MyAnswers.log('onHashChange registration: ', addEvent(window, 'hashchange', onHashChange));
	}

	hashStack = [];
//	deviceVars.disableXSLT = true;

	// caching frequently-accessed selectors
	navBar = $('.navBar');
	activityIndicatorTop = Math.floor($(window).height() / 2);

//	document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
//	iscroll = new iScroll('activeContent', { bounce: true, hScrollbar: false, fadeScrollbar: false, checkDOMChanges: false });
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
	try {
		MyAnswers.log("Device Ready");
		//MyAnswers.log("URL to Load: " + window.Settings.LoadURL);
		MyAnswers.log("Device: " + window.device.platform);
		//MyAnswers.log("Camera Present: " + window.device.camerapresent);
		//MyAnswers.log("Multitasking: " + window.device.multitasking);
		//MyAnswers.cameraPresent = window.device.camerapresent;
		//MyAnswers.loadURL = window.Settings.LoadURL;
		siteVars.serverDomain = MyAnswers.loadURL.match(/:\/\/(.[^\/]+)/)[1];
		MyAnswers.domain = "//" + siteVars.serverDomain + "/";
		MyAnswers.log("Domain: " + MyAnswers.domain);
		//MyAnswers.multiTasking = window.device.multitasking;
		//siteVars.serverAppVersion = window.Settings.codeVersion;
		siteVars.serverAppPath = MyAnswers.loadURL + 'common/' + siteVars.serverAppVersion + '/';
		//siteVars.answerSpace = window.Settings.answerSpace;
		MyAnswers.log("siteVars.answerSpace: " + siteVars.answerSpace);
		siteVars.serverDevicePath = MyAnswers.loadURL + 'android/' + siteVars.serverAppVersion + '/';
		MyAnswers.log("MyAnswers.loadURL: " + MyAnswers.loadURL);
		deviceVars.deviceFileName = '/android.js';
		//if (window.device.platform.search(/iphone/i) != -1) {
		//  siteVars.serverDevicePath = MyAnswers.loadURL + 'iphone/' + siteVars.serverAppVersion + '/';
		//  deviceVars.deviceFileName = '/iphone.js';
		//} else {
		//  siteVars.serverDevicePath = MyAnswers.loadURL + 'ipad/' + siteVars.serverAppVersion + '/';
		//  deviceVars.deviceFileName = '/ipad.js';
		//}
		MyAnswers.log("AppDevicePath: " + siteVars.serverDevicePath);
		MyAnswers.log("AppPath: " + siteVars.serverAppPath);
  } catch(e) {
		MyAnswers.log("onDeviceReady exception: ");
		MyAnswers.log(e);
	}
}

(function(window, undefined) {
	var MyAnswersDevice = function() {
		var MyAnswersDevice = function() {};
		MyAnswersDevice.hideLocationBar = function() {
			window.scrollTo(0, 1);
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
				$view.addClass('animating old');
				if ($view.find('#keywordBox, #categoriesBox, #masterCategoriesBox').children().size() > 0) {
					var animateClass = reverseTransition ? 'zoomingout' : 'zoomingin';
					setTimeout(function() {
						$view.addClass(animateClass);
					}, 0);
					setTimeout(function() {
						$view.hide();
						$view.removeClass('animating old ' + animateClass);
						MyAnswers.dispatch.resume('hideView');
					}, 300);
				} else {
					var slideDirection = reverseTransition ? 'right' : 'left';
					setTimeout(function() {
						$view.hide('slide', { direction: slideDirection }, 300, function() {
							$view.removeClass('animating old');
							MyAnswers.dispatch.resume('hideView');
						});
					}, 0);
				}
			});
		};
		MyAnswersDevice.showView = function($view, reverseTransition) {
			MyAnswers.dispatch.add(function() {
				var entranceDirection = (reverseTransition ? 'left' : 'right'),
					endPosition = (reverseTransition ? 'right' : 'left'),
					startPosition = (reverseTransition ? 'left' : 'right'),
					viewId = $view.attr('id');
				MyAnswers.dispatch.pause('showView');
				MyAnswersDevice.hideLocationBar();
				$view.hide();
				if ($view.find('#keywordBox, #categoriesBox, #masterCategoriesBox').children().size() > 0) {
					var animateClass = reverseTransition ? 'zoomingin' : 'zoomingout';
					$view.addClass(animateClass);
					$view.show();
					setTimeout(function() {
						$view.addClass('animating new');
						$view.removeClass(animateClass);
					}, 0);
					setTimeout(function() {
						$view.removeClass('animating new');
						$(window).trigger('scroll');
						$('body').trigger('transitionComplete', [ viewId ]);
						MyAnswers.dispatch.resume('showView');
						updateNavigationButtons();
					}, 300);
				} else {
					var slideDirection = (reverseTransition ? 'left' : 'right');
					setTimeout(function() {
						$view.addClass('animating new');
						$view.show('slide', { direction: slideDirection }, 300, function() {
							$view.removeClass('animating new');
							$('body').trigger('transitionComplete', [ viewId ]);
							MyAnswers.dispatch.resume('showView');
							updateNavigationButtons();
						});
					}, 0);
				}
				if (isHome()) {
					$.bbq.removeState();
				} else if (viewId === 'categoriesView') {
					$.bbq.pushState({ m: currentMasterCategory }, 2);
				} else if (viewId === 'keywordListView') {
					var hashState = {};
					if (hasCategories) {
						hashState.c = currentCategory;
					}
					if (hasMasterCategories) {
						hashState.m = currentMasterCategory;
					}
					$.bbq.pushState(hashState, 2);
				} else if (viewId === 'keywordView') {
					$.bbq.pushState({ k: currentInteraction }, 2);
				} else if (viewId === 'answerView') {
					$.bbq.pushState({ a: currentInteraction }, 2);
				} else if (viewId === 'answerView2') {
					$.bbq.pushState({ a2k: keyword, a2a: arg }, 2);
				} else if (viewId === 'helpView') {
					$.bbq.pushState({ h: 'H' });
				} else if (viewId === 'loginView') {
					$.bbq.pushState({ l: 'L' }, 2);
				} else if (viewId === 'newLoginView') {
					$.bbq.pushState({ l: 'N' }, 2);
				} else if (viewId === 'activateLoginView') {
					$.bbq.pushState({ l: 'A' }, 2);
				}
			});
		};
		return MyAnswersDevice;
	};
	window.MyAnswersDevice = new MyAnswersDevice();
}(this));

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

function updatePartCSS(element, property, value, valueFormat) {
	var formattedValue = String(value).replace(/(\d+)/, valueFormat);
	$(element).css(property, formattedValue);
}

function onScroll() {
	var //headerBottom = $('header').height(),
		scrollTop = $(window).scrollTop(),
		offset;
/*	if (scrollTop > headerBottom) {
		offset = scrollTop - headerBottom;
		updatePartCSS(navBar, deviceVars.scrollProperty, offset, deviceVars.scrollValue);
	} else {
		updatePartCSS(navBar, deviceVars.scrollProperty, '0', deviceVars.scrollValue);
	}
*/
	updatePartCSS(navBar, deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
	updatePartCSS(MyAnswers.activityIndicator, deviceVars.scrollProperty, (activityIndicatorTop + scrollTop), deviceVars.scrollValue);
}

(function() {
  var timer = setInterval(function() {
		if (typeof(MyAnswers.device_Loaded) !== 'undefined') {
			try {
				MyAnswers.device_Loaded = true;
				clearInterval(timer);
			} catch(e) {
				MyAnswers.log("***** Unable to set: MyAnswers.device_Loaded => true");
			}
		}
  }, 100);
}());
