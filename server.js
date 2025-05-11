const express = require('express');
const path = require('path');
const fs = require('fs');
const { createRandomMatch, loadMatches } = require('./Match.js');
const { generateRandomPlayers } = require('./Player.js');

const app = express();
const PORT = 3000;

function initializeFiles() {
    const playersFilePath = path.join(__dirname, 'players.json');
    if (!fs.existsSync(playersFilePath) || fs.readFileSync(playersFilePath, 'utf-8').trim() === '') {
        const randomPlayers = generateRandomPlayers(100);
        fs.writeFileSync(playersFilePath, JSON.stringify(randomPlayers, null, 2), 'utf-8');
    }
    loadMatches();
}

initializeFiles();

const matchModel = require('./Match.js');
const playerModel = require('./Player.js');

app.use(express.static(path.join(__dirname, 'Views')));
app.set('views', path.join(__dirname, 'Views'));

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'players.html'));
});

app.get('/players.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'players.json'));
});

app.get('/matches.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'matches.json'));
});

function synchronizedWrite(filePath, data) {
    const lockFile = `${filePath}.lock`;
    while (fs.existsSync(lockFile)) {
    }
    fs.writeFileSync(lockFile, '');
    try {
        fs.writeFileSync(filePath, data, 'utf-8');
    } finally {
        fs.unlinkSync(lockFile);
    }
}

function saveMatchToFile(match) {
    let matches = [];
    const matchesFilePath = path.join(__dirname, 'matches.json');
    if (fs.existsSync(matchesFilePath)) {
        const fileContent = fs.readFileSync(matchesFilePath, 'utf-8');
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
    synchronizedWrite(matchesFilePath, JSON.stringify(matches, null, 2));
}

let isCreatingMatch = false;
app.post('/create-random-match', async (req, res) => {
    if (isCreatingMatch) {
        return res.status(429).send({ error: 'A match is already being created. Please wait.' });
    }

    isCreatingMatch = true;
    try {
        const match = createRandomMatch();

        res.json(match);
    } catch (error) {
        console.error('Error creating random match:', error);
        res.status(500).send({ error: 'Failed to create random match' });
    } finally {
        isCreatingMatch = false;
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
