var GameServer = require("./GameServer");
var Entity = require("./entity");
var BotLoader = require("./ai");

var gameServer = new GameServer();
gameServer.start();

var commands = {
	help: function(split) {
		
	},
	
	ejectedmass: function(split) {
		var x = parseFloat(split[1]);
		var y = parseFloat(split[2]);
		var size = parseFloat(split[3]);
		var color = parseFloat(split[4]);
		var amount = parseFloat(split[5]);
		for (var i = 0; i < amount; i++) new Entity.EjectedMass(gameServer, x + Math.random(), y + Math.random(), size, color);
		console.log("Spawned a cluster of " + amount + " ejected cells at (" + x + "," + y + ")");
	},
	
	food: function(split) {
		var x = split[1];
		var y = split[2];
		var size = split[3];
		var color = split[4];
		new Entity.Food(gameServer, x, y, size, color, false);
		console.log("Spawned a pellet at (" + x + "," + y + ")");
	},
	
	merge: function(split) {
		var id = split[1];
		for (var i = 0; i < gameServer.clients[id].playerTracker.cells.length; i++) gameServer.clients[id].playerTracker.cells[i].born = -1e999;
		console.log("Player " + id + " is merging...");
	},
	
	minion: function(split) {
		var id = split[1];
		var amount = split[2];
		for (var i = 0; i < amount; i++) gameServer.clients[id].playerTracker.minions.push(new BotLoader.BotMinion(new BotLoader.FakeSocket));
		console.log("Added " + amount + " minions to player " + id);
	},
	
	size: function(split) {
		var id = split[1];
		var size = split[2];
		for (var i = 0; i < gameServer.clients[id].playerTracker.cells.length; i++) {
			gameServer.clients[id].playerTracker.cells[i].size = size;
			gameServer.clients[id].playerTracker.cells[i].mass = size * size;
		}
		console.log("Set player " + id + "'s size of all cells to " + size);
	},
}

var readline = require("readline");
var in_ = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
setTimeout(prompt, 100);

function prompt() {
	in_.question(">", function(str) {
		try {
			parseCommands(str);
		} catch (err) {
			console.log("Invalid command or arguments! Type \"help\" for a list of all commands.")
		} finally {
			setTimeout(prompt, 0);
		}
	});
}

function parseCommands(str) {
	if (str === "") return;
	
	var split = str.split(" ");
	
	var first = split[0].toLowerCase();
	
	commands[first](split);
}
