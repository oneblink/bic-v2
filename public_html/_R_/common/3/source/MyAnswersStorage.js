/*
 * custom library to abstract access to available local storage mechanisms
 * requires: jQuery 1.5+
 * 
 * valid storage types are: localstorage, sessionstorage, websqldatabase, indexeddb
 * 
 * This has been designed with seemless operation of asynchronous storage methods,
 * so all functions require a callback in order to pass results back to the caller.
 * 
 * The mechanism-specific terms "database" and "table" have been replaced with
 * the more neutral "partition" and "section", respectively.
 */

// TODO: re-implement using jQuery promises

(function(window, $, undefined) {
	window.MyAnswersStorage = function(type, partition, section) {
		var isReady = false,
			readyDeferred = new $.Deferred(),
			db, // for websqldatabase
			memory; // for memory
		if (typeof partition !== 'string' || partition.length < 1) {
			partition = 'default';
		}
		if (typeof section !== 'string' || section.length < 1) {
			section = 'main';
		}
		
		if (typeof type !== 'string') {
			type = available[0];
		} else if (!$.inArray(type, available)) {
			type = available[0];
		}
		
		readyDeferred.done(function() {
			log('MyAnswersStorage(): ' + type + ' -> ' + partition + ' : ' + section + ' ready');
		});
		this.ready = function() {
			return readyDeferred.promise();
		};
		
		if (type === 'localstorage') {

			this.get = function(key, callback) {
				var value = localStorage.getItem(partition + ':' + section + ':' + key);
				if (typeof callback === 'function') {
					callback(key, value);
				}
			};
			
			this.set = function(key, value, callback) {
				localStorage.setItem(partition + ':' + section + ':' + key, value);
				if (typeof callback === 'function') {
					callback();
				}
			};
			
			this.remove = function(key, callback) {
				localStorage.removeItem(partition + ':' + section + ':' + key);
				if (typeof callback === 'function') {
					callback();
				}
			};

			this.keys = function(callback) {
				var found = [],
					length = localStorage.length,
					index, parts;
				for (index = 0; index < length; index++) {
					parts = localStorage.key(index).split(':');
					if (parts[0] === partition && parts[1] === section) {
						found.push(parts[2]);
					}
				}
				if (typeof callback === 'function') {
					callback(found);
				}
			};
			
			this.size = function(callback) {
				var length = this.keys().length;
				if (typeof callback === 'function') {
					callback(length);
				}
			};
			
			readyDeferred.resolve();
			
		} else if (type === 'sessionstorage') {
			
			this.get = function(key, callback) {
				var value = sessionStorage.getItem(partition + ':' + section + ':' + key);
				if (typeof callback === 'function') {
					callback(key, value);
				}
			};
			
			this.set = function(key, value, callback) {
				sessionStorage.setItem(partition + ':' + section + ':' + key, value);
				if (typeof callback === 'function') {
					callback();
				}
			};
			
			this.remove = function(key, callback) {
				sessionStorage.removeItem(partition + ':' + section + ':' + key);
				if (typeof callback === 'function') {
					callback();
				}
			};

			this.keys = function(callback) {
				var found = [],
					length = sessionStorage.length,
					index, parts;
				for (index = 0; index < length; index++) {
					parts = sessionStorage.key(index).split(':');
					if (parts[0] === partition && parts[1] === section) {
						found.push(parts[2]);
					}
				}
				if (typeof callback === 'function') {
					callback(found);
				}
			};
			
			this.size = function(callback) {
				var length = this.keys().length;
				if (typeof callback === 'function') {
					callback(length);
				}
			};
			
			readyDeferred.resolve();

		} else if (type === 'websqldatabase') {
			
			var successHandler = typeof $ === 'function' ? $.noop : function () { };
			var errorHandler = function (tx, error) {
				log('MyAnswersStorage error:', arguments);
				readyDeferred.fail();
			};
			
			try {
				db = openDatabase(partition, '1.0', partition, parseInt(32e3, 16));
			} catch(error) {
				throw 'MyAnswersStorage: ' + error;
			}
			
			db.transaction(function(tx) {
				tx.executeSql(
					'CREATE TABLE IF NOT EXISTS ' + section + ' (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)',
					[],
					readyDeferred.resolve,
					errorHandler
				);
			}, errorHandler, successHandler);
			
			this.get = function(key, callback) {
				db.readTransaction(function(tx) {
					tx.executeSql(
						'SELECT v FROM ' + section + ' WHERE k = ?', [ key ], function(tx, result) {
							var value;
							if (result.rows.length > 1) {
								throw('MyAnswersStorage: non-unique key');
							} else if (result.rows.length === 1) {
								value = result.rows.item(0).v;
							}
							if (typeof callback === 'function') {
								callback(key, value);
							}
						}
					);
				}, errorHandler, successHandler);
			};
			
			this.set = function(key, value, callback) {
				db.transaction(function(tx) {
					tx.executeSql('DELETE FROM ' + section + ' WHERE k = ?', [ key ]);
					tx.executeSql(
						'INSERT INTO ' + section + ' (k, v) VALUES (?, ?)', [ key, value ], function(tx, result) {
							if (result.rowsAffected !== 1) {
								throw('MyAnswersStorage: failed INSERT');
							}
							if (typeof callback === 'function') {
								callback();
							}
						}
					);
				}, errorHandler, successHandler);
			};
			
			this.remove = function(key, callback) {
				db.transaction(function(tx) {
					tx.executeSql('DELETE FROM ' + section + ' WHERE k = ?', [ key ], function(tx, result) {
						if (result.rowsAffected !== 1) {
							throw('MyAnswersStorage: failed DELETE');
						}
						if (typeof callback === 'function') {
							callback();
						}
					});
				}, errorHandler, successHandler);
			};

			this.keys = function(callback) {
				db.readTransaction(function(tx) {
					tx.executeSql(
						'SELECT k FROM ' + section, [], function(tx, result) {
							var index, row,
								length = result.rows.length,
								found = [];
							for (index = 0; index < length; index++) {
								row = result.rows.item(index);
								found.push(row.k);
							}
							if (typeof callback === 'function') {
								callback(found);
							}
						}
					);
				}, errorHandler, successHandler);
			};
			
			this.size = function(callback) {
				db.readTransaction(function(tx) {
					tx.executeSql(
						'SELECT k FROM ' + section, [], function(tx, result) {
							if (typeof callback === 'function') {
								callback(result.rows.length);
							}
						}
					);
				}, errorHandler, successHandler);
			};
			
		} else if (type === 'memory') {
			
			this.memory = {};

			this.get = function(key, callback) {
				var value = this.memory[partition + ':' + section + ':' + key];
				if (typeof callback === 'function') {
					callback(key, value);
				}
			};
			
			this.set = function(key, value, callback) {
				this.memory[partition + ':' + section + ':' + key] = value;
				if (typeof callback === 'function') {
					callback();
				}
			};
			
			this.remove = function(key, callback) {
				delete this.memory[partition + ':' + section + ':' + key];
				if (typeof callback === 'function') {
					callback();
				}
			};

			this.keys = function(callback) {
				var found = [],
					key, parts;
				for (key in this.memory) {
					if (this.memory.hasOwnProperty(key)) {
						parts = this.memory[key].split(':');
						if (parts[0] === partition && parts[1] === section) {
							found.push(parts[2]);
						}
					}
				}
				if (typeof callback === 'function') {
					callback(found);
				}
			};
			
			this.size = function(callback) {
				var length = this.keys().length;
				if (typeof callback === 'function') {
					callback(length);
				}
			};
			
			readyDeferred.resolve();
		}
		return this;
	};
	window.MyAnswersStorage.prototype.log = function() {
		if (typeof console !== 'undefined') { console.log.apply(console, arguments); }
		else if (typeof debug !== 'undefined') { debug.log.apply(debug, arguments); }
	}; 
	window.MyAnswersStorage.prototype.available = [];
	var available = window.MyAnswersStorage.prototype.available,
		log = window.MyAnswersStorage.prototype.log;
	// TODO: add detection for indexedDB
	if (typeof window.openDatabase !== 'undefined') {
		available.push('websqldatabase');
	}
	if (typeof window.localStorage !== 'undefined') {
		available.push('localstorage');
	}
	if (typeof window.sessionStorage !== 'undefined') {
		available.push('sessionstorage');
	}
	available.push('memory');
	log('MyAnswersStorage(): available=[' + available.join(',') + ']');
	window.MyAnswersStorage.prototype.test = function() {

	}; 
}(this, this.jQuery));
