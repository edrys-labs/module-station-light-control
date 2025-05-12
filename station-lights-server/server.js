const express = require('express');
const fetch = require('node-fetch-commonjs');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const getLightUrl = (ip) => `http://${ip}:9123/elgato/lights`;

app.get('/api/light', async (req, res) => {
  const { ip } = req.query;
  if (!ip) {
    return res.status(400).json({ error: 'Light IP address is required' });
  }
  try {
    const response = await fetch(getLightUrl(ip));
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch light status', message: error.message });
  }
});

app.post('/api/light', async (req, res) => {
  console.log('Toggle', req.body);
  
  const { on, brightness, temperature, ip } = req.body;
  
  if (!ip) {
    return res.status(400).json({ error: 'Light IP address is required' });
  }
  
  try {
    const response = await fetch(getLightUrl(ip), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lights: [{ on, brightness, temperature }],
        numberOfLights: 1
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update light', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Elgato Light Server running on http://localhost:${port}`);
});
