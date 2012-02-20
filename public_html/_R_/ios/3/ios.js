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
	if (Modernizr.touch && !Modernizr.positionfixed) {
		document.body.addEventListener('touchmove', function(event) {
			var touch;
			if (event.touches.length === 1) {
				touch = event.touches[0];
				$navBar.addClass('hidden');
				MyAnswers.$footer.addClass('hidden');
			}
		}, false);
		document.body.addEventListener('touchend', function(event) {
			if ($navBar.children().not('.hidden').length > 0) {
				$navBar.removeClass('hidden');
			}
			MyAnswers.$footer.removeClass('hidden');
		}, false);
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
	} catch(e) {
		log("onDeviceReady exception: ");
		log(e);
	}
}

(function(window, undefined) {
	var $ = window.jQuery,
	/* @inner */
	MyAnswersDevice = function() {
		var me = this;
		/* END: var */
		me.hideLocationBar = function() {
			window.scrollTo(0, 1);
		};
		/**
		 * hide the current view, and prepare the new view for display
		 * @param {jQuery} $view the jQuery-selected element that will be shown
		 * @param {Boolean} reverseTransition toggle transition direction
		 * @return {jQueryPromise}
		 */
		me.prepareView = function($view, reverseTransition) {
			var deferred = new $.Deferred();
			MyAnswers.dispatch.add(function() {
				var endPosition = (reverseTransition ? 'right' : 'left'),
				startPosition = (reverseTransition ? 'left' : 'right'),
				$oldView = $('.view:visible'),
				$navBoxHeader = $('#navBoxHeader');
				/* END: var */
				// transition the current view away
				if (window.currentConfig.footerPosition !== 'screen-bottom') {
					MyAnswers.$body.children('footer').addClass('hidden');
				}
				if ($oldView.size() < 1) {
					deferred.resolve();
					return;
				}
				MyAnswers.dispatch.pause('prepareView');
				$navBoxHeader.find('button').attr('disabled', 'disabled');
				$oldView.addClass('animating');
				$oldView.one('webkitTransitionEnd', function(event) {
					$oldView.hide();
					$oldView.removeClass('animating slid' + endPosition);
					MyAnswers.dispatch.resume('hideView');
					deferred.resolve();
				});
				setTimeout(function() {
					$oldView.addClass('slid' + endPosition);
				}, 0);
			});
			return deferred.promise();
		};
		me.showView = function($view, reverseTransition) {
			var deferred = new $.Deferred();
			MyAnswers.dispatch.add(function() {
				var endPosition = (reverseTransition ? 'right' : 'left'),
				startPosition = (reverseTransition ? 'left' : 'right');
				/* END: var */
				MyAnswers.dispatch.pause('showView');
				me.hideLocationBar();
				// move the incoming $view offscreen for compositing
				$view.hide();
				$view.addClass('slid' + startPosition);
				$view.show();
				$view.one('webkitTransitionEnd', function(event) {
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
		return me;
	};
	/* END: var */
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
		var scrollTop = MyAnswers.$window.scrollTop(),
		footerY;
		/* END: var */
		if (!Modernizr.positionfixed) {
			updatePartCSS($navBar, deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
			updatePartCSS(MyAnswers.activityIndicator, deviceVars.scrollProperty, (activityIndicatorTop + scrollTop), deviceVars.scrollValue);
		}
		if (!Modernizr.positionfixed && typeof currentConfig !== 'undefined' && currentConfig.footerPosition === 'screen-bottom') {
			footerY = scrollTop + MyAnswers.windowY - MyAnswers.$footer.outerHeight();
			updatePartCSS(MyAnswers.$footer, deviceVars.scrollProperty, footerY, deviceVars.scrollValue);
		}
	});
}

document.getElementById('startUp-loadDevice').className = 'working success';
MyAnswers.deviceDeferred.resolve();
