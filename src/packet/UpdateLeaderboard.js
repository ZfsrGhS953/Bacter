var writer = require("./Writer");

function UpdateLeaderboard(playerTracker) {
	this.playerTracker = playerTracker;
}

module.exports = UpdateLeaderboard;

UpdateLeaderboard.prototype.build = function(protocol) {
	var length = Math.min(this.playerTracker.gameServer.leaderboard.length, this.playerTracker.gameServer.config.serverMaxLeaderboardLength);
	writer.writeUInt8(49);
	writer.writeUInt32(length);
	if (protocol < 6) {
		for (var i = 0; i < length; i++) {
		var id = 0;
		if (this.playerTracker.gameServer.leaderboard[i].cells[0]) id = this.playerTracker.gameServer.leaderboard[i].cells[0].id;
		writer.writeUInt32(id);
		writer.writeStringUnicode(this.playerTracker.gameServer.leaderboard[i].name);
		}
	} else if (protocol < 11) {
		for (var i = 0; i < length; i++) {
		var id = 0;
		if (this.playerTracker.gameServer.leaderboard[i] === this.playerTracker) id = 1;
		writer.writeUInt32(id);
		writer.writeStringUtf8(this.playerTracker.gameServer.leaderboard[i].name);
		}
	} else {
		for (var i = 0; i < length; i++) writer.writeStringUtf8(this.playerTracker.gameServer.leaderboard[i].name);
		}
	return writer.createBuffer();
}
