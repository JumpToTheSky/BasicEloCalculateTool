const fs = require('fs');
const { randomPlayers, savePlayers } = require('./Player');
const express = require('express');
const app = express();

class Match {
    constructor(id, teamBlue, teamRed, result) {
        this.id = id; // Unique match ID
        this.teamBlue = teamBlue;
        this.teamRed = teamRed;
        this.result = result; // { winner: 'blue' or 'red', stats: { playerId: { kills, deaths, assists, gold, damage } } }
    }
}

function assignRandomRoles(team) {
    const roles = ['top', 'mid', 'jungle', 'ad carry', 'support'];
    team.forEach((player, index) => {
        player.role = roles[index % roles.length]; // Assign roles cyclically
    });
}

function createRandomMatch() {
    const players = [...randomPlayers]; // Use the loaded Player instances directly

    if (players.length === 0) {
        throw new Error('No valid players available to create a match.');
    }

    const teamBlue = [];
    const teamRed = [];

    while (teamBlue.length < 5 || teamRed.length < 5) { // Change team size to 5
        const randomIndex = Math.floor(Math.random() * players.length);
        const player = players.splice(randomIndex, 1)[0];

        if (!player || typeof player.elo !== 'number') {
            console.error('Invalid player object:', player);
            continue; // Skip invalid players
        }

        const team = teamBlue.length < 5 ? teamBlue : teamRed; // Adjust team size to 5
        const opposingTeam = team === teamBlue ? teamRed : teamBlue;

        const eloDifference = opposingTeam.length
            ? Math.abs(player.elo - opposingTeam.reduce((sum, p) => sum + p.elo, 0) / opposingTeam.length)
            : 0;

        if (eloDifference <= 100) {
            team.push(player); // Push the entire Player object
        }
    }

    assignRandomRoles(teamBlue); // Assign roles to teamBlue
    assignRandomRoles(teamRed);  // Assign roles to teamRed

    const result = generateRandomResult(teamBlue, teamRed);
    const matchId = generateMatchId(); // Generate unique match ID

    const teamBlueStats = calculateTeamStats(teamBlue, result.stats);
    const teamRedStats = calculateTeamStats(teamRed, result.stats);

    // Update players.json
    savePlayers([...randomPlayers]);

    // Save match data to matches.json
    saveMatchToFile({
        id: matchId,
        teamBlue,
        teamRed,
        teamBlueStats,
        teamRedStats,
        winner: result.winner
    });

    // Save detailed player changes to player-changes.json
    savePlayerChanges(matchId, teamBlue, teamRed, result.stats);

    return {
        id: matchId,
        teamBlue,
        teamRed,
        teamBlueStats,
        teamRedStats,
        winner: result.winner
    };
}

function calculateTeamStats(team, stats) {
    return team.reduce(
        (acc, player) => {
            const playerStats = stats[player.id];
            acc.kills += playerStats.kills;
            acc.deaths += playerStats.deaths;
            acc.assists += playerStats.assists;
            return acc;
        },
        { kills: 0, deaths: 0, assists: 0 }
    );
}

function generateMatchId() {
    return `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function generateRandomResult(teamBlue, teamRed) {
    const stats = {};
    const allPlayers = [...teamBlue, ...teamRed];

    const totalKillsBlue = Math.floor(Math.random() * 30) + 10; // Random total kills for blue team
    const totalKillsRed = Math.floor(Math.random() * 30) + 10; // Random total kills for red team

    const totalDeathsBlue = totalKillsRed; // Blue team's deaths equal Red team's kills
    const totalDeathsRed = totalKillsBlue; // Red team's deaths equal Blue team's kills
    const distributeStats = (team, totalKills, totalDeaths) => {
        let remainingKills = totalKills;
        let remainingDeaths = totalDeaths;

        return team.map((player, index) => {
            const isLastPlayer = index === team.length - 1;

            const kills = isLastPlayer
                ? remainingKills // Assign remaining kills to the last player
                : Math.floor(Math.random() * (remainingKills / (team.length - index)));

            const deaths = isLastPlayer
                ? remainingDeaths // Assign remaining deaths to the last player
                : Math.floor(Math.random() * (remainingDeaths / (team.length - index)));

            remainingKills -= kills;
            remainingDeaths -= deaths;

            const assists = Math.min(
                Math.floor(Math.random() * (kills * 4 - kills + 1)) + kills, // Assists between kills and kills * 4
                totalKills // Ensure assists do not exceed total team kills
            );

            const damage = Math.max(1000, Math.floor(Math.random() * 15000)); // Damage at least 1000

            stats[player.id] = { kills, deaths, assists, gold: Math.floor((kills + assists) / Math.max(1, deaths) * 1000), damage };
        });
    };

    distributeStats(teamBlue, totalKillsBlue, totalDeathsBlue);
    distributeStats(teamRed, totalKillsRed, totalDeathsRed);

    const winner = Math.random() < 0.5 ? 'blue' : 'red';
    updatePlayerStats(winner, teamBlue, teamRed, stats);
    updateWinRates(teamBlue, teamRed, winner); // Update win rates

    return { winner, stats };
}

function savePlayerChanges(matchId, teamBlue, teamRed, stats) {
    const changesFilePath = 'player_changes.json';
    const changes = fs.existsSync(changesFilePath) ? JSON.parse(fs.readFileSync(changesFilePath, 'utf-8')) : [];
    const matchChanges = {
        matchId,
        changes: [...teamBlue, ...teamRed].map(player => ({
            playerId: player.id,
            eloChange: player.eloChange ?? 0, // Đảm bảo giá trị mặc định là 0 nếu null
            rankPointChange: player.rankPointChange ?? 0, // Đảm bảo giá trị mặc định là 0 nếu null
            stats: {
                kills: stats[player.id]?.kills || 0,
                deaths: stats[player.id]?.deaths || 0,
                assists: stats[player.id]?.assists || 0,
                damage: stats[player.id]?.damage || 0
            }
        }))
    };
    changes.push(matchChanges);
    fs.writeFileSync(changesFilePath, JSON.stringify(changes, null, 2), 'utf-8');
}

function updatePlayerStats(winner, teamBlue, teamRed, stats) {
    const winningTeam = winner === 'blue' ? teamBlue : teamRed;
    const losingTeam = winner === 'blue' ? teamRed : teamBlue;

    const avgEloWinningTeam = winningTeam.reduce((sum, player) => sum + player.elo, 0) / winningTeam.length;
    const avgEloLosingTeam = losingTeam.reduce((sum, player) => sum + player.elo, 0) / losingTeam.length;

    const eloAdjustmentFactor = avgEloWinningTeam < avgEloLosingTeam ? 1.2 : 1.0;

    winningTeam.forEach(player => {
        const { kills, deaths, assists, damage } = stats[player.id];
        const damageScore = Math.floor(damage / 1000);
        const score = (kills + assists) / Math.max(deaths, 1) + damageScore + (player.winRate % 1);

        if (player.elo == null) {
            console.error(`Player ${player.id} has null elo. Setting to default value 0.`);
            player.elo = 0; // Default value if elo is null
        }

        const adjustedScore = score * eloAdjustmentFactor;
        player.rankPoint += adjustedScore;
        player.elo += adjustedScore;
        player.rankPoint = Math.max(0, player.rankPoint);
        player.elo = Math.max(0, player.elo);
        player.eloChange = Math.round(adjustedScore ?? 0); // Store as integer
        player.rankPointChange = Math.round(adjustedScore ?? 0); // Store as integer
    });

    losingTeam.forEach(player => {
        const { kills, deaths, assists, damage } = stats[player.id];
        const damageScore = Math.floor(damage / 1000);
        const score = (kills + assists) / Math.max(deaths, 1) + damageScore + (player.winRate % 1);

        if (player.elo == null) {
            console.error(`Player ${player.id} has null elo. Setting to default value 0.`);
            player.elo = 0; // Default value if elo is null
        }

        const penalty = Math.max(0, score) * eloAdjustmentFactor; // Apply adjustment factor
        player.rankPoint -= penalty;
        player.elo -= penalty;
        player.rankPoint = Math.max(0, player.rankPoint);
        player.elo = Math.max(0, player.elo);
        player.eloChange = -Math.round(penalty ?? 0); // Store as integer
        player.rankPointChange = -Math.round(penalty ?? 0); // Store as integer
    });
}

function updateWinRates(teamBlue, teamRed, winner) {
    const winningTeam = winner === 'blue' ? teamBlue : teamRed;
    const losingTeam = winner === 'blue' ? teamRed : teamBlue;

    winningTeam.forEach(player => {
        player.matchesPlayed = (player.matchesPlayed || 0) + 1;
        const previousWinRate = player.winRate || 0; // Default to 0 if null or undefined
        player.winRate = parseFloat(((previousWinRate * (player.matchesPlayed - 1) + 1) / player.matchesPlayed).toFixed(2));
    });

    losingTeam.forEach(player => {
        player.matchesPlayed = (player.matchesPlayed || 0) + 1;
        const previousWinRate = player.winRate || 0; // Default to 0 if null or undefined
        player.winRate = parseFloat(((previousWinRate * (player.matchesPlayed - 1)) / player.matchesPlayed).toFixed(2));
    });
}

const matchFilePath = 'matches.json';
const playerChangesFilePath = 'player_changes.json';

function saveMatchToFile(match) {
    let matches = [];
    if (fs.existsSync(matchFilePath)) {
        const fileContent = fs.readFileSync(matchFilePath, 'utf-8');
        try {
            matches = JSON.parse(fileContent);
            if (!Array.isArray(matches)) {
                console.error('Invalid matches.json format. Resetting to an empty array.');
                matches = [];
            }
        } catch (error) {
            console.error('Error parsing matches.json. Resetting to an empty array.', error);
            matches = [];
        }
    }
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

function getPlayerMatchDetails(playerId) {
    const matches = loadMatches();
    const playerChanges = fs.existsSync(playerChangesFilePath)
        ? JSON.parse(fs.readFileSync(playerChangesFilePath, 'utf-8'))
        : [];

    return matches
        .filter(match => 
            match.teamBlue.some(player => player.id === playerId) || 
            match.teamRed.some(player => player.id === playerId)
        )
        .map(match => {
            const isBlueTeam = match.teamBlue.some(player => player.id === playerId);
            const team = isBlueTeam ? 'Blue' : 'Red';
            const result = match.result.winner === (isBlueTeam ? 'blue' : 'red') ? 'Win' : 'Loss';

            // Retrieve player changes from player_changes.json
            const matchChanges = playerChanges.find(change => change.matchId === match.id);
            const playerChange = matchChanges?.changes.find(change => change.playerId === playerId);

            if (!playerChange) {
                console.error(`No player change data found for playerId: ${playerId} in matchId: ${match.id}`);
                return null; // Skip if no change data is found
            }

            return {
                team,
                result,
                stats: {
                    kills: null, // No stats available
                    deaths: null,
                    assists: null,
                    damage: null
                },
                eloChange: playerChange.eloChange,
                rankPointChange: playerChange.rankPointChange,
            };
        })
        .filter(detail => detail !== null); // Filter out null entries
}

app.get('/get-player-match-details', (req, res) => {
    const playerId = parseInt(req.query.playerId, 10);
    if (isNaN(playerId)) {
        return res.status(400).send({ error: 'Invalid playerId' });
    }
    const matchDetails = getPlayerMatchDetails(playerId);
    res.json(matchDetails);
});

module.exports = { Match, createRandomMatch, generateRandomResult, updatePlayerStats, saveMatchToFile, loadMatches, filterMatchesByPlayer, getPlayerMatchDetails };

// Example usage:
// const match = createRandomMatch();
// saveMatchToFile(match);
