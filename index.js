var Connection = require("./lib/connection");

module.exports = {
	createProxy: require("./lib/proxy"),
	connect: function (proxy, opts) {
		return new Connection(proxy, opts);
	},
};
