const fs = require('fs');
const { playersData, savePlayers } = require('./Player');
const path = require('path');

function loadChampions() {
    const championsFilePath = path.join(__dirname, 'champions.json');
    if (fs.existsSync(championsFilePath)) {
        const data = fs.readFileSync(championsFilePath, 'utf-8');
        try {
            const champions = JSON.parse(data);
            if (Array.isArray(champions)) {
                return champions;
            }
        } catch (e) {
            console.error('Error parsing champions.json:', e);
        }
    }
    return [];
}

const championsList = loadChampions();

const matchFilePath = path.join(__dirname, 'matches.json');
const playerChangesFilePath = path.join(__dirname, 'player_changes.json');

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
    } else {
        fs.writeFileSync(matchFilePath, JSON.stringify([], null, 2), 'utf-8');
    }
    matches.push(match);
    fs.writeFileSync(matchFilePath, JSON.stringify(matches, null, 2), 'utf-8');
}

function loadMatches() {
    if (!fs.existsSync(matchFilePath)) {
        fs.writeFileSync(matchFilePath, JSON.stringify([], null, 2), 'utf-8');
        return [];
    }
    return JSON.parse(fs.readFileSync(matchFilePath, 'utf-8'));
}

function savePlayerChanges(matchId, teamBlue, teamRed, stats) {
    const changesFilePath = playerChangesFilePath;
    if (!fs.existsSync(changesFilePath)) {
        fs.writeFileSync(changesFilePath, JSON.stringify([], null, 2), 'utf-8');
    }
    const changes = fs.existsSync(changesFilePath) ? JSON.parse(fs.readFileSync(changesFilePath, 'utf-8')) : [];
    const matchChanges = {
        matchId,
        changes: [...teamBlue, ...teamRed].map(player => ({
            playerId: player.id,
            champion: player.champion || "Unknown",
            role: player.role || "Unknown",
            eloChange: player.eloChange ?? 0,
            rankPointChange: player.rankPointChange ?? 0,
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

class Match {
    constructor(id, teamBlue, teamRed, result) {
        this.id = id;
        this.teamBlue = teamBlue;
        this.teamRed = teamRed;
        this.result = result;
    }
}

function assignRandomRoles(team) {
    const roles = ['top', 'mid', 'jungle', 'ad carry', 'support'];
    const shuffledRoles = roles
        .map(role => ({ role, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(obj => obj.role);
    team.forEach((player, index) => {
        player.role = shuffledRoles[index % roles.length];
    });
}

function assignRandomChampions(team) {
    team.forEach(player => {
        if (championsList.length > 0) {
            const randomIndex = Math.floor(Math.random() * championsList.length);
            player.champion = championsList[randomIndex];
        } else {
            player.champion = "Unknown";
        }
    });
}

function createRandomMatch() {
    const players = [...playersData];

    if (players.length === 0) {
        throw new Error('No valid players available to create a match.');
    }

    const teamBlue = [];
    const teamRed = [];

    while (teamBlue.length < 5 || teamRed.length < 5) {
        const randomIndex = Math.floor(Math.random() * players.length);
        const player = players.splice(randomIndex, 1)[0];

        if (!player || typeof player.elo !== 'number') {
            console.error('Invalid player object:', player);
            continue;
        }

        const team = teamBlue.length < 5 ? teamBlue : teamRed;
        const opposingTeam = team === teamBlue ? teamRed : teamBlue;

        const eloDifference = opposingTeam.length
            ? Math.abs(player.elo - opposingTeam.reduce((sum, p) => sum + p.elo, 0) / opposingTeam.length)
            : 0;

        if (eloDifference <= 100) {
            team.push(player);
        }
    }

    assignRandomRoles(teamBlue);
    assignRandomRoles(teamRed);
    assignRandomChampions(teamBlue);
    assignRandomChampions(teamRed);

    const result = generateRandomResult(teamBlue, teamRed);
    const matchId = generateMatchId();

    const teamBlueStats = calculateTeamStats(teamBlue, result.stats);
    const teamRedStats = calculateTeamStats(teamRed, result.stats);

    savePlayers([...playersData]);
    saveMatchToFile({
        id: matchId,
        teamBlue,
        teamRed,
        teamBlueStats,
        teamRedStats,
        winner: result.winner
    });
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

    const totalKillsBlue = Math.floor(Math.random() * 30) + 10;
    const totalKillsRed = Math.floor(Math.random() * 30) + 10;

    const totalDeathsBlue = totalKillsRed;
    const totalDeathsRed = totalKillsBlue;
    const distributeStats = (team, totalKills, totalDeaths) => {
        let remainingKills = totalKills;
        let remainingDeaths = totalDeaths;

        return team.map((player, index) => {
            const isLastPlayer = index === team.length - 1;

            const kills = isLastPlayer
                ? remainingKills
                : Math.floor(Math.random() * (remainingKills / (team.length - index)));

            const deaths = isLastPlayer
                ? remainingDeaths
                : Math.floor(Math.random() * (remainingDeaths / (team.length - index)));

            remainingKills -= kills;
            remainingDeaths -= deaths;

            const assists = Math.min(
                Math.floor(Math.random() * (kills * 4 - kills + 1)) + kills,
                totalKills
            );

            const damage = Math.max(1000, Math.floor(Math.random() * 15000));

            stats[player.id] = { kills, deaths, assists, gold: Math.floor((kills + assists) / Math.max(1, deaths) * 1000), damage };
        });
    };

    distributeStats(teamBlue, totalKillsBlue, totalDeathsBlue);
    distributeStats(teamRed, totalKillsRed, totalDeathsRed);

    const winner = Math.random() < 0.5 ? 'blue' : 'red';
    updatePlayerStats(winner, teamBlue, teamRed, stats);
    updateWinRates(teamBlue, teamRed, winner);

    return { winner, stats };
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
            player.elo = 0;
        }

        const adjustedScore = score * eloAdjustmentFactor;
        player.rankPoint += adjustedScore;
        player.elo += adjustedScore;
        player.rankPoint = Math.max(0, player.rankPoint);
        player.elo = Math.max(0, player.elo);
        player.eloChange = Math.round(adjustedScore ?? 0);
        player.rankPointChange = Math.round(adjustedScore ?? 0);
    });

    losingTeam.forEach(player => {
        const { kills, deaths, assists, damage } = stats[player.id];
        const damageScore = Math.floor(damage / 1000);
        const score = (kills + assists) / Math.max(deaths, 1) + damageScore + (player.winRate % 1);

        if (player.elo == null) {
            console.error(`Player ${player.id} has null elo. Setting to default value 0.`);
            player.elo = 0;
        }

        const penalty = Math.max(0, score) * eloAdjustmentFactor;
        player.rankPoint -= penalty;
        player.elo -= penalty;
        player.rankPoint = Math.max(0, player.rankPoint);
        player.elo = Math.max(0, player.elo);
        player.eloChange = -Math.round(penalty ?? 0);
        player.rankPointChange = -Math.round(penalty ?? 0);
    });
}

function updateWinRates(teamBlue, teamRed, winner) {
    const winningTeam = winner === 'blue' ? teamBlue : teamRed;
    const losingTeam = winner === 'blue' ? teamRed : teamBlue;

    winningTeam.forEach(player => {
        player.matchesPlayed = (player.matchesPlayed || 0) + 1;
        const previousWinRate = player.winRate || 0;
        player.winRate = parseFloat(((previousWinRate * (player.matchesPlayed - 1) + 1) / player.matchesPlayed).toFixed(2));
    });

    losingTeam.forEach(player => {
        player.matchesPlayed = (player.matchesPlayed || 0) + 1;
        const previousWinRate = player.winRate || 0;
        player.winRate = parseFloat(((previousWinRate * (player.matchesPlayed - 1)) / player.matchesPlayed).toFixed(2));
    });
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
            const result = match.result && match.result.winner === (isBlueTeam ? 'blue' : 'red') ? 'Win' : 'Loss';

            const matchChanges = playerChanges.find(change => change.matchId === match.id);
            const playerChange = matchChanges?.changes.find(change => change.playerId === playerId);

            if (!playerChange) {
                console.error(`No player change data found for playerId: ${playerId} in matchId: ${match.id}`);
                return null;
            }

            return {
                team,
                result,
                champion: playerChange.champion || "Unknown",
                stats: {
                    kills: playerChange.stats.kills,
                    deaths: playerChange.stats.deaths,
                    assists: playerChange.stats.assists,
                    damage: playerChange.stats.damage
                },
                eloChange: playerChange.eloChange,
                rankPointChange: playerChange.rankPointChange,
            };
        })
        .filter(detail => detail !== null);
}

module.exports = {
    createRandomMatch,
    loadMatches
};