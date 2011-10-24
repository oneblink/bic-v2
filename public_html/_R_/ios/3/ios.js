var activityIndicatorTop, $navBar;
document.getElementById('startUp-loadDevice').className = 'working';
MyAnswers.deviceDeferred = new $.Deferred();

function init_device() {
	var $activityIndicator = $('#activityIndicator'),
		matches;
	log('init_device()');
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = deviceVars.engineVersion !== null ? deviceVars.engineVersion[1] : 525;
	deviceVars.useCSS3animations = deviceVars.engineVersion >= 532; // iOS 4 doesn't uglify forms
	deviceVars.scrollProperty = deviceVars.engineVersion >= 532 ? '-webkit-transform' : 'top';
	deviceVars.scrollValue = deviceVars.engineVersion >= 532 ? 'translateY($1px)' : '$1px';

	// assume no CSS Fixed Position support for iOS < 5
	matches = navigator.userAgent.match(/OS (\d)[_\d]* like Mac OS X;/);
	if ($.type(matches) === 'array') {
		Modernizr.positionfixed = matches[1] < 5 ? false : Modernizr.positionfixed; 
	}

	// caching frequently-accessed selectors
	$navBar = $('#navBoxHeader');
	activityIndicatorTop = Math.floor($(window).height() / 3);
	$activityIndicator.css('top', activityIndicatorTop);
	if (Modernizr.positionfixed) {
		$navBar.css('position', 'fixed');
		$activityIndicator.css('position', 'fixed');
	} else {
		$navBar.css('position', 'absolute');
		$activityIndicator.css('position', 'absolute');
	}
	if (typeof onScroll === 'function') {
		$(window).bind('scroll', onScroll);
		MyAnswers.dispatch.add(function() {
			$(window).trigger('scroll');
		});
	}
	$('#startUp-initDevice').addClass('success');
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
	try {
		log("Device Ready");
		log("URL to Load: " + window.Settings.LoadURL);
		log("Device: " + window.device.platform);
		log("Camera Present: " + window.device.camerapresent);
		log("Multitasking: " + window.device.multitasking);
		MyAnswers.cameraPresent = window.device.camerapresent;
		MyAnswers.loadURL = window.Settings.LoadURL;
		MyAnswers.multiTasking = window.device.multitasking;
		siteVars.answerSpace = window.Settings.answerSpace;
		siteVars.serverDevicePath = MyAnswers.loadURL + 'ios/' + siteVars.serverAppVersion + '/';
		deviceVars.deviceFileName = '/ios.js';
		log("AppDevicePath: " + siteVars.serverDevicePath);
		log("AppPath: " + siteVars.serverAppPath);
		MyAnswers.blinkgapDeferred.resolve();
		$('#startUp-initBlinkGap').addClass('success');
	} catch(e) {
		log("onDeviceReady exception: ");
		log(e);
		MyAnswers.blinkgapDeferred.reject();
		$('#startUp-initBlinkGap').addClass('error');
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
				$view.addClass('animating');
				$view.bind('webkitTransitionEnd', function(event) {
					$view.unbind('webkitTransitionEnd');
					$view.hide();
					$view.removeClass('animating slid' + endPosition);
					MyAnswers.dispatch.resume('hideView');
					deferred.resolve();
				});
				setTimeout(function() {
					$view.addClass('slid' + endPosition);
				}, 0);
			});
			return deferred.promise();
		};
		MyAnswersDevice.showView = function($view, reverseTransition) {
			var deferred = new $.Deferred();
			MyAnswers.dispatch.add(function() {
				var entranceDirection = (reverseTransition ? 'left' : 'right'),
					endPosition = (reverseTransition ? 'right' : 'left'),
					startPosition = (reverseTransition ? 'left' : 'right');
				MyAnswers.dispatch.pause('showView');
				MyAnswersDevice.hideLocationBar();
				$view.hide();
				$view.addClass('slid' + startPosition);
				$view.show();
				$view.bind('webkitTransitionEnd', function(event) {
					$view.unbind('webkitTransitionEnd');
					$view.removeClass('animating');
					MyAnswers.dispatch.resume('showView');
					updateNavigationButtons();
					MyAnswers.$body.children('footer').removeClass('hidden');
					deferred.resolve();
				});
				setTimeout(function() {
					$view.addClass('animating');
					$view.removeClass('slid' + startPosition);
				}, 0);
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
	var formattedValue = (value + '').replace(/(\d+)/, valueFormat);
	$(element).css(property, formattedValue);
}

function onScroll() {
	MyAnswers.dispatch.add(function() {
		var scrollTop = $(window).scrollTop();
		if (!Modernizr.positionfixed) {
			updatePartCSS($navBar, deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
			updatePartCSS(MyAnswers.activityIndicator, deviceVars.scrollProperty, (activityIndicatorTop + scrollTop), deviceVars.scrollValue);
		}
		if ($.inArray('ios', deviceVars.features) !== -1) {
			updatePartCSS($('#signaturePad'), deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
		}
	});
}

document.getElementById('startUp-loadDevice').className = 'working success';
MyAnswers.deviceDeferred.resolve();
