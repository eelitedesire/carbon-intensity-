const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Load settings
let settings = {};
const settingsPath = path.join(__dirname, 'settings.json');

function loadSettings() {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (error) {
    console.log('No settings file found or invalid JSON. Using default settings.');
    settings = { apiKey: '' };
  }
}

function saveSettings() {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

loadSettings();

// Electricity Maps API configuration
const ELECTRICITY_MAPS_API_URL = 'https://api.electricitymap.org/v3/carbon-intensity/latest';

// Sample countries (you can expand this list)
const countries = [
  { name: 'United Kingdom', code: 'GB', lat: 51.5074, lon: -0.1278 },
  { name: 'France', code: 'FR', lat: 46.2276, lon: 2.2137 },
  { name: 'Germany', code: 'DE', lat: 51.1657, lon: 10.4515 },
  { name: 'Spain', code: 'ES', lat: 40.4637, lon: -3.7492 },
  { name: 'Italy', code: 'IT', lat: 41.8719, lon: 12.5674 },
  { name: 'Sweden', code: 'SE', lat: 60.1282, lon: 18.6435 },
  { name: 'Norway', code: 'NO', lat: 60.4720, lon: 8.4689 },
  { name: 'Denmark', code: 'DK', lat: 56.2639, lon: 9.5018 },
  { name: 'Netherlands', code: 'NL', lat: 52.1326, lon: 5.2913 },
  { name: 'Belgium', code: 'BE', lat: 50.8503, lon: 4.3517 },
  { name: 'Switzerland', code: 'CH', lat: 46.8182, lon: 8.2275 },
  { name: 'Austria', code: 'AT', lat: 47.5162, lon: 14.5501 },
  { name: 'Poland', code: 'PL', lat: 51.9194, lon: 19.1451 },
  { name: 'Portugal', code: 'PT', lat: 39.3999, lon: -8.2245 },
  { name: 'Finland', code: 'FI', lat: 61.9241, lon: 25.7482 },
  { name: 'Ireland', code: 'IE', lat: 53.4129, lon: -8.2439 },
];

app.get('/api/carbon-intensity', async (req, res) => {
  if (!settings.apiKey) {
    return res.status(400).json({ error: 'API key not configured. Please set it in the settings.' });
  }

  try {
    const results = await Promise.all(countries.map(async (country) => {
      const response = await axios.get(ELECTRICITY_MAPS_API_URL, {
        params: {
          lat: country.lat,
          lon: country.lon,
        },
        headers: {
          'auth-token': settings.apiKey,
        },
      });
      return {
        ...country,
        carbonIntensity: response.data.carbonIntensity,
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching carbon intensity:', error);
    res.status(500).json({ error: 'Unable to fetch carbon intensity data' });
  }
});

app.get('/api/settings', (req, res) => {
  res.json({ apiKey: settings.apiKey ? 'API key is set' : '' });
});

app.post('/api/settings', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) {
    settings.apiKey = apiKey;
    saveSettings();
    res.json({ message: 'API key updated successfully' });
  } else {
    res.status(400).json({ error: 'Invalid API key' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Carbon Intensity Dashboard app listening at http://localhost:${port}`);
});