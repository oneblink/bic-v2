var activityIndicatorTop, $navBar;
document.getElementById('startUp-loadDevice').className = 'working';
MyAnswers.deviceDeferred = new $.Deferred();

// ** device-specific initialisation of variables and flags **

function init_device() {
	var $activityIndicator = $('#activityIndicator'),
	matches;
	log('init_device()');
	deviceVars.scrollProperty = '-webkit-transform';
	deviceVars.scrollValue = 'translateY($1px)';

	// assume no CSS Fixed Position support for Android < 3
	matches = navigator.userAgent.match(/Android (\d+)/);
	if ($.type(matches) === 'array') {
		Modernizr.positionfixed = matches[1] < 3 ? false : Modernizr.positionfixed; 
	}

	// caching frequently-accessed selectors
	$navBar = $('#navBoxHeader');
	activityIndicatorTop = Math.floor($(window).height() / 2);
	$activityIndicator.css('top', activityIndicatorTop);
	if (Modernizr.positionfixed) {
		$navBar.css('position', 'fixed');
		$activityIndicator.css('position', 'fixed');
	} else if (typeof onScroll === 'function') {
		$navBar.css('position', 'absolute');
		$activityIndicator.css('position', 'absolute');
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
		//log("URL to Load: " + window.Settings.LoadURL);
		log("Device: " + window.device.platform);
		//log("Camera Present: " + window.device.camerapresent);
		//log("Multitasking: " + window.device.multitasking);
		MyAnswers.cameraPresent = true; // TODO: find an Android device that lacks a camera
		//MyAnswers.loadURL = window.Settings.LoadURL;
		//MyAnswers.multiTasking = window.device.multitasking;
		//siteVars.serverAppVersion = window.Settings.codeVersion;
		//siteVars.answerSpace = window.Settings.answerSpace;
		log("siteVars.answerSpace: " + siteVars.answerSpace);
		deviceVars.deviceFileName = '/android.js';
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
		 * @return {jQueryPromise}
		 */
		me.prepareView = function($view, reverseTransition) {
			var deferred = new $.Deferred(),
			$oldView = $('.view:visible').not($view[0]),
			$navBoxHeader = $('#navBoxHeader');
				/* END: var */
			MyAnswers.dispatch.add(function() {
				// move the incoming $view offscreen for compositing
				$view.hide();
				$view.css({
					'z-index': 0,
					position: 'absolute'
				});
				$oldView.css({
					'z-index': 50,
					position: 'absolute'
				});
				$view.show();
				if (window.currentConfig.footerPosition !== 'screen-bottom') {
					MyAnswers.$body.children('footer').addClass('hidden');
				}
				$navBoxHeader.find('button').prop('disabled', true);
				deferred.resolve();
			});
			return deferred.promise();
		};
		me.showView = function($view, reverseTransition) {
			var deferred = new $.Deferred(),
			$oldView = $('.view:visible').not($view[0]),
			endPosition = (reverseTransition ? 'right' : 'left'),
			startPosition = (reverseTransition ? 'left' : 'right');
			/* END: var */
			me.hideLocationBar();
			MyAnswers.dispatch.add(function() {
				if ($oldView.size() !== 0) {
					// transition the old view away
					$oldView.hide('slide', { direction: endPosition }, 300, function() {
						$oldView.css('z-index', '');
						$oldView.css('position', '');
						$view.css('z-index', '');
						$view.css('position', '');
						updateNavigationButtons();
						MyAnswers.$body.children('footer').removeClass('hidden');
						deferred.resolve();
					});
				} else {
					$view.css('z-index', '');
					$view.css('position', '');
					updateNavigationButtons();
					MyAnswers.$body.children('footer').removeClass('hidden');
					deferred.resolve();
				}
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
	var formattedValue = String(value).replace(/(\d+)/, valueFormat);
	$(element).css(property, formattedValue);
}

function onScroll() {
	var scrollTop = MyAnswers.$window.scrollTop();
	updatePartCSS($('#signaturePad'), deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
	updatePartCSS($navBar, deviceVars.scrollProperty, scrollTop, deviceVars.scrollValue);
	updatePartCSS(MyAnswers.activityIndicator, deviceVars.scrollProperty, (activityIndicatorTop + scrollTop), deviceVars.scrollValue);
	if (!Modernizr.positionfixed && typeof currentConfig !== 'undefined' && currentConfig.footerPosition === 'screen-bottom') {
		updatePartCSS(MyAnswers.$footer, deviceVars.scrollProperty, scrollTop + MyAnswers.$window.height() - MyAnswers.$footer.height(), deviceVars.scrollValue);
	}
}

document.getElementById('startUp-loadDevice').className = 'working success';
MyAnswers.deviceDeferred.resolve();
