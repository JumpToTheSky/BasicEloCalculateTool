const fs = require('fs');
const path = require('path');

const playerFilePath = path.join(__dirname, 'players.json');

class Player {
    constructor(id, name, winRate = 0.0, elo = 0, rankPoint = 0, role = null) {
        this.id = id;
        this.name = name;
        this.winRate = parseFloat(Number(winRate || 0.0).toFixed(2));
        this.elo = Math.floor(elo);
        this.rankPoint = Math.floor(rankPoint);
        this.role = role;
    }
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

function generateRandomPlayers(count) {
    const players = [];
    for (let i = 0; i < count; i++) {
        const id = Math.floor(10000 + Math.random() * 90000);
        const name = generateRandomString(5);
        players.push(new Player(id, name, 0));
    }
    return players;
}

function savePlayers(players) {
    fs.writeFileSync(playerFilePath, JSON.stringify(players, null, 2), 'utf-8');
}

function loadPlayers() {
    if (!fs.existsSync(playerFilePath)) {
        const players = generateRandomPlayers(100);
        savePlayers(players);
    }
    const data = fs.readFileSync(playerFilePath, 'utf-8');
    const parsedPlayers = JSON.parse(data);
    return parsedPlayers.map(p => new Player(
        p.id,
        p.name,
        p.winRate,
        p.elo ?? 0,
        p.rankPoint ?? 0,
        p.role ?? null
    ));
}

const playersData = loadPlayers();

module.exports = { playersData, generateRandomPlayers, savePlayers };
