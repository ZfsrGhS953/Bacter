var PlayerCell = require("./PlayerCell");

function Virus(gameServer, x, y, size, color, spawnProtection) {
	this.gameServer = gameServer;
	this.flag = 0;
	this.id = this.gameServer.createCellID++;
	this.type = 2;
	this.isVirus = 1;
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
	this.quad = this.gameServer.quad[this.x * this.gameServer.invQuadSizeX >> 0][this.y * this.gameServer.invQuadSizeY >> 0];
	this.quadIndex = this.quad.length;
	this.index = this.gameServer.nodesVirus.length;
	this.quad.push(this);
	this.gameServer.nodesVirus.push(this);
}

module.exports = Virus;

Virus.prototype.getName = function() {
	return "";
}

Virus.prototype.onEaten = function(cell) {
	if (!this.spawnProtection || this.gameServer.tickCounter - this.born > 2) {
		cell.mass += this.mass;
		cell.size = Math.sqrt(cell.mass);
		var cellsLeft = this.gameServer.config.playerMaxCells - cell.owner.cells.length;
		if (cellsLeft !== 0) {
		cell.x = Math.max(cell.x, cell.size * 0.5);
		cell.x = Math.min(cell.x, this.gameServer.config.borderWidth - cell.size * 0.5);
		cell.y = Math.max(cell.y, cell.size * 0.5);
		cell.y = Math.min(cell.y, this.gameServer.config.borderHeight - cell.size * 0.5);
		var threshold = cell.mass - cellsLeft * this.gameServer.config.playerStartMass;
		
		var big = [];
		if (cellsLeft === 1) big = [cell.mass / 2];
		else if (cellsLeft === 2) big = [cell.mass / 4, cell.mass / 4];
		else if (cellsLeft === 3) big = [cell.mass / 4, cell.mass / 4, cell.mass / 7];
		else if (cellsLeft === 4) big = [cell.mass / 5, cell.mass / 7, cell.mass / 8, cell.mass / 10];
		else if (cell.size > 216) {
			var exp = Math.random() * (4.5 - 3.33) + 3.33;
			while (threshold / exp > 2400) {
				threshold /= exp;
				exp = 2;
				big.push(threshold);
			}
		}
		cellsLeft -= big.length;
		
		for (var i = 0; i < big.length; i++) {
			cell.mass -= big[i];
			var split = new PlayerCell(this.gameServer, cell.x, cell.y, Math.sqrt(big[i]), cell.color, false, cell.owner);
			var angle = Math.random() * 6.28318530717958648;
			split.boostX = Math.sin(angle) * this.gameServer.config.playerSplitSpeed;
			split.boostY = Math.cos(angle) * this.gameServer.config.playerSplitSpeed;
		}
		var mass = this.gameServer.config.playerStartMass * 100;
		var size = Math.sqrt(mass);
		for (var i = 0; i < cellsLeft; i++) {
			if (cell.mass - mass < this.gameServer.config.playerStartMass * this.gameServer.config.playerStartMass) break;
			cell.mass -= mass;
			var split = new PlayerCell(this.gameServer, cell.x, cell.y, size, cell.color, false, cell.owner);
			var angle = Math.random() * 6.28318530717958648;
			split.boostX = Math.sin(angle) * this.gameServer.config.playerSplitSpeed;
			split.boostY = Math.cos(angle) * this.gameServer.config.playerSplitSpeed;
		}
		cell.size = Math.sqrt(cell.mass);
		}
	}
	this.killer = cell;
	this.quad[this.quadIndex] = this.quad[this.quad.length - 1];
	this.quad[this.quadIndex].quadIndex = this.quadIndex;
	this.quad.pop();
	this.gameServer.nodesVirus[this.index] = this.gameServer.nodesVirus[this.gameServer.nodesVirus.length - 1];
	this.gameServer.nodesVirus[this.index].index = this.index;
	this.gameServer.nodesVirus.pop();
}
