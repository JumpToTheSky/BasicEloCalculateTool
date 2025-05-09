const express = require('express');
const path = require('path');
const fs = require('fs');
const { createRandomMatch } = require('./Match');

const app = express();
const PORT = 3000;

// Serve static files (e.g., players.html)
app.use(express.static(path.join(__dirname)));

// Serve players.html as the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'players.html'));
});

// Endpoint to serve players.json
app.get('/players.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'players.json'));
});

// Endpoint to serve matches.json
app.get('/matches.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'matches.json'));
});

// Đồng bộ hóa ghi dữ liệu
function synchronizedWrite(filePath, data) {
    const lockFile = `${filePath}.lock`;
    while (fs.existsSync(lockFile)) {
        // Chờ nếu file đang bị khóa
    }
    fs.writeFileSync(lockFile, ''); // Tạo file khóa
    try {
        fs.writeFileSync(filePath, data, 'utf-8');
    } finally {
        fs.unlinkSync(lockFile); // Xóa file khóa
    }
}

// Function to save match to file and prevent duplicates
function saveMatchToFile(match) {
    let matches = [];
    if (fs.existsSync('matches.json')) {
        const fileContent = fs.readFileSync('matches.json', 'utf-8');
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
    synchronizedWrite('matches.json', JSON.stringify(matches, null, 2));
}

// Add endpoint to create a random match
let isCreatingMatch = false; // Trạng thái để ngăn chặn yêu cầu trùng lặp
app.post('/create-random-match', async (req, res) => {
    if (isCreatingMatch) {
        return res.status(429).send({ error: 'A match is already being created. Please wait.' });
    }

    isCreatingMatch = true; // Set the state to prevent duplicate requests
    try {
        const match = createRandomMatch();

        res.json(match);
    } catch (error) {
        console.error('Error creating random match:', error);
        res.status(500).send({ error: 'Failed to create random match' });
    } finally {
        isCreatingMatch = false; // Reset the state after completion
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
