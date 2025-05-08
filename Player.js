const fs = require('fs');

class Player {
    constructor(id, name, winRate, elo = 0, rankPoint = 0) {
        this.id = id; 
        this.name = name; 
        this.winRate = winRate; 
        this.elo = elo; 
        this.rankPoint = rankPoint; 
    }
}


function generateRandomName() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return Array.from({ length: 5 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
}

function generateRandomID() {
    return Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
}

const randomPlayers = Array.from({ length: 100 }, () => {
    return new Player(generateRandomID(), generateRandomName(), 0);
});

// Lưu danh sách người chơi vào file JSON nếu file chưa tồn tại
const filePath = 'players.json';
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(randomPlayers, null, 2), 'utf-8');
} else {
    console.log(`${filePath} already exists. Skipping file creation.`);
}

module.exports = { Player, randomPlayers };
