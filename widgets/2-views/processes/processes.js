
define(function() {

	return function() {
		var self = this;

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{
				"list": self.config.serviceBaseUri + "/io.devcomp.tool.process/service/list.json"
			},
			[
				{
					resources: [ "htm" ],
					streams: [ "list" ],
					handler: function(_htm, _list) {

						_list.on("data", function(services) {

							for (var serviceId in services) {
								services[serviceId].config = JSON.stringify(services[serviceId]);
							}

							return self.setHTM(_htm, {
								services: services
							}).then(function (tag) {

								var actionButtons = $("#processes-action-buttons", tag);
								actionButtons.detach();
								actionButtons.removeClass("hidden");

								$(".button-start", actionButtons).click(function () {
console.log("Start", actionButtons.attr("serviceId"));
								});
								$(".button-stop", actionButtons).click(function () {
console.log("Stop", actionButtons.attr("serviceId"));
								});
								$(".button-restart", actionButtons).click(function () {
console.log("Restart", actionButtons.attr("serviceId"));
								});
								$(".button-kill", actionButtons).click(function () {
console.log("Kill", actionButtons.attr("serviceId"));
								});
								$(".button-terminate", actionButtons).click(function () {
console.log("Terminate", actionButtons.attr("serviceId"));
								});

								$("TR", tag).each(function () {
									var tr = $(this);
									var serviceId = tr.attr("serviceid");
									if (!serviceId) return;
									tr.hover(function () {
										actionButtons.appendTo($("TD.actions", tr));
										actionButtons.attr("serviceId", serviceId);
									}, function () {
										actionButtons.detach();
										actionButtons.attr("serviceId", "");
									});
								});
							});
						});
					}
				}
			]
		);
	};
});
