var buffer = new Buffer(524288);
var offset = 0;
var Writer = {
	writeInt8: function(n) {
		buffer[offset++] = n;
	},
	
	writeUInt8: function(n) {
		buffer[offset++] = n;
	},
	
	writeInt16: function(n) {
		buffer[offset++] = n;
		buffer[offset++] = n >> 8;
	},
	
	writeUInt16: function(n) {
		buffer[offset++] = n;
		buffer[offset++] = n >> 8;
	},
	
	writeInt24: function(n) {
		buffer[offset++] = n;
		buffer[offset++] = n >> 8;
		buffer[offset++] = n >> 16;
	},
	
	writeUInt24: function(n) {
		buffer[offset++] = n;
		buffer[offset++] = n >> 8;
		buffer[offset++] = n >> 16;
	},
	
	writeInt32: function(n) {
		buffer[offset++] = n;
		buffer[offset++] = n >> 8;
		buffer[offset++] = n >> 16;
		buffer[offset++] = n >> 24;
	},
	
	writeUInt32: function(n) {
		buffer[offset++] = n;
		buffer[offset++] = n >> 8;
		buffer[offset++] = n >> 16;
		buffer[offset++] = n >> 24;
	},
	
	writeFloat: function(n) {
		buffer.writeFloatLE(n, offset);
		offset += 4;
	},
	
	writeDouble: function(n) {
		buffer.writeDoubleLE(n, offset);
		offset += 8;
	},
	
	writeStringUtf8: function(n) {
		for (var i = 0; i < n.length; i++) {
			if (n.charCodeAt(i) < 128) {
				buffer[offset++] = n.charCodeAt(i);
			} else if (n.charCodeAt(i) < 2048) {
				buffer[offset++] = 192 + (n.charCodeAt(i) >> 6);
				buffer[offset++] = 128 + (n.charCodeAt(i) & 63);
			} else if ((n.charCodeAt(i) & 64512 === 55296) && (n.charCodeAt(i + 1) & 64512 === 56320)) {
				var m = 65536 + ((n.charCodeAt(i) & 1023) << 10) + (n.charCodeAt(i + 1) & 1023);
				buffer[offset++] = 240 + (m >> 18);
				buffer[offset++] = 128 + (m >> 12 & 63);
				buffer[offset++] = 128 + (m >> 6 & 63);
				buffer[offset++] = 128 + (m & 63);
				i++;
			} else {
				buffer[offset++] = 224 + (n.charCodeAt(i) >> 12);
				buffer[offset++] = 128 + (n.charCodeAt(i) >> 6 & 63);
				buffer[offset++] = 128 + (n.charCodeAt(i) & 63);
			}
		}
		buffer[offset++] = 0;
	},
	
	writeStringUnicode: function(n) {
		for (var i = 0; i < n.length; i++) {
			buffer[offset++] = n.charCodeAt(i);
		    buffer[offset++] = n.charCodeAt(i) >> 8;
		}
		buffer[offset++] = 0;
		buffer[offset++] = 0;
	},
	
	createBuffer: function() {
		var buf = Buffer.concat([buffer.slice(0, offset)]);
		offset = 0;
		return buf;
	}
};

module.exports = Writer;
