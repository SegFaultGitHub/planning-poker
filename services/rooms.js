"use strict";

var async = require("async");

var logger = require("../lib/logger.js")("service/room");

module.exports = function (app, router) {
	var redis = app.get("clients").redis

	router.post("/room",
		function (request, response, next) {
			var masterId = request.body.userId;
			var roomId = request.body.roomId;
			async.waterfall([
				function (callback) {
					return redis.get(`room:${roomId}`, callback);
				},
				function (room, callback) {
					if (!room || room.lastUpdate < Date.now() - 3600e3) {
						// Create room
						room = {
							roomId: roomId,
							masterId: masterId,
							participants: [masterId],
							lastUpdate: Date.now()
						};
						return callback(null, room);
					} else {
						// Room already created
						return callback("Room already existing.");
					}
				},
				function(room, callback) {
					return redis.set(`room:${roomId}`, JSON.stringify(room), function(err) {
						return callback(err);
					});
				},
				function(callback) {
					return redis.expire(`room:${roomId}`, 3600, callback);
				}
			], function (err, res) {
				if (err) return next(err);
				else return response.send(`Room ${roomId} created.`);
			});
		}
	);

	router.get("/room/:id",
		function(request, response, next) {
			return redis.get(`room:${request.params.id}`, function(err, res) {
				if (err) return next(err);
				else return response.json(JSON.parse(res));
			});
		}
	);

	router.post("/join",
		function (request, response, next) {

			return response.end();
		}
	);
};
