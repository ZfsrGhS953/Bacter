var writer = require("./Writer");

function SetBorder(playerTracker) {
	this.playerTracker = playerTracker;
}

module.exports = SetBorder;

SetBorder.prototype.build = function(protocol) {
	writer.writeUInt8(64);
	writer.writeDouble(0);
	writer.writeDouble(0);
	writer.writeDouble(this.playerTracker.gameServer.config.borderWidth);
	writer.writeDouble(this.playerTracker.gameServer.config.borderHeight);
	return writer.createBuffer();
}
