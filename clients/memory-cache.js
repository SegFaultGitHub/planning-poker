"use strict";

/* Mock library for Redis */

module.exports = function (callback) {
	var cache = {};

	var client = {
		get: function (key, callback) {
			if (cache.hasOwnProperty(key)) {
				if (typeof cache[key] === "string") {
					return callback(null, cache[key]);
				} else {
					return callback("WRONGTYPE Operation against a key holding the wrong kind of value");
				}
			} else {
				return callback(null, null);
			}
		},
		set: function (key, value, callback) {
			if (cache.hasOwnProperty(key)) {
				if (typeof cache[key] === "string") {
					cache[key] = value.toString();
					return callback(null, "OK");
				} else {
					return callback("WRONGTYPE Operation against a key holding the wrong kind of value");
				}
			} else {
				cache[key] = value.toString();
				return callback(null, "OK");
			}
		},
		hget: function (key, field, callback) {
			if (cache.hasOwnProperty(key)) {
				if (typeof cache[key] === "object") {
					return callback(null, cache[key].hasOwnProperty(field) ? cache[key][field] : null);
				} else {
					return callback("WRONGTYPE Operation against a key holding the wrong kind of value");
				}
			} else {
				return callback(null, null);
			}
		},
		hset: function (key, field, value, callback) {
			if (cache.hasOwnProperty(key)) {
				if (typeof cache[key] === "object") {
					cache[key][field] = value.toString();
					return callback(null, "OK");
				} else {
					return callback("WRONGTYPE Operation against a key holding the wrong kind of value");
				}
			} else {
				cache[key] = {};
				cache[key][field] = value.toString();
				return callback(null, "OK");
			}
		},
		del: function(pattern, callback) {
			pattern = pattern.replace("*", ".*");
			var regexp = new RegExp(`^${pattern}$`);
			var count = 0;
			Object.keys(cache).forEach(function(key) {
				if (regexp.test(key)) {
					delete cache[key];
					count++;
				}
			});
			return callback(null, count);
		},
		keys: function(pattern, callback) {
			pattern = pattern.replace("*", ".*");
			var regexp = new RegExp(`^${pattern}$`);
			keys = Object.keys(cache).filter(function(key) {
				return regexp.test(key);
			});
			return callback(null, keys);
		},
		expire: function(key, ttl, callback) {
			return callback();
		}
	}

	return callback(null, client);
};
