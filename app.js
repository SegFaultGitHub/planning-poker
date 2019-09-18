"use strict";

var async = require("async");
var bodyParser = require("body-parser");
var express = require("express");
var fs = require("fs");
var path = require("path");
var uuid = require("uuid");

var config = require("./config.js");
var logger = require("./lib/logger.js")("app");

// Catch all errors
process.on("uncaughtException", function (err) {
	logger.error(`Caught exception: ${err.stack}`);
	process.exit(1);
});

var app = express();
async.auto({
	express: function (callback) {
		var port = config.server.port;
		app.use(function (req, res, next) {
			var requestId = uuid.v4();
			var start = Date.now();
			logger.info({
				message: "Incoming request",
				method: req.method,
				url: req.originalUrl,
				requestId: requestId
			});
			res.on("finish", function () {
				var log = {
					message: "Request finished",
					method: req.method,
					url: req.originalUrl,
					status: res.statusCode,
					body: req.body,
					requestId: requestId,
					clientIP: req.ip,
					elapsed: Date.now() - start
				};
				if (log.status >= 200 && log.status < 300) {
					logger.info(log);
				} else if (log.status >= 300 && log.status < 400) {
					logger.warn(log);
				} else {
					logger.error(log);
				}
			});
			res.on("close", function () {
				logger.warn({
					message: "Connection closed",
					method: req.method,
					url: req.originalUrl,
					body: req.body,
					requestId: requestId,
					elapsed: Date.now() - start
				});
			});
			return next();
		});
		app.use(bodyParser.json());
		app.listen(port, function () {
			logger.info("Express server listening on port {0}", port);
			return callback();
		});
	},
	clients: function (callback) {
		return async.parallel({
			/* Load all clients: */
			redis: require("./clients/redis-client")
		}, function (err, res) {
			if (err) return callback(err);
			app.set("clients", {});
			Object.keys(res).forEach(function (key) {
				app.get("clients")[key] = res[key];
			});
			return callback();
		});
	},
	librairies: ["clients", function (_, callback) {
		return async.parallel({
			/* Load all libraries: */
			lib: function (callback) {
			    return require("./lib/lib1.js")(app, callback);
			}
		}, function (err, res) {
			if (err) return callback(err);
			app.set("librairies", {});
			Object.keys(res).forEach(function (key) {
				app.get("librairies")[key] = res[key];
			});
			return callback();
		});
	}],
	services: ["express", "librairies", function (_, callback) {
		/* Load all services: */
		fs.readdirSync("./services").forEach(function (filename) {
			var filepath = path.join(__dirname, "services", filename);
			var router = express.Router();

			var prefix = filename.split(".").slice(0, -1).reduce(function (a, b) {
				return `${a}/${b}`;
			}, "");

			require(filepath)(app, router);
			app.use(prefix, router);
		});
		return callback();
	}]
}, function (err) {
	if (err) {
		logger.error(err);
		return process.exit(1);
	} else {
		// Do stuff
	}
});
