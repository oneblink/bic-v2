/*
 * custom library to abstract access to available local storage mechanisms
 * requires: jQuery 1.5+, utilities.js
 * 
 * valid storage types are: localstorage, sessionstorage, websqldatabase, indexeddb
 * 
 * This has been designed with seemless operation of asynchronous storage methods,
 * via the jQuery Deferred Promises mechanism in jQuery 1.5.
 * 
 * The mechanism-specific terms "database" and "table" have been replaced with
 * the more neutral "partition" and "section", respectively.
 */


(function(window, undefined) {
	var webSqlDbs = {}, // store open handles to databases (websqldatabase)
		navigator = window.navigator,
		$ = window.jQuery;
	BlinkStorage = function(type, partition, section) {
		var self = this,
			readyDeferred = new $.Deferred(),
			db, // for websqldatabase, localstorage or sessionstorage
			memory; // for memory
		if (typeof partition !== 'string' || partition.length < 1) {
			partition = 'default';
		}
		if (typeof section !== 'string' || section.length < 1) {
			section = 'main';
		}
		
		if (typeof type !== 'string') {
			type = available[0];
		} else if (type === 'sessionstorage' && $.inArray('sessionstorage', available) === -1) {
			type = 'memory';
		} else if ($.inArray(type, available) === -1) {
			type = available[0];
		}
		
		self.type = type;
		self.partition = partition;
		self.section = section;
		
		readyDeferred.done(function() {
			log('BlinkStorage(): ' + type + ' -> ' + partition + ' : ' + section + ' ready');
		});
		self.ready = function() {
			return readyDeferred.promise();
		};
		
		if (type === 'localstorage' || type === 'sessionstorage') {

			db = (type === 'localstorage') ? localStorage : sessionStorage;

			self.get = function(key) {
				var deferred = new $.Deferred(function(dfrd) {
					dfrd.resolve(db.getItem(partition + ':' + section + ':' + key));
					// dfrd.reject(); not sure if this is needed
				});
				return deferred.promise();
			};
			
			self.set = function(key, value) {
				var deferred = new $.Deferred(function(dfrd) {
					db.setItem(partition + ':' + section + ':' + key, value);
					dfrd.resolve();
				});
				return deferred.promise();
			};
			
			self.remove = function(key) {
				var deferred = new $.Deferred(function(dfrd) {
					db.removeItem(partition + ':' + section + ':' + key);
					dfrd.resolve();
				});
				return deferred.promise();
			};

			self.keys = function() {
				var deferred = new $.Deferred(function(dfrd) {
					var found = [],
						length = db.length,
						index, parts;
					for (index = 0; index < length; index++) {
						parts = db.key(index).split(':');
						if (parts[0] === partition && parts[1] === section) {
							found.push(parts[2]);
						}
					}
					dfrd.resolve(found);
				});
				return deferred.promise();
			};
			
			self.size = function() {
				var deferred = new $.Deferred(function(dfrd) {
					$.when(self.keys()).done(function(keys) {
						dfrd.resolve(keys.length);
					});
				});
				return deferred.promise();
			};
			
			readyDeferred.resolve();

		} else if (type === 'websqldatabase') {
			
			var estimatedSize = (window.device ? 5 : 1) * 1024 * 1024,
			/* @inner */
			successHandler = typeof $ === 'function' ? $.noop : function () { },
			/* @inner */
			errorHandler = function() {
				log('BlinkStorage error1: ' + error.code + ' ' + error.message);
				if (error.code === 3 || error.code === 4 || error.code === 7) {
					alert('storage-error: ' + error.code + '\n' + error.message);
				}
				return false;
			},
			/* @inner */
			openSection = function() {
				db.transaction(function(tx) {
					tx.executeSql(
						'CREATE TABLE IF NOT EXISTS `' + section + '` (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)',
						[],
						readyDeferred.resolve,
						readyDeferred.reject
					);
				}, errorHandler, successHandler);
			},
			/* @inner */
			openWebSQL = function() {
				try {
					db = openDatabase(partition, '1.0', partition, estimatedSize);
					webSqlDbs[partition] = db;
					// fix for Android and others with incomplete WebSQL implementation
					db.readTransaction = db.readTransaction || db.transaction;
				} catch(error) {
					readyDeferred.reject();
					throw 'BlinkStorage: ' + error;
				}
			};
			/* END: var */
			
			if (webSqlDbs[partition]) {
				db = webSqlDbs[partition];
			} else {
				openWebSQL();
			}
			openSection();
			
			self.get = function(key) {
				var deferred = new $.Deferred(function(dfrd) {
					db.readTransaction(function(tx) {
						tx.executeSql(
							'SELECT v FROM `' + section + '` WHERE k = ?', [ key ], function(tx, result) {
								if (result.rows.length === 1) {
									dfrd.resolve(result.rows.item(0).v);
								} else {
									dfrd.resolve(null);
									if (result.rows.length > 1) {
										throw('BlinkStorage: non-unique key');
									}
								}
							}
						);
					}, errorHandler, successHandler);
				});
				return deferred.promise();
			};
			
			self.set = function(key, value, attempts) {
				var deferred = new $.Deferred(),
					promise = deferred.promise();
				attempts = typeof attempts !== 'number' ? 1 : attempts;
				db.transaction(function(tx) {
					tx.executeSql(
						'INSERT OR REPLACE INTO `' + section + '` (k, v) VALUES (?, ?)', [ key, value ], function(tx, result) {
							if (result.rowsAffected !== 1) {
								throw('BlinkStorage: failed INSERT');
							}
						}
					);
				}, function(error) {
					if (attempts-- > 0) {
						$.when(self.set(key, value, attempts))
							.fail(function(error) {
								log('BlinkStorage error: ' + error.code + ' ' + error.message);
								if (error.code === 3 || error.code === 4 || error.code === 7) {
									alert('storage-error: ' + error.code + '\n' + error.message);
								}
								deferred.reject();
							})
							.then(deferred.resolve());
					} else {
						deferred.reject();
					}
				}, deferred.resolve);
				return promise;
			};
	
			self.remove = function(key) {
				var deferred = new $.Deferred(function(dfrd) {
					db.transaction(function(tx) {
						tx.executeSql('DELETE FROM `' + section + '` WHERE k = ?', [ key ], function(tx, result) {
							dfrd.resolve();
						});
					}, errorHandler, successHandler);
				});
				return deferred.promise();
			};

			self.keys = function() {
				var deferred = new $.Deferred(function(dfrd) {
					db.readTransaction(function(tx) {
						tx.executeSql('SELECT k FROM `' + section + '`', [], function(tx, result) {
							var index, row,
								length = result.rows.length,
								found = [];
							for (index = 0; index < length; index++) {
								row = result.rows.item(index);
								found.push(row.k);
							}
							dfrd.resolve(found);
						});
					}, errorHandler, successHandler);
				});
				return deferred.promise();
			};
			
			self.size = function() {
				var deferred = new $.Deferred(function(dfrd) {
					db.readTransaction(function(tx) {
						tx.executeSql(
							'SELECT k FROM ' + section, [], function(tx, result) {
								dfrd.resolve(result.rows.length);
							}
						);
					}, errorHandler, successHandler);
				});
				return deferred.promise();
			};
			
		} else if (type === 'memory') {
			
			memory = {};

			self.get = function(key) {
				var deferred = new $.Deferred(function(dfrd) {
					dfrd.resolve(memory[partition + ':' + section + ':' + key]);
					// dfrd.reject(); not sure if this is needed
				});
				return deferred.promise();
			};
			
			self.set = function(key, value) {
				var deferred = new $.Deferred(function(dfrd) {
					memory[partition + ':' + section + ':' + key] = value;
					dfrd.resolve();
				});
				return deferred.promise();
			};
			
			self.remove = function(key) {
				var deferred = new $.Deferred(function(dfrd) {
					delete memory[partition + ':' + section + ':' + key];
					dfrd.resolve();
				});
				return deferred.promise();
			};

			self.keys = function() {
				var deferred = new $.Deferred(function(dfrd) {
					var found = [],
						key, parts;
					for (key in memory) {
						if (memory.hasOwnProperty(key)) {
							parts = memory[key].split(':');
							if (parts[0] === partition && parts[1] === section) {
								found.push(parts[2]);
							}
						}
					}
					dfrd.resolve(found);
				});
				return deferred.promise();
			};
			
			self.size = function() {
				var deferred = new $.Deferred(function(dfrd) {
					$.when(self.keys()).done(function(keys) {
						dfrd.resolve(keys.length);
					});
				});
				return deferred.promise();
			};
			
			readyDeferred.resolve();
		}
		return this;
	};
	BlinkStorage.prototype.available = [];
	var available = BlinkStorage.prototype.available;
	BlinkStorage.prototype.removeKeysRegExp = function(regexp) {
		var store = this,
			deferred = new $.Deferred(function(dfrd) {
			$.when(store.keys()).done(function(keys) {
				var k, kLength = keys.length,
					removeDefers = [];
				for (k = 0; k < kLength; k++) {
					if (keys[k].search(regexp) !== -1) {
						removeDefers.push(store.remove(keys[k]));
					}
				}
				$.when(removeDefers).done(dfrd.resolve());
			});
		});
		return deferred.promise();
	};
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
	if (typeof window.log === 'function') {
		log('BlinkStorage(): available=[' + available.join(',') + ']');
	}
}(this));
  