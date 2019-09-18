"use strict";

var config = require("../config.js");
var logger = require("../lib/logger")({
	scope: "redis"
});

if (config.redis) {
	var redis = require("redis");

	module.exports = function (callback) {
		var port = config.redis.port;
		var host = config.redis.host;
		var db = config.redis.db;

		var client = redis.createClient(port, host);
		client.select(db, function (err) {
			if (err) return callback(err);
			else {
				logger.info(`Redis client created and connected to db${db}`);
				return callback(null, client);
			}
		});
	};
} else {
	var memoryCache = require("./memory-cache");
	module.exports = function(callback) {
		memoryCache(function(err, client) {
			if (err) return callback(err);
			else {
				logger.info("Redis client mocked");
				return callback(null, client);
			}
		});
	}
};
