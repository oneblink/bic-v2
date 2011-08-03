var activityIndicatorTop, $navBar;
MyAnswers.deviceDeferred = new $.Deferred();

// ** device-specific initialisation of variables and flags **

function init_device()
{
	log('init_device()');
	deviceVars.scrollProperty = '-moz-transform';
	deviceVars.scrollValue = 'translateY($1px)';

//	deviceVars.disableXSLT = true;

	// caching frequently-accessed selectors
	$navBar = $('#navBoxHeader');
	activityIndicatorTop = Math.floor($(window).height() / 2);

	deviceVars.hasCSSFixedPosition = hasCSSFixedPosition();
	log('hasCSSFixedPosition: ' + deviceVars.hasCSSFixedPosition);
	if (deviceVars.hasCSSFixedPosition) {
		$('#activityIndicator').css('top', activityIndicatorTop);
	} else if (typeof onScroll === 'function') {
		$(window).bind('scroll', onScroll);
		$(window).trigger('scroll');
	}
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
	try {
		log("Device Ready");
		//log("URL to Load: " + window.Settings.LoadURL);
		log("Device: " + window.device.platform);
		//log("Camera Present: " + window.device.camerapresent);
		//log("Multitasking: " + window.device.multitasking);
		//MyAnswers.cameraPresent = window.device.camerapresent;
		//MyAnswers.loadURL = window.Settings.LoadURL;
		siteVars.serverDomain = MyAnswers.loadURL.match(/:\/\/(.[^\/]+)/)[1];
		MyAnswers.domain = "//" + siteVars.serverDomain + "/";
		log("Domain: " + MyAnswers.domain);
		//MyAnswers.multiTasking = window.device.multitasking;
		//siteVars.serverAppVersion = window.Settings.codeVersion;
		siteVars.serverAppPath = MyAnswers.loadURL + 'common/' + siteVars.serverAppVersion + '/';
		//siteVars.answerSpace = window.Settings.answerSpace;
		log("siteVars.answerSpace: " + siteVars.answerSpace);
		siteVars.serverDevicePath = MyAnswers.loadURL + 'android/' + siteVars.serverAppVersion + '/';
		log("MyAnswers.loadURL: " + MyAnswers.loadURL);
		deviceVars.deviceFileName = '/android.js';
		//if (window.device.platform.search(/iphone/i) != -1) {
		//  siteVars.serverDevicePath = MyAnswers.loadURL + 'iphone/' + siteVars.serverAppVersion + '/';
		//  deviceVars.deviceFileName = '/iphone.js';
		//} else {
		//  siteVars.serverDevicePath = MyAnswers.loadURL + 'ipad/' + siteVars.serverAppVersion + '/';
		//  deviceVars.deviceFileName = '/ipad.js';
		//}
		log("AppDevicePath: " + siteVars.serverDevicePath);
		log("AppPath: " + siteVars.serverAppPath);
  } catch(e) {
		log("onDeviceReady exception: ");
		log(e);
	}
}

(function(window, undefined) {
	var $ = window.jQuery,
	MyAnswersDevice = function() {
		var MyAnswersDevice = function() {};
		MyAnswersDevice.hideLocationBar = function() {
			window.scrollTo(0, 1);
		};
		MyAnswersDevice.hideView = function(reverseTransition) {
			var deferred = new $.Deferred();
			MyAnswers.dispatch.add(function() {
				var entranceDirection = (reverseTransition ? 'left' : 'right'),
					endPosition = (reverseTransition ? 'right' : 'left'),
					startPosition = (reverseTransition ? 'left' : 'right'),
					$view = $('.view:visible'),
					$navBoxHeader = $('#navBoxHeader');
				if ($view.size() < 1) {
					deferred.resolve();
					return deferred.promise();
				}
				MyAnswers.$body.children('footer').addClass('hidden');
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
						deferred.resolve();
					}, 300);
				} else {
					var slideDirection = reverseTransition ? 'right' : 'left';
					setTimeout(function() {
						$view.hide('slide', { direction: slideDirection }, 300, function() {
							$view.removeClass('animating old');
							MyAnswers.dispatch.resume('hideView');
							deferred.resolve();
						});
					}, 0);
				}
			});
			return deferred.promise();
		};
		MyAnswersDevice.showView = function($view, reverseTransition) {
			var deferred = new $.Deferred();
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
						MyAnswers.dispatch.resume('showView');
						updateNavigationButtons();
						MyAnswers.$body.children('footer').removeClass('hidden');
						deferred.resolve();
					}, 300);
				} else {
					var slideDirection = (reverseTransition ? 'left' : 'right');
					setTimeout(function() {
						$view.addClass('animating new');
						$view.show('slide', { direction: slideDirection }, 300, function() {
							$view.removeClass('animating new');
							MyAnswers.dispatch.resume('showView');
							updateNavigationButtons();
							MyAnswers.$body.children('footer').removeClass('hidden');
							deferred.resolve();
						});
					}, 0);
				}
			});
			return deferred.promise();
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
	updatePartCSS($('#signaturePad'), deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
	updatePartCSS($navBar, deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
	updatePartCSS(MyAnswers.activityIndicator, deviceVars.scrollProperty, (activityIndicatorTop + scrollTop), deviceVars.scrollValue);
}

MyAnswers.deviceDeferred.resolve();
