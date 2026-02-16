/**
 * Local API server for dev: only /detectIntent (OpenAI). No Firebase/config.
 * Usage: node server.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const detectIntentApi = require('./api/controllers/detectIntent');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple path for local dev (frontend calls http://localhost:5001/api/detectIntent)
app.post('/api/detectIntent', detectIntentApi.post);

app.listen(PORT, () => {
  console.log(`Chat API: http://localhost:${PORT}/api/detectIntent`);
});
