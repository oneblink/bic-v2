var activityIndicatorTop, navBar;

function init_device()
{
	MyAnswers.log('init_device()');
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = deviceVars.engineVersion !== null ? deviceVars.engineVersion[1] : 525;
	deviceVars.useCSS3animations = deviceVars.engineVersion >= 532; // iOS 4 doesn't uglify forms
	deviceVars.useCSS3buttons = deviceVars.engineVersion >= 531; // iOS 3.2 understand border-image
	deviceVars.scrollProperty = deviceVars.engineVersion >= 532 ? '-webkit-transform' : 'top';
	deviceVars.scrollValue = deviceVars.engineVersion >= 532 ? 'translateY($1px)' : '$1px';

	// caching frequently-accessed selectors
	navBar = $('.navBar');
	activityIndicatorTop = Math.floor($(window).height() / 2);
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
  siteVars.serverDevicePath = MyAnswers.loadURL + 'ios/' + siteVars.serverAppVersion + '/';
  deviceVars.deviceFileName = '/ios.js';
  MyAnswers.log("AppDevicePath: " + siteVars.serverDevicePath);
  MyAnswers.log("AppPath: " + siteVars.serverAppPath);
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
				$('#activeContent > footer').addClass('hidden');
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
					startPosition = (reverseTransition ? 'left' : 'right');
				MyAnswers.dispatch.pause('showView');
				MyAnswersDevice.hideLocationBar();
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
					$('#activeContent > footer').removeClass('hidden');
				}, 350);
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
	var formattedValue = (value + '').replace(/(\d+)/, valueFormat);
	$(element).css(property, formattedValue);
	}

function onScroll() {
	var //headerBottom = $('.header').height(),
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

function setupParts()
{
	$('body').trigger('taskBegun');
	if (deviceVars.useCSS3buttons === false)
	{
		$('.backButton').each(function(index, element) {
			var thisElement = $(element);
			var fragment = document.createDocumentFragment();
			var left = document.createElement('div');
			left.setAttribute('class', 'backButtonLeft');
			fragment.appendChild(left);
			var label = document.createElement('div');
			label.setAttribute('class', 'buttonLabel');
			label.appendChild(document.createTextNode(thisElement.text()));
			fragment.appendChild(label);
			var right = document.createElement('div');
			right.setAttribute('class', 'backButtonRight');
			fragment.appendChild(right);
			emptyDOMelement(element);
			element.appendChild(fragment);
		});
		$('.roundButton').each(function(index, element) {
			var thisElement = $(element);
			var fragment = document.createDocumentFragment();
			var left = document.createElement('div');
			left.setAttribute('class', 'roundButtonLeft');
			fragment.appendChild(left);
			var label = document.createElement('div');
			label.setAttribute('class', 'buttonLabel');
			label.appendChild(document.createTextNode(thisElement.text()));
			fragment.appendChild(label);
			var right = document.createElement('div');
			right.setAttribute('class', 'roundButtonRight');
			fragment.appendChild(right);
			emptyDOMelement(element);
			element.appendChild(fragment);
		});
		$('.squareButton').each(function(index, element) {
			var thisElement = $(element);
			var fragment = document.createDocumentFragment();
			var left = document.createElement('div');
			left.setAttribute('class', 'squareButtonLeft');
			fragment.appendChild(left);
			var label = document.createElement('div');
			label.setAttribute('class', 'buttonLabel');
			label.appendChild(document.createTextNode(thisElement.text()));
			fragment.appendChild(label);
			var right = document.createElement('div');
			right.setAttribute('class', 'squareButtonRight');
			fragment.appendChild(right);
			emptyDOMelement(element);
			element.appendChild(fragment);
		});
	}
	$('body').trigger('taskComplete');
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
})();