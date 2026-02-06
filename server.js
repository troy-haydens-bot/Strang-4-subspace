const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Store Python process reference
let pythonProcess = null;

// Start Python backend
function startPythonBackend() {
    console.log('Starting Python matrix calculator backend...');
    pythonProcess = spawn('python3', ['matrix_calculator.py']);
    
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

// Proxy API requests to Python backend
app.post('/api/calculate', async (req, res) => {
    try {
        const response = await fetch('http://localhost:5000/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error calling Python backend:', error);
        res.status(500).json({ error: 'Backend calculation failed' });
    }
});

// Check backend health
app.get('/api/health', async (req, res) => {
    try {
        const response = await fetch('http://localhost:5000/health');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Backend unavailable' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Strang 4 Subspaces Visualizer running on http://localhost:${PORT}`);
    console.log('Starting Python backend...');
    startPythonBackend();
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    if (pythonProcess) {
        pythonProcess.kill();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
    process.exit(0);
});