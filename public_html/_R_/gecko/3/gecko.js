var activityIndicatorTop, $navBar,
	onDeviceReady = $.noop; // there are no gecko-based native applications
document.getElementById('startUp-loadDevice').className = 'working';
MyAnswers.deviceDeferred = new $.Deferred();

// ** device-specific initialisation of variables and flags **

function init_device() {
	var $activityIndicator = $('#activityIndicator');
	log('init_device()');
	deviceVars.scrollProperty = '-moz-transform';
	deviceVars.scrollValue = 'translateY($1px)';

//	deviceVars.disableXSLT = true;

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
	$('#startUp-initDevice').addClass('success');
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
