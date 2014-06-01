
define(function() {

	return function() {
		var self = this;

		return self.hook(
			{
				"htm": "./" + self.widget.id + ".htm"
			},
			{},
			[
				{
					resources: [ "htm" ],
					handler: function(_htm) {

						return self.setHTM(_htm);
					}
				}
			]
		);
	};
});

