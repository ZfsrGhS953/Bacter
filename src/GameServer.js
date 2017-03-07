var WebSocket = require("ws");
var http = require("http");
var PlayerTracker = require("./PlayerTracker");
var PacketHandler = require("./PacketHandler");
var Entity = require("./entity");
var Packet = require("./packet");
function GameServer() {
	this.config = {
		serverMaxConnections: 64,
		serverPort: 443,
		serverBind: "0.0.0.0",
		serverQuadAmountX: 64,
		serverQuadAmountY: 64,
		serverBots: 0,
		serverViewBaseX: 960,
		serverViewBaseY: 540,
		serverSpectatorScale: 0.4,
		serverSpectatorSpeed: 32,
		serverMaxLeaderboardLength: 10,
		
		borderWidth: 14142,
		borderHeight: 14142,
		
		foodMinMass: 100,
		foodMaxMass: 0,
		foodAmount: 4000,
		foodSpawnAmount: 4000,
		foodGrow: 1,
		foodGrowMass: 100,
		foodMaxGrow: 350,
		foodGrowInterval: 4000,
		
		virusMinMass: 100,
		virusMaxMass: 18000,
		virusMinAmount: 32,
		virusMaxAmount: 88,
		virusShootSpeed: 78,
		
		ejectMass: 36,
		ejectMassLoss: 1600,
		ejectedMassSpeed: 78,
		
		playerStartMass: 32,
		playerMaxMass: 1500,
		playerMinSplitMass: 3500,
		playerMinEjectMass: 3500,
		playerSpeed: 84.424,
		playerSplitSpeed: 78,
		playerMaxCells: 16,
		playerCellCollisionCooldown: 12,
		playerCellEatThreshold: 0.75,
		playerDecaySpeed: 0.99996,
		playerMinDecayMass: 900,
		playerSpaceCooldown: 2,
		playerWCooldown: 2,
		playerQCooldown: 2,
		playerECooldown: 2,
		playerRCooldown: 2,
		playerTCooldown: 2,
		playerMergeTimeMin: 750,
		playerMergeTimeFactor: 5,
		playerMaxNameLength: 15
		
	}
	this.invQuadSizeX = 1 / this.config.borderWidth * this.config.serverQuadAmountX;
	this.invQuadSizeY = 1 / this.config.borderHeight * this.config.serverQuadAmountY;
	this.maxBoundX = this.config.serverQuadAmountX - 1;
	this.maxBoundY = this.config.serverQuadAmountY - 1;
	this.speedCache = new Float64Array(32768);
	for (var i in this.speedCache) this.speedCache[i] = this.config.playerSpeed / Math.pow(i, 0.449);
	this.quad = new Array(this.config.serverQuadAmountX);
	for (var i = 0; i < this.quad.length; i++) {
		this.quad[i] = new Array(this.config.serverQuadAmountY);
		for(var j = 0; j < this.quad[i].length; j++) this.quad[i][j] = [];
	}
	this.colors = new Uint32Array(1537);
	for (var i = 0; i < 256; i++) {
		this.colors[i] = 0x0707FF + ((i / 255 * 248) << 8);
	}
	for (var i = 256; i < 512; i++) {
		this.colors[i] = 0x07FFFF - (i - 256) / 255 * 248;
	}
	for (var i = 512; i < 768; i++) {
		this.colors[i] = 0x07FF07 + (((i - 512) / 255 * 248) << 16);
	}
	for (var i = 768; i < 1024; i++) {
		this.colors[i] = 0xFFFF07 - (((i - 768) / 255 * 248) << 8);
	}
	for (var i = 1024; i < 1280; i++) {
		this.colors[i] = 0xFF0707 + (i - 1024) / 255 * 248;
	}
	for (var i = 1280; i < 1536; i++) {
		this.colors[i] = 0xFF07FF - (((i - 1280) / 255 * 248) << 16);
	}
	this.colors[1536] = 0x33FF33;
	this.tickCounter = 0;
	this.createCellID = 1;
	this.clients = [];
	this.nodesFood = [];
	this.nodesEjected = [];
	this.nodesVirus = [];
	this.leaderboard = [];
	this.timeStamp = 0;
	this.timerLoopBind = null;
	this.mainLoopBind = null;
	this.httpServer = null;
	this.wsServer = null;
}

module.exports = GameServer;

GameServer.prototype.start = function() {
	this.timerLoopBind = this.timerLoop.bind(this);
	this.mainLoopBind = this.mainLoop.bind(this);
	this.httpServer = http.createServer();
	this.wsServer = new WebSocket.Server({
		server: this.httpServer,
		perMessageDeflate: false,
		maxPayload: 256
	});
	this.wsServer.on("connection", this.onClientSocketOpen.bind(this));
	this.httpServer.listen(this.config.serverPort, this.config.serverBind, this.onHttpServerOpen.bind(this));
}

WebSocket.prototype.sendPacket = function(packet) {
	if (this.readyState === WebSocket.OPEN) {
		if (this._socket.writable !== null && !this._socket.writable) return;
		var buffer = packet.build(this.packetHandler.protocol);
		if (buffer !== null) this.send(buffer, {binary: true});
	} else {
		this.readyState = WebSocket.CLOSED;
		this.emit("close");
	}
}

GameServer.prototype.onHttpServerOpen = function() {
	setTimeout(this.timerLoopBind, 1);
	for (var i = 0; i < this.config.serverBots; i++) this.addBot();
}

GameServer.prototype.onClientSocketOpen = function(ws) {
	ws.on("error", function(e){
		ws.sendPacket = function(data) {};
	});
	
	var dis = this;
	ws.on("close", function(reason){
		if (ws._socket.destroy !== null && typeof ws._socket.destroy === "function") ws._socket.destroy();
		ws.sendPacket = function(data) {};
		var index = dis.clients.indexOf(ws);
		if (index !== -1) dis.clients.splice(index, 1);
	});
	
	ws.on("message", function(message){
		ws.packetHandler.handleMessage(message);
	});
	
	if (this.clients.length >= this.config.serverMaxConnections) {
		ws.close(1000, "");
		return;
	}
	
	ws.playerTracker = new PlayerTracker(this, ws);
	ws.packetHandler = new PacketHandler(this, ws);
	
	this.clients.push(ws);
	
	ws.sendPacket(new Packet.SetBorder(ws.playerTracker));
}

GameServer.prototype.timerLoop = function() {
	var ts = Date.now();
	var dt = ts - this.timeStamp;
	if (dt < 35) {
		setTimeout(this.timerLoopBind, 35 - dt);
		return;
	}
	if (!this.timeStamp) this.timeStamp = ts;
	this.timeStamp += 40;
	setTimeout(this.mainLoopBind, 0);
	setTimeout(this.timerLoopBind, 0);
}

GameServer.prototype.mainLoop = function() {
	this.tickCounter++;
	
	if (this.tickCounter % 25 === 0) {
	this.clients.sort(function(a, b) {
		return b.playerTracker.score - a.playerTracker.score;
	});
	this.leaderboard = [];
	for (var i = 0; i < this.clients.length; i++) {
		if (this.clients[i].playerTracker.score === 0) break;
		this.leaderboard.push(this.clients[i].playerTracker);
	}
	}
		
	for (var i = 0; i < this.nodesFood.length; i++) {
		var cell = this.nodesFood[i];
		if ((this.tickCounter - cell.born) % this.config.foodGrowInterval === 0 && cell.mass < this.config.foodMaxGrow) {
			cell.mass += this.config.foodGrowMass;
			cell.size = Math.sqrt(cell.mass);
		}
	}
	
	for (var i in this.clients) this.clients[i].playerTracker.update();
	
	for (var i = 0; i < this.nodesEjected.length; i++) {
		var cell = this.nodesEjected[i];
		var boundX = Math.min((cell.x + cell.size * 2) * this.invQuadSizeX, this.maxBoundX) >> 0;
			var boundY = Math.min((cell.y + cell.size * 2) * this.invQuadSizeY, this.maxBoundY) >> 0;
			for (var x = Math.max((cell.x - cell.size * 2) * this.invQuadSizeX, 0) >> 0; x <= boundX; x++) {
				for (var y = Math.max((cell.y - cell.size * 2) * this.invQuadSizeY, 0) >> 0; y <= boundY; y++) {
					for (var z in this.quad[x][y]) {
						var check = this.quad[x][y][z];
						var dx = check.x - cell.x;
						var dy = check.y - cell.y;
						var r = check.size + cell.size;
						var squared = dx * dx + dy * dy;
						if (squared > r * r) continue;
						if (check === cell) continue;
						if (check.type === 3) {
							if (squared === 0) continue;
							var d = 0.5 * r / Math.sqrt(squared) - 0.5;
							check.x += dx * d;
							check.y += dy * d;
							cell.x -= dx * d;
							cell.y -= dy * d;
						}
					}
				}
			}
		cell.x += cell.boostX;
		cell.boostX *= 0.9;
		cell.y += cell.boostY;
		cell.boostY *= 0.9;
		var collisionMin = cell.size * 0.5;
		var collisionMaxX = this.config.borderWidth - collisionMin;
		var collisionMaxY = this.config.borderHeight - collisionMin;
		if (cell.x < collisionMin || cell.x > collisionMaxX) cell.boostX =- cell.boostX;
		if (cell.y < collisionMin || cell.y > collisionMaxY) cell.boostY =- cell.boostY;
		cell.x = Math.max(cell.x, collisionMin);
		cell.x = Math.min(cell.x, collisionMaxX);
		cell.y = Math.max(cell.y, collisionMin);
		cell.y = Math.min(cell.y, collisionMaxY);
		cell.quad[cell.quadIndex] = cell.quad[cell.quad.length - 1];
		cell.quad[cell.quadIndex].quadIndex = cell.quadIndex;
		cell.quad.pop();
		cell.quad = this.quad[cell.x * this.invQuadSizeX >> 0][cell.y * this.invQuadSizeY >> 0];
		cell.quadIndex = cell.quad.length;
		cell.quad.push(cell);
	}
	
	for (var i = 0; i < this.nodesVirus.length; i++) {
		var cell = this.nodesVirus[i];
		var boundX = Math.min((cell.x + cell.size) * this.invQuadSizeX, this.maxBoundX) >> 0;
			var boundY = Math.min((cell.y + cell.size) * this.invQuadSizeY, this.maxBoundY) >> 0;
			for (var x = Math.max((cell.x - cell.size) * this.invQuadSizeX, 0) >> 0; x <= boundX; x++) {
				for (var y = Math.max((cell.y - cell.size) * this.invQuadSizeY, 0) >> 0; y <= boundY; y++) {
					for (var z in this.quad[x][y]) {
						var check = this.quad[x][y][z];
						var dx = check.x - cell.x;
						var dy = check.y - cell.y;
						var r = check.size + cell.size;
						var squared = dx * dx + dy * dy;
						if (squared > r * r) continue;
						if (check.type === 3 && this.nodesVirus.length !== this.config.virusMaxAmount) {
						    if (cell.mass * this.config.playerCellEatThreshold < check.mass) continue;
							var eatDistance = cell.size - check.size / 3;
							if (squared > eatDistance * eatDistance) continue;
							check.onEaten(cell);
							if (cell.mass > this.config.virusMaxMass) {
								cell.size = this.config.virusMinMass;
								cell.mass = cell.size * cell.size;
								var virus = new Entity.Virus(this, cell.x, cell.y, this.config.virusMinMass, 1536, false);
								var dx = check.boostX;
								var dy = check.boostY;
								if (dx === 0 && dy === 0) dx = 1;
								var d = this.config.virusShootSpeed / Math.sqrt(dx * dx + dy * dy);
								virus.boostX = dx * d;
								virus.boostY = dy * d;
							}
						}
					}
				}
			}
		cell.x += cell.boostX;
		cell.boostX *= 0.9;
		cell.y += cell.boostY;
		cell.boostY *= 0.9;
		var collisionMin = cell.size * 0.5;
		var collisionMaxX = this.config.borderWidth - collisionMin;
		var collisionMaxY = this.config.borderHeight - collisionMin;
		if (cell.x < collisionMin || cell.x > collisionMaxX) cell.boostX =- cell.boostX;
		if (cell.y < collisionMin || cell.y > collisionMaxY) cell.boostY =- cell.boostY;
		cell.x = Math.max(cell.x, collisionMin);
		cell.x = Math.min(cell.x, collisionMaxX);
		cell.y = Math.max(cell.y, collisionMin);
		cell.y = Math.min(cell.y, collisionMaxY);
		cell.quad[cell.quadIndex] = cell.quad[cell.quad.length - 1];
		cell.quad[cell.quadIndex].quadIndex = cell.quadIndex;
		cell.quad.pop();
		cell.quad = this.quad[cell.x * this.invQuadSizeX >> 0][cell.y * this.invQuadSizeY >> 0];
		cell.quadIndex = cell.quad.length;
		cell.quad.push(cell);
	}
	
	var amount = Math.min(this.config.foodSpawnAmount, this.config.foodAmount - this.nodesFood.length);
	
	for (var i = 0; i < amount; i++) new Entity.Food(this, Math.random() * this.config.borderWidth, Math.random() * this.config.borderHeight, Math.sqrt(this.config.foodMinMass + Math.random() * this.config.foodMaxMass), Math.random() * 1536 >> 0);
	
	amount = this.config.virusMinAmount - this.nodesVirus.length;
	
	for (var i = 0; i < amount; i++) new Entity.Virus(this, Math.random() * this.config.borderWidth, Math.random() * this.config.borderHeight, this.config.virusMinMass, 1536, true);
}
