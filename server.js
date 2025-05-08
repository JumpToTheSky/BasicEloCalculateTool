const express = require('express');
const fs = require('fs');
const path = require('path');
const { createRandomMatch, saveMatchToFile, loadMatches, filterMatchesByPlayer } = require('./Match');
const { randomPlayers } = require('./Player');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'players.html'));
});

app.get('/players.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'players.html'));
});

app.get('/match.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'match.html'));
});

app.post('/create-random-match', (req, res) => {
    const match = createRandomMatch();
    saveMatchToFile(match);
    res.json(match.result);
});

app.get('/players', (req, res) => {
    res.json(randomPlayers);
});

app.get('/matches', (req, res) => {
    const matches = loadMatches();
    res.json(matches);
});

app.get('/player-matches/:playerId', (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);
    const matches = filterMatchesByPlayer(playerId);
    res.json(matches);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
