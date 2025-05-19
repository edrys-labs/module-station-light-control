const express = require('express');
const fetch = require('node-fetch-commonjs');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const getLightUrl = (ip) => `http://${ip}:9123/elgato/lights`;

// Track active stations with their light state and last heartbeat
const activeStations = new Map();

// Heartbeat endpoint to keep track of active stations
app.post('/api/heartbeat', (req, res) => {
  const { stationId, lightIp, lightState } = req.body;
  
  if (!stationId || !lightIp) {
    return res.status(400).json({ error: 'Station ID and light IP are required' });
  }
  
  console.log(`Received heartbeat from ${stationId}`);
  
  activeStations.set(stationId, {
    lightIp,
    lightState,
    lastHeartbeat: Date.now()
  });
  
  res.json({ status: 'OK' });
});

// Endpoint to get the status of the light
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

// Endpoint to toggle the light
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

// Check for inactive stations every 10 seconds and turn off their lights
const HEARTBEAT_TIMEOUT = 15000; // 15 seconds timeout
setInterval(async () => {
  const now = Date.now();
  
  for (const [stationId, station] of activeStations.entries()) {
    // If station hasn't sent a heartbeat in 15 seconds and light was on
    if (now - station.lastHeartbeat > HEARTBEAT_TIMEOUT && station.lightState) {
      console.log(`${stationId} is inactive, turning off light`);
      
      try {
        await fetch(getLightUrl(station.lightIp), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lights: [{ on: 0, brightness: 50, temperature: 213 }],
            numberOfLights: 1
          })
        });
        
        // Update the station's light state
        station.lightState = false;
        
        console.log(`Successfully turned off light for inactive ${stationId}`);
      } catch (error) {
        console.error(`Failed to turn off light for station ${stationId}:`, error.message);
      }
    }
  }
}, 10000);


app.listen(port, () => {
  console.log(`Elgato Light Server running on http://localhost:${port}`);
});
