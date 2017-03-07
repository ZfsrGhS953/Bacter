var writer = require("./Writer");

function LeaderboardPosition(playerTracker) {
	this.playerTracker = playerTracker;
}

module.exports = LeaderboardPosition;

LeaderboardPosition.prototype.build = function(protocol) {
	writer.writeUInt8(48);
	writer.writeUInt16(this.playerTracker.gameServer.leaderboard.indexOf(this.playerTracker) + 1);
	return writer.createBuffer();
}
