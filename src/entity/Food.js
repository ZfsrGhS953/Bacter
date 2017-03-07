function Food(gameServer, x, y, size, color) {
	this.gameServer = gameServer;
	this.flag = 0;
	this.id = this.gameServer.createCellID++;
	this.type = 1;
	this.isVirus = 0;
	this.x = x;
	this.y = y;
	this.size = size;
	this.mass = size * size;
	this.color = color;
	this.killer = null;
	this.born = this.gameServer.tickCounter;
	this.quad = this.gameServer.quad[this.x * this.gameServer.invQuadSizeX >> 0][this.y * this.gameServer.invQuadSizeY >> 0];
	this.quadIndex = this.quad.length;
	this.index = this.gameServer.nodesFood.length;
	this.quad.push(this);
	this.gameServer.nodesFood.push(this);
}

module.exports = Food;

Food.prototype.getName = function() {
	return "";
}

Food.prototype.onEaten = function(cell) {
	if (this.gameServer.tickCounter - this.born > 2) {
		cell.mass += this.mass;
		cell.size = Math.sqrt(cell.mass);
	}
	this.killer = cell;
	this.quad[this.quadIndex] = this.quad[this.quad.length - 1];
	this.quad[this.quadIndex].quadIndex = this.quadIndex;
	this.quad.pop();
	this.gameServer.nodesFood[this.index] = this.gameServer.nodesFood[this.gameServer.nodesFood.length - 1];
	this.gameServer.nodesFood[this.index].index = this.index;
	this.gameServer.nodesFood.pop();
}
