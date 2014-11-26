
define(function() {

	return function() {
		var self = this;

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{
				"processes": self.config.serviceBaseUri + "/io.devcomp.tool.process/service/list.json",
				"ports": self.config.serviceBaseUri + "/io.devcomp.tool.ports/ports/list.json"
			},
			[
				{
					resources: [ "htm" ],
					streams: [ "processes", "ports" ],
					handler: function(_htm, _processes, _ports) {

						var tag = null;

						var renderedPortIds = {};

						var processes = null;
						var ports = null;

						function ensureTag (callback) {
							if (tag) {
								return callback(null);
							}
							return self.setHTM(_htm, {
								services: processes.services
							}).then(function (_tag) {
								tag = _tag;
								return callback(null);
							});
						}

						function syncUpdate (callback) {

							if (!processes) {
								return callback(null);
							}

							return ensureTag(function (err) {
								if (err) return callback(err);

								var updatedPortIds = {};

								if (ports) {
									Object.keys(processes.services).forEach(function (serviceId) {
										var serviceTag = $('TR[serviceId="' + serviceId + '"]', tag);

										var pids = [];
										if (processes.services[serviceId].info) {
											pids.push(processes.services[serviceId].info.PID);
										}
										function addChildPids (node) {
											if (!node || !node.children) {
												return;
											}
											node.children.forEach(function (pid) {
												pids.push(pid);
												addChildPids(processes.processes[pid]);
											});
										}
										addChildPids(processes.services[serviceId]);

										if (pids.length === 0) {
											return;
										}

										var servicePorts = {};
										pids.forEach(function (pid) {
											if (ports[parseInt(pid)]) {
												for (var portId in ports[parseInt(pid)]) {
													servicePorts[portId] = ports[parseInt(pid)][portId];
												}
											}
										});

										Object.keys(servicePorts).forEach(function (portId) {

											var portNode = $('TR[portId="' + portId + '"]', tag);

											if (portNode.length === 1) {
												$('TD', portNode).each(function() {
													var node = $(this);
													var field = node.attr("field");
													if (!field) return;
													node.html(""+servicePorts[portId][field]);
												});
											} else {

												var html = [];
												html.push('<tr portId="' + portId + '">');
												html.push('    <td colspan="2"></td>');
												html.push('    <td field="protocol">' + servicePorts[portId].protocol + '</td>');
												html.push('    <td field="localAddress">' + servicePorts[portId].localAddress + '</td>');
												html.push('    <td field="foreignAddress">' + servicePorts[portId].foreignAddress + '</td>');
												html.push('    <td field="state">' + servicePorts[portId].state + '</td>');
												html.push('    <td field="pid">' + servicePorts[portId].pid + '</td>');
												html.push('    <td field="programName">' + servicePorts[portId].programName + '</td>');
												html.push('</tr>');

												$(html.join("\n")).insertAfter(serviceTag);
											}

											renderedPortIds[portId] = true;
											updatedPortIds[portId] = true;
										});
									});
								}

								var diff = arr_diff(Object.keys(renderedPortIds), Object.keys(updatedPortIds));
								if (diff.length > 0) {
									diff.forEach(function (portId) {
										delete renderedPortIds[portId];
										$('TR[portId="' + portId  + '"]', tag).each(function() {
											$(this).remove();
										});
									});
								}

								return callback(null);
							});
						}

						_processes.on("data", function(_processes) {
							processes = _processes;
							syncUpdate(function (err) {
								if (err) {
									console.error(err.stack);
								}
							});
						});
						_ports.on("data", function(_ports) {
							ports = _ports;
							syncUpdate(function (err) {
								if (err) {
									console.error(err.stack);
								}
							});
						});
					}
				}
			]
		);
	};

	function arr_diff(a1, a2) {
	  var a=[], diff=[];
	  for(var i=0;i<a1.length;i++)
	    a[a1[i]]=true;
	  for(var i=0;i<a2.length;i++)
	    if(a[a2[i]]) delete a[a2[i]];
	    else a[a2[i]]=true;
	  for(var k in a)
	    diff.push(k);
	  return diff;
	}

});
