
const PATH = require("path");
const CRYPTO = require("crypto");

const DB_NAME = "devcomp";

exports.app = function(req, res, next) {

	if (req.query.tag) {

		var tag = req.query.tag.split(";");

		return res.r.tableEnsure(DB_NAME, "myissues", "issues", {
			indexes: [
				"updatedOn"
			]
		}, function(err, issuesTable) {
	        if (err) return next(err);

			return res.r.tableEnsure(DB_NAME, "myissues", "tags", {
				indexes: [
					"issue",
					"name"
				]
			}, function(err, tagsTable) {
		        if (err) return next(err);

		        // TODO: Don't return tag record; just issue record.
		        var filter = {
					name: tag[0]		        	
		        };
		        if (tag.length === 2) {
		        	filter.value = tag[1];
		        }
				return tagsTable.eqJoin("issue", issuesTable).filter({
					left: filter
				}).run(res.r.conn, function(err, cursor) {
		    		if (err) return next(err);
		    		function respond(body) {
						res.writeHead(200, {
							"Content-Type": "application/json",
//							"Content-Length": body.length,
			                "Cache-Control": "max-age=60",  // seconds
			                "Etag": CRYPTO.createHash("md5").update(body).digest("hex")
						});
					    return res.end(body);
		    		}
					return cursor.toArray(function(err, issues) {
					    if (err) return next(err);
						return respond(JSON.stringify(issues.map(function (record) {
							var data = record.right;
							data._filter = {
								tag: {
									name: record.left.name,
									value: record.left.value
								}
							};
							return data;
						}), null, 4));
					});
				});
			});
	    });

	} else {

		return res.r.tableEnsure(DB_NAME, "myissues", "issues", {
			indexes: [
				"updatedOn"
			]
		}, function(err, issuesTable) {
	        if (err) return next(err);

			return issuesTable.orderBy({
	    		index: res.r.desc("updatedOn")
	    	}).filter({
	    	}).limit(100).run(res.r.conn, function(err, cursor) {
	    		if (err) return next(err);
	    		function respond(body) {
					res.writeHead(200, {
						"Content-Type": "application/json",
//						"Content-Length": body.length,
		                "Cache-Control": "max-age=60",  // seconds
		                "Etag": CRYPTO.createHash("md5").update(body).digest("hex")
					});
				    return res.end(body);
	    		}
				return cursor.toArray(function(err, issues) {
				    if (err) return next(err);
					return respond(JSON.stringify(issues, null, 4));
				});
			});
	    });
	}
}
