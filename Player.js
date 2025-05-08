const fs = require('fs');

class Player {
    constructor(id, name, winRate, elo = 0, rankPoint = 0) {
        this.id = id; 
        this.name = name; 
        this.winRate = winRate; 
        this.elo = Math.floor(elo); // Ensure elo is an integer
        this.rankPoint = Math.floor(rankPoint); // Ensure rankPoint is an integer
    }
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

function generateRandomPlayers(count) {
    const players = [];
    for (let i = 0; i < count; i++) {
        const id = Math.floor(10000 + Math.random() * 90000); // Random 5-digit ID
        const name = generateRandomString(5); // Random 5-character name
        players.push(new Player(id, name, 0)); // Default winRate = 0, elo = 0, rankPoint = 0
    }
    return players;
}

const playerFilePath = 'players.json';

function loadPlayers() {
    if (fs.existsSync(playerFilePath)) {
        const data = fs.readFileSync(playerFilePath, 'utf-8');
        return JSON.parse(data).map(p => new Player(p.id, p.name, p.winRate, p.elo, p.rankPoint));
    } else {
        const players = generateRandomPlayers(100);
        savePlayers(players);
        return players;
    }
}

function savePlayers(players) {
    fs.writeFileSync(playerFilePath, JSON.stringify(players, null, 2), 'utf-8');
}

const randomPlayers = loadPlayers();

module.exports = { Player, randomPlayers, savePlayers };
