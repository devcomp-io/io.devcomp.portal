
define(function() {

	return function() {
		var self = this;

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{
				"list": self.config.serviceBaseUri + "/io.devcomp.tool.test/service/list.json"
			},
			[
				{
					resources: [ "htm" ],
					streams: [ "list" ],
					handler: function(_htm, _list) {

						_list.on("data", function(services) {
							self.setHTM(_htm, {
								services: services
							});
						});
					}
				}
			]
		);
	};
});

