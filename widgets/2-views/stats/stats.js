
define(function() {

	return function() {
		var self = this;

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{
				"list": self.config.serviceBaseUri + "/io.devcomp.tool.stats/service/list.json"
			},
			[
				{
					resources: [ "htm" ],
					streams: [ "list" ],
					handler: function(_htm, _list) {

						_list.on("data", function(services) {

console.log("services", services);

							for (var serviceId in services) {
								services[serviceId].config = JSON.stringify(services[serviceId]);
							}

							return self.setHTM(_htm, {
								services: services
							});
						});
					}
				}
			]
		);
	};
});

