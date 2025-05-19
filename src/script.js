const usersNum = document.getElementById("users-num");
const lightStatus = document.getElementById("light-status");

let lastUsersCount = 0;
let stationUsers = [];
let lightOn = false;
let stationId = null;

Edrys.onReady(async () => {
  usersNum.innerText = 0;
  lightStatus.innerText = "OFF";

  if (!Edrys.module.stationConfig?.lightIp) {
    console.warn("Light IP not configured in stationConfig");
  }

  // Generate a unique ID for this station instance
  stationId = Edrys.username + '-' + Edrys.class_id + '-' + Date.now();
  
  checkUsersInStation();

  setInterval(() => {
    checkUsersInStation();
  }, 2000);

  startHeartbeat();

  document.getElementById("light-status").className = "light-indicator off";
});

// Send heartbeats to the server (to keep track of active stations)
function startHeartbeat() {
  sendHeartbeat();
  
  setInterval(() => {
    sendHeartbeat();
  }, 10000);
}

async function sendHeartbeat() {
  const lightIp = Edrys.module.stationConfig?.lightIp;
  
  if (!lightIp || !stationId) {
    return;
  }
  
  try {
    await fetch("http://localhost:3000/api/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId,
        lightIp,
        lightState: lightOn
      }),
    });
  } catch (error) {
    console.error("Failed to send heartbeat:", error);
  }
}

checkUsersInStation = () => {
  if (Edrys.liveUser.room.startsWith("Station")) {
    const currentStationUsers = Object.values(Edrys.liveClass.users).filter(
      (user) => {
        return (
          !user.displayName.startsWith("Station") &&
          user.room.startsWith("Station")
        );
      }
    );

    const currentCount = currentStationUsers.length;

    const hasChanged = currentCount !== lastUsersCount;

    if (hasChanged) {
      usersNum.innerText = currentCount;

      // If users have entered or left the station, update light status
      if (currentCount > 0 && lastUsersCount === 0) {
        setLightState(true);
      } else if (currentCount === 0 && lastUsersCount > 0) {
        setLightState(false);
      }

      lastUsersCount = currentCount;
    }

    return hasChanged;
  }
  return false;
};

async function setLightState(on) {
  const lightIp = Edrys.module.stationConfig?.lightIp;

  if (!lightIp) {
    console.error("Light IP not configured in stationConfig");
    return;
  }

  lightOn = on;
  const indicator = document.getElementById("light-status");
  indicator.innerText = on ? "ON" : "OFF";
  indicator.className = on ? "light-indicator on" : "light-indicator off";

  try {
    await fetch("http://localhost:3000/api/light", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        on: on ? 1 : 0,
        brightness: 50,
        temperature: 213,
        ip: lightIp,
      }),
    });
  } catch (error) {
    console.error("Failed to set light state:", error);
  }
}
