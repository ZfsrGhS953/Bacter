var writer = require("./Writer");

function UpdatePosition(playerTracker) {
	this.playerTracker = playerTracker;
}

module.exports = UpdatePosition;

UpdatePosition.prototype.build = function(protocol) {
	writer.writeUInt8(17);
	writer.writeFloat(this.playerTracker.viewX);
	writer.writeFloat(this.playerTracker.viewY);
	writer.writeFloat(this.playerTracker.scale);
	return writer.createBuffer();
}
