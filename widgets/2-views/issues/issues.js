
define(function() {

	return function() {
		var self = this;

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{
			},
			[
				{
					resources: [ "htm" ],
					handler: function(_htm) {

						return self.setHTM(_htm, {
							"credentialsConfig": JSON.stringify({
							    "uri": "http://myissues-collector-github." + window.API.config.hostname + ":8013/ensure/credentials"
							}),
							apis: {
								"issues-all": {
									"url": self.config.serviceBaseUri + "/io.devcomp.portal/2-views/issues.json",
									"$label": self.config.serviceBaseUri + "/io.devcomp.portal/2-views/issues.json"
								},
								"issues-by-tag": {
									"url": self.config.serviceBaseUri + "/io.devcomp.portal/2-views/issues.json?tag=" + encodeURIComponent("fixed" + ";" + "firebug-3.0.0-alpha.3"),
									"$label": self.config.serviceBaseUri + "/io.devcomp.portal/2-views/issues.json?tag=' + encodeURIComponent(\"fixed\" + \";\" + \"firebug-3.0.0-alpha.3\")"
								}
							}
						}).then(function(tag) {
							$("#button-sync-now").click(function () {
								$.ajax({
									type: 'GET',
									url: "http://myissues-collector-github." + window.API.config.hostname + ":8013/sync/now",
									timeout: 5 * 1000,
									crossDomain: true,
									xhrFields: {
										withCredentials: true
									},
									success: function(response, textStatus, jqXHR) {
										console.error("sync triggered!");
									},
									error: function(xhr, type) {
										console.error("error triggering sync");
									}
								});
							});
						});
					}
				}
			]
		);
	};
});
