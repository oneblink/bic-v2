/* 
 * basic class for queuing execution
 * requires utilities.js
 */

(function(window, undefined) {
	BlinkDispatch = function(interval) {
		var queue = [],
			timeout = null,
			dispatch = this; // to facilitate self-references
		this.interval = interval;
		this.isPaused = false;
		function processQueue() {
			if (dispatch.isPaused || timeout !== null || queue.length === 0) {return;}
			var item = queue.shift();
			if (typeof item === 'function') {
				item();
			} else {
				log('BlinkDispatch:' + item);
			}
			timeout = setTimeout(function() {
				timeout = null;
				processQueue();
			}, dispatch.interval);
		}
		this._push = function(item) {
			queue.push(item);
			processQueue();
		};
		this.pause = function() {
			clearTimeout(timeout);
			timeout = null;
			this.isPaused = true;
		};
		this.resume = function() {
			this.isPaused = false;
			processQueue();
		};
		return this;
	};
	BlinkDispatch.prototype.add = function(item) {
		this._push(item);
	};
}(this));
