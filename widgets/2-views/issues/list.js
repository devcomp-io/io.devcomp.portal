
define(function() {

	return function() {
		var self = this;

    	function formatDays(time) {
    		var elapsed = Math.floor((Date.now() - time) / 1000 / 60  / 60 / 24);
    		if (elapsed === 1) {
    			return "1 day";
    		}
    		return elapsed + " days";
    	}

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{
				"issues": self.config.serviceBaseUri + "/io.devcomp.portal/2-views/issues.json"
			},
			[
				{
					resources: [ "htm" ],
					streams: [ "issues" ],
					handler: function(_htm, _issues) {

						_issues.on("data", function(issues) {

							issues = issues.map(function(issue, issueIndex) {

								issue.$safe = {
									id: issue.id.replace(/[\/]/, "-"),
									index: issueIndex
								};

								issue.$display = JSON.parse(JSON.stringify(issue));

								// TODO: This should be done by data renderers.
								issue.$display.organization = issue.repository.replace(/^github\.com\/([^\/]+)\/[^\/]+$/, "$0");
								issue.$display.repository = issue.repository.replace(/^github\.com\/[^\/]+\//, "");
								issue.$display.updatedOn = formatDays(issue.updatedOn);
								issue.$display.createdOn = formatDays(issue.createdOn);
								issue.$display.assignedTo = (issue.$display.assignedTo || "").replace(/^github\.com\//, "");

								return issue;

							});

							return self.setHTM(_htm, {
								issues: issues
							}).then(function(tag) {
								$("tr", tag).click(function() {
									window.open(issues[parseInt($(this).attr("issue-index"))].externalUrl);
								});
							});
						});

						return self.API.Q.resolve();
					}
				}
			]
		);
	};
});
