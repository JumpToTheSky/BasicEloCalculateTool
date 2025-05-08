const fs = require('fs');
const { randomPlayers, savePlayers } = require('./Player');

class Match {
    constructor(teamBlue, teamRed, result) {
        this.teamBlue = teamBlue;
        this.teamRed = teamRed;
        this.result = result; // { winner: 'blue' or 'red', stats: { playerId: { kills, deaths, assists, gold, damage } } }
    }
}

function createRandomMatch() {
    const players = [...randomPlayers];
    const teamBlue = [];
    const teamRed = [];

    while (teamBlue.length < 3 || teamRed.length < 3) {
        const randomIndex = Math.floor(Math.random() * players.length);
        const player = players.splice(randomIndex, 1)[0];

        const team = teamBlue.length < 3 ? teamBlue : teamRed;
        const opposingTeam = team === teamBlue ? teamRed : teamBlue;

        const eloDifference = opposingTeam.length
            ? Math.abs(player.elo - opposingTeam.reduce((sum, p) => sum + p.elo, 0) / opposingTeam.length)
            : 0;

        if (eloDifference <= 100) {
            team.push(player);
        }
    }

    const result = generateRandomResult(teamBlue, teamRed);
    savePlayers([...randomPlayers]); // Save updated player data
    return new Match(teamBlue, teamRed, result);
}

function generateRandomResult(teamBlue, teamRed) {
    const stats = {};
    const allPlayers = [...teamBlue, ...teamRed];

    allPlayers.forEach(player => {
        const kills = Math.floor(Math.random() * 10);
        const deaths = Math.max(1, Math.floor(Math.random() * 10)); // Avoid division by zero
        const assists = Math.floor(Math.random() * 10);
        const gold = Math.floor((kills + assists) / deaths * 1000);
        const damage = Math.floor(Math.random() * 10000);

        stats[player.id] = { kills, deaths, assists, gold, damage };
    });

    const winner = Math.random() < 0.5 ? 'blue' : 'red';
    updatePlayerStats(winner, teamBlue, teamRed, stats);
    updateWinRates(teamBlue, teamRed, winner); // Update win rates

    return { winner, stats };
}

function updatePlayerStats(winner, teamBlue, teamRed, stats) {
    const winningTeam = winner === 'blue' ? teamBlue : teamRed;
    const losingTeam = winner === 'blue' ? teamRed : teamBlue;

    const winningTeamMaxScore = Math.max(...winningTeam.map(player => {
        const { kills, deaths, assists, damage } = stats[player.id];
        return (kills + assists) / deaths + (10 - player.winRate*10) + Math.floor(damage / 1000);
    }));

    winningTeam.forEach(player => {
        const { kills, deaths, assists, damage } = stats[player.id];
        const score = (kills + assists) / deaths + (10 - player.winRate) + Math.floor(damage / 1000);
        player.rankPoint += score;
        player.elo += score; // Arbitrary Elo increment for winning
        player.rankPoint = Math.max(0, player.rankPoint); // Prevent negative rankPoint
        player.elo = Math.max(0, player.elo); // Prevent negative Elo
    });

    losingTeam.forEach(player => {
        const { kills, deaths, assists, damage } = stats[player.id];
        const score = (kills + assists) / deaths + (10 - player.winRate) + Math.floor(damage / 1000);
        player.rankPoint -= (winningTeamMaxScore - score);
        player.elo -= (winningTeamMaxScore - score);; // Arbitrary Elo decrement for losing
        player.rankPoint = Math.max(0, player.rankPoint); // Prevent negative rankPoint
        player.elo = Math.max(0, player.elo); // Prevent negative Elo
    });
}

function updateWinRates(teamBlue, teamRed, winner) {
    const winningTeam = winner === 'blue' ? teamBlue : teamRed;
    const losingTeam = winner === 'blue' ? teamRed : teamBlue;

    winningTeam.forEach(player => {
        player.winRate = ((player.winRate * player.matchesPlayed + 1) / (player.matchesPlayed + 1)).toFixed(2);
        player.matchesPlayed = (player.matchesPlayed || 0) + 1;
    });

    losingTeam.forEach(player => {
        player.winRate = ((player.winRate * player.matchesPlayed) / (player.matchesPlayed + 1)).toFixed(2);
        player.matchesPlayed = (player.matchesPlayed || 0) + 1;
    });
}

const matchFilePath = 'matches.json';

function saveMatchToFile(match) {
    const matches = fs.existsSync(matchFilePath) ? JSON.parse(fs.readFileSync(matchFilePath, 'utf-8')) : [];
    matches.push(match);
    fs.writeFileSync(matchFilePath, JSON.stringify(matches, null, 2), 'utf-8');
}

function loadMatches() {
    if (fs.existsSync(matchFilePath)) {
        return JSON.parse(fs.readFileSync(matchFilePath, 'utf-8'));
    }
    return [];
}

function filterMatchesByPlayer(playerId) {
    const matches = loadMatches();
    return matches.filter(match => 
        match.teamBlue.some(player => player.id === playerId) || 
        match.teamRed.some(player => player.id === playerId)
    );
}

module.exports = { Match, createRandomMatch, generateRandomResult, updatePlayerStats, saveMatchToFile, loadMatches, filterMatchesByPlayer };

// Example usage:
// const match = createRandomMatch();
// saveMatchToFile(match);
