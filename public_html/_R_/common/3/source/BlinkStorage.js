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


(function(window, $, undefined) {
	var webSqlDbs = {}; // store open handles to databases (websqldatabase)
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
		} else if (!$.inArray(type, available)) {
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
			
			var successHandler = typeof $ === 'function' ? $.noop : function () { };
			var errorHandler = function (error) {
				log('BlinkStorage error: ' + error.code + ' ' + error.message);
				if (error.code === 3 || error.code === 4 || error.code === 7) {
					alert('storage-error: ' + error.code + '\n' + error.message);
				}
			};

			var estimatedSize;
			if (navigator.userAgent.indexOf("BlinkGap") !== -1) {
				estimatedSize = 40 * 1024 * 1024;
			} else {
				estimatedSize = 3 * 1024 * 1024;
			}

			if (webSqlDbs[partition]) {
				db = webSqlDbs[partition];
			} else {
				try {
					db = openDatabase(partition, '1.0', partition, estimatedSize);
					webSqlDbs[partition] = db;
				} catch(error) {
					readyDeferred.reject();
					throw 'BlinkStorage: ' + error;
					return this;
				}
			}

			db.readTransaction = db.readTransaction || db.transaction;
			
			db.transaction(function(tx) {
				tx.executeSql(
					'CREATE TABLE IF NOT EXISTS `' + section + '` (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)',
					[],
					readyDeferred.resolve,
					readyDeferred.reject
				);
			}, errorHandler, successHandler);
			
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
			
			self.set = function(key, value) {
				var deferred = new $.Deferred(function(dfrd) {
					db.transaction(function(tx) {
						tx.executeSql('DELETE FROM `' + section + '` WHERE k = ?', [ key ]);
						tx.executeSql(
							'INSERT INTO ' + section + ' (k, v) VALUES (?, ?)', [ key, value ], function(tx, result) {
								if (result.rowsAffected !== 1) {
									dfrd.reject();
									throw('BlinkStorage: failed INSERT');
								}
								dfrd.resolve();
							}
						);
					}, errorHandler, successHandler);
				});
				return deferred.promise();
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
	log('BlinkStorage(): available=[' + available.join(',') + ']');
}(this, jQuery));