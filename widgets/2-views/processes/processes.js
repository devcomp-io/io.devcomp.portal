
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

						var firstTime = true;
						var tag = null;
						var actionsDialog = null;
						var processChildTemplate = null;

						var renderedProcessIds = {};

						var data = null;

						_list.on("data", function(_data) {

							data = _data;

							function syncUpdate () {

								var updatedProcessIds = {};

								Object.keys(data.services).forEach(function (serviceId) {
									var serviceTag = $('TR[serviceId="' + serviceId + '"]', tag);

									serviceTag.attr("pid_last", serviceTag.attr("pid") || "");
									serviceTag.attr("pid", "");

									var pid = null;

									if (data.services[serviceId].info) {
										pid = data.services[serviceId].info.PID;
									}

									if (!pid && data.services[serviceId].isApp !== true) return;

									if (pid) {
										serviceTag.attr("pid", pid);
									}
									if (data.services[serviceId].info) {
										$('TD', serviceTag).each(function() {
											var node = $(this);
											var field = node.attr("field");
											if (!field) return;
											node.html(""+data.services[serviceId].info[field]);
										});
									}

									renderedProcessIds[pid] = true;
									updatedProcessIds[pid] = true;

									function renderChildren (pid, level) {
										if (
											!data.processes[pid]
										) return;

										if (level > 0) {

											function renderIndent (level) {
												var indent = ["+"];
												for (var i=0;i<level;i++) {
													indent.push("+");
												}
												return indent.join("&nbsp;");
											}

											var html = [];
											html.push('<tr childServiceId="' + serviceId + '" pid="' + pid + '" class="process-child">');
											html.push('    <td colspan="2"></td>');
											html.push('    <td>' + renderIndent(level) + '</td>');
											html.push('    <td field="PID">' + data.processes[pid].info.PID + '</td>');
											html.push('    <td field="START">' + data.processes[pid].info.START + '</td>');
											html.push('    <td field="TIME">' + data.processes[pid].info.TIME + '</td>');
											html.push('    <td field="%MEM">' + data.processes[pid].info['%MEM'] + '</td>');
											html.push('    <td field="%CPU">' + data.processes[pid].info['%CPU'] + '</td>');
											html.push('    <td field="RSS">' + data.processes[pid].info.RSS + '</td>');
											html.push('    <td field="VSZ">' + data.processes[pid].info.VSZ + '</td>');
											html.push('    <td field="STAT">' + data.processes[pid].info.STAT + '</td>');
											html.push('</tr>');

											var existingNode = $('TR[pid="' + pid  + '"]', tag);
											if (existingNode.length === 1) {
												existingNode.html(html.slice(1, html.length-1).join("\n"));
											} else {
												$(html.join("\n")).insertAfter(serviceTag);
											}

											renderedProcessIds[pid] = true;
											updatedProcessIds[pid] = true;
										}

										if (
											!data.processes[pid].children
										) return;

										data.processes[pid].children.forEach(function (pid) {
											return renderChildren(pid, level + 1);
										});
									}

									renderChildren(pid, 0);
								});


								var diff = arr_diff(Object.keys(renderedProcessIds), Object.keys(updatedProcessIds));
								if (diff.length > 0) {
									diff.forEach(function (pid) {
										delete renderedProcessIds[pid];
										$('TR[pid_last="' + pid  + '"]', tag).each(function() {
											$('TD[field]', $(this)).html("");
										});
										$('TR[pid="' + pid  + '"]', tag).each(function() {
											$(this).remove();
										});
									});
								}
							}

							if (firstTime) {
								firstTime = false;

								return self.setHTM(_htm, {
									services: data.services,
									processes: data.processes
								}).then(function (_tag) {
									tag = _tag;

									processChildTemplate = $("#process-child-template", tag);
									processChildTemplate.detach();
									processChildTemplate.removeClass("hidden");

									actionsDialog = $("#modal-processes-action", tag);
									actionsDialog.modal({
										show: false
									});

									function triggerAction (action) {
										return $.ajax({
											url: self.config.serviceBaseUri + "/io.devcomp.tool.process/service/manage.json",
											method: "POST",
											data: JSON.stringify({
												action: action,
												serviceId: actionsDialog.attr("serviceId") || null,
												pid: actionsDialog.attr("pid") || null
											}),
											headers: {
												"x-pio-proxy-upstream-host": "127.0.0.1:8106",
												"content-type": "application/json"
											}
										}).done(function() {
											// TODO: Display success message.
											actionsDialog.modal('hide');										
										}).fail(function(err) {
											// TODO: Display error.
											console.error("Request failed", err);
										});
									}


									$("BUTTON.button-start", actionsDialog).click(function () {
										triggerAction("start");
									});
									$("BUTTON.button-stop", actionsDialog).click(function () {
										triggerAction("stop");
									});
									$("BUTTON.button-restart", actionsDialog).click(function () {
										triggerAction("restart");
									});
									$("BUTTON.button-kill", actionsDialog).click(function () {
										triggerAction("kill");
									});
									$("BUTTON.button-terminate", actionsDialog).click(function () {
										triggerAction("terminate");
									});

									$("TABLE", tag).click(function (evt) {

										function findNodeInfo (node) {
											if (node.attr("serviceId") || node.attr("childServiceId")) {
												return {
													pid: node.attr("pid"),
													serviceId: node.attr("serviceId") || null,
													childServiceId: node.attr("childServiceId") || null
												};
											}
											var parent = node.parent();
											if (parent.length === 0) return null;
											return findNodeInfo(node.parent());
										}

										var nodeInfo = findNodeInfo($(evt.target));
										if (!nodeInfo) return;
										actionsDialog.attr("pid", nodeInfo.pid || "");
										actionsDialog.attr("serviceId", nodeInfo.childServiceId || nodeInfo.serviceId);

										if (!nodeInfo.pid && data.services[nodeInfo.serviceId].isApp !== true) return;

										if (!nodeInfo.pid) {
											$(".processes-action-buttons BUTTON", actionsDialog).prop("disabled", true);
											$(".processes-action-buttons BUTTON.button-start", actionsDialog).prop("disabled", false);
										} else {
											$(".processes-action-buttons BUTTON", actionsDialog).prop("disabled", false);
											$(".processes-action-buttons BUTTON.button-start", actionsDialog).prop("disabled", true);
											if (!nodeInfo.serviceId) {
												$(".processes-action-buttons BUTTON.button-restart", actionsDialog).prop("disabled", true);
												$(".processes-action-buttons BUTTON.button-stop", actionsDialog).prop("disabled", true);
											}
										}

										if (
											nodeInfo.pid &&
											data.processes[nodeInfo.pid]
										) {
											if (data.processes[nodeInfo.pid].info) {
												$('DIV.modal-body DIV.command', actionsDialog).html(data.processes[nodeInfo.pid].info.COMMAND);
											} else {
												$('DIV.modal-body DIV.command', actionsDialog).html("?");
											}
										}

										actionsDialog.modal('show');
									});

									syncUpdate();
								});

							} else {

								syncUpdate();
							}
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
