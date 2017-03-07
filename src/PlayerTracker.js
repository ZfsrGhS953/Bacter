var Entity = require("./entity");
var Packet = require("./packet");

function PlayerTracker(gameServer, socket) {
	this.gameServer = gameServer;
	this.socket = socket;
	this.x = 0;
	this.y = 0;
	this.spaceCooldown = 0;
	this.wCooldown = 0;
	this.qCooldown = 0;
	this.eCooldown = 0;
	this.rCooldown = 0;
	this.tCooldown = 0;
	this.score = 0;
	this.scale = 1;
	this.oldNodes = [];
	this.viewNodes = [];
	this.delNodes = [];
	this.eatNodes = [];
	this.updNodes = [];
	this.addNodes = [];
	this.minions = [];
	this.minionsFrozen = false;
	this.spectate = false;
	this.specByLeaderboard = true;
	this.viewX = 0;
	this.viewY = 0;
	this.cells = [];
	this.name = "";
	this.color = 0;
}

module.exports = PlayerTracker;

PlayerTracker.prototype.update = function() {
	    for (var i = 0; i < this.cells.length; i++) {
			var cell = this.cells[i];
			var boundX = Math.min((cell.x + cell.size * 2) * this.gameServer.invQuadSizeX, this.gameServer.maxBoundX) >> 0;
			var boundY = Math.min((cell.y + cell.size * 2) * this.gameServer.invQuadSizeY, this.gameServer.maxBoundY) >> 0;
			for (var x = Math.max((cell.x - cell.size * 2) * this.gameServer.invQuadSizeX, 0) >> 0; x <= boundX; x++) {
				for (var y = Math.max((cell.y - cell.size * 2) * this.gameServer.invQuadSizeY, 0) >> 0; y <= boundY; y++) {
					for (var z in this.gameServer.quad[x][y]) {
						var check = this.gameServer.quad[x][y][z];
						var dx = check.x - cell.x;
						var dy = check.y - cell.y;
						var r = check.size + cell.size;
						var squared = dx * dx + dy * dy;
						if (squared > r * r) continue;
						if (check === cell) continue;
						if (check.owner === this && this.gameServer.tickCounter - cell.born > this.gameServer.config.playerCellCollisionCooldown && this.gameServer.tickCounter - check.born > this.gameServer.config.playerCellCollisionCooldown && (this.gameServer.tickCounter - cell.born < Math.max(cell.size * this.gameServer.config.playerMergeTimeFactor, this.gameServer.config.playerMergeTimeMin) || this.gameServer.tickCounter - check.born < Math.max(check.size * this.gameServer.config.playerMergeTimeFactor, this.gameServer.config.playerMergeTimeMin))) {
							if (squared === 0) continue;
							var d = r / Math.sqrt(squared) - 1;
							var m = check.mass + cell.mass;
							var m1 = check.mass / m;
							var m2 = cell.mass / m;
							check.x += dx * d * m2;
							check.y += dy * d * m2;
							cell.x -= dx * d * m1;
							cell.y -= dy * d * m1;
						} else {
							if (check.owner === this) {
								if (this.gameServer.tickCounter - cell.born <= this.gameServer.config.playerCellCollisionCooldown || this.gameServer.tickCounter - check.born <= this.gameServer.config.playerCellCollisionCooldown) continue;
							} else {
								if (cell.mass * this.gameServer.config.playerCellEatThreshold < check.mass) continue;
							}
							var eatDistance = cell.size - check.size / 3;
							if (squared > eatDistance * eatDistance) continue;
							check.onEaten(cell);
						}
					}
				}
			}
			if (cell.mass > this.gameServer.config.playerMinDecayMass) {
				cell.size *= this.gameServer.config.playerDecaySpeed;
				cell.mass = cell.size * cell.size;
			}
			if (cell.size > this.gameServer.config.playerMaxMass) {
				if (this.cells.length === this.gameServer.config.playerMaxCells) {
					cell.size = this.gameServer.config.playerMaxMass;
					cell.mass = cell.size * cell.size;
				} else {
				cell.size *= 0.70710678118654752;
				cell.mass = cell.size * cell.size;
				cell.x = Math.max(cell.x, cell.size * 0.5);
			    cell.x = Math.min(cell.x, this.gameServer.config.borderWidth - cell.size * 0.5);
			    cell.y = Math.max(cell.y, cell.size * 0.5);
			    cell.y = Math.min(cell.y, this.gameServer.config.borderHeight - cell.size * 0.5);
				var split = new Entity.PlayerCell(this.gameServer, cell.x, cell.y, cell.size, cell.color, false, this);
				var angle = Math.random() * 6.28318530717958648;
				split.boostX = Math.sin(angle) * this.gameServer.config.playerSplitSpeed;
				split.boostY = Math.cos(angle) * this.gameServer.config.playerSplitSpeed;
				}
			}
			var dx = this.x - cell.x;
			var dy = this.y - cell.y;
			var squared = dx * dx + dy * dy;
			if (squared !== 0) {
			var d = Math.sqrt(squared);
			var speed = Math.min(this.gameServer.speedCache[cell.size >> 0], d) / d;
			cell.x += dx * speed;
			cell.y += dy * speed;
			}
			cell.x += cell.boostX;
			cell.boostX *= 0.9;
			cell.y += cell.boostY;
			cell.boostY *= 0.9;
			var collisionMin = cell.size * 0.5;
			var collisionMaxX = this.gameServer.config.borderWidth - collisionMin;
			var collisionMaxY = this.gameServer.config.borderHeight - collisionMin;
			if (cell.x < collisionMin || cell.x > collisionMaxX) cell.boostX =- cell.boostX;
			if (cell.y < collisionMin || cell.y > collisionMaxY) cell.boostY =- cell.boostY;
			cell.x = Math.max(cell.x, collisionMin);
			cell.x = Math.min(cell.x, collisionMaxX);
			cell.y = Math.max(cell.y, collisionMin);
			cell.y = Math.min(cell.y, collisionMaxY);
			cell.quad[cell.quadIndex] = cell.quad[cell.quad.length - 1];
		    cell.quad[cell.quadIndex].quadIndex = cell.quadIndex;
		    cell.quad.pop();
		    cell.quad = this.gameServer.quad[cell.x * this.gameServer.invQuadSizeX >> 0][cell.y * this.gameServer.invQuadSizeY >> 0];
		    cell.quadIndex = cell.quad.length;
		    cell.quad.push(cell);
		}
		for(var i = 0; i < this.minions.length; i++) {
			if (this.minions[i].cells.length === 0) {
				this.minions[i].color = Math.random() * 1536 >> 0;
				new Entity.PlayerCell(this.gameServer, Math.random() * this.gameServer.config.borderWidth, Math.random() * this.gameServer.config.borderHeight, this.gameServer.config.playerStartMass, this.minions[i].color, true, this.minions[i]);
			}
		for (var j = 0; j < this.minions[i].cells.length; j++) {
			var cell = this.minions[i].cells[j];
			var boundX = Math.min((cell.x + cell.size * 2) * this.gameServer.invQuadSizeX, this.gameServer.maxBoundX) >> 0;
			var boundY = Math.min((cell.y + cell.size * 2) * this.gameServer.invQuadSizeY, this.gameServer.maxBoundY) >> 0;
			for (var x = Math.max((cell.x - cell.size * 2) * this.gameServer.invQuadSizeX, 0) >> 0; x <= boundX; x++) {
				for (var y = Math.max((cell.y - cell.size * 2) * this.gameServer.invQuadSizeY, 0) >> 0; y <= boundY; y++) {
					for (var z in this.gameServer.quad[x][y]) {
						var check = this.gameServer.quad[x][y][z];
						var dx = check.x - cell.x;
						var dy = check.y - cell.y;
						var r = check.size + cell.size;
						var squared = dx * dx + dy * dy;
						if (squared > r * r) continue;
						if (check === cell) continue;
						if (check.owner === this.minions[i] && this.gameServer.tickCounter - cell.born > this.gameServer.config.playerCellCollisionCooldown && this.gameServer.tickCounter - check.born > this.gameServer.config.playerCellCollisionCooldown && (this.gameServer.tickCounter - cell.born < Math.max(cell.size * this.gameServer.config.playerMergeTimeFactor, this.gameServer.config.playerMergeTimeMin) || this.gameServer.tickCounter - check.born < Math.max(check.size * this.gameServer.config.playerMergeTimeFactor, this.gameServer.config.playerMergeTimeMin))) {
							if (squared === 0) continue;
							var d = r / Math.sqrt(squared) - 1;
							var m = check.mass + cell.mass;
							var m1 = check.mass / m;
							var m2 = cell.mass / m;
							check.x += dx * d * m2;
							check.y += dy * d * m2;
							cell.x -= dx * d * m1;
							cell.y -= dy * d * m1;
						} else {
							if (check.owner === this.minions[i]) {
								if (this.gameServer.tickCounter - cell.born <= this.gameServer.config.playerCellCollisionCooldown || this.gameServer.tickCounter - check.born <= this.gameServer.config.playerCellCollisionCooldown) continue;
							} else {
								if (cell.mass * this.gameServer.config.playerCellEatThreshold < check.mass) continue;
							}
							var eatDistance = cell.size - check.size / 3;
							if (squared > eatDistance * eatDistance) continue;
							check.onEaten(cell);
						}
					}
				}
			}
			if (cell.mass > this.gameServer.config.playerMinDecayMass) {
				cell.size *= this.gameServer.config.playerDecaySpeed;
				cell.mass = cell.size * cell.size;
			}
			if (cell.size > this.gameServer.config.playerMaxMass) {
				if (this.minions[i].cells.length === this.gameServer.config.playerMaxCells) {
					cell.size = this.gameServer.config.playerMaxMass;
					cell.mass = cell.size * cell.size;
				} else {
				cell.size *= 0.70710678118654752;
				cell.mass = cell.size * cell.size;
				cell.x = Math.max(cell.x, cell.size * 0.5);
			    cell.x = Math.min(cell.x, this.gameServer.config.borderWidth - cell.size * 0.5);
			    cell.y = Math.max(cell.y, cell.size * 0.5);
			    cell.y = Math.min(cell.y, this.gameServer.config.borderHeight - cell.size * 0.5);
				var split = new Entity.PlayerCell(this.gameServer, cell.x, cell.y, cell.size, cell.color, false, this.minions[i]);
				var angle = Math.random() * 6.28318530717958648;
				split.boostX = Math.sin(angle) * this.gameServer.config.playerSplitSpeed;
				split.boostY = Math.cos(angle) * this.gameServer.config.playerSplitSpeed;
				}
			}
			if (!this.minionsFrozen) {
			var dx = this.x - cell.x;
			var dy = this.y - cell.y;
			var squared = dx * dx + dy * dy;
			if (squared !== 0) {
			var d = Math.sqrt(squared);
			var speed = Math.min(this.gameServer.speedCache[cell.size >> 0], d) / d;
			cell.x += dx * speed;
			cell.y += dy * speed;
			}
			}
			cell.x += cell.boostX;
			cell.boostX *= 0.9;
			cell.y += cell.boostY;
			cell.boostY *= 0.9;
			var collisionMin = cell.size * 0.5;
			var collisionMaxX = this.gameServer.config.borderWidth - collisionMin;
			var collisionMaxY = this.gameServer.config.borderHeight - collisionMin;
			if (cell.x < collisionMin || cell.x > collisionMaxX) cell.boostX =- cell.boostX;
			if (cell.y < collisionMin || cell.y > collisionMaxY) cell.boostY =- cell.boostY;
			cell.x = Math.max(cell.x, collisionMin);
			cell.x = Math.min(cell.x, collisionMaxX);
			cell.y = Math.max(cell.y, collisionMin);
			cell.y = Math.min(cell.y, collisionMaxY);
			cell.quad[cell.quadIndex] = cell.quad[cell.quad.length - 1];
		    cell.quad[cell.quadIndex].quadIndex = cell.quadIndex;
		    cell.quad.pop();
		    cell.quad = this.gameServer.quad[cell.x * this.gameServer.invQuadSizeX >> 0][cell.y * this.gameServer.invQuadSizeY >> 0];
		    cell.quadIndex = cell.quad.length;
		    cell.quad.push(cell);
		}
		}
		
	if (this.spaceCooldown < this.gameServer.config.playerSpaceCooldown) this.spaceCooldown++;
	if (this.wCooldown < this.gameServer.config.playerWCooldown) this.wCooldown++;
	if (this.qCooldown < this.gameServer.config.playerQCooldown) this.qCooldown++;
	if (this.eCooldown < this.gameServer.config.playerECooldown) this.eCooldown++;
	if (this.rCooldown < this.gameServer.config.playerRCooldown) this.rCooldown++;
	if (this.tCooldown < this.gameServer.config.playerTCooldown) this.tCooldown++;
	if (this.socket.packetHandler.spacePressed && this.spaceCooldown >= this.gameServer.config.playerSpaceCooldown) {
		this.socket.packetHandler.spacePressed = false;
				this.spaceCooldown -= this.gameServer.config.playerSpaceCooldown;
				var maxSplit = this.gameServer.config.playerMaxCells - this.cells.length;
				var splitCells = 0;
				for (var i in this.cells) {
					var cell = this.cells[i];
					if (cell.mass < this.gameServer.config.playerMinSplitMass) continue;
					if (splitCells++ === maxSplit) break;
					cell.size *= 0.70710678118654752;
				    cell.mass = cell.size * cell.size;
					cell.x = Math.max(cell.x, cell.size * 0.5);
			        cell.x = Math.min(cell.x, this.gameServer.config.borderWidth - cell.size * 0.5);
			        cell.y = Math.max(cell.y, cell.size * 0.5);
			        cell.y = Math.min(cell.y, this.gameServer.config.borderHeight - cell.size * 0.5);
					var split = new Entity.PlayerCell(this.gameServer, cell.x, cell.y, cell.size, cell.color, false, this);
				    var dx = this.x - split.x;
					var dy = this.y - split.y;
					if (dx === 0 && dy === 0) dx = 1;
					var d = this.gameServer.config.playerSplitSpeed / Math.sqrt(dx * dx + dy * dy);
				    split.boostX = dx * d;
				    split.boostY = dy * d;
				}
	}
	if (this.socket.packetHandler.wPressed && this.wCooldown >= this.gameServer.config.playerWCooldown) {
		this.socket.packetHandler.wPressed = false;
		this.wCooldown -= this.gameServer.config.playerWCooldown;
		for (var i in this.cells) {
			var cell = this.cells[i];
			if (cell.mass < this.gameServer.config.playerMinEjectMass) continue;
			cell.mass -= this.gameServer.config.ejectMassLoss;
			cell.size = Math.sqrt(cell.mass);
			cell.x = Math.max(cell.x, cell.size * 0.5);
			cell.x = Math.min(cell.x, this.gameServer.config.borderWidth - cell.size * 0.5);
			cell.y = Math.max(cell.y, cell.size * 0.5);
			cell.y = Math.min(cell.y, this.gameServer.config.borderHeight - cell.size * 0.5);
			var ejected = new Entity.EjectedMass(this.gameServer, cell.x, cell.y, this.gameServer.config.ejectMass, this.color);
			var dx = this.x - ejected.x;
			var dy = this.y - ejected.y;
			if (dx === 0 && dy === 0) dx = 1;
			var angle = Math.atan2(dx, dy);
			ejected.x += Math.sin(angle) * cell.size;
			ejected.y += Math.cos(angle) * cell.size;
			angle += Math.random() * 0.6 - 0.3;
			ejected.boostX = Math.sin(angle) * this.gameServer.config.ejectedMassSpeed;
			ejected.boostY = Math.cos(angle) * this.gameServer.config.ejectedMassSpeed;
		}
	}
	if (this.socket.packetHandler.qPressed && this.qCooldown >= this.gameServer.config.playerQCooldown) {
		this.socket.packetHandler.qPressed = false;
		this.qCooldown -= this.gameServer.config.playerQCooldown;
		if (this.spectate) this.specByLeaderboard = !this.specByLeaderboard;
	}
	if (this.socket.packetHandler.ePressed && this.eCooldown >= this.gameServer.config.playerECooldown) {
		this.socket.packetHandler.ePressed = false;
		this.eCooldown -= this.gameServer.config.playerECooldown;
		for (var i = 0; i < this.minions.length; i++) {
			    var maxSplit = this.gameServer.config.playerMaxCells - this.minions[i].cells.length;
				var splitCells = 0;
				for (var j in this.minions[i].cells) {
					if (splitCells++ === maxSplit) break;
					var cell = this.minions[i].cells[j];
					if (cell.mass < this.gameServer.config.playerMinSplitMass) continue;
					cell.size *= 0.70710678118654752;
				    cell.mass = cell.size * cell.size;
					cell.x = Math.max(cell.x, cell.size * 0.5);
			        cell.x = Math.min(cell.x, this.gameServer.config.borderWidth - cell.size * 0.5);
			        cell.y = Math.max(cell.y, cell.size * 0.5);
			        cell.y = Math.min(cell.y, this.gameServer.config.borderHeight - cell.size * 0.5);
					var split = new Entity.PlayerCell(this.gameServer, cell.x, cell.y, cell.size, cell.color, false, this.minions[i]);
				    var dx = this.x - split.x;
					var dy = this.y - split.y;
					if (dx === 0 && dy === 0) dx = 1;
					var d = this.gameServer.config.playerSplitSpeed / Math.sqrt(dx * dx + dy * dy);
				    split.boostX = dx * d;
				    split.boostY = dy * d;
				}
		}
	}
	if (this.socket.packetHandler.rPressed && this.rCooldown >= this.gameServer.config.playerRCooldown) {
		this.socket.packetHandler.rPressed = false;
		this.rCooldown -= this.gameServer.config.playerRCooldown;
		for (var i = 0; i < this.minions.length; i++) {
		for (var j in this.minions[i].cells) {
			var cell = this.minions[i].cells[j];
			if (cell.mass < this.gameServer.config.playerMinEjectMass) continue;
			cell.mass -= this.gameServer.config.ejectMassLoss;
			cell.size = Math.sqrt(cell.mass);
			cell.x = Math.max(cell.x, cell.size * 0.5);
			cell.x = Math.min(cell.x, this.gameServer.config.borderWidth - cell.size * 0.5);
			cell.y = Math.max(cell.y, cell.size * 0.5);
			cell.y = Math.min(cell.y, this.gameServer.config.borderHeight - cell.size * 0.5);
			var ejected = new Entity.EjectedMass(this.gameServer, cell.x, cell.y, this.gameServer.config.ejectMass, this.minions[i].color);
			var dx = this.x - ejected.x;
			var dy = this.y - ejected.y;
			if (dx === 0 && dy === 0) dx = 1;
			var angle = Math.atan2(dx, dy);
			ejected.x += Math.sin(angle) * cell.size;
			ejected.y += Math.cos(angle) * cell.size;
			angle += Math.random() * 0.6 - 0.3;
			ejected.boostX = Math.sin(angle) * this.gameServer.config.ejectedMassSpeed;
			ejected.boostY = Math.cos(angle) * this.gameServer.config.ejectedMassSpeed;
		}
		}
	}
	if (this.socket.packetHandler.tPressed && this.tCooldown >= this.gameServer.config.playerTCooldown) {
		this.socket.packetHandler.tPressed = false;
		this.tCooldown -= this.gameServer.config.playerTCooldown;
		this.minionsFrozen = !this.minionsFrozen;
	}
		
	if (this.spectate) {
		if (this.specByLeaderboard && this.gameServer.leaderboard[0]) {
			this.viewX = this.gameServer.leaderboard[0].viewX;
			this.viewY = this.gameServer.leaderboard[0].viewY;
			this.scale = this.gameServer.leaderboard[0].scale;
		} else {
			var dx = this.x - this.viewX;
			var dy = this.y - this.viewY;
			var squared = dx * dx + dy * dy;
			if (squared !== 0) {
			var d = Math.sqrt(squared);
			var speed = Math.min(this.gameServer.config.serverSpectatorSpeed, d) / d;
			this.viewX += dx * speed;
			this.viewY += dy * speed;
			this.viewX = Math.max(this.viewX, 0);
			this.viewX = Math.min(this.viewX, this.gameServer.config.borderWidth);
			this.viewY = Math.max(this.viewY, 0);
			this.viewY = Math.min(this.viewY, this.gameServer.config.borderHeight);
			}
			this.scale = this.gameServer.config.serverSpectatorScale;
		}
		this.socket.sendPacket(new Packet.UpdatePosition(this));
	} else {
		this.score = 0;
		this.scale = 0;
		var cx = 0;
		var cy = 0;
		for (var i = 0; i < this.cells.length; i++) {
			this.scale += this.cells[i].size;
			this.score += this.cells[i].mass;
			cx += this.cells[i].x;
			cy += this.cells[i].y;
		}
		if (this.score !== 0) {
			this.scale = Math.pow(Math.min(64 / this.scale, 1), 0.4);
			this.viewX = cx / this.cells.length;
			this.viewY = cy / this.cells.length;
		}
	}
		if (this.socket.packetHandler.protocol !== 0) {
	for (var i in this.oldNodes) this.oldNodes[i].flag = 1;
	var boundX = Math.min((this.viewX + this.gameServer.config.serverViewBaseX / this.scale) * this.gameServer.invQuadSizeX, this.gameServer.maxBoundX) >> 0;
	var boundY = Math.min((this.viewY + this.gameServer.config.serverViewBaseY / this.scale) * this.gameServer.invQuadSizeY, this.gameServer.maxBoundY) >> 0;
			for (var x = Math.max((this.viewX - this.gameServer.config.serverViewBaseX / this.scale) * this.gameServer.invQuadSizeX, 0) >> 0; x <= boundX; x++) {
				for (var y = Math.max((this.viewY - this.gameServer.config.serverViewBaseY / this.scale) * this.gameServer.invQuadSizeY, 0) >> 0; y <= boundY; y++) {
					for (var z in this.gameServer.quad[x][y]) {
						if (this.gameServer.quad[x][y][z].owner !== this) this.viewNodes.push(this.gameServer.quad[x][y][z]);
					}
				}
			}
			this.viewNodes = this.viewNodes.concat(this.cells);
	for (var i in this.viewNodes) this.viewNodes[i].flag++;
	for(var i in this.oldNodes) {
		if (this.oldNodes[i].flag === 1) {
			if (this.oldNodes[i].killer) this.eatNodes.push(this.oldNodes[i]);
			else this.delNodes.push(this.oldNodes[i]);
			this.oldNodes[i].flag = 0;
		}
	}
	for (var i in this.viewNodes) {
		if (this.viewNodes[i].flag === 1) this.addNodes.push(this.viewNodes[i]);
		else if (this.viewNodes[i].type !== 1 || (this.gameServer.tickCounter - this.viewNodes[i].born) % this.gameServer.config.foodGrowInterval === 0) this.updNodes.push(this.viewNodes[i]);
		this.viewNodes[i].flag = 0;
	}
	
	this.socket.sendPacket(new Packet.UpdateNodes(this, this.delNodes, this.eatNodes, this.updNodes, this.addNodes));
	this.oldNodes = this.viewNodes;
	this.viewNodes = [];
	this.delNodes = [];
	this.eatNodes = [];
	this.updNodes = [];
	this.addNodes = [];
	
	if (this.gameServer.tickCounter % 25 === 0) {
		this.socket.sendPacket(new Packet.UpdateLeaderboard(this));
		if (this.socket.packetHandler.protocol >= 11) this.socket.sendPacket(new Packet.LeaderboardPosition(this));
	}
		}
}
