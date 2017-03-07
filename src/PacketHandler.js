var Entity = require("./entity");

function PacketHandler(gameServer, socket) {
	this.gameServer = gameServer;
	this.socket = socket;
	this.wCooldown = 0;
	this.spaceCooldown = 0;
	this.qCooldown = 0;
	this.eCooldown = 0;
	this.rCooldown = 0;
	this.tCooldown = 0;
	this.protocol = 0;
}

module.exports = PacketHandler;

PacketHandler.prototype.handleMessage = function(message) {
	try {
		switch(message[0]) {
			case 0:
			if (this.socket.playerTracker.cells.length === 0) {
				this.socket.playerTracker.name = "";
				if (this.protocol < 6) {
					for (var i = 1; i < message.length; i += 2) {
						var n = message[i] + (message[i + 1] << 8);
						this.socket.playerTracker.name += String.fromCharCode(n);
					}
				} else {
					for (var i = 1; i < message.length;) {
					if (message[i] === 0) {
						break;
					} else if (message[i] < 192) {
						this.socket.playerTracker.name += String.fromCharCode(message[i]);
						i++;
					} else if (message[i] < 224) {
						this.socket.playerTracker.name += String.fromCharCode(((message[i] & 31) << 6) + (message[i + 1] & 63));
						i += 2;
					} else if (message[i] < 240) {
						this.socket.playerTracker.name += String.fromCharCode(((message[i] & 15) << 12) + ((message[i + 1] & 63) << 6) + (message[i + 2] & 63));
						i += 3;
					} else {
						var m = ((message[i] & 7) << 18) + ((message[i + 1] & 63) << 12) + ((message[i + 2] & 63) << 6) + (message[i + 3] & 63) - 65536;
						this.socket.playerTracker.name += String.fromCharCode(55296 + (m >> 10));
						this.socket.playerTracker.name += String.fromCharCode(56320 + (m & 1023));
						i += 4;
					}
					}
				}
				this.socket.playerTracker.color = Math.random() * 1536 >> 0;
				this.socket.playerTracker.spectate = false;
				new Entity.PlayerCell(this.gameServer, Math.random() * this.gameServer.config.borderWidth, Math.random() * this.gameServer.config.borderHeight, this.gameServer.config.playerStartMass, this.socket.playerTracker.color, true, this.socket.playerTracker);
			}
			break;
			case 1:
			if (this.socket.playerTracker.cells.length === 0) this.socket.playerTracker.spectate = true;
			break;
			case 16:
			if (message.length > 16) {
				this.socket.playerTracker.x = message.readDoubleLE(1);
				this.socket.playerTracker.y = message.readDoubleLE(9);
			} else if (message.length > 9) {
				this.socket.playerTracker.x = message[1] + (message[2] << 8) + (message[3] << 16) + (message[4] << 24);
				this.socket.playerTracker.y = message[5] + (message[6] << 8) + (message[7] << 16) + (message[8] << 24);
			} else {
				this.socket.playerTracker.x = message[1] + (message[2] << 8);
				if (this.socket.playerTracker.x > 32767) this.socket.playerTracker.x -= 65536; 
				this.socket.playerTracker.y = message[3] + (message[4] << 8);
				if (this.socket.playerTracker.y > 32767) this.socket.playerTracker.y -= 65536;
			}
			break;
			case 17:
			this.spacePressed = true;
			break;
			case 18:
			this.qPressed = true;
			break;
			case 21:
			this.wPressed = true;
			break;
			case 22:
			this.ePressed = true;
			break;
			case 23:
			this.rPressed = true;
			break;
			case 24:
			this.tPressed = true;
			break;
			case 254:
			this.protocol = message[1] + (message[2] << 8) + (message[3] << 16) + (message[4] << 24);
			break;
		}
	} catch(e) {}
}
