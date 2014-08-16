
const PATH = require("path");


const DB_NAME = "devcomp";

exports.app = function(req, res, next) {
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
					"Content-Length": body.length,
	                "Cache-Control": "max-age=60"  // seconds
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
