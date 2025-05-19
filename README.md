# Station Light Control

An Edrys module that automatically controls Elgato lights in stations based on user presence. When users enter a station, the lights turn on, and when the last user leaves, the lights turn off.

To add the module to your Edrys class, import the following URL:

```
https://edrys-labs.github.io/module-station-light-control/index.html
```

## How It Works

### Module Architecture

The system consists of two main components:
1. **Frontend Module**: An Edrys module that runs in a station and monitors user presence
2. **Backend Server**: A lightweight NodeJs server that runs locally on the station machine and communicates with the Elgato light

### Communication Flow

1. The module detects user presence changes in the station using the Edrys API
2. When status changes, the module sends a request to the backend server
3. The server communicates with the Elgato light using its REST API
4. The light turns on/off based on the command

## Setup

### Server Setup

You can run the server using Docker:

```
docker run --init -p 3000:3000 edryslabs/station-lights-server
```

### Module Configuration

1. Add the Station Light Control module to your Edrys class (it should only be visible in station mode)
2. In the module settings, configure:
   - **lightIp**: The IP address of your Elgato light (e.g., `192.169.1.100`)

### Light Requirements

- Elgato Key Light 
- Connected to the same network as the server
- API access enabled

## API Endpoints

The backend server provides these endpoints:

- `GET /api/light?ip={light-ip}`: Get the current light status
- `POST /api/light`: Update light state with the following body:
  ```json
  {
    "on": 1,          // 1 for on, 0 for off
    "brightness": 50, // 0-100
    "temperature": 213, // Color temperature
    "ip": "192.169.1.100" // Light IP address (lightIp)
  }
  ```
- `POST /api/heartbeat`: Send a heartbeat to keep track of active stations (ensures lights are turned off when a station window is closed, but the light is still on):
  ```json
  {
    "stationId": "unique-station-id", // Unique identifier for the station instance
    "lightIp": "192.169.1.100", // Light IP address
    "lightState": true // Current state of the light (true if on, false if off)
  }
  ```
