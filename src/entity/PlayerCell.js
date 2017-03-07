var Packet = require("../packet");

function PlayerCell(gameServer, x, y, size, color, spawnProtection, owner) {
	this.gameServer = gameServer;
	this.flag = 0;
	this.id = this.gameServer.createCellID++;
	this.type = 0;
	this.isVirus = 0;
	this.x = x;
	this.y = y;
	this.size = size;
	this.mass = size * size;
	this.color = color;
	this.killer = null;
	this.boostX = 0;
	this.boostY = 0;
	this.born = this.gameServer.tickCounter;
	this.spawnProtection = spawnProtection;
	this.owner = owner;
	this.quad = this.gameServer.quad[this.x * this.gameServer.invQuadSizeX >> 0][this.y * this.gameServer.invQuadSizeY >> 0];
	this.quadIndex = this.quad.length;
	this.index = this.owner.cells.length;
	this.quad.push(this);
	this.owner.cells.push(this);
	this.owner.socket.sendPacket(new Packet.AddNode(this));
}

module.exports = PlayerCell;

PlayerCell.prototype.getName = function() {
	return this.owner.name;
}

PlayerCell.prototype.onEaten = function(cell) {
	if (!this.spawnProtection || this.gameServer.tickCounter - this.born > 2) {
		cell.mass += this.mass;
		cell.size = Math.sqrt(cell.mass);
	}
	this.killer = cell;
	this.quad[this.quadIndex] = this.quad[this.quad.length - 1];
	this.quad[this.quadIndex].quadIndex = this.quadIndex;
	this.quad.pop();
	this.owner.cells[this.index] = this.owner.cells[this.owner.cells.length - 1];
	this.owner.cells[this.index].index = this.index;
	this.owner.cells.pop();
}
