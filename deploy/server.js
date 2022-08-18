module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadUpdateChunk(chunkId) {
/******/ 		var chunk = require("./" + "" + chunkId + "." + hotCurrentHash + ".hot-update.js");
/******/ 		hotAddUpdateChunk(chunk.id, chunk.modules);
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadManifest() {
/******/ 		try {
/******/ 			var update = require("./" + "" + hotCurrentHash + ".hot-update.json");
/******/ 		} catch (e) {
/******/ 			return Promise.resolve();
/******/ 		}
/******/ 		return Promise.resolve(update);
/******/ 	}
/******/
/******/ 	//eslint-disable-next-line no-unused-vars
/******/ 	function hotDisposeChunk(chunkId) {
/******/ 		delete installedChunks[chunkId];
/******/ 	}
/******/
/******/ 	var hotApplyOnUpdate = true;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentHash = "0ec03a508a9296d1d856";
/******/ 	var hotRequestTimeout = 10000;
/******/ 	var hotCurrentModuleData = {};
/******/ 	var hotCurrentChildModule;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParents = [];
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParentsTemp = [];
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateRequire(moduleId) {
/******/ 		var me = installedModules[moduleId];
/******/ 		if (!me) return __webpack_require__;
/******/ 		var fn = function(request) {
/******/ 			if (me.hot.active) {
/******/ 				if (installedModules[request]) {
/******/ 					if (installedModules[request].parents.indexOf(moduleId) === -1) {
/******/ 						installedModules[request].parents.push(moduleId);
/******/ 					}
/******/ 				} else {
/******/ 					hotCurrentParents = [moduleId];
/******/ 					hotCurrentChildModule = request;
/******/ 				}
/******/ 				if (me.children.indexOf(request) === -1) {
/******/ 					me.children.push(request);
/******/ 				}
/******/ 			} else {
/******/ 				console.warn(
/******/ 					"[HMR] unexpected require(" +
/******/ 						request +
/******/ 						") from disposed module " +
/******/ 						moduleId
/******/ 				);
/******/ 				hotCurrentParents = [];
/******/ 			}
/******/ 			return __webpack_require__(request);
/******/ 		};
/******/ 		var ObjectFactory = function ObjectFactory(name) {
/******/ 			return {
/******/ 				configurable: true,
/******/ 				enumerable: true,
/******/ 				get: function() {
/******/ 					return __webpack_require__[name];
/******/ 				},
/******/ 				set: function(value) {
/******/ 					__webpack_require__[name] = value;
/******/ 				}
/******/ 			};
/******/ 		};
/******/ 		for (var name in __webpack_require__) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(__webpack_require__, name) &&
/******/ 				name !== "e" &&
/******/ 				name !== "t"
/******/ 			) {
/******/ 				Object.defineProperty(fn, name, ObjectFactory(name));
/******/ 			}
/******/ 		}
/******/ 		fn.e = function(chunkId) {
/******/ 			if (hotStatus === "ready") hotSetStatus("prepare");
/******/ 			hotChunksLoading++;
/******/ 			return __webpack_require__.e(chunkId).then(finishChunkLoading, function(err) {
/******/ 				finishChunkLoading();
/******/ 				throw err;
/******/ 			});
/******/
/******/ 			function finishChunkLoading() {
/******/ 				hotChunksLoading--;
/******/ 				if (hotStatus === "prepare") {
/******/ 					if (!hotWaitingFilesMap[chunkId]) {
/******/ 						hotEnsureUpdateChunk(chunkId);
/******/ 					}
/******/ 					if (hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 						hotUpdateDownloaded();
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		fn.t = function(value, mode) {
/******/ 			if (mode & 1) value = fn(value);
/******/ 			return __webpack_require__.t(value, mode & ~1);
/******/ 		};
/******/ 		return fn;
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateModule(moduleId) {
/******/ 		var hot = {
/******/ 			// private stuff
/******/ 			_acceptedDependencies: {},
/******/ 			_declinedDependencies: {},
/******/ 			_selfAccepted: false,
/******/ 			_selfDeclined: false,
/******/ 			_selfInvalidated: false,
/******/ 			_disposeHandlers: [],
/******/ 			_main: hotCurrentChildModule !== moduleId,
/******/
/******/ 			// Module API
/******/ 			active: true,
/******/ 			accept: function(dep, callback) {
/******/ 				if (dep === undefined) hot._selfAccepted = true;
/******/ 				else if (typeof dep === "function") hot._selfAccepted = dep;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._acceptedDependencies[dep[i]] = callback || function() {};
/******/ 				else hot._acceptedDependencies[dep] = callback || function() {};
/******/ 			},
/******/ 			decline: function(dep) {
/******/ 				if (dep === undefined) hot._selfDeclined = true;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._declinedDependencies[dep[i]] = true;
/******/ 				else hot._declinedDependencies[dep] = true;
/******/ 			},
/******/ 			dispose: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			addDisposeHandler: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			removeDisposeHandler: function(callback) {
/******/ 				var idx = hot._disposeHandlers.indexOf(callback);
/******/ 				if (idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 			},
/******/ 			invalidate: function() {
/******/ 				this._selfInvalidated = true;
/******/ 				switch (hotStatus) {
/******/ 					case "idle":
/******/ 						hotUpdate = {};
/******/ 						hotUpdate[moduleId] = modules[moduleId];
/******/ 						hotSetStatus("ready");
/******/ 						break;
/******/ 					case "ready":
/******/ 						hotApplyInvalidatedModule(moduleId);
/******/ 						break;
/******/ 					case "prepare":
/******/ 					case "check":
/******/ 					case "dispose":
/******/ 					case "apply":
/******/ 						(hotQueuedInvalidatedModules =
/******/ 							hotQueuedInvalidatedModules || []).push(moduleId);
/******/ 						break;
/******/ 					default:
/******/ 						// ignore requests in error states
/******/ 						break;
/******/ 				}
/******/ 			},
/******/
/******/ 			// Management API
/******/ 			check: hotCheck,
/******/ 			apply: hotApply,
/******/ 			status: function(l) {
/******/ 				if (!l) return hotStatus;
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			addStatusHandler: function(l) {
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			removeStatusHandler: function(l) {
/******/ 				var idx = hotStatusHandlers.indexOf(l);
/******/ 				if (idx >= 0) hotStatusHandlers.splice(idx, 1);
/******/ 			},
/******/
/******/ 			//inherit from previous dispose call
/******/ 			data: hotCurrentModuleData[moduleId]
/******/ 		};
/******/ 		hotCurrentChildModule = undefined;
/******/ 		return hot;
/******/ 	}
/******/
/******/ 	var hotStatusHandlers = [];
/******/ 	var hotStatus = "idle";
/******/
/******/ 	function hotSetStatus(newStatus) {
/******/ 		hotStatus = newStatus;
/******/ 		for (var i = 0; i < hotStatusHandlers.length; i++)
/******/ 			hotStatusHandlers[i].call(null, newStatus);
/******/ 	}
/******/
/******/ 	// while downloading
/******/ 	var hotWaitingFiles = 0;
/******/ 	var hotChunksLoading = 0;
/******/ 	var hotWaitingFilesMap = {};
/******/ 	var hotRequestedFilesMap = {};
/******/ 	var hotAvailableFilesMap = {};
/******/ 	var hotDeferred;
/******/
/******/ 	// The update info
/******/ 	var hotUpdate, hotUpdateNewHash, hotQueuedInvalidatedModules;
/******/
/******/ 	function toModuleId(id) {
/******/ 		var isNumber = +id + "" === id;
/******/ 		return isNumber ? +id : id;
/******/ 	}
/******/
/******/ 	function hotCheck(apply) {
/******/ 		if (hotStatus !== "idle") {
/******/ 			throw new Error("check() is only allowed in idle status");
/******/ 		}
/******/ 		hotApplyOnUpdate = apply;
/******/ 		hotSetStatus("check");
/******/ 		return hotDownloadManifest(hotRequestTimeout).then(function(update) {
/******/ 			if (!update) {
/******/ 				hotSetStatus(hotApplyInvalidatedModules() ? "ready" : "idle");
/******/ 				return null;
/******/ 			}
/******/ 			hotRequestedFilesMap = {};
/******/ 			hotWaitingFilesMap = {};
/******/ 			hotAvailableFilesMap = update.c;
/******/ 			hotUpdateNewHash = update.h;
/******/
/******/ 			hotSetStatus("prepare");
/******/ 			var promise = new Promise(function(resolve, reject) {
/******/ 				hotDeferred = {
/******/ 					resolve: resolve,
/******/ 					reject: reject
/******/ 				};
/******/ 			});
/******/ 			hotUpdate = {};
/******/ 			var chunkId = "main";
/******/ 			// eslint-disable-next-line no-lone-blocks
/******/ 			{
/******/ 				hotEnsureUpdateChunk(chunkId);
/******/ 			}
/******/ 			if (
/******/ 				hotStatus === "prepare" &&
/******/ 				hotChunksLoading === 0 &&
/******/ 				hotWaitingFiles === 0
/******/ 			) {
/******/ 				hotUpdateDownloaded();
/******/ 			}
/******/ 			return promise;
/******/ 		});
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotAddUpdateChunk(chunkId, moreModules) {
/******/ 		if (!hotAvailableFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
/******/ 			return;
/******/ 		hotRequestedFilesMap[chunkId] = false;
/******/ 		for (var moduleId in moreModules) {
/******/ 			if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				hotUpdate[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if (--hotWaitingFiles === 0 && hotChunksLoading === 0) {
/******/ 			hotUpdateDownloaded();
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotEnsureUpdateChunk(chunkId) {
/******/ 		if (!hotAvailableFilesMap[chunkId]) {
/******/ 			hotWaitingFilesMap[chunkId] = true;
/******/ 		} else {
/******/ 			hotRequestedFilesMap[chunkId] = true;
/******/ 			hotWaitingFiles++;
/******/ 			hotDownloadUpdateChunk(chunkId);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotUpdateDownloaded() {
/******/ 		hotSetStatus("ready");
/******/ 		var deferred = hotDeferred;
/******/ 		hotDeferred = null;
/******/ 		if (!deferred) return;
/******/ 		if (hotApplyOnUpdate) {
/******/ 			// Wrap deferred object in Promise to mark it as a well-handled Promise to
/******/ 			// avoid triggering uncaught exception warning in Chrome.
/******/ 			// See https://bugs.chromium.org/p/chromium/issues/detail?id=465666
/******/ 			Promise.resolve()
/******/ 				.then(function() {
/******/ 					return hotApply(hotApplyOnUpdate);
/******/ 				})
/******/ 				.then(
/******/ 					function(result) {
/******/ 						deferred.resolve(result);
/******/ 					},
/******/ 					function(err) {
/******/ 						deferred.reject(err);
/******/ 					}
/******/ 				);
/******/ 		} else {
/******/ 			var outdatedModules = [];
/******/ 			for (var id in hotUpdate) {
/******/ 				if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 					outdatedModules.push(toModuleId(id));
/******/ 				}
/******/ 			}
/******/ 			deferred.resolve(outdatedModules);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotApply(options) {
/******/ 		if (hotStatus !== "ready")
/******/ 			throw new Error("apply() is only allowed in ready status");
/******/ 		options = options || {};
/******/ 		return hotApplyInternal(options);
/******/ 	}
/******/
/******/ 	function hotApplyInternal(options) {
/******/ 		hotApplyInvalidatedModules();
/******/
/******/ 		var cb;
/******/ 		var i;
/******/ 		var j;
/******/ 		var module;
/******/ 		var moduleId;
/******/
/******/ 		function getAffectedStuff(updateModuleId) {
/******/ 			var outdatedModules = [updateModuleId];
/******/ 			var outdatedDependencies = {};
/******/
/******/ 			var queue = outdatedModules.map(function(id) {
/******/ 				return {
/******/ 					chain: [id],
/******/ 					id: id
/******/ 				};
/******/ 			});
/******/ 			while (queue.length > 0) {
/******/ 				var queueItem = queue.pop();
/******/ 				var moduleId = queueItem.id;
/******/ 				var chain = queueItem.chain;
/******/ 				module = installedModules[moduleId];
/******/ 				if (
/******/ 					!module ||
/******/ 					(module.hot._selfAccepted && !module.hot._selfInvalidated)
/******/ 				)
/******/ 					continue;
/******/ 				if (module.hot._selfDeclined) {
/******/ 					return {
/******/ 						type: "self-declined",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				if (module.hot._main) {
/******/ 					return {
/******/ 						type: "unaccepted",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				for (var i = 0; i < module.parents.length; i++) {
/******/ 					var parentId = module.parents[i];
/******/ 					var parent = installedModules[parentId];
/******/ 					if (!parent) continue;
/******/ 					if (parent.hot._declinedDependencies[moduleId]) {
/******/ 						return {
/******/ 							type: "declined",
/******/ 							chain: chain.concat([parentId]),
/******/ 							moduleId: moduleId,
/******/ 							parentId: parentId
/******/ 						};
/******/ 					}
/******/ 					if (outdatedModules.indexOf(parentId) !== -1) continue;
/******/ 					if (parent.hot._acceptedDependencies[moduleId]) {
/******/ 						if (!outdatedDependencies[parentId])
/******/ 							outdatedDependencies[parentId] = [];
/******/ 						addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 						continue;
/******/ 					}
/******/ 					delete outdatedDependencies[parentId];
/******/ 					outdatedModules.push(parentId);
/******/ 					queue.push({
/******/ 						chain: chain.concat([parentId]),
/******/ 						id: parentId
/******/ 					});
/******/ 				}
/******/ 			}
/******/
/******/ 			return {
/******/ 				type: "accepted",
/******/ 				moduleId: updateModuleId,
/******/ 				outdatedModules: outdatedModules,
/******/ 				outdatedDependencies: outdatedDependencies
/******/ 			};
/******/ 		}
/******/
/******/ 		function addAllToSet(a, b) {
/******/ 			for (var i = 0; i < b.length; i++) {
/******/ 				var item = b[i];
/******/ 				if (a.indexOf(item) === -1) a.push(item);
/******/ 			}
/******/ 		}
/******/
/******/ 		// at begin all updates modules are outdated
/******/ 		// the "outdated" status can propagate to parents if they don't accept the children
/******/ 		var outdatedDependencies = {};
/******/ 		var outdatedModules = [];
/******/ 		var appliedUpdate = {};
/******/
/******/ 		var warnUnexpectedRequire = function warnUnexpectedRequire() {
/******/ 			console.warn(
/******/ 				"[HMR] unexpected require(" + result.moduleId + ") to disposed module"
/******/ 			);
/******/ 		};
/******/
/******/ 		for (var id in hotUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 				moduleId = toModuleId(id);
/******/ 				/** @type {TODO} */
/******/ 				var result;
/******/ 				if (hotUpdate[id]) {
/******/ 					result = getAffectedStuff(moduleId);
/******/ 				} else {
/******/ 					result = {
/******/ 						type: "disposed",
/******/ 						moduleId: id
/******/ 					};
/******/ 				}
/******/ 				/** @type {Error|false} */
/******/ 				var abortError = false;
/******/ 				var doApply = false;
/******/ 				var doDispose = false;
/******/ 				var chainInfo = "";
/******/ 				if (result.chain) {
/******/ 					chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
/******/ 				}
/******/ 				switch (result.type) {
/******/ 					case "self-declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of self decline: " +
/******/ 									result.moduleId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of declined dependency: " +
/******/ 									result.moduleId +
/******/ 									" in " +
/******/ 									result.parentId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "unaccepted":
/******/ 						if (options.onUnaccepted) options.onUnaccepted(result);
/******/ 						if (!options.ignoreUnaccepted)
/******/ 							abortError = new Error(
/******/ 								"Aborted because " + moduleId + " is not accepted" + chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "accepted":
/******/ 						if (options.onAccepted) options.onAccepted(result);
/******/ 						doApply = true;
/******/ 						break;
/******/ 					case "disposed":
/******/ 						if (options.onDisposed) options.onDisposed(result);
/******/ 						doDispose = true;
/******/ 						break;
/******/ 					default:
/******/ 						throw new Error("Unexception type " + result.type);
/******/ 				}
/******/ 				if (abortError) {
/******/ 					hotSetStatus("abort");
/******/ 					return Promise.reject(abortError);
/******/ 				}
/******/ 				if (doApply) {
/******/ 					appliedUpdate[moduleId] = hotUpdate[moduleId];
/******/ 					addAllToSet(outdatedModules, result.outdatedModules);
/******/ 					for (moduleId in result.outdatedDependencies) {
/******/ 						if (
/******/ 							Object.prototype.hasOwnProperty.call(
/******/ 								result.outdatedDependencies,
/******/ 								moduleId
/******/ 							)
/******/ 						) {
/******/ 							if (!outdatedDependencies[moduleId])
/******/ 								outdatedDependencies[moduleId] = [];
/******/ 							addAllToSet(
/******/ 								outdatedDependencies[moduleId],
/******/ 								result.outdatedDependencies[moduleId]
/******/ 							);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 				if (doDispose) {
/******/ 					addAllToSet(outdatedModules, [result.moduleId]);
/******/ 					appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Store self accepted outdated modules to require them later by the module system
/******/ 		var outdatedSelfAcceptedModules = [];
/******/ 		for (i = 0; i < outdatedModules.length; i++) {
/******/ 			moduleId = outdatedModules[i];
/******/ 			if (
/******/ 				installedModules[moduleId] &&
/******/ 				installedModules[moduleId].hot._selfAccepted &&
/******/ 				// removed self-accepted modules should not be required
/******/ 				appliedUpdate[moduleId] !== warnUnexpectedRequire &&
/******/ 				// when called invalidate self-accepting is not possible
/******/ 				!installedModules[moduleId].hot._selfInvalidated
/******/ 			) {
/******/ 				outdatedSelfAcceptedModules.push({
/******/ 					module: moduleId,
/******/ 					parents: installedModules[moduleId].parents.slice(),
/******/ 					errorHandler: installedModules[moduleId].hot._selfAccepted
/******/ 				});
/******/ 			}
/******/ 		}
/******/
/******/ 		// Now in "dispose" phase
/******/ 		hotSetStatus("dispose");
/******/ 		Object.keys(hotAvailableFilesMap).forEach(function(chunkId) {
/******/ 			if (hotAvailableFilesMap[chunkId] === false) {
/******/ 				hotDisposeChunk(chunkId);
/******/ 			}
/******/ 		});
/******/
/******/ 		var idx;
/******/ 		var queue = outdatedModules.slice();
/******/ 		while (queue.length > 0) {
/******/ 			moduleId = queue.pop();
/******/ 			module = installedModules[moduleId];
/******/ 			if (!module) continue;
/******/
/******/ 			var data = {};
/******/
/******/ 			// Call dispose handlers
/******/ 			var disposeHandlers = module.hot._disposeHandlers;
/******/ 			for (j = 0; j < disposeHandlers.length; j++) {
/******/ 				cb = disposeHandlers[j];
/******/ 				cb(data);
/******/ 			}
/******/ 			hotCurrentModuleData[moduleId] = data;
/******/
/******/ 			// disable module (this disables requires from this module)
/******/ 			module.hot.active = false;
/******/
/******/ 			// remove module from cache
/******/ 			delete installedModules[moduleId];
/******/
/******/ 			// when disposing there is no need to call dispose handler
/******/ 			delete outdatedDependencies[moduleId];
/******/
/******/ 			// remove "parents" references from all children
/******/ 			for (j = 0; j < module.children.length; j++) {
/******/ 				var child = installedModules[module.children[j]];
/******/ 				if (!child) continue;
/******/ 				idx = child.parents.indexOf(moduleId);
/******/ 				if (idx >= 0) {
/******/ 					child.parents.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// remove outdated dependency from module children
/******/ 		var dependency;
/******/ 		var moduleOutdatedDependencies;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					for (j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 						dependency = moduleOutdatedDependencies[j];
/******/ 						idx = module.children.indexOf(dependency);
/******/ 						if (idx >= 0) module.children.splice(idx, 1);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Now in "apply" phase
/******/ 		hotSetStatus("apply");
/******/
/******/ 		if (hotUpdateNewHash !== undefined) {
/******/ 			hotCurrentHash = hotUpdateNewHash;
/******/ 			hotUpdateNewHash = undefined;
/******/ 		}
/******/ 		hotUpdate = undefined;
/******/
/******/ 		// insert new code
/******/ 		for (moduleId in appliedUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
/******/ 				modules[moduleId] = appliedUpdate[moduleId];
/******/ 			}
/******/ 		}
/******/
/******/ 		// call accept handlers
/******/ 		var error = null;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					var callbacks = [];
/******/ 					for (i = 0; i < moduleOutdatedDependencies.length; i++) {
/******/ 						dependency = moduleOutdatedDependencies[i];
/******/ 						cb = module.hot._acceptedDependencies[dependency];
/******/ 						if (cb) {
/******/ 							if (callbacks.indexOf(cb) !== -1) continue;
/******/ 							callbacks.push(cb);
/******/ 						}
/******/ 					}
/******/ 					for (i = 0; i < callbacks.length; i++) {
/******/ 						cb = callbacks[i];
/******/ 						try {
/******/ 							cb(moduleOutdatedDependencies);
/******/ 						} catch (err) {
/******/ 							if (options.onErrored) {
/******/ 								options.onErrored({
/******/ 									type: "accept-errored",
/******/ 									moduleId: moduleId,
/******/ 									dependencyId: moduleOutdatedDependencies[i],
/******/ 									error: err
/******/ 								});
/******/ 							}
/******/ 							if (!options.ignoreErrored) {
/******/ 								if (!error) error = err;
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Load self accepted modules
/******/ 		for (i = 0; i < outdatedSelfAcceptedModules.length; i++) {
/******/ 			var item = outdatedSelfAcceptedModules[i];
/******/ 			moduleId = item.module;
/******/ 			hotCurrentParents = item.parents;
/******/ 			hotCurrentChildModule = moduleId;
/******/ 			try {
/******/ 				__webpack_require__(moduleId);
/******/ 			} catch (err) {
/******/ 				if (typeof item.errorHandler === "function") {
/******/ 					try {
/******/ 						item.errorHandler(err);
/******/ 					} catch (err2) {
/******/ 						if (options.onErrored) {
/******/ 							options.onErrored({
/******/ 								type: "self-accept-error-handler-errored",
/******/ 								moduleId: moduleId,
/******/ 								error: err2,
/******/ 								originalError: err
/******/ 							});
/******/ 						}
/******/ 						if (!options.ignoreErrored) {
/******/ 							if (!error) error = err2;
/******/ 						}
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				} else {
/******/ 					if (options.onErrored) {
/******/ 						options.onErrored({
/******/ 							type: "self-accept-errored",
/******/ 							moduleId: moduleId,
/******/ 							error: err
/******/ 						});
/******/ 					}
/******/ 					if (!options.ignoreErrored) {
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// handle errors in accept handlers and self accepted module load
/******/ 		if (error) {
/******/ 			hotSetStatus("fail");
/******/ 			return Promise.reject(error);
/******/ 		}
/******/
/******/ 		if (hotQueuedInvalidatedModules) {
/******/ 			return hotApplyInternal(options).then(function(list) {
/******/ 				outdatedModules.forEach(function(moduleId) {
/******/ 					if (list.indexOf(moduleId) < 0) list.push(moduleId);
/******/ 				});
/******/ 				return list;
/******/ 			});
/******/ 		}
/******/
/******/ 		hotSetStatus("idle");
/******/ 		return new Promise(function(resolve) {
/******/ 			resolve(outdatedModules);
/******/ 		});
/******/ 	}
/******/
/******/ 	function hotApplyInvalidatedModules() {
/******/ 		if (hotQueuedInvalidatedModules) {
/******/ 			if (!hotUpdate) hotUpdate = {};
/******/ 			hotQueuedInvalidatedModules.forEach(hotApplyInvalidatedModule);
/******/ 			hotQueuedInvalidatedModules = undefined;
/******/ 			return true;
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotApplyInvalidatedModule(moduleId) {
/******/ 		if (!Object.prototype.hasOwnProperty.call(hotUpdate, moduleId))
/******/ 			hotUpdate[moduleId] = modules[moduleId];
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {},
/******/ 			hot: hotCreateModule(moduleId),
/******/ 			parents: (hotCurrentParentsTemp = hotCurrentParents, hotCurrentParents = [], hotCurrentParentsTemp),
/******/ 			children: []
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "http://localhost:3001/";
/******/
/******/ 	// __webpack_hash__
/******/ 	__webpack_require__.h = function() { return hotCurrentHash; };
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return hotCreateRequire(0)(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/jest-message-util/build/index.js":
/*!********************************************************!*\
  !*** ../node_modules/jest-message-util/build/index.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, '__esModule', {
  value: true
});
Object.defineProperty(exports, 'Frame', {
  enumerable: true,
  get: function get() {
    return _types.Frame;
  }
});
exports.separateMessageFromStack = exports.formatResultsErrors = exports.formatStackTrace = exports.getTopFrame = exports.getStackTraceLines = exports.formatExecError = void 0;

var _fs = _interopRequireDefault(__webpack_require__(/*! fs */ "fs"));

var _path = _interopRequireDefault(__webpack_require__(/*! path */ "path"));

var _chalk = _interopRequireDefault(__webpack_require__(/*! chalk */ "chalk"));

var _micromatch = _interopRequireDefault(__webpack_require__(/*! micromatch */ "micromatch"));

var _slash = _interopRequireDefault(__webpack_require__(/*! slash */ "../node_modules/slash/index.js"));

var _codeFrame = __webpack_require__(/*! @babel/code-frame */ "@babel/code-frame");

var _stackUtils = _interopRequireDefault(__webpack_require__(/*! stack-utils */ "../node_modules/stack-utils/index.js"));

var _types = __webpack_require__(/*! ./types */ "../node_modules/jest-message-util/build/types.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

var Symbol = global['jest-symbol-do-not-touch'] || global.Symbol;

var jestReadFile =
  global[Symbol.for('jest-native-read-file')] || _fs.default.readFileSync;

var Symbol = global['jest-symbol-do-not-touch'] || global.Symbol;
// stack utils tries to create pretty stack by making paths relative.
const stackUtils = new _stackUtils.default({
  cwd: 'something which does not exist'
});
let nodeInternals = [];

try {
  nodeInternals = _stackUtils.default.nodeInternals();
} catch (e) {
  // `StackUtils.nodeInternals()` fails in browsers. We don't need to remove
  // node internals in the browser though, so no issue.
}

const PATH_NODE_MODULES = `${_path.default.sep}node_modules${_path.default.sep}`;
const PATH_JEST_PACKAGES = `${_path.default.sep}jest${_path.default.sep}packages${_path.default.sep}`; // filter for noisy stack trace lines

const JASMINE_IGNORE = /^\s+at(?:(?:.jasmine\-)|\s+jasmine\.buildExpectationResult)/;
const JEST_INTERNALS_IGNORE = /^\s+at.*?jest(-.*?)?(\/|\\)(build|node_modules|packages)(\/|\\)/;
const ANONYMOUS_FN_IGNORE = /^\s+at <anonymous>.*$/;
const ANONYMOUS_PROMISE_IGNORE = /^\s+at (new )?Promise \(<anonymous>\).*$/;
const ANONYMOUS_GENERATOR_IGNORE = /^\s+at Generator.next \(<anonymous>\).*$/;
const NATIVE_NEXT_IGNORE = /^\s+at next \(native\).*$/;
const TITLE_INDENT = '  ';
const MESSAGE_INDENT = '    ';
const STACK_INDENT = '      ';
const ANCESTRY_SEPARATOR = ' \u203A ';

const TITLE_BULLET = _chalk.default.bold('\u25cf ');

const STACK_TRACE_COLOR = _chalk.default.dim;
const STACK_PATH_REGEXP = /\s*at.*\(?(\:\d*\:\d*|native)\)?/;
const EXEC_ERROR_MESSAGE = 'Test suite failed to run';
const NOT_EMPTY_LINE_REGEXP = /^(?!$)/gm;

const indentAllLines = (lines, indent) =>
  lines.replace(NOT_EMPTY_LINE_REGEXP, indent);

const trim = string => (string || '').trim(); // Some errors contain not only line numbers in stack traces
// e.g. SyntaxErrors can contain snippets of code, and we don't
// want to trim those, because they may have pointers to the column/character
// which will get misaligned.

const trimPaths = string =>
  string.match(STACK_PATH_REGEXP) ? trim(string) : string;

const getRenderedCallsite = (fileContent, line, column) => {
  let renderedCallsite = (0, _codeFrame.codeFrameColumns)(
    fileContent,
    {
      start: {
        column,
        line
      }
    },
    {
      highlightCode: true
    }
  );
  renderedCallsite = indentAllLines(renderedCallsite, MESSAGE_INDENT);
  renderedCallsite = `\n${renderedCallsite}\n`;
  return renderedCallsite;
};

const blankStringRegexp = /^\s*$/; // ExecError is an error thrown outside of the test suite (not inside an `it` or
// `before/after each` hooks). If it's thrown, none of the tests in the file
// are executed.

const formatExecError = (error, config, options, testPath, reuseMessage) => {
  if (!error || typeof error === 'number') {
    error = new Error(`Expected an Error, but "${String(error)}" was thrown`);
    error.stack = '';
  }

  let message, stack;

  if (typeof error === 'string' || !error) {
    error || (error = 'EMPTY ERROR');
    message = '';
    stack = error;
  } else {
    message = error.message;
    stack = error.stack;
  }

  const separated = separateMessageFromStack(stack || '');
  stack = separated.stack;

  if (separated.message.includes(trim(message))) {
    // Often stack trace already contains the duplicate of the message
    message = separated.message;
  }

  message = indentAllLines(message, MESSAGE_INDENT);
  stack =
    stack && !options.noStackTrace
      ? '\n' + formatStackTrace(stack, config, options, testPath)
      : '';

  if (blankStringRegexp.test(message) && blankStringRegexp.test(stack)) {
    // this can happen if an empty object is thrown.
    message = MESSAGE_INDENT + 'Error: No message was provided';
  }

  let messageToUse;

  if (reuseMessage) {
    messageToUse = ` ${message.trim()}`;
  } else {
    messageToUse = `${EXEC_ERROR_MESSAGE}\n\n${message}`;
  }

  return TITLE_INDENT + TITLE_BULLET + messageToUse + stack + '\n';
};

exports.formatExecError = formatExecError;

const removeInternalStackEntries = (lines, options) => {
  let pathCounter = 0;
  return lines.filter(line => {
    if (ANONYMOUS_FN_IGNORE.test(line)) {
      return false;
    }

    if (ANONYMOUS_PROMISE_IGNORE.test(line)) {
      return false;
    }

    if (ANONYMOUS_GENERATOR_IGNORE.test(line)) {
      return false;
    }

    if (NATIVE_NEXT_IGNORE.test(line)) {
      return false;
    }

    if (nodeInternals.some(internal => internal.test(line))) {
      return false;
    }

    if (!STACK_PATH_REGEXP.test(line)) {
      return true;
    }

    if (JASMINE_IGNORE.test(line)) {
      return false;
    }

    if (++pathCounter === 1) {
      return true; // always keep the first line even if it's from Jest
    }

    if (options.noStackTrace) {
      return false;
    }

    if (JEST_INTERNALS_IGNORE.test(line)) {
      return false;
    }

    return true;
  });
};

const formatPaths = (config, relativeTestPath, line) => {
  // Extract the file path from the trace line.
  const match = line.match(/(^\s*at .*?\(?)([^()]+)(:[0-9]+:[0-9]+\)?.*$)/);

  if (!match) {
    return line;
  }

  let filePath = (0, _slash.default)(
    _path.default.relative(config.rootDir, match[2])
  ); // highlight paths from the current test file

  if (
    (config.testMatch &&
      config.testMatch.length &&
      _micromatch.default.some(filePath, config.testMatch)) ||
    filePath === relativeTestPath
  ) {
    filePath = _chalk.default.reset.cyan(filePath);
  }

  return STACK_TRACE_COLOR(match[1]) + filePath + STACK_TRACE_COLOR(match[3]);
};

const getStackTraceLines = (
  stack,
  options = {
    noStackTrace: false
  }
) => removeInternalStackEntries(stack.split(/\n/), options);

exports.getStackTraceLines = getStackTraceLines;

const getTopFrame = lines => {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (
      var _iterator = lines[Symbol.iterator](), _step;
      !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
      _iteratorNormalCompletion = true
    ) {
      const line = _step.value;

      if (
        line.includes(PATH_NODE_MODULES) ||
        line.includes(PATH_JEST_PACKAGES)
      ) {
        continue;
      }

      const parsedFrame = stackUtils.parseLine(line.trim());

      if (parsedFrame && parsedFrame.file) {
        return parsedFrame;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return null;
};

exports.getTopFrame = getTopFrame;

const formatStackTrace = (stack, config, options, testPath) => {
  const lines = getStackTraceLines(stack, options);
  const topFrame = getTopFrame(lines);
  let renderedCallsite = '';
  const relativeTestPath = testPath
    ? (0, _slash.default)(_path.default.relative(config.rootDir, testPath))
    : null;

  if (topFrame) {
    const column = topFrame.column,
      filename = topFrame.file,
      line = topFrame.line;

    if (line && filename && _path.default.isAbsolute(filename)) {
      let fileContent;

      try {
        // TODO: check & read HasteFS instead of reading the filesystem:
        // see: https://github.com/facebook/jest/pull/5405#discussion_r164281696
        fileContent = jestReadFile(filename, 'utf8');
        renderedCallsite = getRenderedCallsite(fileContent, line, column);
      } catch (e) {
        // the file does not exist or is inaccessible, we ignore
      }
    }
  }

  const stacktrace = lines
    .filter(Boolean)
    .map(
      line =>
        STACK_INDENT + formatPaths(config, relativeTestPath, trimPaths(line))
    )
    .join('\n');
  return `${renderedCallsite}\n${stacktrace}`;
};

exports.formatStackTrace = formatStackTrace;

const formatResultsErrors = (testResults, config, options, testPath) => {
  const failedResults = testResults.reduce((errors, result) => {
    result.failureMessages.forEach(content =>
      errors.push({
        content,
        result
      })
    );
    return errors;
  }, []);

  if (!failedResults.length) {
    return null;
  }

  return failedResults
    .map(({result, content}) => {
      let _separateMessageFromS = separateMessageFromStack(content),
        message = _separateMessageFromS.message,
        stack = _separateMessageFromS.stack;

      stack = options.noStackTrace
        ? ''
        : STACK_TRACE_COLOR(
            formatStackTrace(stack, config, options, testPath)
          ) + '\n';
      message = indentAllLines(message, MESSAGE_INDENT);
      const title =
        _chalk.default.bold.red(
          TITLE_INDENT +
            TITLE_BULLET +
            result.ancestorTitles.join(ANCESTRY_SEPARATOR) +
            (result.ancestorTitles.length ? ANCESTRY_SEPARATOR : '') +
            result.title
        ) + '\n';
      return title + '\n' + message + '\n' + stack;
    })
    .join('\n');
};

exports.formatResultsErrors = formatResultsErrors;
const errorRegexp = /^Error:?\s*$/;

const removeBlankErrorLine = str =>
  str
    .split('\n') // Lines saying just `Error:` are useless
    .filter(line => !errorRegexp.test(line))
    .join('\n')
    .trimRight(); // jasmine and worker farm sometimes don't give us access to the actual
// Error object, so we have to regexp out the message from the stack string
// to format it.

const separateMessageFromStack = content => {
  if (!content) {
    return {
      message: '',
      stack: ''
    };
  } // All lines up to what looks like a stack -- or if nothing looks like a stack
  // (maybe it's a code frame instead), just the first non-empty line.
  // If the error is a plain "Error:" instead of a SyntaxError or TypeError we
  // remove the prefix from the message because it is generally not useful.

  const messageMatch = content.match(
    /^(?:Error: )?([\s\S]*?(?=\n\s*at\s.*:\d*:\d*)|\s*.*)([\s\S]*)$/
  );

  if (!messageMatch) {
    // For typescript
    throw new Error('If you hit this error, the regex above is buggy.');
  }

  const message = removeBlankErrorLine(messageMatch[1]);
  const stack = removeBlankErrorLine(messageMatch[2]);
  return {
    message,
    stack
  };
};

exports.separateMessageFromStack = separateMessageFromStack;


/***/ }),

/***/ "../node_modules/jest-message-util/build/types.js":
/*!********************************************************!*\
  !*** ../node_modules/jest-message-util/build/types.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



/***/ }),

/***/ "../node_modules/slash/index.js":
/*!**************************************!*\
  !*** ../node_modules/slash/index.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = input => {
	const isExtendedLengthPath = /^\\\\\?\\/.test(input);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(input); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return input;
	}

	return input.replace(/\\/g, '/');
};


/***/ }),

/***/ "../node_modules/stack-utils/index.js":
/*!********************************************!*\
  !*** ../node_modules/stack-utils/index.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* istanbul ignore next - affordance for node v8 */
if (!String.prototype.trimEnd) {
  String.prototype.trimEnd = function () {
    return this.replace(/[\n\r\s\t]+$/, '')
  }
}

const escapeStringRegexp = __webpack_require__(/*! escape-string-regexp */ "escape-string-regexp");

const natives = [].concat(
  __webpack_require__(/*! module */ "module").builtinModules,
  'bootstrap_node',
  'node'
).map(n => new RegExp(`(?:\\((?:node:)?${n}(?:\\.js)?:\\d+:\\d+\\)$|^\\s*at (?:node:)?${n}(?:\\.js)?:\\d+:\\d+$)`));

natives.push(
  /\((?:node:)?internal\/[^:]+:\d+:\d+\)$/,
  /\s*at (?:node:)?internal\/[^:]+:\d+:\d+$/,
  /\/\.node-spawn-wrap-\w+-\w+\/node:\d+:\d+\)?$/
);

class StackUtils {
  constructor (opts) {
    opts = Object.assign({}, {
      ignoredPackages: []
    }, opts);

    if ('internals' in opts === false) {
      opts.internals = StackUtils.nodeInternals();
    }

    if ('cwd' in opts === false) {
      opts.cwd = process.cwd()
    }

    this._cwd = opts.cwd.replace(/\\/g, '/');
    this._internals = [].concat(
      opts.internals,
      ignoredPackagesRegExp(opts.ignoredPackages)
    );

    this._wrapCallSite = opts.wrapCallSite || false;
  }

  static nodeInternals () {
    return natives.slice();
  }

  clean (stack, indent) {
    indent = indent || 0
    indent = ' '.repeat(indent);

    if (!Array.isArray(stack)) {
      stack = stack.split('\n');
    }

    if (!(/^\s*at /.test(stack[0])) && (/^\s*at /.test(stack[1]))) {
      stack = stack.slice(1);
    }

    let outdent = false;
    let lastNonAtLine = null;
    const result = [];

    stack.forEach(st => {
      st = st.replace(/\\/g, '/');

      if (this._internals.some(internal => internal.test(st))) {
        return;
      }

      const isAtLine = /^\s*at /.test(st);

      if (outdent) {
        st = st.trimEnd().replace(/^(\s+)at /, '$1');
      } else {
        st = st.trim();
        if (isAtLine) {
          st = st.slice(3);
        }
      }

      st = st.replace(`${this._cwd}/`, '');

      if (st) {
        if (isAtLine) {
          if (lastNonAtLine) {
            result.push(lastNonAtLine);
            lastNonAtLine = null;
          }

          result.push(st);
        } else {
          outdent = true;
          lastNonAtLine = st;
        }
      }
    });

    return result.map(line => `${indent}${line}\n`).join('');
  }

  captureString (limit, fn) {
    fn = fn || this.captureString
    if (typeof limit === 'function') {
      fn = limit;
      limit = Infinity;
    }

    const stackTraceLimit = Error.stackTraceLimit;
    if (limit) {
      Error.stackTraceLimit = limit;
    }

    const obj = {};

    Error.captureStackTrace(obj, fn);
    const stack = obj.stack;
    Error.stackTraceLimit = stackTraceLimit;

    return this.clean(stack);
  }

  capture (limit, fn) {
    fn = fn || this.capture
    if (typeof limit === 'function') {
      fn = limit;
      limit = Infinity;
    }

    const prepareStackTrace = Error.prepareStackTrace
    const stackTraceLimit = Error.stackTraceLimit
    Error.prepareStackTrace = (obj, site) => {
      if (this._wrapCallSite) {
        return site.map(this._wrapCallSite);
      }

      return site;
    };

    if (limit) {
      Error.stackTraceLimit = limit;
    }

    const obj = {};
    Error.captureStackTrace(obj, fn);
    const stack = obj.stack;
    Object.assign(Error, {prepareStackTrace, stackTraceLimit});

    return stack;
  }

  at (fn) {
    fn = fn || this.at
    const site = this.capture(1, fn)[0];

    if (!site) {
      return {};
    }

    const res = {
      line: site.getLineNumber(),
      column: site.getColumnNumber()
    };

    setFile(res, site.getFileName(), this._cwd);

    if (site.isConstructor()) {
      res.constructor = true;
    }

    if (site.isEval()) {
      res.evalOrigin = site.getEvalOrigin();
    }

    // Node v10 stopped with the isNative() on callsites, apparently
    /* istanbul ignore next */
    if (site.isNative()) {
      res.native = true;
    }

    let typename;
    try {
      typename = site.getTypeName();
    } catch (_) {
    }

    if (typename && typename !== 'Object' && typename !== '[object Object]') {
      res.type = typename;
    }

    const fname = site.getFunctionName();
    if (fname) {
      res.function = fname;
    }

    const meth = site.getMethodName();
    if (meth && fname !== meth) {
      res.method = meth;
    }

    return res;
  }

  parseLine (line) {
    const match = line && line.match(re);
    if (!match) {
      return null;
    }

    const ctor = match[1] === 'new';
    let fname = match[2];
    const evalOrigin = match[3];
    const evalFile = match[4];
    const evalLine = Number(match[5]);
    const evalCol = Number(match[6]);
    let file = match[7];
    const lnum = match[8];
    const col = match[9];
    const native = match[10] === 'native';
    const closeParen = match[11] === ')';
    let method;

    const res = {};

    if (lnum) {
      res.line = Number(lnum);
    }

    if (col) {
      res.column = Number(col);
    }

    if (closeParen && file) {
      // make sure parens are balanced
      // if we have a file like "asdf) [as foo] (xyz.js", then odds are
      // that the fname should be += " (asdf) [as foo]" and the file
      // should be just "xyz.js"
      // walk backwards from the end to find the last unbalanced (
      let closes = 0;
      for (let i = file.length - 1; i > 0; i--) {
        if (file.charAt(i) === ')') {
          closes++;
        } else if (file.charAt(i) === '(' && file.charAt(i - 1) === ' ') {
          closes--;
          if (closes === -1 && file.charAt(i - 1) === ' ') {
            const before = file.slice(0, i - 1);
            const after = file.slice(i + 1);
            file = after;
            fname += ` (${before}`;
            break;
          }
        }
      }
    }

    if (fname) {
      const methodMatch = fname.match(methodRe);
      if (methodMatch) {
        fname = methodMatch[1];
        method = methodMatch[2];
      }
    }

    setFile(res, file, this._cwd);

    if (ctor) {
      res.constructor = true;
    }

    if (evalOrigin) {
      res.evalOrigin = evalOrigin;
      res.evalLine = evalLine;
      res.evalColumn = evalCol;
      res.evalFile = evalFile && evalFile.replace(/\\/g, '/');
    }

    if (native) {
      res.native = true;
    }

    if (fname) {
      res.function = fname;
    }

    if (method && fname !== method) {
      res.method = method;
    }

    return res;
  }
}

function setFile (result, filename, cwd) {
  if (filename) {
    filename = filename.replace(/\\/g, '/');
    if (filename.startsWith(`${cwd}/`)) {
      filename = filename.slice(cwd.length + 1);
    }

    result.file = filename;
  }
}

function ignoredPackagesRegExp(ignoredPackages) {
  if (ignoredPackages.length === 0) {
    return [];
  }

  const packages = ignoredPackages.map(mod => escapeStringRegexp(mod));

  return new RegExp(`[\/\\\\]node_modules[\/\\\\](?:${packages.join('|')})[\/\\\\][^:]+:\\d+:\\d+`)
}

const re = new RegExp(
  '^' +
    // Sometimes we strip out the '    at' because it's noisy
  '(?:\\s*at )?' +
    // $1 = ctor if 'new'
  '(?:(new) )?' +
    // $2 = function name (can be literally anything)
    // May contain method at the end as [as xyz]
  '(?:(.*?) \\()?' +
    // (eval at <anonymous> (file.js:1:1),
    // $3 = eval origin
    // $4:$5:$6 are eval file/line/col, but not normally reported
  '(?:eval at ([^ ]+) \\((.+?):(\\d+):(\\d+)\\), )?' +
    // file:line:col
    // $7:$8:$9
    // $10 = 'native' if native
  '(?:(.+?):(\\d+):(\\d+)|(native))' +
    // maybe close the paren, then end
    // if $11 is ), then we only allow balanced parens in the filename
    // any imbalance is placed on the fname.  This is a heuristic, and
    // bound to be incorrect in some edge cases.  The bet is that
    // having weird characters in method names is more common than
    // having weird characters in filenames, which seems reasonable.
  '(\\)?)$'
);

const methodRe = /^(.*?) \[as (.*?)\]$/;

module.exports = StackUtils;


/***/ }),

/***/ "../node_modules/webpack/hot/log-apply-result.js":
/*!*******************************************************!*\
  !*** ../node_modules/webpack/hot/log-apply-result.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
module.exports = function(updatedModules, renewedModules) {
	var unacceptedModules = updatedModules.filter(function(moduleId) {
		return renewedModules && renewedModules.indexOf(moduleId) < 0;
	});
	var log = __webpack_require__(/*! ./log */ "../node_modules/webpack/hot/log.js");

	if (unacceptedModules.length > 0) {
		log(
			"warning",
			"[HMR] The following modules couldn't be hot updated: (They would need a full reload!)"
		);
		unacceptedModules.forEach(function(moduleId) {
			log("warning", "[HMR]  - " + moduleId);
		});
	}

	if (!renewedModules || renewedModules.length === 0) {
		log("info", "[HMR] Nothing hot updated.");
	} else {
		log("info", "[HMR] Updated modules:");
		renewedModules.forEach(function(moduleId) {
			if (typeof moduleId === "string" && moduleId.indexOf("!") !== -1) {
				var parts = moduleId.split("!");
				log.groupCollapsed("info", "[HMR]  - " + parts.pop());
				log("info", "[HMR]  - " + moduleId);
				log.groupEnd("info");
			} else {
				log("info", "[HMR]  - " + moduleId);
			}
		});
		var numberIds = renewedModules.every(function(moduleId) {
			return typeof moduleId === "number";
		});
		if (numberIds)
			log(
				"info",
				"[HMR] Consider using the NamedModulesPlugin for module names."
			);
	}
};


/***/ }),

/***/ "../node_modules/webpack/hot/log.js":
/*!******************************************!*\
  !*** ../node_modules/webpack/hot/log.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var logLevel = "info";

function dummy() {}

function shouldLog(level) {
	var shouldLog =
		(logLevel === "info" && level === "info") ||
		(["info", "warning"].indexOf(logLevel) >= 0 && level === "warning") ||
		(["info", "warning", "error"].indexOf(logLevel) >= 0 && level === "error");
	return shouldLog;
}

function logGroup(logFn) {
	return function(level, msg) {
		if (shouldLog(level)) {
			logFn(msg);
		}
	};
}

module.exports = function(level, msg) {
	if (shouldLog(level)) {
		if (level === "info") {
			console.log(msg);
		} else if (level === "warning") {
			console.warn(msg);
		} else if (level === "error") {
			console.error(msg);
		}
	}
};

/* eslint-disable node/no-unsupported-features/node-builtins */
var group = console.group || dummy;
var groupCollapsed = console.groupCollapsed || dummy;
var groupEnd = console.groupEnd || dummy;
/* eslint-enable node/no-unsupported-features/node-builtins */

module.exports.group = logGroup(group);

module.exports.groupCollapsed = logGroup(groupCollapsed);

module.exports.groupEnd = logGroup(groupEnd);

module.exports.setLogLevel = function(level) {
	logLevel = level;
};

module.exports.formatError = function(err) {
	var message = err.message;
	var stack = err.stack;
	if (!stack) {
		return message;
	} else if (stack.indexOf(message) < 0) {
		return message + "\n" + stack;
	} else {
		return stack;
	}
};


/***/ }),

/***/ "../node_modules/webpack/hot/poll.js?300":
/*!***********************************************!*\
  !*** ../node_modules/webpack/hot/poll.js?300 ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__resourceQuery) {/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
/*globals __resourceQuery */
if (true) {
	var hotPollInterval = +__resourceQuery.substr(1) || 10 * 60 * 1000;
	var log = __webpack_require__(/*! ./log */ "../node_modules/webpack/hot/log.js");

	var checkForUpdate = function checkForUpdate(fromUpdate) {
		if (module.hot.status() === "idle") {
			module.hot
				.check(true)
				.then(function(updatedModules) {
					if (!updatedModules) {
						if (fromUpdate) log("info", "[HMR] Update applied.");
						return;
					}
					__webpack_require__(/*! ./log-apply-result */ "../node_modules/webpack/hot/log-apply-result.js")(updatedModules, updatedModules);
					checkForUpdate(true);
				})
				.catch(function(err) {
					var status = module.hot.status();
					if (["abort", "fail"].indexOf(status) >= 0) {
						log("warning", "[HMR] Cannot apply update.");
						log("warning", "[HMR] " + log.formatError(err));
						log("warning", "[HMR] You need to restart the application!");
					} else {
						log("warning", "[HMR] Update failed: " + log.formatError(err));
					}
				});
		}
	};
	setInterval(checkForUpdate, hotPollInterval);
} else {}

/* WEBPACK VAR INJECTION */}.call(this, "?300"))

/***/ }),

/***/ "./deploy/chunks.json":
/*!****************************!*\
  !*** ./deploy/chunks.json ***!
  \****************************/
/*! exports provided: client, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"client\":{\"scss\":[],\"css\":[],\"js\":[\"http://localhost:3001/static/js/bundle.js\",\"http://localhost:3001/static/js/bundle.js.map\"]}}");

/***/ }),

/***/ "./node_modules/nessapp/tailwind/base.scss":
/*!*************************************************!*\
  !*** ./node_modules/nessapp/tailwind/base.scss ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:text/x-scss;base64,QHRhaWx3aW5kIGJhc2U7CkB0YWlsd2luZCBjb21wb25lbnRzOwpAdGFpbHdpbmQgdXRpbGl0aWVzOwpAdGFpbHdpbmQgc2NyZWVuczs="

/***/ }),

/***/ "./node_modules/nessapp/utils/nodeErrors.js":
/*!**************************************************!*\
  !*** ./node_modules/nessapp/utils/nodeErrors.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var _objectSpread = __webpack_require__(/*! @babel/runtime/helpers/objectSpread2 */ "@babel/runtime/helpers/objectSpread2").default;
var _objectWithoutProperties = __webpack_require__(/*! @babel/runtime/helpers/objectWithoutProperties */ "@babel/runtime/helpers/objectWithoutProperties").default;
var _excluded = ["stack"];
var fs = __webpack_require__(/*! fs */ "fs");

var _require = __webpack_require__(/*! jest-message-util */ "../node_modules/jest-message-util/build/index.js"),
    getTopFrame = _require.getTopFrame,
    getStackTraceLines = _require.getStackTraceLines,
    separateMessageFromStack = _require.separateMessageFromStack;

var _require2 = __webpack_require__(/*! @babel/code-frame */ "@babel/code-frame"),
    codeFrameColumns = _require2.codeFrameColumns;

function pretty(error) {
  var message = error.message,
      stack = error.stack;
  var lines = getStackTraceLines(stack);
  var topFrame = getTopFrame(lines);
  var fallback = "".concat(message).concat(stack);
  if (!topFrame) return fallback;
  var file = topFrame.file,
      line = topFrame.line;

  try {
    var result = codeFrameColumns(fs.readFileSync(file, 'utf8'), {
      start: {
        line: line
      }
    }, {
      highlightCode: true
    });
    return "\n".concat(message, "\n\n").concat(result, "\n").concat(stack, "\n");
  } catch (error) {
    return fallback;
  }
}

function usePrettyErrors(transform) {
  var prepareStackTrace = Error.prepareStackTrace;

  Error.prepareStackTrace = function (error, trace) {
    var prepared = prepareStackTrace ? separateMessageFromStack(prepareStackTrace(error, trace)) : error;
    var transformed = transform ? transform(prepared) : prepared;
    return pretty(transformed);
  };
}

var stackTransform = function stackTransform(_ref) {
  var _ref$stack = _ref.stack,
      stack = _ref$stack === void 0 ? '' : _ref$stack,
      rest = _objectWithoutProperties(_ref, _excluded);

  return _objectSpread({
    stack: stack.replace('/build/webpack:', '')
  }, rest);
}; // eslint-disable-next-line


usePrettyErrors(stackTransform);

/***/ }),

/***/ "./src/components/ui/Container/index.js":
/*!**********************************************!*\
  !*** ./src/components/ui/Container/index.js ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/components/ui/Container/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


function Container(_ref) {
  let {
    children
  } = _ref;
  const childrenWithProps = react__WEBPACK_IMPORTED_MODULE_0___default.a.Children.map(children, child => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.isValidElement(child)) {
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.cloneElement(child);
    }

    return child;
  });
  return __jsx("div", {
    className: "container m-auto w-[100%] ml-5 xs:ml-0 sm:ml-0 inline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 13,
      columnNumber: 12
    }
  }, childrenWithProps);
}

/* harmony default export */ __webpack_exports__["default"] = (Container);

/***/ }),

/***/ "./src/components/ui/Flex/index.js":
/*!*****************************************!*\
  !*** ./src/components/ui/Flex/index.js ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/components/ui/Flex/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


function Flex(_ref) {
  let {
    children
  } = _ref;
  const childrenWithProps = react__WEBPACK_IMPORTED_MODULE_0___default.a.Children.map(children, child => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.isValidElement(child)) {
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.cloneElement(child);
    }

    return child;
  });
  return __jsx("div", {
    className: "flex xs:block sm:block w-[100%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 13,
      columnNumber: 12
    }
  }, childrenWithProps);
}

/* harmony default export */ __webpack_exports__["default"] = (Flex);

/***/ }),

/***/ "./src/components/ui/Header/index.js":
/*!*******************************************!*\
  !*** ./src/components/ui/Header/index.js ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-router-dom */ "react-router-dom");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_router_dom__WEBPACK_IMPORTED_MODULE_1__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/components/ui/Header/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;



function Header(props) {
  const seacrhInput = Object(react__WEBPACK_IMPORTED_MODULE_0__["useRef"])(null);
  let keysPressed = {};

  const focusSearch = e => {
    e.preventDefault();
    seacrhInput.current.focus();
  };

  const handleKeyUnPress = Object(react__WEBPACK_IMPORTED_MODULE_0__["useCallback"])(event => {
    delete keysPressed[event.key];
  }, []); // handle what happens on key press

  const handleKeyPress = Object(react__WEBPACK_IMPORTED_MODULE_0__["useCallback"])(event => {
    keysPressed[event.key] = true;

    if (keysPressed['Control'] || keysPressed['Meta'] && event.key === 'k') {
      focusSearch(event);
    }
  }, []);
  Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyUnPress); // remove the event listener

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyUnPress);
    };
  }, [handleKeyPress]);
  return __jsx("header", {
    className: "sticky",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 38,
      columnNumber: 9
    }
  }, __jsx("div", {
    className: "p-[12px] text-center bg-[#2a425c] text-white xs:text-[12px] xs:p-[13px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 39,
      columnNumber: 13
    }
  }, "Support Ukraine \uD83C\uDDFA\uD83C\uDDE6 ", __jsx("a", {
    target: "_blank",
    rel: "noopener noreferrer",
    href: "https://opensource.facebook.com/support-ukraine",
    className: "underline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 38
    }
  }, " Help Provide Humanitarian Aid to Ukraine"), "."), __jsx("div", {
    className: "mb-4 border-b border-gray-200 dark:border-gray-700 px-10 xs:px-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 42,
      columnNumber: 13
    }
  }, __jsx("div", {
    className: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 43,
      columnNumber: 17
    }
  }, __jsx("div", {
    className: "flex w-[33%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 21
    }
  }, __jsx("ul", {
    className: "flex flex-wrap -mb-px text-sm font-medium text-center",
    id: "myTab",
    "data-tabs-toggle": "#myTabContent",
    role: "tablist",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 45,
      columnNumber: 25
    }
  }, __jsx("li", {
    className: "mr-20 justify-content flex",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 46,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/",
    className: "text-[20px] inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300 pointer text-[#4277ad]",
    id: "home",
    "data-tabs-target": "#home",
    type: "button",
    role: "tab",
    "aria-controls": "profile",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 47,
      columnNumber: 33
    }
  }, __jsx("b", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 48,
      columnNumber: 37
    }
  }, "Ness.js")), __jsx("span", {
    className: "text-[13px] text-slate-500 my-auto xs:hidden sm:hidden",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 33
    }
  }, "Newest Experience of Server Side development.")))), __jsx("div", {
    className: "flex w-[33%] xs:hidden sm:hidden",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 56,
      columnNumber: 21
    }
  }, __jsx("ul", {
    className: "flex flex-wrap -mb-px text-sm font-medium text-center",
    id: "myTab",
    "data-tabs-toggle": "#myTabContent",
    role: "tablist",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 57,
      columnNumber: 25
    }
  }, __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 58,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 59,
      columnNumber: 32
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'default' ? 'border-transparent' : ''}`,
    id: "profile-tab",
    "data-tabs-target": "#profile",
    type: "button",
    role: "tab",
    "aria-controls": "profile",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 60,
      columnNumber: 37
    }
  }, "Introduction"))), __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 63,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 64,
      columnNumber: 33
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'getting-started' ? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`,
    id: "dashboard-tab",
    "data-tabs-target": "#dashboard",
    type: "button",
    role: "tab",
    "aria-controls": "dashboard",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 65,
      columnNumber: 37
    }
  }, "Getting Started"))), __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 68,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/documentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 69,
      columnNumber: 33
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'documentation' ? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`,
    id: "settings-tab",
    "data-tabs-target": "#settings",
    type: "button",
    role: "tab",
    "aria-controls": "settings",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 70,
      columnNumber: 37
    }
  }, "Documentation"))), __jsx("li", {
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 73,
      columnNumber: 29
    }
  }, __jsx("a", {
    href: "https://github.com/firstcontributions/first-contributions",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 74,
      columnNumber: 33
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'contributing' ? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`,
    id: "contacts-tab",
    "data-tabs-target": "#contacts",
    type: "button",
    role: "tab",
    "aria-controls": "contacts",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 75,
      columnNumber: 37
    }
  }, "Contributing"))))), __jsx("div", {
    className: "flex w-[33%] xs:ml-auto xs:w-[67%] sm:ml-auto sm:w-[67%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 80,
      columnNumber: 21
    }
  }, __jsx("nav", {
    className: "mt-1.5 ml-auto",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 81,
      columnNumber: 25
    }
  }, __jsx("div", {
    className: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 82,
      columnNumber: 29
    }
  }, __jsx("nav", {
    className: "mr-5 flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 83,
      columnNumber: 33
    }
  }, __jsx("a", {
    href: "https://github.com/leroywagner/Ness.js",
    "data-tooltip-target": "tooltip-github-2",
    className: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 mr-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 84,
      columnNumber: 37
    }
  }, __jsx("svg", {
    className: "w-5 h-5",
    "aria-hidden": "true",
    focusable: "false",
    "data-prefix": "fab",
    "data-icon": "github",
    role: "img",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 496 512",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 85,
      columnNumber: 41
    }
  }, __jsx("path", {
    fill: "currentColor",
    d: "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 85,
      columnNumber: 208
    }
  })), __jsx("span", {
    className: "sr-only",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 86,
      columnNumber: 41
    }
  }, "View on Github")), __jsx("button", {
    disabled: true,
    type: "button",
    className: "xs:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 inline-flex items-center",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 88,
      columnNumber: 37
    }
  }, __jsx("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    className: "w-5 h-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 88,
      columnNumber: 291
    }
  }, __jsx("path", {
    d: "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 88,
      columnNumber: 410
    }
  })))), __jsx("form", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 90,
      columnNumber: 33
    }
  }, __jsx("label", {
    htmlFor: "search",
    className: "mb-3 text-sm font-medium text-gray-900 sr-only dark:text-gray-300",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 91,
      columnNumber: 37
    }
  }, "Your Email"), __jsx("div", {
    className: "relative flex mt-[1px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 92,
      columnNumber: 37
    }
  }, __jsx("div", {
    className: "flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 93,
      columnNumber: 41
    }
  }, __jsx("svg", {
    "aria-hidden": "true",
    className: "w-5 h-5 text-gray-500 dark:text-gray-400",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 94,
      columnNumber: 45
    }
  }, __jsx("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 94,
      columnNumber: 211
    }
  }))), __jsx("input", {
    ref: seacrhInput,
    type: "search",
    id: "search",
    className: "block p-2 pl-10 text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-200 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
    placeholder: "Search",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 96,
      columnNumber: 41
    }
  }), __jsx("button", {
    onClick: focusSearch,
    style: {
      'marginTop': '4.8px'
    },
    className: "border-gray-300 text-slate-500 absolute right-1.5 m-auto hover:bg-slate-200 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-1 py-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 97,
      columnNumber: 41
    }
  }, "\u2318K")))))))));
}

/* harmony default export */ __webpack_exports__["default"] = (Header);

/***/ }),

/***/ "./src/components/ui/Navbar/index.js":
/*!*******************************************!*\
  !*** ./src/components/ui/Navbar/index.js ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/components/ui/Navbar/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


function Navbar(_ref) {
  let {
    children
  } = _ref;
  const childrenWithProps = react__WEBPACK_IMPORTED_MODULE_0___default.a.Children.map(children, child => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.isValidElement(child)) {
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.cloneElement(child);
    }

    return child;
  });
  return __jsx("nav", {
    className: "navbar w-[25%] xs:w-[100%] xs:mt-[-15px] xs:mb-10 sm:w-[100%] sm:mt-[-15px] sm:mb-10",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 13,
      columnNumber: 12
    }
  }, childrenWithProps);
}

/* harmony default export */ __webpack_exports__["default"] = (Navbar);

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _router__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./router */ "./src/router.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! express */ "express");
/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_router_dom_server__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-router-dom/server */ "react-router-dom/server");
/* harmony import */ var react_router_dom_server__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_router_dom_server__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_dom_server__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react-dom/server */ "react-dom/server");
/* harmony import */ var react_dom_server__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_dom_server__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react-helmet */ "react-helmet");
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_helmet__WEBPACK_IMPORTED_MODULE_5__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_1___default.a.createElement;





 // dependencies

const path = __webpack_require__(/*! path */ "path");

const server = express__WEBPACK_IMPORTED_MODULE_2___default()();
const nessAplication = server;

const assets = __webpack_require__(/*! ./deploy/chunks.json */ "./deploy/chunks.json");

nessAplication.use(express__WEBPACK_IMPORTED_MODULE_2___default.a.static("/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/public"));
nessAplication.set('view engine', 'pug');
nessAplication.set('views', path.join(__dirname, '..', 'views')); // all routes to client router

nessAplication.get('/*', (req, res) => {
  const context = {};
  const serverRouter = Object(react_dom_server__WEBPACK_IMPORTED_MODULE_4__["renderToString"])(__jsx(react_router_dom_server__WEBPACK_IMPORTED_MODULE_3__["StaticRouter"], {
    location: req.url,
    isServer: true,
    __self: undefined,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 22,
      columnNumber: 5
    }
  }, __jsx(_router__WEBPACK_IMPORTED_MODULE_0__["default"], {
    isServer: true,
    __self: undefined,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 7
    }
  })));
  const metadata = react_helmet__WEBPACK_IMPORTED_MODULE_5__["Helmet"].renderStatic();
  const meta = metadata.meta.toComponent();
  const title = metadata.title.toComponent();
  const manifest = Object(react_dom_server__WEBPACK_IMPORTED_MODULE_4__["renderToString"])(meta) + Object(react_dom_server__WEBPACK_IMPORTED_MODULE_4__["renderToString"])(title);
  if (context.url) res.redirect(context.url);else res.status(200).render('index', {
    metadata: manifest,
    production: "development" === 'production',
    clientStyles: assets.client.css.filter(chunk => !chunk.includes('.map')),
    bundledScript: assets.client.js.filter(chunk => !chunk.includes('.map')),
    body: serverRouter
  });
});
/* harmony default export */ __webpack_exports__["default"] = (nessAplication);

/***/ }),

/***/ "./src/pages/Documentation.js":
/*!************************************!*\
  !*** ./src/pages/Documentation.js ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-router-dom */ "react-router-dom");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_router_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-helmet */ "react-helmet");
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_helmet__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! nessapp/next/ui */ "nessapp/next/ui");
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_ui_Header__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/ui/Header */ "./src/components/ui/Header/index.js");
/* harmony import */ var _components_ui_Container__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/ui/Container */ "./src/components/ui/Container/index.js");
/* harmony import */ var _components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../components/ui/Flex */ "./src/components/ui/Flex/index.js");
/* harmony import */ var _components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../components/ui/Navbar */ "./src/components/ui/Navbar/index.js");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../styles/Home.module.scss */ "./src/styles/Home.module.scss");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/pages/Documentation.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


 // layout

 // components




 // Home module stylesheet



function Documentation(props) {
  return __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Page"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 5
    }
  }, __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Head"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 7
    }
  }, __jsx(react_helmet__WEBPACK_IMPORTED_MODULE_2__["Helmet"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 21,
      columnNumber: 9
    }
  }, __jsx("title", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 22,
      columnNumber: 11
    }
  }, "Documentation | NessApp"), __jsx("meta", {
    name: "description",
    content: "Thanks for installing this application!",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 11
    }
  }))), __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Layout"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 7
    }
  }, __jsx(_components_ui_Header__WEBPACK_IMPORTED_MODULE_4__["default"], {
    active: "documentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27,
      columnNumber: 9
    }
  }), __jsx(_components_ui_Container__WEBPACK_IMPORTED_MODULE_5__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 9
    }
  }, __jsx("div", {
    className: "m-auto w-[100%] block",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 11
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 13
    }
  }, __jsx(_components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 31,
      columnNumber: 15
    }
  }, __jsx("ul", {
    className: "h-[100%] p-0 bg-slate-0 rounded-md ml-9 border-r border-slate-200 rounded-r-none sticky xs:w-[100%] xs:ml-0 xs:m-4 xs:bg-slate-50 sm:w-[100%] sm:ml-0 sm:m-4 sm:bg-slate-50",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 32,
      columnNumber: 17
    }
  }, __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 34,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 35,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 36,
      columnNumber: 25
    }
  }, "Introduction")), __jsx("ul", {
    className: "ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 38,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 39,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#about",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 25
    }
  }, "- What is Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 45,
      columnNumber: 25
    }
  }, "- Why to use Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 49,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 25
    }
  }, "- Development experience")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 54,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "https://github.com/leroywagner/Ness.js/issues",
    target: "_blank",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 55,
      columnNumber: 25
    }
  }, "- Create an issue")))), __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 62,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 63,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 64,
      columnNumber: 25
    }
  }, "Getting Started")), __jsx("ul", {
    className: "ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 66,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 67,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#quick-start",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 68,
      columnNumber: 25
    }
  }, "- Installing Ness CLI")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 72,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 73,
      columnNumber: 25
    }
  }, "- Setup a new application")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 77,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 78,
      columnNumber: 25
    }
  }, "- Commands")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 82,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 83,
      columnNumber: 25
    }
  }, "- Plugins")))), __jsx("li", {
    className: "active text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 90,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 91,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/documentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 92,
      columnNumber: 25
    }
  }, "Documentation"))))), __jsx("main", {
    className: "ml-10 w-[50%] p-10 pt-0 xs:ml-0 xs:w-[100%] sm:ml-0 sm:w-[100%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 97,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "mb-10 font-light pb-2 text-center",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 98,
      columnNumber: 17
    }
  }, __jsx("h1", {
    className: "text-[40px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 99,
      columnNumber: 19
    }
  }, "Documentation"), __jsx("p", {
    className: "text-slate-500 mt-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 100,
      columnNumber: 19
    }
  }, "Documentation will be available later, we are sorry.")), __jsx("div", {
    className: "mt-10",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 102,
      columnNumber: 17
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 103,
      columnNumber: 19
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/getting-started",
    className: "ml-auto inline-flex items-center py-2 px-4 mr-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 104,
      columnNumber: 21
    }
  }, __jsx("svg", {
    "aria-hidden": "true",
    className: "mr-2 w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 105,
      columnNumber: 25
    }
  }, __jsx("path", {
    "fill-rule": "evenodd",
    d: "M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z",
    "clip-rule": "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 105,
      columnNumber: 149
    }
  })), "Previous: Getting Started")))))))));
}

/* harmony default export */ __webpack_exports__["default"] = (Documentation);

/***/ }),

/***/ "./src/pages/Home.js":
/*!***************************!*\
  !*** ./src/pages/Home.js ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-helmet */ "react-helmet");
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_helmet__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-router-dom */ "react-router-dom");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_router_dom__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! nessapp/next/ui */ "nessapp/next/ui");
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_ui_Header__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/ui/Header */ "./src/components/ui/Header/index.js");
/* harmony import */ var _components_ui_Container__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/ui/Container */ "./src/components/ui/Container/index.js");
/* harmony import */ var _components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../components/ui/Flex */ "./src/components/ui/Flex/index.js");
/* harmony import */ var _components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../components/ui/Navbar */ "./src/components/ui/Navbar/index.js");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../styles/Home.module.scss */ "./src/styles/Home.module.scss");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/pages/Home.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


 // layout

 // components




 // Home module stylesheet



function Home(props) {
  return __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Page"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 5
    }
  }, __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Head"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 7
    }
  }, __jsx(react_helmet__WEBPACK_IMPORTED_MODULE_1__["Helmet"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 21,
      columnNumber: 9
    }
  }, __jsx("title", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 22,
      columnNumber: 11
    }
  }, "Introduction | NessApp"), __jsx("meta", {
    name: "description",
    content: "Thanks for installing this application!",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 11
    }
  }))), __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Layout"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 7
    }
  }, __jsx(_components_ui_Header__WEBPACK_IMPORTED_MODULE_4__["default"], {
    active: "default",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27,
      columnNumber: 9
    }
  }), __jsx(_components_ui_Container__WEBPACK_IMPORTED_MODULE_5__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 9
    }
  }, __jsx("div", {
    className: "m-auto",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 11
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 13
    }
  }, __jsx(_components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 31,
      columnNumber: 15
    }
  }, __jsx("ul", {
    className: "h-[100%] p-0 bg-slate-0 rounded-md ml-9 border-r border-slate-200 rounded-r-none sticky xs:w-[100%] xs:ml-0 xs:m-4 xs:bg-slate-50 sm:w-[100%] sm:ml-0 sm:m-4 sm:bg-slate-50",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 32,
      columnNumber: 17
    }
  }, __jsx("li", {
    className: "active text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 34,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 35,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 36,
      columnNumber: 25
    }
  }, "Introduction")), __jsx("ul", {
    className: "ml-5 xs:ml-0 sm:ml-0",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 38,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 39,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#about",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 25
    }
  }, "- What is Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 45,
      columnNumber: 25
    }
  }, "- Why to use Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 49,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 25
    }
  }, "- Development experience")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 54,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "https://github.com/leroywagner/Ness.js/issues",
    target: "_blank",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 55,
      columnNumber: 25
    }
  }, "- Create an issue")))), __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 62,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 63,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 64,
      columnNumber: 25
    }
  }, "Getting Started")), __jsx("ul", {
    className: "ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 66,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 67,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#quick-start",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 68,
      columnNumber: 25
    }
  }, "- Installing Ness CLI")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 72,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 73,
      columnNumber: 25
    }
  }, "- Setup a new application")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 77,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 78,
      columnNumber: 25
    }
  }, "- Commands")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 82,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 83,
      columnNumber: 25
    }
  }, "- Plugins")))), __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 90,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 91,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/documentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 92,
      columnNumber: 25
    }
  }, "Documentation"))))), __jsx("main", {
    className: "ml-10 w-[50%] p-10 pt-0 xs:ml-0 xs:w-[100%] sm:ml-0 sm:w-[100%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 97,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "mb-10 font-light pb-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 98,
      columnNumber: 17
    }
  }, __jsx("h1", {
    className: "text-[40px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 99,
      columnNumber: 19
    }
  }, "Introduction"), __jsx("p", {
    className: "text-slate-500 mt-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 100,
      columnNumber: 19
    }
  }, "Get started with the open-source framework of React experience and interactive UI components built with the utility classes from Tailwind CSS")), __jsx("div", {
    className: "bg-slate-0 p-0 rounded-lg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 102,
      columnNumber: 17
    }
  }, __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 103,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 104,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 105,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 106,
      columnNumber: 25
    }
  }, "What is Ness.js?"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 109,
      columnNumber: 21
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 110,
      columnNumber: 23
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 111,
      columnNumber: 25
    }
  }, "Ness.js is an open-source framework of React experience and interactive UI components built with the utility classes from Tailwind CSS. It supports both-side rendering without missmatches on client-side and server-side."), __jsx("p", {
    className: "text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 112,
      columnNumber: 25
    }
  }, "Check out this guide to learn how to ", __jsx("a", {
    href: "/getting-started",
    className: "text-blue-600 dark:text-blue-500 hover:underline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 112,
      columnNumber: 110
    }
  }, "get started"), " and start developing websites even faster.")))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 116,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 117,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 118,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 119,
      columnNumber: 25
    }
  }, "Why to use Ness.js?"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 122,
      columnNumber: 21
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 123,
      columnNumber: 23
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 124,
      columnNumber: 25
    }
  }, "Ness.js will allow you to create modern SPA applications without any extra knowledge, only with experience in creating ", __jsx("a", {
    href: "https://create-react-app.dev/",
    className: "text-blue-600 dark:text-blue-500 hover:underline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 124,
      columnNumber: 197
    }
  }, "create-react-app"), ".")))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 128,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 129,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 130,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 131,
      columnNumber: 25
    }
  }, "Development experience"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 134,
      columnNumber: 21
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 135,
      columnNumber: 23
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 136,
      columnNumber: 25
    }
  }, "You do not have to buy various solutions, development and assembly of your application takes place in real time using the popular HOT Module Replacement(HMR) and also saves time writing styling. As practice has shown, writing a complex application takes less than a week."))))), __jsx("div", {
    className: "mt-10",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 141,
      columnNumber: 17
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 142,
      columnNumber: 19
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/getting-started",
    className: "inline-flex items-center py-2 px-4 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 143,
      columnNumber: 21
    }
  }, "Next: Getting Started", __jsx("svg", {
    "aria-hidden": "true",
    className: "ml-2 w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 145,
      columnNumber: 23
    }
  }, __jsx("path", {
    fillRule: "evenodd",
    d: "M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z",
    clipRule: "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 145,
      columnNumber: 147
    }
  })))))))))));
}

/* harmony default export */ __webpack_exports__["default"] = (Home);

/***/ }),

/***/ "./src/pages/NotFound.js":
/*!*******************************!*\
  !*** ./src/pages/NotFound.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-helmet */ "react-helmet");
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_helmet__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! nessapp/next/ui */ "nessapp/next/ui");
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_ui_Header__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components/ui/Header */ "./src/components/ui/Header/index.js");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/Home.module.scss */ "./src/styles/Home.module.scss");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_4__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/pages/NotFound.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


// layout
 // components

 // Home module stylesheet



function QuickStart(props) {
  return __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__["Page"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 16,
      columnNumber: 5
    }
  }, __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__["Head"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 17,
      columnNumber: 7
    }
  }, __jsx(react_helmet__WEBPACK_IMPORTED_MODULE_1__["Helmet"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 18,
      columnNumber: 9
    }
  }, __jsx("title", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 11
    }
  }, "Not Found | NessApp"), __jsx("meta", {
    name: "description",
    content: "Thanks for installing this application!",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 11
    }
  }))), __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__["Layout"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 7
    }
  }, __jsx(_components_ui_Header__WEBPACK_IMPORTED_MODULE_3__["default"], {
    active: "getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 24,
      columnNumber: 9
    }
  }), __jsx("div", {
    className: "m-auto w-full",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 25,
      columnNumber: 13
    }
  }, __jsx("main", {
    className: "p-10 pt-0 m-auto mt-20",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 17
    }
  }, __jsx("div", {
    className: "m-auto mb-10 font-light pb-2 text-center",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27,
      columnNumber: 21
    }
  }, __jsx("h1", {
    className: "text-[60px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 25
    }
  }, "404"), __jsx("h1", {
    className: "text-[40px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 25
    }
  }, "Page was not found"), __jsx("p", {
    className: "text-slate-500 mt-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 25
    }
  }, "We are sorry, but that's what we have :("))))));
}

/* harmony default export */ __webpack_exports__["default"] = (QuickStart);

/***/ }),

/***/ "./src/pages/QuickStart.js":
/*!*********************************!*\
  !*** ./src/pages/QuickStart.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-helmet */ "react-helmet");
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_helmet__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-router-dom */ "react-router-dom");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_router_dom__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! nessapp/next/ui */ "nessapp/next/ui");
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_ui_Header__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/ui/Header */ "./src/components/ui/Header/index.js");
/* harmony import */ var _components_ui_Container__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/ui/Container */ "./src/components/ui/Container/index.js");
/* harmony import */ var _components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../components/ui/Flex */ "./src/components/ui/Flex/index.js");
/* harmony import */ var _components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../components/ui/Navbar */ "./src/components/ui/Navbar/index.js");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../styles/Home.module.scss */ "./src/styles/Home.module.scss");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/pages/QuickStart.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


 // layout

 // components




 // Home module stylesheet



function QuickStart(props) {
  return __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Page"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 5
    }
  }, __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Head"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 7
    }
  }, __jsx(react_helmet__WEBPACK_IMPORTED_MODULE_1__["Helmet"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 21,
      columnNumber: 9
    }
  }, __jsx("title", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 22,
      columnNumber: 11
    }
  }, "Getting Started | NessApp"), __jsx("meta", {
    name: "description",
    content: "Thanks for installing this application!",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 11
    }
  }))), __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Layout"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 7
    }
  }, __jsx(_components_ui_Header__WEBPACK_IMPORTED_MODULE_4__["default"], {
    active: "getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27,
      columnNumber: 9
    }
  }), __jsx(_components_ui_Container__WEBPACK_IMPORTED_MODULE_5__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 9
    }
  }, __jsx("div", {
    className: "m-auto",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 11
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 13
    }
  }, __jsx(_components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 31,
      columnNumber: 17
    }
  }, __jsx("ul", {
    className: "h-[100%] p-0 bg-slate-0 rounded-md ml-9 border-r border-slate-200 rounded-r-none sticky xs:w-[100%] xs:ml-0 xs:m-4 xs:bg-slate-50 sm:w-[100%] sm:ml-0 sm:m-4 sm:bg-slate-50",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 32,
      columnNumber: 17
    }
  }, __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 34,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 35,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 36,
      columnNumber: 25
    }
  }, "Introduction")), __jsx("ul", {
    className: "ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 38,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 39,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#about",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 25
    }
  }, "- What is Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 45,
      columnNumber: 25
    }
  }, "- Why to use Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 49,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 25
    }
  }, "- Development experience")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 54,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "https://github.com/leroywagner/Ness.js/issues",
    target: "_blank",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 55,
      columnNumber: 25
    }
  }, "- Create an issue")))), __jsx("li", {
    className: "active text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 62,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 63,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 64,
      columnNumber: 25
    }
  }, "Getting Started")), __jsx("ul", {
    className: "ml-5 xs:ml-0 sm:ml-0",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 66,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 67,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#quick-start",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 68,
      columnNumber: 25
    }
  }, "- Installing Ness CLI")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 72,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 73,
      columnNumber: 25
    }
  }, "- Setup a new application")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 77,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 78,
      columnNumber: 25
    }
  }, "- Commands")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 82,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 83,
      columnNumber: 25
    }
  }, "- Plugins")))), __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 90,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 91,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/documentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 92,
      columnNumber: 25
    }
  }, "Documentation"))))), __jsx("main", {
    className: "ml-10 w-[50%] p-10 pt-0 xs:ml-0 xs:w-[100%] sm:ml-0 sm:w-[100%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 97,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "mb-10 font-light pb-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 98,
      columnNumber: 17
    }
  }, __jsx("h1", {
    className: "text-[40px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 99,
      columnNumber: 19
    }
  }, "Getting Started"), __jsx("p", {
    className: "text-slate-500 mt-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 100,
      columnNumber: 19
    }
  }, "Installation, commands and plugins.")), __jsx("div", {
    className: "bg-slate-0 p-0 rounded-lg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 102,
      columnNumber: 17
    }
  }, __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 103,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 104,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 105,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 106,
      columnNumber: 25
    }
  }, "Installing Ness CLI"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 109,
      columnNumber: 21
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 110,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-4 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 111,
      columnNumber: 29
    }
  }, "Use command below for installing client, you may use: npx, npm & yarn:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 112,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 113,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 114,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 115,
      columnNumber: 41
    }
  }, "$ npm install -g create-ness-app@latest")))), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 119,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 120,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 121,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 122,
      columnNumber: 41
    }
  }, "$ npx create-ness-app")))), __jsx("p", {
    className: "p-4 border-l-4 border-slate-100 my-5 py-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 126,
      columnNumber: 29
    }
  }, "Note that we prefer using npx, because of latest version. If you will using npx go next step"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 129,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 130,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 131,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 132,
      columnNumber: 41
    }
  }, "$ yarn global add create-ness-app@latest")))), __jsx("p", {
    className: "mt-5 text-gray-500 dark:text-gray-400 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 136,
      columnNumber: 29
    }
  }, "If you've previously installed", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 138,
      columnNumber: 33
    }
  }, "create-ness-app"), "globally using", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 139,
      columnNumber: 33
    }
  }, "npm install -g create-ness-app"), ", we recommend you uninstall the package by", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 140,
      columnNumber: 33
    }
  }, "npm uninstall -g create-ness-app"), "or", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 141,
      columnNumber: 33
    }
  }, "yarn global remove create-ness-app"), "to ensure that npx always uses the latest version.")))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 146,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 147,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 148,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 149,
      columnNumber: 25
    }
  }, "Setup a new application"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 152,
      columnNumber: 21
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 153,
      columnNumber: 23
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 154,
      columnNumber: 25
    }
  }, "Now you abble to setup a new project, use next command:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 155,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 156,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 157,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 158,
      columnNumber: 41
    }
  }, "$ npx create-ness-app")))), __jsx("p", {
    className: "p-4 border-l-4 border-slate-100 my-5 py-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 162,
      columnNumber: 29
    }
  }, "or (by default)"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 163,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 164,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 165,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 166,
      columnNumber: 41
    }
  }, "$ create-ness-app")))), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 170,
      columnNumber: 25
    }
  }, "Now you must set project name and location where to setup. For example:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 171,
      columnNumber: 25
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 172,
      columnNumber: 29
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 173,
      columnNumber: 33
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 174,
      columnNumber: 37
    }
  }, __jsx("i", {
    className: "text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 175,
      columnNumber: 41
    }
  }, "How we will name your project?(ness-app):"), " ness-app")), __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 178,
      columnNumber: 33
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 179,
      columnNumber: 37
    }
  }, __jsx("i", {
    className: "text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 180,
      columnNumber: 41
    }
  }, "Where do you want to locate your project?(current directory):"))), __jsx("br", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 183,
      columnNumber: 33
    }
  }), __jsx("div", {
    className: "token-line !color-slate-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 184,
      columnNumber: 33
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 185,
      columnNumber: 37
    }
  }, __jsx("i", {
    className: "text-slate-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 186,
      columnNumber: 41
    }
  }, "Creating ness.js app ness-app in ness-app")))))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 194,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 195,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 196,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 197,
      columnNumber: 25
    }
  }, "Availbale commands"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 200,
      columnNumber: 21
    }
  }, __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 201,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 202,
      columnNumber: 29
    }
  }, "Running development server with hot-reload on port 3000"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 203,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 204,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 205,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 206,
      columnNumber: 41
    }
  }, "$ npm run start"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 211,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 212,
      columnNumber: 29
    }
  }, "Building server"), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 213,
      columnNumber: 29
    }
  }, "You may pass", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 213,
      columnNumber: 116
    }
  }, "NODE_ENV=production"), "directly or", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 213,
      columnNumber: 159
    }
  }, "NODE_ENV=development")), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 214,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 215,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 216,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 217,
      columnNumber: 41
    }
  }, "$ npm run build"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 222,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 223,
      columnNumber: 29
    }
  }, "Generate component, hook, page and others"), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 224,
      columnNumber: 29
    }
  }, "Available types:", __jsx("div", {
    className: "mt-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 225,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 226,
      columnNumber: 37
    }
  }, __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 227,
      columnNumber: 41
    }
  }, "page"), __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 228,
      columnNumber: 41
    }
  }, "hook"), __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 229,
      columnNumber: 41
    }
  }, "service"), __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 230,
      columnNumber: 41
    }
  }, "component")))), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 234,
      columnNumber: 29
    }
  }, "Example:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 235,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 236,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 237,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 238,
      columnNumber: 41
    }
  }, "$ nessapp generate *type* *path*"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 243,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 244,
      columnNumber: 29
    }
  }, "Start production server"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 245,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 246,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 247,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 248,
      columnNumber: 41
    }
  }, "$ npm run start:prod"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 253,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 254,
      columnNumber: 29
    }
  }, "Start testing"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 255,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 256,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 257,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 258,
      columnNumber: 41
    }
  }, "$ npm run test")))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 264,
      columnNumber: 21
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 265,
      columnNumber: 25
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 266,
      columnNumber: 29
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 267,
      columnNumber: 33
    }
  }, "Plugins"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 270,
      columnNumber: 25
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 271,
      columnNumber: 29
    }
  }, __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 272,
      columnNumber: 33
    }
  }, __jsx("b", {
    className: "mb-4 code-description text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 273,
      columnNumber: 37
    }
  }, "After installing plugins include them in", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 273,
      columnNumber: 129
    }
  }, "ness.config.js")), __jsx("pre", {
    className: "mt-5 text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 274,
      columnNumber: 37
    }
  }, __jsx("code", {
    class: "prism-code language-js",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 275,
      columnNumber: 41
    }
  }, __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 276,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    style: {
      color: "rgb(233, 30, 99)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 277,
      columnNumber: 49
    }
  }, "module"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 278,
      columnNumber: 49
    }
  }, "."), __jsx("span", {
    class: "token property-access",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 279,
      columnNumber: 49
    }
  }, "exports"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 280,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token operator",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 281,
      columnNumber: 49
    }
  }, "="), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 282,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 283,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 284,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 286,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 287,
      columnNumber: 49
    }
  }, "  plugins"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 288,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 289,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 290,
      columnNumber: 49
    }
  }, "["), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 291,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 293,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 294,
      columnNumber: 49
    }
  }, "    "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 295,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 296,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 298,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 299,
      columnNumber: 49
    }
  }, "      name"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 300,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 301,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token string",
    style: {
      color: "rgb(2, 130, 101)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 302,
      columnNumber: 49
    }
  }, "'tailwind'"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 303,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 304,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 306,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 307,
      columnNumber: 49
    }
  }, "      options"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 308,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 309,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 310,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 311,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 313,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 314,
      columnNumber: 49
    }
  }, "        postcss"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 315,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 316,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 317,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 318,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 320,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 321,
      columnNumber: 49
    }
  }, "          dev"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 322,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 323,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 324,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 325,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 327,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 328,
      columnNumber: 49
    }
  }, "            sourceMap"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 329,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 330,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token boolean",
    style: {
      color: "rgb(217, 147, 30)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 331,
      columnNumber: 49
    }
  }, "true"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 332,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 333,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 335,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 336,
      columnNumber: 49
    }
  }, "          "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 337,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 338,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 339,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 341,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 342,
      columnNumber: 49
    }
  }, "        "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 343,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 344,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 345,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 347,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 348,
      columnNumber: 49
    }
  }, "      "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 349,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 350,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 351,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 353,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 354,
      columnNumber: 49
    }
  }, "    "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 355,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 356,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 357,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 359,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 360,
      columnNumber: 49
    }
  }, "  "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 361,
      columnNumber: 49
    }
  }, "]"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 362,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 363,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 365,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 366,
      columnNumber: 49
    }
  }), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 367,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 368,
      columnNumber: 49
    }
  }, ";"))))))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 375,
      columnNumber: 25
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 376,
      columnNumber: 29
    }
  }, __jsx("p", {
    className: "mb-4 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 377,
      columnNumber: 33
    }
  }, "Available plugins:"), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 379,
      columnNumber: 33
    }
  }, __jsx("b", {
    className: "mb-4",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 380,
      columnNumber: 37
    }
  }, "Plugin ness-tailwind will setup tailwind in your application, it using SASS."), __jsx("pre", {
    className: "mt-4 text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 381,
      columnNumber: 37
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 382,
      columnNumber: 41
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 383,
      columnNumber: 45
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 384,
      columnNumber: 49
    }
  }, "$ npm install ness-tailwind@latest")))))))))), __jsx("div", {
    className: "mt-10",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 394,
      columnNumber: 17
    }
  }, __jsx("div", {
    className: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 395,
      columnNumber: 19
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/",
    className: "mr-auto inline-flex items-center py-2 px-4 mr-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 396,
      columnNumber: 21
    }
  }, __jsx("svg", {
    "aria-hidden": "true",
    className: "mr-2 w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 397,
      columnNumber: 25
    }
  }, __jsx("path", {
    "fill-rule": "evenodd",
    d: "M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z",
    "clip-rule": "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 397,
      columnNumber: 149
    }
  })), "Previous: Introduction"), __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/documentation",
    className: "mr-auto inline-flex items-center py-2 px-4 mr-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 400,
      columnNumber: 21
    }
  }, "Next: Documentation", __jsx("svg", {
    "aria-hidden": "true",
    className: "ml-2 w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 402,
      columnNumber: 25
    }
  }, __jsx("path", {
    "fill-rule": "evenodd",
    d: "M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z",
    "clip-rule": "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 402,
      columnNumber: 149
    }
  })))))))))));
}

/* harmony default export */ __webpack_exports__["default"] = (QuickStart);

/***/ }),

/***/ "./src/router.js":
/*!***********************!*\
  !*** ./src/router.js ***!
  \***********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-router-dom */ "react-router-dom");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_router_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _pages_Home__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pages/Home */ "./src/pages/Home.js");
/* harmony import */ var _pages_QuickStart__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./pages/QuickStart */ "./src/pages/QuickStart.js");
/* harmony import */ var _pages_Documentation__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./pages/Documentation */ "./src/pages/Documentation.js");
/* harmony import */ var _pages_NotFound__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./pages/NotFound */ "./src/pages/NotFound.js");
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/router.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;





 // Routes

const HomePage = () => __jsx(_pages_Home__WEBPACK_IMPORTED_MODULE_2__["default"], {
  __self: undefined,
  __source: {
    fileName: _jsxFileName,
    lineNumber: 9,
    columnNumber: 24
  }
});

const QuickStartPage = () => __jsx(_pages_QuickStart__WEBPACK_IMPORTED_MODULE_3__["default"], {
  __self: undefined,
  __source: {
    fileName: _jsxFileName,
    lineNumber: 10,
    columnNumber: 30
  }
});

const DocumentationPage = () => __jsx(_pages_Documentation__WEBPACK_IMPORTED_MODULE_4__["default"], {
  __self: undefined,
  __source: {
    fileName: _jsxFileName,
    lineNumber: 11,
    columnNumber: 33
  }
});

function Router() {
  return __jsx(react__WEBPACK_IMPORTED_MODULE_0___default.a.Fragment, {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 15,
      columnNumber: 5
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Routes"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 16,
      columnNumber: 7
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Route"], {
    path: "/",
    element: __jsx(HomePage, {
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 17,
        columnNumber: 34
      }
    }),
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 17,
      columnNumber: 9
    }
  }), __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Route"], {
    path: "/getting-started",
    element: __jsx(QuickStartPage, {
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 18,
        columnNumber: 49
      }
    }),
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 18,
      columnNumber: 9
    }
  }), __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Route"], {
    path: "/documentation",
    element: __jsx(DocumentationPage, {
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 19,
        columnNumber: 47
      }
    }),
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 9
    }
  }), __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Route"], {
    path: "/*",
    element: __jsx(_pages_NotFound__WEBPACK_IMPORTED_MODULE_5__["default"], {
      __self: this,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 20,
        columnNumber: 35
      }
    }),
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 9
    }
  })));
}

/* harmony default export */ __webpack_exports__["default"] = (Router);

/***/ }),

/***/ "./src/server/index.js":
/*!*****************************!*\
  !*** ./src/server/index.js ***!
  \*****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const server = __webpack_require__(/*! ../index */ "./src/index.js").default;

const express = __webpack_require__(/*! express */ "express");

const results = Object.create(null);

const chalk = __webpack_require__(/*! chalk */ "chalk");

const logger = console.log;

const {
  networkInterfaces
} = __webpack_require__(/*! os */ "os");

const nets = networkInterfaces();
const port = 3000; // hot-reload server core

let nessAplication = server; // retrieve networkInterfaces

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;

    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) results[name] = [];
      results[name].push(net.address);
    }
  }
} // server live mode


if (true) module.hot.accept(/*! ../index */ "./src/index.js", function(__WEBPACK_OUTDATED_DEPENDENCIES__) { (() => {
  try {
    nessAplication = __webpack_require__(/*! ../index */ "./src/index.js").default;
  } catch (error) {
    console.error(error);
  }
})(__WEBPACK_OUTDATED_DEPENDENCIES__); }.bind(this));
/* harmony default export */ __webpack_exports__["default"] = (express().use((req, res) => nessAplication.handle(req, res)).listen(port, function (err) {
  if (err) return console.error(err);
  logger(`🌱 NessApp started on: ${chalk.hex('#5590CB').bold('http://localhost:' + "3000" || false)} and ${chalk.hex('#5590CB').bold('http://' + results['en0'] instanceof Object ? results['en0'][0] : 'localhost' + ':' + "3000" || false)}`);
}));

/***/ }),

/***/ "./src/styles/Home.module.scss":
/*!*************************************!*\
  !*** ./src/styles/Home.module.scss ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:text/x-scss;base64,bmF2IGxpID4gdWwgewogIGRpc3BsYXk6IG5vbmU7Cn0KbmF2IGxpID4gdWwgbGkgewogIEBhcHBseSB0ZXh0LXNsYXRlLTEwMDsKfQoKbmF2IGxpLmFjdGl2ZSB1bCB7CiAgZGlzcGxheTogYmxvY2s7Cn0KbmF2IGxpLmFjdGl2ZSBkaXYgewogIEBhcHBseSBiZy1zbGF0ZS0yMDA7CiAgZGlzcGxheTogYmxvY2s7CiAgY29sb3I6IGJsYWNrOwogIGZvbnQtd2VpZ2h0OiA1MDA7Cn0KCm5hdiBsaSBkaXYgewogIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7Cn0KCi5jb2RlLWRlc2NyaXB0aW9uIHsKICBsaW5lLWhlaWdodDogMjhweDsKfQouY29kZS1kZXNjcmlwdGlvbiBjb2RlIHsKICBAYXBwbHkgdGV4dC1bMTRweF0gYmctc2xhdGUtMTAwIHJvdW5kZWQtbGcgcC0xIG0tMjsKfQoKLmNvbnRhaW5lciB7CiAgQGFwcGx5IHNtOm1sLTA7Cn0KCnByZSB7CiAgQGFwcGx5IHctWzEwMCVdOwogIG92ZXJmbG93LXg6IGF1dG87Cn0="

/***/ }),

/***/ 0:
/*!*********************************************************************************************************************************************!*\
  !*** multi ./node_modules/nessapp/utils/nodeErrors.js webpack/hot/poll?300 ./src/server/index.js ./node_modules/nessapp/tailwind/base.scss ***!
  \*********************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! /Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/node_modules/nessapp/utils/nodeErrors.js */"./node_modules/nessapp/utils/nodeErrors.js");
__webpack_require__(/*! webpack/hot/poll?300 */"../node_modules/webpack/hot/poll.js?300");
__webpack_require__(/*! /Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/server/index.js */"./src/server/index.js");
module.exports = __webpack_require__(/*! /Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/node_modules/nessapp/tailwind/base.scss */"./node_modules/nessapp/tailwind/base.scss");


/***/ }),

/***/ "@babel/code-frame":
/*!************************************!*\
  !*** external "@babel/code-frame" ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@babel/code-frame");

/***/ }),

/***/ "@babel/runtime/helpers/objectSpread2":
/*!*******************************************************!*\
  !*** external "@babel/runtime/helpers/objectSpread2" ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@babel/runtime/helpers/objectSpread2");

/***/ }),

/***/ "@babel/runtime/helpers/objectWithoutProperties":
/*!*****************************************************************!*\
  !*** external "@babel/runtime/helpers/objectWithoutProperties" ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@babel/runtime/helpers/objectWithoutProperties");

/***/ }),

/***/ "chalk":
/*!************************!*\
  !*** external "chalk" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("chalk");

/***/ }),

/***/ "escape-string-regexp":
/*!***************************************!*\
  !*** external "escape-string-regexp" ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("escape-string-regexp");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "micromatch":
/*!*****************************!*\
  !*** external "micromatch" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("micromatch");

/***/ }),

/***/ "module":
/*!*************************!*\
  !*** external "module" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("module");

/***/ }),

/***/ "nessapp/next/ui":
/*!**********************************!*\
  !*** external "nessapp/next/ui" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("nessapp/next/ui");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react");

/***/ }),

/***/ "react-dom/server":
/*!***********************************!*\
  !*** external "react-dom/server" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react-dom/server");

/***/ }),

/***/ "react-helmet":
/*!*******************************!*\
  !*** external "react-helmet" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react-helmet");

/***/ }),

/***/ "react-router-dom":
/*!***********************************!*\
  !*** external "react-router-dom" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react-router-dom");

/***/ }),

/***/ "react-router-dom/server":
/*!******************************************!*\
  !*** external "react-router-dom/server" ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("react-router-dom/server");

/***/ })

/******/ });
//# sourceMappingURL=server.js.map