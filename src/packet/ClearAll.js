var writer = require("./Writer");

function ClearAll() {
	
}

module.exports = ClearAll;

ClearAll.prototype.build = function(protocol) {
	writer.writeUInt8(18);
	return writer.createBuffer();
}
