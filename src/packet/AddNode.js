var writer = require("./Writer");

function AddNode(node) {
	this.node = node;
}

module.exports = AddNode;

AddNode.prototype.build = function(protocol) {
	writer.writeUInt8(32);
	writer.writeUInt32(this.node.id);
	return writer.createBuffer();
}
