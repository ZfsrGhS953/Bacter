var writer = require("./Writer");

function UpdateNodes(playerTracker, delNodes, eatNodes, updNodes, addNodes) {
	this.playerTracker = playerTracker;
	this.delNodes = delNodes;
	this.eatNodes = eatNodes;
	this.updNodes = updNodes;
	this.addNodes = addNodes;
}

module.exports = UpdateNodes;

UpdateNodes.prototype.build = function(protocol) {
	writer.writeUInt8(16);
	writer.writeUInt16(this.eatNodes.length);
	for (var i = 0; i < this.eatNodes.length; i++) {
		writer.writeUInt32(this.eatNodes[i].killer.id);
		writer.writeUInt32(this.eatNodes[i].id);
	}
	if (protocol < 5) {
		for (var i = 0; i < this.updNodes.length; i++) {
			writer.writeUInt32(this.updNodes[i].id);
			writer.writeInt16(this.updNodes[i].x);
			writer.writeInt16(this.updNodes[i].y);
			writer.writeUInt16(this.updNodes[i].size);
			writer.writeUInt24(this.playerTracker.gameServer.colors[this.updNodes[i].color]);
			writer.writeUInt8(this.updNodes[i].isVirus);
			writer.writeUInt16(0);
		}
		
		for (var i = 0; i < this.addNodes.length; i++) {
			writer.writeUInt32(this.addNodes[i].id);
			writer.writeInt16(this.addNodes[i].x);
			writer.writeInt16(this.addNodes[i].y);
			writer.writeUInt16(this.addNodes[i].size);
			writer.writeUInt24(this.playerTracker.gameServer.colors[this.addNodes[i].color]);
			writer.writeUInt8(this.addNodes[i].isVirus);
			writer.writeStringUnicode(this.addNodes[i].getName());
		}
		
		writer.writeUInt32(0);
		
		writer.writeUInt32(this.delNodes.length + this.eatNodes.length);
		
		for (var i = 0; i < this.delNodes.length; i++) writer.writeUInt32(this.delNodes[i].id);
		
		for (var i = 0; i < this.eatNodes.length; i++) writer.writeUInt32(this.eatNodes[i].id);
	} else if (protocol === 5) {
		for (var i = 0; i < this.updNodes.length; i++) {
			writer.writeUInt32(this.updNodes[i].id);
			writer.writeInt32(this.updNodes[i].x);
			writer.writeInt32(this.updNodes[i].y);
			writer.writeUInt16(this.updNodes[i].size);
			writer.writeUInt24(this.playerTracker.gameServer.colors[this.updNodes[i].color]);
			writer.writeUInt8(this.updNodes[i].isVirus);
			writer.writeUInt16(0);
		}
		
		for (var i = 0; i < this.addNodes.length; i++) {
			writer.writeUInt32(this.addNodes[i].id);
			writer.writeInt32(this.addNodes[i].x);
			writer.writeInt32(this.addNodes[i].y);
			writer.writeUInt16(this.addNodes[i].size);
			writer.writeUInt24(this.playerTracker.gameServer.colors[this.addNodes[i].color]);
			writer.writeUInt8(this.addNodes[i].isVirus);
			writer.writeStringUnicode(this.addNodes[i].getName());
		}
		
		writer.writeUInt32(0);
		
		writer.writeUInt32(this.delNodes.length + this.eatNodes.length);
		
		for (var i = 0; i < this.delNodes.length; i++) writer.writeUInt32(this.delNodes[i].id);
		
		for (var i = 0; i < this.eatNodes.length; i++) writer.writeUInt32(this.eatNodes[i].id);
	} else {
		for (var i = 0; i < this.updNodes.length; i++) {
			writer.writeUInt32(this.updNodes[i].id);
			writer.writeInt32(this.updNodes[i].x);
			writer.writeInt32(this.updNodes[i].y);
			writer.writeUInt16(this.updNodes[i].size);
			writer.writeUInt8(this.updNodes[i].isVirus);
		}
		
		for (var i = 0; i < this.addNodes.length; i++) {
			writer.writeUInt32(this.addNodes[i].id);
			writer.writeInt32(this.addNodes[i].x);
			writer.writeInt32(this.addNodes[i].y);
			writer.writeUInt16(this.addNodes[i].size);
			writer.writeUInt8(this.addNodes[i].isVirus + 2 + ((this.addNodes[i].getName() !== "") << 3));
			writer.writeUInt24(this.playerTracker.gameServer.colors[this.addNodes[i].color]);
			if (this.addNodes[i].getName() !== "") writer.writeStringUtf8(this.addNodes[i].getName());
		}
		
		writer.writeUInt32(0);
		
		writer.writeUInt16(this.delNodes.length + this.eatNodes.length);
		
		for (var i = 0; i < this.delNodes.length; i++) writer.writeUInt32(this.delNodes[i].id);
		
		for (var i = 0; i < this.eatNodes.length; i++) writer.writeUInt32(this.eatNodes[i].id);
	}
	
	return writer.createBuffer();
}
